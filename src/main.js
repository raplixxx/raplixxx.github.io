/* ==========================================================================
   Saklar Pusat (Main Entry Point) - WhatsApp Clone (Rafly)
   ========================================================================== */

// 1. Meng-import semua file logika agar aktif berbarengan (INI WAJIB DI ATAS)
import "./database/firebase-config.js";
import "./auth/login.js";
import "./chat/group.js";
import "./chat/send.js";
import "./chat/render.js";
import "./status/status-handler.js";
import "./utils/notification.js";
import "./utils/ai-assistant.js";

console.log("🔋 Semua modul WhatsApp Clone berhasil aktif via main.js!");

// 2. Fitur Otomatis: Aktifkan Dark Mode jika dibuka malam hari
const jamSekarang = new Date().getHours();
if (jamSekarang >= 18 || jamSekarang <= 6) {
    document.body.classList.add("dark-theme");
    console.log("🌙 Dark Mode otomatis aktif karena sudah malam.");
}

// 3. Logika Navigasi Tab (Chat & Status)
const btnTabChat = document.getElementById("btnTabChat");
const btnTabStatus = document.getElementById("btnTabStatus");
const tabChatContent = document.getElementById("tabChatContent");
const tabStatusContent = document.getElementById("tabStatusContent");
const inputStatusFile = document.getElementById("inputStatusFile");
const btnTriggerUploadStatus = document.getElementById("btnTriggerUploadStatus");

if (btnTabStatus && btnTabChat) {
    btnTabStatus.addEventListener("click", () => {
        tabChatContent.classList.add("hidden");
        tabStatusContent.classList.remove("hidden");
        btnTabChat.classList.remove("active");
        btnTabStatus.classList.add("active");
    });

    btnTabChat.addEventListener("click", () => {
        tabStatusContent.classList.add("hidden");
        tabChatContent.classList.remove("hidden");
        btnTabStatus.classList.remove("active");
        btnTabChat.classList.add("active");
    });
}

// 4. Memicu Tombol Upload Status mengambil file dari HP
if (btnTriggerUploadStatus && inputStatusFile) {
    btnTriggerUploadStatus.addEventListener("click", () => inputStatusFile.click());
    
    inputStatusFile.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
            const caption = prompt("Masukkan kata-kata/caption untuk statusmu:") || "";
            const { uploadStatusBaru } = await import("./status/status-handler.js");
            uploadStatusBaru(file, caption);
        }
    });
}
