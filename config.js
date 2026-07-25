/**
 * js/config.js
 * ---------------------------------------------------------------------------
 * SATU-SATUNYA tempat konfigurasi sensitif (API keys, Firebase config, dll).
 * File lain (auth.js, chat.js, firestore.js, app.js) TIDAK BOLEH menaruh
 * kunci API langsung di dalamnya — semua harus import dari sini.
 *
 * ⚠️ CATATAN KEAMANAN PENTING:
 * Karena proyek ini adalah Single Page Application statis yang di-hosting di
 * GitHub Pages (tanpa backend/server), SEMUA kode JavaScript — termasuk file
 * ini — pasti terkirim ke browser pengguna dan bisa dibaca siapa saja lewat
 * DevTools atau "view source". Memisahkan kunci ke file ini merapikan kode
 * dan memudahkan rotasi kunci, TAPI TIDAK menyembunyikannya secara teknis.
 *
 * Firebase apiKey memang didesain aman untuk client-side (dibatasi lewat
 * Firebase Security Rules & App Check), tapi SumoPod API Key dan Tavily API
 * Key BUKAN kunci client-safe — siapa pun bisa mengambilnya dari file ini
 * dan memakainya untuk menghabiskan kuota/biaya Anda. Untuk produksi yang
 * sesungguhnya, sebaiknya kunci-kunci itu dipindah ke Cloud Function /
 * proxy server sehingga tidak pernah dikirim ke browser. Jangan commit kunci
 * asli ke repo publik — pertimbangkan memakai GitHub Secrets + build step,
 * atau minimal rotasi kunci secara berkala.
 * ---------------------------------------------------------------------------
 */

// ==== FIREBASE (Auth + Firestore) ====
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
  authDomain: "wa-clone-rafly.firebaseapp.com",
  projectId: "wa-clone-rafly",
  storageBucket: "wa-clone-rafly.firebasestorage.app",
  messagingSenderId: "217952329083",
  appId: "1:217952329083:web:644aafe82e9b40794b31de",
};

// ==== SumoPod AI (OpenAI-compatible Chat Completions) ====
export const SUMOPOD_CONFIG = {
  baseUrl: "https://ai.sumopod.com/v1",
  apiKey: "sk-QTrGoAspLLuYSacIKQyuww",
  model: "gpt-4o-mini",
  maxTokens: 4096,
  temperature: 0.7,
};

// ==== Tavily Web Search ====
export const TAVILY_CONFIG = {
  baseUrl: "https://api.tavily.com/search",
  apiKey: "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",
};

// ==== Branding / Aset Logo ====
export const BRAND_CONFIG = {
  appName: "Web Ahay",
  botName: "Vesta AI",
  seoLogoUrl: "https://raflymusyaf.web.id/logoweb.png", // khusus meta tag / favicon
  displayLogoUrl: "https://raflymusyaf.web.id/logodash.png", // khusus tampilan visual (header, sidebar, loading)
  domain: "https://raflymusyaf.web.id",
};

// ==== Batasan Aplikasi ====
export const APP_LIMITS = {
  maxHistoryMessages: 20, // maksimal pesan yang dikirim sebagai konteks ke API
  maxImageSizeMB: 10,
  allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  allowedDocTypes: [".txt", ".md", ".csv", ".json"],
};
