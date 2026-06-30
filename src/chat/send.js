/* ==========================================================================
   Logika Pengiriman Pesan, Edit, Reply, Forward & Voice Note - WhatsApp Clone
   ========================================================================== */

import { cekDanTanggapiAI } from "../utils/ai-assistant.js";
import { db, auth } from "../database/firebase-config.js";
import { collection, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { IDGrupAktif } from "./group.js";

// Ambil elemen HTML input
const inputMsg = document.getElementById("inputMsg");
const btnKirim = document.getElementById("btnKirim");
const btnAttachMedia = document.getElementById("btnAttachMedia"); // Kita manfaatkan sementara untuk VN/Foto

// Variabel bantu untuk fitur Reply & Edit
let pesanDibalasData = null; 
let IDPesanDiedit = null; 
let mediaRecorder = null;
let audioChunks = [];

// ==========================================================================
// FUNGSI 1: MENGIRIM PESAN (TEKS, REPLY, EDIT)
// ==========================================================================
async function eksekusiKirimPesan() {
    const userSekarang = auth.currentUser;
    if (!userSekarang) return alert("Kamu harus login dulu!");
    if (!IDGrupAktif) return alert("Pilih grup terlebih dahulu!");
    
    const teksPesan = inputMsg.value.trim();
    if (teksPesan === "") return;

    try {
        // JIKA MODE EDIT AKTIF: Update pesan lama di Firebase
        if (IDPesanDiedit) {
            const pesanRef = doc(db, "messages", IDPesanDiedit);
            await updateDoc(pesanRef, {
                text: teksPesan + " _(diedit)_",
                isEdited: true
            });
            IDPesanDiedit = null; // Reset mode edit
            inputMsg.placeholder = "Ketik pesan";
        } 
        // JIKA MODE BIASA / REPLY AKTIF: Buat dokumen pesan baru
        else {
            const dataPesan = {
                groupId: IDGrupAktif,
                senderId: userSekarang.uid,
                senderName: userSekarang.displayName,
                text: teksPesan,
                timestamp: new Date().toISOString(),
                statusCentang: 1, // 1 = Terkirim ke server
                reactions: [],
                replyTo: pesanDibalasData ? pesanDibalasData : null // Tempel data reply jika ada
            };

            await addDoc(collection(db, "messages"), dataPesan);
            
            // Reset data reply setelah terkirim
            pesanDibalasData = null;
            inputMsg.placeholder = "Ketik pesan";
        }

        inputMsg.value = ""; // Bersihkan kolom input teks
    } catch (error) {
        console.error("Gagal mengirim/mengedit pesan:", error);
    }
}

// Event listener klik tombol kirim atau tekan tombol Enter
if (btnKirim) btnKirim.addEventListener("click", eksekusiKirimPesan);
if (inputMsg) {
    inputMsg.addEventListener("keypress", (e) => {
        if (e.key === "Enter") eksekusiKirimPesan();
    });
}

// ==========================================================================
// FUNGSI 2: FITUR FORWARD (TERUSKAN PESAN)
// ==========================================================================
async function forwardPesan(teksAsli, targetGroupId) {
    const userSekarang = auth.currentUser;
    if (!userSekarang || !targetGroupId) return;

    try {
        await addDoc(collection(db, "messages"), {
            groupId: targetGroupId,
            senderId: userSekarang.uid,
            senderName: userSekarang.displayName,
            text: teksAsli + " _[Diteruskan]_",
            timestamp: new Date().toISOString(),
            statusCentang: 1,
            reactions: []
        });
        alert("Pesan berhasil diteruskan!");
    } catch (error) {
        console.error("Gagal meneruskan pesan:", error);
    }
}

// ==========================================================================
// FUNGSI 3: FITUR VOICE NOTE (VN) LEWAT MIKROFON HP/LAPTOP
// ==========================================================================
// Klik ikon kamera/lampiran agak lama atau klik dua kali untuk rekam suara
if (btnAttachMedia) {
    btnAttachMedia.addEventListener("dblclick", async () => {
        if (!IDGrupAktif) return alert("Pilih grup dulu sebelum merekam suara!");
        
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            // Mulai merekam suara
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    
                    // Ubah rekaman audio menjadi string Base64 pendek agar bisa dialirkan
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = async () => {
                        const base64Audio = reader.result;
                        
                        // Kirim informasi VN ke Firebase teks, audio aslinya nanti ditangkap di lokal HP penerima
                        const userSekarang = auth.currentUser;
                        await addDoc(collection(db, "messages"), {
                            groupId: IDGrupAktif,
                            senderId: userSekarang.uid,
                            senderName: userSekarang.displayName,
                            text: "🎤 Voice Note (Klik untuk putar)",
                            audioData: base64Audio, // Audio terkompresi
                            timestamp: new Date().toISOString(),
                            statusCentang: 1,
                            reactions: []
                        });
                    };
                });

                mediaRecorder.start();
                btnAttachMedia.textContent = "🛑"; // Ubah icon jadi stop saat merekam
                inputMsg.placeholder = "🔴 Sedang merekam suara...";
            } catch (err) {
                alert("Gagal mengakses mikrofon: " + err.message);
            }
        } else {
            // Berhenti merekam suara
            mediaRecorder.stop();
            btnAttachMedia.textContent = "📷";
            inputMsg.placeholder = "Ketik pesan";
        }
    });
}

// ==========================================================================
// PENERIMA SINYAL DARI KLIK KANAN / MENU BALON CHAT (Akan dihubungkan ke render.js)
// ==========================================================================
window.addEventListener("setReply", (e) => {
    pesanDibalasData = e.detail;
    inputMsg.placeholder = `Balas @${pesanDibalasData.senderName}: "${pesanDibalasData.text}"`;
    inputMsg.focus();
});

window.addEventListener("setEdit", (e) => {
    IDPesanDiedit = e.detail.msgId;
    inputMsg.value = e.detail.oldText.replace(" _(diedit)_", "");
    inputMsg.placeholder = "Edit pesanmu di sini...";
    inputMsg.focus();
});

window.addEventListener("setForward", (e) => {
    const targetGrup = prompt("Masukkan ID Grup Tujuan untuk meneruskan pesan ini:");
    if (targetGrup) {
        forwardPesan(e.detail.text, targetGrup);
    }
});

