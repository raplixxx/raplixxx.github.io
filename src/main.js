/* ==========================================================================
   Saklar Pusat (Main Entry Point) - WhatsApp Clone (Rafly)
   ========================================================================== */

// Meng-import semua file logika agar aktif dan berjalan bersama
import "./utils/notification.js";
import "./database/firebase-config.js";
import "./auth/login.js";
import "./chat/group.js";
import "./chat/send.js";
import "./chat/render.js";

console.log("🔋 Semua modul WhatsApp Clone berhasil aktif via main.js!");

// Fitur Otomatis: Jika dibuka malam hari (di atas jam 6 sore), otomatis aktifkan Dark Mode
const jamSekarang = new Date().getHours();
if (jamSekarang >= 18 || jamSekarang <= 6) {
    document.body.classList.add("dark-theme");
    console.log("🌙 Dark Mode otomatis aktif karena sudah malam.");
}
