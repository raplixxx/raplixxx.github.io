// =====================================================================
// VESTA AI ("Web Ahay") — Core Application Logic
// Semua panggilan ke SumoPod AI & Tavily dilakukan lewat Firebase Cloud
// Functions (lihat /functions/index.js) sehingga API key TIDAK PERNAH
// dikirim ke browser. Firebase client config di bawah bukan rahasia —
// itu memang didesain publik oleh Firebase dan diamankan lewat
// Firestore/Auth Security Rules, bukan lewat kerahasiaan config ini.
// =====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection,
  addDoc, query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getFunctions, httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

// ---------------------------------------------------------------------
// 1. FIREBASE INIT
// ---------------------------------------------------------------------
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
  authDomain: "wa-clone-rafly.firebaseapp.com",
  projectId: "wa-clone-rafly",
  storageBucket: "wa-clone-rafly.firebasestorage.app",
  messagingSenderId: "217952329083",
  appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);

const callChatCompletion = httpsCallable(functions, "chatCompletion");
const callWebSearch = httpsCallable(functions, "webSearch");

const MAX_HISTORY_MESSAGES = 20;
const AVATAR_COLORS = ["#8b5cf6", "#3b82f6", "#ec4899", "#22d3ee", "#f59e0b", "#34d399"];

// ---------------------------------------------------------------------
// 2. STATE
// ---------------------------------------------------------------------
const state = {
  user: null,           // firebase auth user
  profile: null,        // { username, uniqueLinkId, email, avatarColor, createdAt }
  sessions: [],         // list of session metadata
  currentSessionId: null,
  messages: [],         // messages of current session (in-memory mirror)
  attachment: null,     // { type: 'image'|'doc', name, dataUrl|text, mime }
  unsubSessions: null,
  unsubMessages: null,
  sending: false
};

// ---------------------------------------------------------------------
// 3. DOM REFS
// ---------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const splashScreen = $("splashScreen");
const loginScreen = $("loginScreen");
const appShell = $("appShell");
const sharedView = $("sharedView");

const googleLoginBtn = $("googleLoginBtn");
const logoutBtn = $("logoutBtn");
const newChatBtn = $("newChatBtn");
const sessionListEl = $("sessionList");
const userAvatarEl = $("userAvatar");
const userDisplayNameEl = $("userDisplayName");
const userLinkIdEl = $("userLinkId");

const messagesArea = $("messagesArea");
const messagesListEl = $("messagesList");
const emptyStateEl = $("emptyState");
const typingIndicator = $("typingIndicator");
const currentSessionTitleEl = $("currentSessionTitle");

const messageInput = $("messageInput");
const sendBtn = $("sendBtn");
const imageInput = $("imageInput");
const docInput = $("docInput");
const attachImageBtn = $("attachImageBtn");
const attachDocBtn = $("attachDocBtn");
const attachmentPreviewEl = $("attachmentPreview");

const sidebar = $("sidebar");
const sidebarOverlay = $("sidebarOverlay");
const openSidebarBtn = $("openSidebarBtn");
const closeSidebarBtn = $("closeSidebarBtn");

const shareChatBtn = $("shareChatBtn");
const shareModal = $("shareModal");
const shareLinkOutput = $("shareLinkOutput");
const copyShareLinkBtn = $("copyShareLinkBtn");
const closeShareModalBtn = $("closeShareModalBtn");

const usernameModal = $("usernameModal");
const usernameInput = $("usernameInput");
const usernameError = $("usernameError");
const usernameSaveBtn = $("usernameSaveBtn");
const usernameSkipBtn = $("usernameSkipBtn");

const imageLightbox = $("imageLightbox");
const lightboxImg = $("lightboxImg");
const closeLightboxBtn = $("closeLightboxBtn");

