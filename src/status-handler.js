/* ==========================================================================
   Logika WhatsApp Story (Status) - Upload & T Tampilan Real-Time
   ========================================================================== */

import { db, auth } from "../database/firebase-config.js";
import { collection, addDoc, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { simpanMediaLokal, ambilMediaLokal } from "../utils/storage-local.js";

const btnTabStatus = document.getElementById("btnTabStatus"); // Tombol pindah ke tab status
const statusListContainer = document.getElementById("statusListContainer"); // Tempat daftar status di sidebar

// ==========================================================================
// FUNGSI 1: UPLOAD STATUS (MEMPROSES FOTO JADI BASE64 & SIMPAN LOKAL)
// ==========================================================================
export async function uploadStatusBaru(fileGambar, teksCaption) {
    const userSekarang = auth.currentUser;
    if (!userSekarang) return alert("Kamu harus login dulu!");

    const reader = new FileReader();
    reader.readAsDataURL(fileGambar);
    reader.onloadend = async () => {
        const base64Gambar = reader.result; // Hasil konversi foto jadi string teks

        // Buat ID unik untuk kunci penyimpanan foto di HP
        const mediaKey = `status_${userSekarang.uid}_${Date.now()}`;
        
        // Simpan foto asli di LocalStorage HP agar hemat database cloud
        const suksesSimpan = simpanMediaLokal(mediaKey, base64Gambar);

        if (suksesSimpan) {
            try {
                // Kirim data info statusnya saja ke Firebase Firestore
                await addDoc(collection(db, "statuses"), {
                    senderId: userSekarang.uid,
                    senderName: userSekarang.displayName,
                    senderFoto: userSekarang.photoURL,
                    caption: teksCaption || "",
                    storageKey: mediaKey, // Kunci untuk mengambil foto di lokal nanti
                    createdAt: new Date().toISOString()
                });
                alert("Status WhatsApp Story berhasil di-upload!");
            } catch (error) {
                console.error("Gagal mencatat status ke Firebase:", error);
            }
        }
    };
}

// ==========================================================================
// FUNGSI 2: MEMUAT DAFTAR STATUS SECARA REAL-TIME DI SIDEBAR
// ==========================================================================
function muatDaftarStatus() {
    const q = query(collection(db, "statuses"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        if (statusListContainer) statusListContainer.innerHTML = ""; // Bersihkan list lama

        snapshot.forEach((statusDoc) => {
            const data = statusDoc.data();
            
            // Cek apakah status sudah kedaluwarsa (lebih dari 24 jam)
            const waktuDibuat = new Date(data.createdAt).getTime();
            const waktuSekarang = Date.now();
            if (waktuSekarang - waktuDibuat > 24 * 60 * 60 * 1000) {
                return; // Lewati jika sudah lewat 24 jam (Khas WA Story)
            }

            // Gambar item lingkaran status di sidebar
            const statusItem = document.createElement("div");
            statusItem.className = "list-item";
            statusItem.innerHTML = `
                <div style="position: relative;">
                    <img src="${data.senderFoto || 'https://via.placeholder.com/45'}" alt="Avatar" class="item-avatar" style="border: 2px solid var(--wa-green); padding: 2px;">
                </div>
                <div class="item-info">
                    <h4>${data.senderName}</h4>
                    <p>${data.caption || 'Lihat status...'}</p>
                </div>
            `;

            // Aksi jika lingkaran status di klik: Tampilkan pop-up gambarnya
            statusItem.addEventListener("click", () => {
                bukaViewerStatus(data);
            });

            if (statusListContainer) statusListContainer.appendChild(statusItem);
        });
    });
}

// ==========================================================================
// FUNGSI 3: POP-UP VIEWER STATUS (MELIHAT GAMBAR STORY)
// ==========================================================================
function bukaViewerStatus(dataStatus) {
    // Ambil string foto dari LocalStorage berdasarkan kunci dokumen Firebase
    const fotoBase64 = ambilMediaLokal(dataStatus.storageKey);

    if (!fotoBase64) {
        alert("Foto status tidak bisa dimuat karena data media berada di perangkat lokal pemilik status.");
        return;
    }

    // Buat element pop-up layar hitam penuh ala WA Story viewer
    const viewerOverlay = document.createElement("div");
    viewerOverlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.95); z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white;";
    
    viewerOverlay.innerHTML = `
        <div style="position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 10px;">
            <img src="${dataStatus.senderFoto}" style="width: 40px; height: 40px; border-radius: 50%;">
            <strong>${dataStatus.senderName}</strong>
        </div>
        <button id="closeStatusViewer" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 30px; cursor: pointer;">✕</button>
        <img src="${fotoBase64}" style="max-width: 90%; max-height: 70%; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
        <p style="margin-top: 20px; font-size: 16px; font-weight: 300; max-width: 80%; text-align: center;">${dataStatus.caption}</p>
    `;

    document.body.appendChild(viewerOverlay);

    // Tombol close viewer status
    document.getElementById("closeStatusViewer").addEventListener("click", () => {
        viewerOverlay.remove();
    });
}

// Jalankan fungsi membaca status begitu halaman selesai dimuat browser
window.addEventListener("load", () => {
    setTimeout(() => {
        auth.onAuthStateChanged((user) => {
            if (user) muatDaftarStatus();
        });
    }, 1200);
});

