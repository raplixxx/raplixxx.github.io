/**
 * js/shared.js
 * Logika halaman shared.html — memuat chat publik read-only dari
 * shared_chats/{shareId} berdasarkan query param ?id=.
 */

import { BRAND_CONFIG } from "./config.js";
import { getSharedChat } from "./firestore.js";
import { escapeHTML, escapeHTMLWithBreaks, qs, qsa } from "./ui.js";

function applyBranding() {
  document.title = `Percakapan Dibagikan — ${BRAND_CONFIG.botName}`;
  qsa("[data-brand-logo]").forEach((el) => (el.src = BRAND_CONFIG.displayLogoUrl));
  qsa("[data-brand-name]").forEach((el) => (el.textContent = BRAND_CONFIG.botName));
  const favicon = document.getElementById("favicon");
  if (favicon) favicon.href = BRAND_CONFIG.seoLogoUrl;
}

function buildBubble(message) {
  const row = document.createElement("div");
  row.className = `msg-row ${message.role === "user" ? "user" : "assistant"}`;

  const avatar = document.createElement("img");
  avatar.className = "msg-avatar" + (message.role === "assistant" ? " bot-avatar" : "");
  avatar.src = BRAND_CONFIG.displayLogoUrl;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  let inner = "";
  if (message.imageUrl) {
    inner += `<img class="msg-image" src="${message.imageUrl}" alt="Gambar terlampir">`;
  }
  if (message.docName) {
    inner += `<div class="msg-doc-chip">📄 ${escapeHTML(message.docName)}</div><br>`;
  }
  inner += escapeHTMLWithBreaks(message.content || "");

  if (Array.isArray(message.sources) && message.sources.length > 0) {
    inner += `<div class="web-sources">${message.sources
      .map((s) => `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title || s.url)}</a>`)
      .join("")}</div>`;
  }

  bubble.innerHTML = inner;
  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

async function init() {
  applyBranding();

  const params = new URLSearchParams(window.location.search);
  const shareId = params.get("id");
  const container = qs("#shared-messages");
  const titleEl = qs("#shared-title");
  const ownerEl = qs("#shared-owner");

  if (!shareId) {
    container.innerHTML = `<p class="composer-hint">Tautan tidak valid — parameter ID tidak ditemukan.</p>`;
    return;
  }

  try {
    const data = await getSharedChat(shareId);
    if (!data) {
      container.innerHTML = `<p class="composer-hint">Percakapan yang dibagikan tidak ditemukan atau sudah dihapus.</p>`;
      return;
    }

    titleEl.textContent = data.title || "Percakapan Vesta AI";
    ownerEl.textContent = `Dibagikan oleh ${data.ownerName || "Pengguna"}`;

    container.innerHTML = "";
    (data.messages || []).forEach((m) => container.appendChild(buildBubble(m)));
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="composer-hint">Gagal memuat percakapan. Coba muat ulang halaman.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