// ---------------------------------------------------------------------
// 4. UTILITIES
// ---------------------------------------------------------------------
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function linkifyEscaped(escapedText){
  // escapedText sudah melalui escapeHtml, aman untuk disisipi tag <a>.
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return escapedText.replace(urlRegex, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}

function randomAlphaNumeric(len){
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function slugifyUsername(name){
  let base = (name || "pengguna").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (base.length < 3) base = (base + "ahay" + randomAlphaNumeric(3)).slice(0, 15);
  return base.slice(0, 16);
}

function pickAvatarColor(seed){
  let hash = 0;
  for (const ch of (seed || "x")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name){
  if (!name) return "V";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || name[0].toUpperCase();
}

function scrollMessagesToBottom(){
  requestAnimationFrame(() => { messagesArea.scrollTop = messagesArea.scrollHeight; });
}

function autoResizeTextarea(){
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + "px";
}

// Heuristik sederhana untuk mendeteksi kebutuhan pencarian web real-time.
function needsWebSearch(text){
  const t = (text || "").toLowerCase();
  const keywords = [
    "hari ini", "sekarang", "terkini", "terbaru", "saat ini", "minggu ini",
    "bulan ini", "tahun ini", "berita", "harga", "kurs", "cuaca", "skor",
    "hasil pertandingan", "rilis", "update terbaru", "siapa presiden",
    "kapan", "jadwal", "2024", "2025", "2026", "2027", "trending"
  ];
  return keywords.some((k) => t.includes(k));
}

// ---------------------------------------------------------------------
// 5. TOAST NOTIFICATIONS
// ---------------------------------------------------------------------
function showToast(message, type = "info", { loading = false, duration = 3800 } = {}){
  const container = $("toastContainer");
  const toastEl = document.createElement("div");
  toastEl.className = `toast ${type}`;
  toastEl.innerHTML = `${loading ? '<span class="toast-spinner"></span>' : ""}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toastEl);
  if (!loading){
    setTimeout(() => {
      toastEl.classList.add("leaving");
      setTimeout(() => toastEl.remove(), 260);
    }, duration);
  }
  return toastEl;
}
function dismissToast(toastEl, finalMessage, finalType){
  if (!toastEl) return;
  if (finalMessage){
    toastEl.className = `toast ${finalType || "success"}`;
    toastEl.innerHTML = `<span>${escapeHtml(finalMessage)}</span>`;
  }
  setTimeout(() => {
    toastEl.classList.add("leaving");
    setTimeout(() => toastEl.remove(), 260);
  }, 1600);
}

// ---------------------------------------------------------------------
// 6. AUTH FLOW
// ---------------------------------------------------------------------
googleLoginBtn.addEventListener("click", async () => {
  try{
    googleLoginBtn.disabled = true;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }catch(err){
    console.error(err);
    showToast("Gagal masuk dengan Google: " + (err.message || "coba lagi"), "error");
  }finally{
    googleLoginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  try{
    detachRealtimeListeners();
    await signOut(auth);
  }catch(err){
    showToast("Gagal keluar: " + err.message, "error");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (window.__isSharedRoute) return; // halaman shared read-only tidak butuh auth
  splashScreen.classList.add("hidden");
  if (user){
    state.user = user;
    await ensureUserProfile(user);
    loginScreen.classList.add("hidden");
    appShell.classList.remove("hidden");
    renderUserChip();
    attachSessionsListener();
  } else {
    state.user = null;
    state.profile = null;
    appShell.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  }
});

// Membuat profil otomatis dari akun Google saat login pertama kali —
// TIDAK ADA layar "buat username" yang memblokir (mengatasi loading lama).
async function ensureUserProfile(user){
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()){
    state.profile = snap.data();
    return;
  }
  const baseUsername = slugifyUsername(user.displayName || user.email?.split("@")[0]);
  let finalUsername = baseUsername;
  let uniqueLinkId = "ahay-" + randomAlphaNumeric(5);

  // Cek keunikan username (best-effort, beberapa percobaan)
  for (let attempt = 0; attempt < 5; attempt++){
    try{
      const q = query(collection(db, "users"), where("username", "==", finalUsername), limit(1));
      const existing = await getDocs(q);
      if (existing.empty) break;
      finalUsername = (baseUsername.slice(0, 12) + randomAlphaNumeric(4));
    }catch(e){
      break; // jika query gagal (index/permission), lanjut dengan kandidat saat ini
    }
  }

  const profile = {
    username: finalUsername,
    uniqueLinkId,
    email: user.email || "",
    displayName: user.displayName || finalUsername,
    photoURL: user.photoURL || "",
    avatarColor: pickAvatarColor(user.uid),
    createdAt: serverTimestamp()
  };
  await setDoc(userRef, profile);
  state.profile = profile;
  showToast(`Selamat datang, ${profile.displayName}! Nama pengguna: ${finalUsername}`, "success");
}

function renderUserChip(){
  const p = state.profile;
  if (!p) return;
  userAvatarEl.style.background = p.avatarColor;
  userAvatarEl.textContent = initials(p.displayName);
  userDisplayNameEl.textContent = p.displayName;
  userLinkIdEl.textContent = "@" + p.username;
}

// Modal edit username opsional (dibuka manual lewat klik pada user-chip)
document.querySelector(".user-chip").addEventListener("click", () => {
  usernameInput.value = state.profile?.username || "";
  usernameError.classList.add("hidden");
  usernameModal.classList.remove("hidden");
});
usernameSkipBtn.addEventListener("click", () => usernameModal.classList.add("hidden"));
usernameSaveBtn.addEventListener("click", async () => {
  const val = usernameInput.value.trim().toLowerCase();
  if (!/^[a-z0-9]{3,20}$/.test(val)){
    usernameError.textContent = "Gunakan 3-20 karakter huruf kecil & angka saja.";
    usernameError.classList.remove("hidden");
    return;
  }
  try{
    const q = query(collection(db, "users"), where("username", "==", val), limit(1));
    const existing = await getDocs(q);
    if (!existing.empty && val !== state.profile.username){
      usernameError.textContent = "Nama pengguna sudah dipakai, coba yang lain.";
      usernameError.classList.remove("hidden");
      return;
    }
    await updateDoc(doc(db, "users", state.user.uid), { username: val });
    state.profile.username = val;
    renderUserChip();
    usernameModal.classList.add("hidden");
    showToast("Nama pengguna diperbarui.", "success");
  }catch(err){
    usernameError.textContent = "Gagal menyimpan: " + err.message;
    usernameError.classList.remove("hidden");
  }
});

// ---------------------------------------------------------------------
// 7. SESSIONS (riwayat obrolan)
// ---------------------------------------------------------------------
function sessionsCol(){
  return collection(db, "chats", state.profile.uniqueLinkId, "sessions");
}
function messagesCol(sessionId){
  return collection(db, "chats", state.profile.uniqueLinkId, "sessions", sessionId, "messages");
}

function attachSessionsListener(){
  detachRealtimeListeners();
  const q = query(sessionsCol(), orderBy("updatedAt", "desc"), limit(100));
  state.unsubSessions = onSnapshot(q, (snap) => {
    state.sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderSessionList();
  }, (err) => showToast("Gagal memuat riwayat: " + err.message, "error"));
}

function detachRealtimeListeners(){
  if (state.unsubSessions) state.unsubSessions();
  if (state.unsubMessages) state.unsubMessages();
  state.unsubSessions = null;
  state.unsubMessages = null;
}

function renderSessionList(){
  sessionListEl.innerHTML = "";
  if (state.sessions.length === 0){
    const empty = document.createElement("p");
    empty.style.cssText = "color:var(--text-dim); font-size:0.8rem; padding:10px 12px;";
    empty.textContent = "Belum ada obrolan tersimpan.";
    sessionListEl.appendChild(empty);
    return;
  }
  for (const s of state.sessions){
    const item = document.createElement("div");
    item.className = "session-item" + (s.id === state.currentSessionId ? " active" : "");
    item.innerHTML = `<span class="session-title">${escapeHtml(s.title || "Obrolan Baru")}</span><span class="session-delete" title="Hapus">🗑️</span>`;
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("session-delete")) return;
      loadSession(s.id);
      closeSidebarMobile();
    });
    item.querySelector(".session-delete").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Hapus sesi obrolan ini?")) return;
      try{
        await deleteDoc(doc(db, "chats", state.profile.uniqueLinkId, "sessions", s.id));
        if (state.currentSessionId === s.id) startNewSession(false);
        showToast("Sesi dihapus.", "success");
      }catch(err){ showToast("Gagal menghapus sesi: " + err.message, "error"); }
    });
    sessionListEl.appendChild(item);
  }
}

function startNewSession(focusInput = true){
  state.currentSessionId = null;
  state.messages = [];
  if (state.unsubMessages) state.unsubMessages();
  currentSessionTitleEl.textContent = "Obrolan Baru";
  messagesListEl.innerHTML = "";
  emptyStateEl.classList.remove("hidden");
  renderSessionList();
  if (focusInput) messageInput.focus();
}

async function loadSession(sessionId){
  state.currentSessionId = sessionId;
  const meta = state.sessions.find((s) => s.id === sessionId);
  currentSessionTitleEl.textContent = meta?.title || "Obrolan";
  emptyStateEl.classList.add("hidden");
  renderSessionList();

  if (state.unsubMessages) state.unsubMessages();
  const q = query(messagesCol(sessionId), orderBy("createdAt", "asc"));
  state.unsubMessages = onSnapshot(q, (snap) => {
    state.messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMessages();
  }, (err) => showToast("Gagal memuat pesan: " + err.message, "error"));
}

async function ensureSessionExists(firstUserText){
  if (state.currentSessionId) return state.currentSessionId;
  const title = (firstUserText || "Obrolan Baru").slice(0, 42);
  const ref = await addDoc(sessionsCol(), {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  state.currentSessionId = ref.id;
  currentSessionTitleEl.textContent = title;
  const q = query(messagesCol(ref.id), orderBy("createdAt", "asc"));
  if (state.unsubMessages) state.unsubMessages();
  state.unsubMessages = onSnapshot(q, (snap) => {
    state.messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMessages();
  });
  return ref.id;
}

newChatBtn.addEventListener("click", () => { startNewSession(); closeSidebarMobile(); });

// ---------------------------------------------------------------------
// 8. RENDERING MESSAGES
// ---------------------------------------------------------------------
function renderMessages(){
  emptyStateEl.classList.toggle("hidden", state.messages.length > 0);
  messagesListEl.innerHTML = "";
  for (const m of state.messages) messagesListEl.appendChild(buildMessageEl(m));
  scrollMessagesToBottom();
}

function buildMessageEl(m){
  const row = document.createElement("div");
  row.className = `msg-row ${m.role === "user" ? "user" : "ai"}`;

  const avatar = document.createElement("div");
  if (m.role === "user"){
    avatar.className = "msg-avatar user";
    avatar.style.background = state.profile?.avatarColor || "#8b5cf6";
    avatar.textContent = initials(state.profile?.displayName);
  } else {
    avatar.className = "msg-avatar ai";
    avatar.innerHTML = `<img src="https://raflymusyaf.web.id/logodash.png" alt="Vesta AI">`;
  }

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  let html = "";
  if (m.webSearchUsed){
    html += `<div class="web-badge">🔍 Telah menelusuri web</div>`;
  }
  html += linkifyEscaped(escapeHtml(m.text || ""));
  if (m.imageDataUrl){
    html += `<img src="${m.imageDataUrl}" class="msg-image" alt="Lampiran gambar">`;
  }
  if (m.docName){
    html += `<div class="msg-doc-chip">📄 ${escapeHtml(m.docName)}</div>`;
  }
  if (m.sources && m.sources.length){
    html += `<div class="web-sources">${m.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(s.title || s.url)}</a>`).join("")}</div>`;
  }
  bubble.innerHTML = html;

  const img = bubble.querySelector("img.msg-image");
  if (img) img.addEventListener("click", () => openLightbox(img.src));

  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

function openLightbox(src){
  lightboxImg.src = src;
  imageLightbox.classList.remove("hidden");
}
closeLightboxBtn.addEventListener("click", () => imageLightbox.classList.add("hidden"));
imageLightbox.addEventListener("click", (e) => { if (e.target === imageLightbox) imageLightbox.classList.add("hidden"); });

// ---------------------------------------------------------------------
// 9. ATTACHMENTS (foto & dokumen)
// ---------------------------------------------------------------------
attachImageBtn.addEventListener("click", () => imageInput.click());
attachDocBtn.addEventListener("click", () => docInput.click());

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];
  imageInput.value = "";
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)){
    showToast("Format gambar tidak didukung (gunakan JPG/PNG/GIF/WebP).", "error");
    return;
  }
  if (file.size > 10 * 1024 * 1024){
    showToast("Ukuran gambar maksimal 10MB.", "error");
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  state.attachment = { type: "image", name: file.name, dataUrl, mime: file.type };
  renderAttachmentPreview();
});

