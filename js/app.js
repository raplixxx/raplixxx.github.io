/**
 * js/app.js
 * Menghubungkan auth.js, firestore.js, chat.js, ui.js ke halaman index.html.
 */

import { BRAND_CONFIG } from "./config.js";
import { loginWithGoogle, logout, watchAuthState } from "./auth.js";
import {
  createSession,
  listSessions,
  touchSession,
  deleteSession,
  addMessage,
  listMessages,
  shareChatSession,
} from "./firestore.js";
import {
  sendChatMessage,
  readDocumentFile,
  readImageAsBase64,
} from "./chat.js";
import {
  escapeHTML,
  escapeHTMLWithBreaks,
  showToast,
  updateToast,
  qs,
  qsa,
  formatTime,
} from "./ui.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  user: null,
  profile: null,
  currentSessionId: null,
  currentMessages: [], // riwayat pesan sesi aktif (untuk konteks AI)
  pendingImage: null, // { dataUrl, fileName }
  pendingDocument: null, // { name, content }
  isSending: false,
};

// ---------------------------------------------------------------------------
// Set logo & meta tag sesuai konfigurasi
// ---------------------------------------------------------------------------
function applyBranding() {
  document.title = `${BRAND_CONFIG.appName} — ${BRAND_CONFIG.botName}`;
  qsa("[data-brand-logo]").forEach((el) => (el.src = BRAND_CONFIG.displayLogoUrl));
  qsa("[data-brand-name]").forEach((el) => (el.textContent = BRAND_CONFIG.botName));

  const favicon = document.getElementById("favicon");
  if (favicon) favicon.href = BRAND_CONFIG.seoLogoUrl;
  const metaOg = document.querySelector('meta[property="og:image"]');
  if (metaOg) metaOg.setAttribute("content", BRAND_CONFIG.seoLogoUrl);
}

// ---------------------------------------------------------------------------
// Auth wiring
// ---------------------------------------------------------------------------
function initAuth() {
  qs("#btn-google-login").addEventListener("click", async () => {
    const toastRef = showToast("Menghubungkan ke Google...", "loading", 0);
    try {
      await loginWithGoogle();
      updateToast(toastRef, "Berhasil masuk!", "success");
    } catch (e) {
      updateToast(toastRef, "Gagal masuk dengan Google.", "error");
    }
  });

  qs("#btn-logout").addEventListener("click", async () => {
    try {
      await logout();
      showToast("Anda telah keluar.", "info");
    } catch (e) {
      /* sudah ditangani di auth.js */
    }
  });

  watchAuthState(async (user, profile) => {
    state.user = user;
    state.profile = profile;
    qs("#loading-screen").classList.add("hidden");

    if (user && profile) {
      qs("#login-page").classList.add("hidden");
      qs("#app-shell").classList.remove("hidden");
      renderProfile(profile);
      await loadSessions();
    } else {
      qs("#app-shell").classList.add("hidden");
      qs("#login-page").classList.remove("hidden");
    }
  });
}

function renderProfile(profile) {
  qs("#profile-avatar").src = profile.photoURL || BRAND_CONFIG.displayLogoUrl;
  qs("#profile-name").textContent = profile.displayName || "Pengguna";
  qs("#profile-link").textContent = profile.uniqueLinkId;
}

