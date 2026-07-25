/**
 * js/chat.js
 * ---------------------------------------------------------------------------
 * Inti logika AI "Vesta AI":
 *  - System prompt menegaskan identitas AI (Vesta AI) & menyisipkan nama
 *    pengguna yang sedang login, supaya AI selalu tahu sedang bicara dengan
 *    siapa dan menyapa dengan nama tersebut secara natural.
 *  - Manajemen memori ketat: hanya maksimal 20 pesan terakhir yang dikirim
 *    ke API (APP_LIMITS.maxHistoryMessages), sisanya dipangkas dari depan.
 *  - Deteksi otomatis kebutuhan pencarian web -> panggil Tavily -> sisipkan
 *    hasilnya sebagai konteks tambahan sebelum meminta jawaban akhir ke
 *    SumoPod AI, lalu ditandai lewat badge "🔍 Telah menelusuri web".
 *  - Dukungan vision (analisis foto) & analisis dokumen teks.
 * ---------------------------------------------------------------------------
 */

import { SUMOPOD_CONFIG, TAVILY_CONFIG, BRAND_CONFIG, APP_LIMITS } from "./config.js";

// ---------------------------------------------------------------------------
// System Prompt — identitas Vesta AI + nama pengguna
// ---------------------------------------------------------------------------
function buildSystemPrompt({ userName, documentContext }) {
  let prompt = `Kamu adalah ${BRAND_CONFIG.botName}, asisten AI yang ramah, cerdas, sopan, dan selalu menjawab dalam Bahasa Indonesia yang natural.

Identitas kamu:
- Namamu adalah ${BRAND_CONFIG.botName}. Jika ditanya siapa kamu, siapa yang membuatmu, atau model apa yang kamu pakai, jawablah bahwa kamu adalah ${BRAND_CONFIG.botName}, asisten AI dari aplikasi ${BRAND_CONFIG.appName}. Jangan menyebut nama model atau penyedia API di baliknya.
- Kamu sedang berbicara dengan pengguna bernama "${userName}". Ingat nama ini sepanjang percakapan, sapa mereka dengan nama tersebut secara wajar (tidak perlu di setiap kalimat), dan personalisasikan jawabanmu untuk mereka.
- Gaya bicaramu hangat, membantu, ringkas namun lengkap, dan tidak kaku.
- Jika kamu diberi hasil pencarian web di dalam pesan pengguna (ditandai bagian "[HASIL PENCARIAN WEB]"), gunakan informasi tersebut sebagai dasar jawaban dan sebutkan bahwa informasi tersebut berasal dari penelusuran terbaru.
- Jika kamu diberi lampiran dokumen (ditandai "[LAMPIRAN DOKUMEN]"), gunakan isinya untuk menjawab pertanyaan seputar dokumen tersebut secara akurat.`;

  if (documentContext) {
    prompt += `\n\n[LAMPIRAN DOKUMEN: ${documentContext.name}]\n${documentContext.content}\n[AKHIR LAMPIRAN DOKUMEN]`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Deteksi kebutuhan pencarian web (heuristik kata kunci sederhana & cepat,
// tanpa memanggil API tambahan hanya untuk klasifikasi)
// ---------------------------------------------------------------------------
const WEB_SEARCH_TRIGGERS = [
  "hari ini", "sekarang", "terbaru", "terkini", "kabar", "berita",
  "harga", "kurs", "cuaca", "skor", "hasil pertandingan", "rilis",
  "tahun ini", "202", "siapa presiden", "siapa juara", "update",
  "kapan", "jadwal", "trending", "viral",
];

export function shouldSearchWeb(userMessage) {
  const lower = userMessage.toLowerCase();
  return WEB_SEARCH_TRIGGERS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Tavily Web Search
// ---------------------------------------------------------------------------
export async function searchWeb(query) {
  try {
    const response = await fetch(TAVILY_CONFIG.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_CONFIG.apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      answer: data.answer || "",
      results: (data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  } catch (error) {
    console.error("Gagal melakukan pencarian web:", error);
    return { answer: "", results: [], error: true };
  }
}

function formatWebSearchContext(searchData) {
  if (!searchData || searchData.error || searchData.results.length === 0) return "";
  let ctx = "[HASIL PENCARIAN WEB]\n";
  if (searchData.answer) ctx += `Ringkasan: ${searchData.answer}\n\n`;
  searchData.results.forEach((r, i) => {
    ctx += `${i + 1}. ${r.title}\n${r.content}\nSumber: ${r.url}\n\n`;
  });
  ctx += "[AKHIR HASIL PENCARIAN WEB]";
  return ctx;
}

// ---------------------------------------------------------------------------
// Manajemen Memori — potong ke maksimal N pesan terakhir
// ---------------------------------------------------------------------------
export function trimHistory(messages) {
  const max = APP_LIMITS.maxHistoryMessages;
  if (messages.length <= max) return messages;
  return messages.slice(messages.length - max);
}

// ---------------------------------------------------------------------------
// Konversi riwayat internal -> format pesan SumoPod (OpenAI-compatible)
// ---------------------------------------------------------------------------
function toApiMessages(history) {
  return history.map((m) => {
    if (m.role === "user" && m.imageUrl) {
      // Format vision: content berupa array (text + image_url)
      return {
        role: "user",
        content: [
          { type: "text", text: m.content || "Tolong jelaskan isi gambar ini." },
          { type: "image_url", image_url: { url: m.imageUrl } },
        ],
      };
    }
    return { role: m.role, content: m.content || "" };
  });
}

/**
 * Panggil SumoPod AI (Chat Completions, OpenAI-compatible).
 * @param {Array} apiMessages array pesan format OpenAI (termasuk system prompt)
 */
async function callSumoPod(apiMessages) {
  const response = await fetch(`${SUMOPOD_CONFIG.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUMOPOD_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: SUMOPOD_CONFIG.model,
      max_tokens: SUMOPOD_CONFIG.maxTokens,
      temperature: SUMOPOD_CONFIG.temperature,
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`SumoPod API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Respons SumoPod AI kosong / tidak valid.");
  return content;
}

/**
 * Fungsi utama: kirim pesan pengguna, kembalikan balasan Vesta AI.
 *
 * @param {object} params
 *  - userName: nama pengguna login (disisipkan ke system prompt)
 *  - history: array pesan sebelumnya [{role, content, imageUrl?}]
 *  - userMessage: teks pesan baru dari pengguna
 *  - imageUrl: base64 data URL gambar (opsional, untuk analisis foto)
 *  - documentContext: { name, content } (opsional, untuk analisis dokumen)
 *  - forceWebSearch: boolean, paksa pencarian web
 *
 * @returns {Promise<{ reply: string, usedWebSearch: boolean, sources: Array }>}
 */
export async function sendChatMessage({
  userName,
  history = [],
  userMessage,
  imageUrl = null,
  documentContext = null,
  forceWebSearch = false,
}) {
  let finalUserMessage = userMessage;
  let usedWebSearch = false;
  let sources = [];

  // 1. Deteksi & lakukan pencarian web bila perlu
  if ((forceWebSearch || shouldSearchWeb(userMessage)) && userMessage.trim().length > 0) {
    const searchData = await searchWeb(userMessage);
    if (!searchData.error && searchData.results.length > 0) {
      usedWebSearch = true;
      sources = searchData.results.map((r) => ({ title: r.title, url: r.url }));
      finalUserMessage = `${userMessage}\n\n${formatWebSearchContext(searchData)}`;
    }
  }

  // 2. Susun system prompt (identitas Vesta AI + nama pengguna + dokumen)
  const systemPrompt = buildSystemPrompt({ userName, documentContext });

  // 3. Potong riwayat ke maksimal 20 pesan terakhir (memori ketat)
  const trimmedHistory = trimHistory(history);

  // 4. Susun pesan baru pengguna (dengan gambar jika ada)
  const newUserEntry = imageUrl
    ? { role: "user", content: finalUserMessage, imageUrl }
    : { role: "user", content: finalUserMessage };

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...toApiMessages(trimmedHistory),
    ...toApiMessages([newUserEntry]),
  ];

  // 5. Panggil SumoPod AI
  const reply = await callSumoPod(apiMessages);

  return { reply, usedWebSearch, sources };
}

// ---------------------------------------------------------------------------
// Analisis Dokumen — baca file teks via FileReader
// ---------------------------------------------------------------------------
export function readDocumentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, content: String(reader.result) });
    reader.onerror = () => reject(new Error("Gagal membaca file dokumen."));
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Konversi gambar ke Base64 data URL
// ---------------------------------------------------------------------------
export function readImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (!APP_LIMITS.allowedImageTypes.includes(file.type)) {
      reject(new Error("Format gambar tidak didukung (hanya JPG/PNG/GIF/WebP)."));
      return;
    }
    if (file.size > APP_LIMITS.maxImageSizeMB * 1024 * 1024) {
      reject(new Error(`Ukuran gambar melebihi ${APP_LIMITS.maxImageSizeMB}MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}