docInput.addEventListener("change", async () => {
  const file = docInput.files[0];
  docInput.value = "";
  if (!file) return;
  const allowedExt = [".txt", ".md", ".csv", ".json"];
  if (!allowedExt.some((ext) => file.name.toLowerCase().endsWith(ext))){
    showToast("Format dokumen tidak didukung (gunakan .txt/.md/.csv/.json).", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024){
    showToast("Ukuran dokumen maksimal 5MB.", "error");
    return;
  }
  try{
    const text = await fileToText(file);
    state.attachment = { type: "doc", name: file.name, text };
    renderAttachmentPreview();
  }catch(err){
    showToast("Gagal membaca dokumen: " + err.message, "error");
  }
});

function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca gambar"));
    reader.readAsDataURL(file);
  });
}
function fileToText(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsText(file);
  });
}

function renderAttachmentPreview(){
  if (!state.attachment){
    attachmentPreviewEl.classList.add("hidden");
    attachmentPreviewEl.innerHTML = "";
    return;
  }
  attachmentPreviewEl.classList.remove("hidden");
  if (state.attachment.type === "image"){
    attachmentPreviewEl.innerHTML = `<img src="${state.attachment.dataUrl}" alt="preview"><span>${escapeHtml(state.attachment.name)}</span><span class="remove-attach">✕</span>`;
  } else {
    attachmentPreviewEl.innerHTML = `<span>📄</span><span>${escapeHtml(state.attachment.name)}</span><span class="remove-attach">✕</span>`;
  }
  attachmentPreviewEl.querySelector(".remove-attach").addEventListener("click", () => {
    state.attachment = null;
    renderAttachmentPreview();
  });
}