// ---------------------------------------------------------------------------
// Sidebar: daftar sesi
// ---------------------------------------------------------------------------
async function loadSessions() {
  const listEl = qs("#session-list");
  listEl.innerHTML = `<div class="composer-hint">Memuat riwayat...</div>`;
  try {
    const sessions = await listSessions(state.profile.uniqueLinkId);
    if (sessions.length === 0) {
      listEl.innerHTML = `<div class="composer-hint">Belum ada percakapan.</div>`;
      return;
    }
    listEl.innerHTML = "";
    sessions.forEach((s) => listEl.appendChild(renderSessionItem(s)));
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<div class="composer-hint">Gagal memuat riwayat.</div>`;
  }
}

function renderSessionItem(session) {
  const item = document.createElement("div");
  item.className = "session-item" + (session.id === state.currentSessionId ? " active" : "");
  item.dataset.sessionId = session.id;
  item.innerHTML = `
    <span class="session-title">${escapeHTML(session.title || "Percakapan Baru")}</span>
    <button class="session-delete-btn" aria-label="Hapus percakapan">🗑</button>
  `;

  item.addEventListener("click", (e) => {
    if (e.target.closest(".session-delete-btn")) return;
    openSession(session.id);
    closeMobileSidebar();
  });

  item.querySelector(".session-delete-btn").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!confirm("Hapus percakapan ini? Tindakan tidak bisa dibatalkan.")) return;
    try {
      await deleteSession(state.profile.uniqueLinkId, session.id);
      showToast("Percakapan dihapus.", "success");
      if (state.currentSessionId === session.id) {
        state.currentSessionId = null;
        state.currentMessages = [];
        renderEmptyState();
      }
      await loadSessions();
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus percakapan.", "error");
    }
  });

  return item;
}

async function openSession(sessionId) {
  state.currentSessionId = sessionId;
  qsa(".session-item").forEach((el) => el.classList.toggle("active", el.dataset.sessionId === sessionId));

  const container = qs("#messages-container");
  container.innerHTML = `<div class="composer-hint">Memuat pesan...</div>`;

  try {
    const messages = await listMessages(state.profile.uniqueLinkId, sessionId);
    state.currentMessages = messages;
    renderAllMessages(messages);
  } catch (e) {
    console.error(e);
    showToast("Gagal memuat pesan.", "error");
  }
}

async function startNewSession() {
  state.currentSessionId = null;
  state.currentMessages = [];
  renderEmptyState();
  qsa(".session-item").forEach((el) => el.classList.remove("active"));
  closeMobileSidebar();
}

// ---------------------------------------------------------------------------
// Rendering pesan
// ---------------------------------------------------------------------------
function renderEmptyState() {
  qs("#messages-container").innerHTML = `
    <div class="empty-state">
      <img src="${BRAND_CONFIG.displayLogoUrl}" alt="${BRAND_CONFIG.botName}">
      <h3>Halo, ${escapeHTML(state.profile?.displayName?.split(" ")[0] || "")}!</h3>
      <p>Saya ${BRAND_CONFIG.botName}. Tanyakan apa saja, unggah foto, atau lampirkan dokumen untuk mulai mengobrol.</p>
    </div>
  `;
  qs("#chat-title").textContent = "Percakapan Baru";
}

function renderAllMessages(messages) {
  const container = qs("#messages-container");
  container.innerHTML = "";
  if (messages.length === 0) {
    renderEmptyState();
    return;
  }
  messages.forEach((m) => container.appendChild(buildMessageBubble(m)));
  container.scrollTop = container.scrollHeight;
}

function buildMessageBubble(message) {
  const row = document.createElement("div");
  row.className = `msg-row ${message.role === "user" ? "user" : "assistant"}`;

  const avatar = document.createElement("img");
  avatar.className = "msg-avatar" + (message.role === "assistant" ? " bot-avatar" : "");
  avatar.src =
    message.role === "assistant"
      ? BRAND_CONFIG.displayLogoUrl
      : state.profile?.photoURL || BRAND_CONFIG.displayLogoUrl;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  let inner = "";
  if (message.imageUrl) {
    inner += `<img class="msg-image" src="${message.imageUrl}" alt="Gambar terlampir">`;
  }
  if (message.docName) {
    inner += `<div class="msg-doc-chip">📄 ${escapeHTML(message.docName)}</div><br>`;
  }
  if (message.role === "assistant" && message.usedWebSearch) {
    inner += `<div class="web-search-badge">🔍 Telah menelusuri web</div><br>`;
  }
  inner += escapeHTMLWithBreaks(message.content || "");

  if (message.role === "assistant" && Array.isArray(message.sources) && message.sources.length > 0) {
    inner += `<div class="web-sources">${message.sources
      .map((s) => `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title || s.url)}</a>`)
      .join("")}</div>`;
  }

  bubble.innerHTML = inner;
  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

function appendTypingIndicator() {
  const container = qs("#messages-container");
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.id = "typing-indicator-row";
  row.innerHTML = `
    <img class="msg-avatar bot-avatar" src="${BRAND_CONFIG.displayLogoUrl}" alt="${BRAND_CONFIG.botName}">
    <div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
  `;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}
function removeTypingIndicator() {
  qs("#typing-indicator-row")?.remove();
}

// ---------------------------------------------------------------------------
// Composer: kirim pesan, lampiran gambar/dokumen
// ---------------------------------------------------------------------------
function initComposer() {
  const textarea = qs("#chat-input");
  const sendBtn = qs("#btn-send");
  const imageInput = qs("#image-input");
  const docInput = qs("#doc-input");

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + "px";
    sendBtn.disabled = textarea.value.trim().length === 0 && !state.pendingImage;
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener("click", handleSend);

  qs("#btn-attach-image").addEventListener("click", () => imageInput.click());
  qs("#btn-attach-doc").addEventListener("click", () => docInput.click());

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await readImageAsBase64(file);
      state.pendingImage = { dataUrl, fileName: file.name };
      renderAttachmentPreview();
      sendBtn.disabled = false;
    } catch (err) {
      showToast(err.message, "error");
    }
    imageInput.value = "";
  });

  docInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const doc = await readDocumentFile(file);
      state.pendingDocument = doc;
      renderAttachmentPreview();
      sendBtn.disabled = false;
    } catch (err) {
      showToast(err.message, "error");
    }
    docInput.value = "";
  });
}

function renderAttachmentPreview() {
  const wrap = qs("#attachment-preview");
  if (!state.pendingImage && !state.pendingDocument) {
    wrap.classList.add("hidden");
    wrap.innerHTML = "";
    return;
  }
  wrap.classList.remove("hidden");
  if (state.pendingImage) {
    wrap.innerHTML = `
      <img src="${state.pendingImage.dataUrl}" alt="preview">
      <span>${escapeHTML(state.pendingImage.fileName)}</span>
      <button class="remove-attachment" aria-label="Hapus lampiran">×</button>
    `;
  } else if (state.pendingDocument) {
    wrap.innerHTML = `
      <span>📄 ${escapeHTML(state.pendingDocument.name)}</span>
      <button class="remove-attachment" aria-label="Hapus lampiran">×</button>
    `;
  }
  wrap.querySelector(".remove-attachment").addEventListener("click", () => {
    state.pendingImage = null;
    state.pendingDocument = null;
    renderAttachmentPreview();
  });
}

async function handleSend() {
  if (state.isSending) return;
  const textarea = qs("#chat-input");
  const text = textarea.value.trim();
  if (!text && !state.pendingImage) return;

  state.isSending = true;
  qs("#btn-send").disabled = true;

  const imageUrl = state.pendingImage?.dataUrl || null;
  const documentContext = state.pendingDocument || null;
  const docName = documentContext?.name || null;

  textarea.value = "";
  textarea.style.height = "auto";
  state.pendingImage = null;
  state.pendingDocument = null;
  renderAttachmentPreview();

  try {
    // Pastikan ada sesi aktif
    if (!state.currentSessionId) {
      const title = text.slice(0, 40) || "Percakapan Baru";
      state.currentSessionId = await createSession(state.profile.uniqueLinkId, title);
      await loadSessions();
      qsa(".session-item").forEach((el) =>
        el.classList.toggle("active", el.dataset.sessionId === state.currentSessionId)
      );
      qs("#chat-title").textContent = title;
    }

    // Render pesan user
    const userMsgObj = { role: "user", content: text, imageUrl, docName };
    if (qs(".empty-state")) qs("#messages-container").innerHTML = "";
    qs("#messages-container").appendChild(buildMessageBubble(userMsgObj));
    qs("#messages-container").scrollTop = qs("#messages-container").scrollHeight;
    state.currentMessages.push(userMsgObj);
    await addMessage(state.profile.uniqueLinkId, state.currentSessionId, userMsgObj);

    appendTypingIndicator();

    // Panggil AI
    const { reply, usedWebSearch, sources } = await sendChatMessage({
      userName: state.profile.displayName,
      history: state.currentMessages.slice(0, -1),
      userMessage: text,
      imageUrl,
      documentContext,
    });

    removeTypingIndicator();

    const botMsgObj = { role: "assistant", content: reply, usedWebSearch, sources };
    qs("#messages-container").appendChild(buildMessageBubble(botMsgObj));
    qs("#messages-container").scrollTop = qs("#messages-container").scrollHeight;
    state.currentMessages.push(botMsgObj);
    await addMessage(state.profile.uniqueLinkId, state.currentSessionId, botMsgObj);
  } catch (error) {
    console.error(error);
    removeTypingIndicator();
    showToast("Terjadi kesalahan saat menghubungi Vesta AI. Coba lagi.", "error");
  } finally {
    state.isSending = false;
    qs("#btn-send").disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Share Chat
// ---------------------------------------------------------------------------
function initShare() {
  qs("#btn-share").addEventListener("click", async () => {
    if (!state.currentSessionId) {
      showToast("Mulai percakapan dulu sebelum membagikan.", "info");
      return;
    }
    const toastRef = showToast("Membuat tautan berbagi...", "loading", 0);
    try {
      const shareId = await shareChatSession(
        state.profile.uniqueLinkId,
        state.currentSessionId,
        state.profile.displayName
      );
      const url = `${window.location.origin}${window.location.pathname.replace("index.html", "")}shared.html?id=${shareId}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      updateToast(toastRef, "Tautan berhasil disalin ke clipboard!", "success");
    } catch (error) {
      console.error(error);
      updateToast(toastRef, "Gagal membuat tautan berbagi.", "error");
    }
  });
}

// ---------------------------------------------------------------------------
// Mobile sidebar toggle
// ---------------------------------------------------------------------------
function initMobileSidebar() {
  qs("#btn-sidebar-toggle").addEventListener("click", () => {
    qs("#sidebar").classList.add("open");
    qs("#sidebar-overlay").classList.add("visible");
  });
  qs("#sidebar-overlay").addEventListener("click", closeMobileSidebar);
}
function closeMobileSidebar() {
  qs("#sidebar")?.classList.remove("open");
  qs("#sidebar-overlay")?.classList.remove("visible");
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
  applyBranding();
  initAuth();
  initComposer();
  initShare();
  initMobileSidebar();
  qs("#btn-new-chat").addEventListener("click", startNewSession);
}

document.addEventListener("DOMContentLoaded", init);
