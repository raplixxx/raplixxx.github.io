/* ==========================================================================
   Gerbang Utama Firebase & Inisialisasi Layanan - WhatsApp Clone (Rafly)
   ========================================================================== */

// 1. Mengambil fungsi inti Firebase langsung dari server Google CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Konfigurasi akun Firebase asli milik Rafly
const firebaseConfig = {
  apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
  authDomain: "wa-clone-rafly.firebaseapp.com",
  projectId: "wa-clone-rafly",
  storageBucket: "wa-clone-rafly.firebasestorage.app",
  messagingSenderId: "217952329083",
  appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

// 3. Menyalakan mesin utama Firebase di website
const app = initializeApp(firebaseConfig);

// 4. Mengekspor modul otentikasi login & database agar bisa dibaca file js lain
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase Engine Berhasil Dinyalakan!");