// ---------------------------------------------------------------------
// 10. SEND MESSAGE / AI PIPELINE
// ---------------------------------------------------------------------
messageInput.addEventListener("input", autoResizeTextarea);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    handleSend();
  }
});
sendBtn.addEventListener("click", handleSend);

async function handleSend(){
  const text = messageInput.value.trim();
  if (!text && !state.attachment) return;
  if (state.sending) return;
  state.sending = true;
  sendBtn.disabled = true;

  const attachment = state.attachment;
  state.attachment = null;
  renderAttachmentPreview();
  messageInput.value = "";
  autoResizeTextarea();

  try{
    const sessionId = await ensureSessionExists(text);

    const userMsg = {
      role: "user",
      text,
      createdAt: serverTimestamp(),
      ...(attachment?.type === "image" ? { imageDataUrl: attachment.dataUrl } : {}),
      ...(attachment?.type === "doc" ? { docName: attachment.name } : {})
    };
    await addDoc(messagesCol(sessionId), userMsg);
    await updateDoc(doc(db, "chats", state.profile.uniqueLinkId, "sessions", sessionId), { updatedAt: serverTimestamp() });

    typingIndicator.classList.remove("hidden");
    scrollMessagesToBottom();

    // --- Web search otomatis (Tavily via Cloud Function) ---
    let webSearchUsed = false;
    let sources = [];
    let searchContext = "";
    if (needsWebSearch(text)){
      const searchToast = showToast("Menelusuri web untuk info terkini…", "loading", { loading: true });
      try{
        const res = await callWebSearch({ query: text });
        const results = res.data?.results || [];
        if (results.length){
          webSearchUsed = true;
          sources = results.slice(0, 5).map((r) => ({ title: r.title, url: r.url }));
          searchContext = results.slice(0, 5)
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSumber: ${r.url}`)
            .join("\n\n");
        }
        dismissToast(searchToast, "Penelusuran web selesai.", "success");
      }catch(err){
        dismissToast(searchToast, "Penelusuran web gagal, lanjut tanpa data web.", "error");
      }
    }

    // --- Bangun riwayat percakapan (maks 20 pesan terakhir) ---
    const history = state.messages.slice(-MAX_HISTORY_MESSAGES);
    const chatHistory = history.map((m) => {
      if (m.role === "user" && m.imageDataUrl){
        return {
          role: "user",
          content: [
            { type: "text", text: m.text || "Tolong analisis gambar ini." },
            { type: "image_url", image_url: { url: m.imageDataUrl } }
          ]
        };
      }
      let contentText = m.text || "";
      if (m.docName && m.docText) contentText += `\n\n[Lampiran dokumen: ${m.docName}]\n${m.docText}`;
      return { role: m.role === "user" ? "user" : "assistant", content: contentText };
    });

    // Sisipkan isi dokumen (jika ada) ke pesan user terakhir sebagai konteks
    if (attachment?.type === "doc"){
      const last = chatHistory[chatHistory.length - 1];
      if (last && typeof last.content === "string"){
        last.content += `\n\n[Lampiran dokumen: ${attachment.name}]\n${attachment.text.slice(0, 12000)}`;
      }
    }

    let systemPrompt = "Kamu adalah Vesta AI, asisten AI yang ramah, cerdas, dan selalu menjawab dalam Bahasa Indonesia yang natural. Jawablah dengan jelas, ringkas namun informatif.";
    if (searchContext){
      systemPrompt += `\n\nBerikut hasil penelusuran web terkini yang relevan dengan pertanyaan pengguna. Gunakan informasi ini jika relevan dan sebutkan sumbernya secara natural:\n\n${searchContext}`;
    }

    const aiRes = await callChatCompletion({
      messages: [{ role: "system", content: systemPrompt }, ...chatHistory]
    });

    const aiText = aiRes.data?.text || "Maaf, aku tidak bisa menjawab saat ini.";

    await addDoc(messagesCol(sessionId), {
      role: "assistant",
      text: aiText,
      webSearchUsed,
      sources,
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "chats", state.profile.uniqueLinkId, "sessions", sessionId), { updatedAt: serverTimestamp() });

  }catch(err){
    console.error(err);
    showToast("Terjadi kesalahan: " + (err.message || "coba lagi"), "error");
  }finally{
    typingIndicator.classList.add("hidden");
    state.sending = false;
    sendBtn.disabled = false;
  }
}

// ---------------------------------------------------------------------
// 11. SHARE CHAT
// ---------------------------------------------------------------------
shareChatBtn.addEventListener("click", async () => {
  if (!state.currentSessionId || state.messages.length === 0){
    showToast("Mulai obrolan terlebih dahulu sebelum membagikan.", "error");
    return;
  }
  const toast = showToast("Menyiapkan tautan berbagi…", "loading", { loading: true });
  try{
    const shareId = randomAlphaNumeric(10);
    await setDoc(doc(db, "shared_chats", shareId), {
      ownerUsername: state.profile.username,
      title: currentSessionTitleEl.textContent,
      messages: state.messages.map((m) => ({
        role: m.role,
        text: m.text || "",
        imageDataUrl: m.imageDataUrl || null,
        docName: m.docName || null,
        webSearchUsed: !!m.webSearchUsed,
        sources: m.sources || []
      })),
      createdAt: serverTimestamp()
    });
    const url = `${location.origin}${location.pathname}?share=${shareId}`;
    shareLinkOutput.value = url;
    shareModal.classList.remove("hidden");
    dismissToast(toast, "Tautan siap dibagikan!", "success");
  }catch(err){
    dismissToast(toast, "Gagal membuat tautan: " + err.message, "error");
  }
});
closeShareModalBtn.addEventListener("click", () => shareModal.classList.add("hidden"));
copyShareLinkBtn.addEventListener("click", async () => {
  try{
    await navigator.clipboard.writeText(shareLinkOutput.value);
    showToast("Tautan disalin ke clipboard.", "success");
  }catch{
    shareLinkOutput.select();
    document.execCommand("copy");
    showToast("Tautan disalin.", "success");
  }
});

// ---------------------------------------------------------------------
// 12. PUBLIC SHARED VIEW (read-only, tanpa login)
// ---------------------------------------------------------------------
async function initSharedViewIfNeeded(){
  const params = new URLSearchParams(location.search);
  const shareId = params.get("share");
  if (!shareId) return false;
  window.__isSharedRoute = true;
  splashScreen.classList.add("hidden");
  loginScreen.classList.add("hidden");
  appShell.classList.add("hidden");
  sharedView.classList.remove("hidden");

  try{
    const snap = await getDoc(doc(db, "shared_chats", shareId));
    if (!snap.exists()){
      $("sharedMessagesList").innerHTML = `<p style="color:var(--text-dim); text-align:center;">Tautan tidak ditemukan atau sudah kedaluwarsa.</p>`;
      return true;
    }
    const data = snap.data();
    $("sharedMeta").textContent = `Dibagikan oleh @${data.ownerUsername} · "${data.title}"`;
    const list = $("sharedMessagesList");
    list.innerHTML = "";
    for (const m of (data.messages || [])) list.appendChild(buildSharedMessageEl(m));
  }catch(err){
    $("sharedMessagesList").innerHTML = `<p style="color:var(--text-dim); text-align:center;">Gagal memuat obrolan: ${escapeHtml(err.message)}</p>`;
  }
  return true;
}

function buildSharedMessageEl(m){
  const row = document.createElement("div");
  row.className = `msg-row ${m.role === "user" ? "user" : "ai"}`;
  const avatar = document.createElement("div");
  if (m.role === "user"){
    avatar.className = "msg-avatar user";
    avatar.style.background = "#8b5cf6";
    avatar.textContent = "U";
  } else {
    avatar.className = "msg-avatar ai";
    avatar.innerHTML = `<img src="https://raflymusyaf.web.id/logodash.png" alt="Vesta AI">`;
  }
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  let html = "";
  if (m.webSearchUsed) html += `<div class="web-badge">🔍 Telah menelusuri web</div>`;
  html += linkifyEscaped(escapeHtml(m.text || ""));
  if (m.imageDataUrl) html += `<img src="${m.imageDataUrl}" class="msg-image" alt="Lampiran gambar">`;
  if (m.docName) html += `<div class="msg-doc-chip">📄 ${escapeHtml(m.docName)}</div>`;
  if (m.sources?.length){
    html += `<div class="web-sources">${m.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(s.title || s.url)}</a>`).join("")}</div>`;
  }
  bubble.innerHTML = html;
  const img = bubble.querySelector("img.msg-image");
  if (img) img.addEventListener("click", () => openLightbox(img.src));
  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

// ---------------------------------------------------------------------
// 13. MOBILE SIDEBAR TOGGLE
// ---------------------------------------------------------------------
openSidebarBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
});
function closeSidebarMobile(){
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}
closeSidebarBtn.addEventListener("click", closeSidebarMobile);
sidebarOverlay.addEventListener("click", closeSidebarMobile);

// ---------------------------------------------------------------------
// 14. BOOTSTRAP
// ---------------------------------------------------------------------
(async function bootstrap(){
  const isShared = await initSharedViewIfNeeded();
  if (isShared) return;
  // onAuthStateChanged di atas akan menyembunyikan splash & menampilkan layar yang sesuai.
  setTimeout(() => splashScreen.classList.add("hidden"), 4000); // fallback jika auth lambat
})();
