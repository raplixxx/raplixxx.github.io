/**
 * js/ui.js
 * Helper UI kecil: Toast notification, escape HTML (anti-XSS), dan util DOM.
 */

// ---------------------------------------------------------------------------
// Anti-XSS: sanitasi semua teks yang berasal dari input pengguna sebelum
// dirender sebagai innerHTML.
// ---------------------------------------------------------------------------
export function escapeHTML(str = "") {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// Ubah newline jadi <br> SETELAH escape, supaya tetap aman.
export function escapeHTMLWithBreaks(str = "") {
  return escapeHTML(str).replace(/\n/g, "<br>");
}

// ---------------------------------------------------------------------------
// Toast Notification (gaya Uiverse: glass card, glowing border, auto-dismiss)
// ---------------------------------------------------------------------------
let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

/**
 * @param {string} message
 * @param {"success"|"error"|"loading"|"info"} type
 * @param {number} duration ms (0 = tidak auto-hilang, dipakai untuk loading)
 * @returns {HTMLElement} elemen toast (untuk di-dismiss manual jika perlu)
 */
export function showToast(message, type = "info", duration = 3500) {
  const container = ensureContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const icons = {
    success: "✅",
    error: "⚠️",
    loading: '<span class="toast-spinner"></span>',
    info: "ℹ️",
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" aria-label="Tutup notifikasi">×</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  const remove = () => {
    toast.classList.remove("toast--visible");
    toast.classList.add("toast--leaving");
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".toast-close").addEventListener("click", remove);

  if (duration > 0) {
    setTimeout(remove, duration);
  }

  return { element: toast, dismiss: remove };
}

export function updateToast(toastRef, message, type = "success", duration = 3000) {
  if (!toastRef || !toastRef.element) return;
  const { element } = toastRef;
  element.className = `toast toast--${type} toast--visible`;
  const icons = { success: "✅", error: "⚠️", loading: '<span class="toast-spinner"></span>', info: "ℹ️" };
  element.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" aria-label="Tutup notifikasi">×</button>
  `;
  element.querySelector(".toast-close").addEventListener("click", toastRef.dismiss);
  if (duration > 0) setTimeout(toastRef.dismiss, duration);
}

// ---------------------------------------------------------------------------
// Util kecil lain
// ---------------------------------------------------------------------------
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function generateRandomAlphaNumeric(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateUUID() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date = new Date()) {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
