/* ==========================================================================
   Logika Render Balon Chat, Reaksi Emoji, Search & Action Menu - WhatsApp Clone
   ========================================================================== */

import { db, auth } from "../database/firebase-config.js";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const chatContainer = document.getElementById("chatContainer");
const searchBar = document.getElementById("searchBar");
let unsubscribeChat = null;
let semuaPesanGrup = []; // Menyimpan cadangan pesan untuk fitur Search

// ==========================================================================
// FUNGSI 1: MENDENGAR & MEMUAT PESAN GRUP SECARA REAL-TIME
// ==========================================================================
window.addEventListener("grupBerubah", (e) => {
    const groupId = e.detail.groupId;
    
    // Matikan pendengar grup lama jika ada, biar tidak bentrok
    if (unsubscribeChat) unsubscribeChat();

    const q = query(
        collection(db, "messages"),
        where("groupId", "==", groupId),
        orderBy("timestamp", "asc")
    );

    // Dengarkan perubahan database Firebase Firestore
    unsubscribeChat = onSnapshot(q, (snapshot) => {
        semuaPesanGrup = [];
        if (chatContainer) chatContainer.innerHTML = "";

        snapshot.forEach((msgDoc) => {
            const data = msgDoc.data();
            const id = msgDoc.id;
            semuaPesanGrup.push({ id, ...data });
            
            // Gambar balon chat ke layar
            renderBalonChat(id, data);
        });

        // Otomatis gulir chat ke paling bawah setiap ada pesan baru
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, (error) => {
        console.error("Gagal memuat pesan:", error);
    });
});

// ==========================================================================
// FUNGSI 2: LOGIKA MENGGAMBAR BALON CHAT (KANAN / KIRI)
// ==========================================================================
function renderBalonChat(msgId, data) {
    const userSekarang = auth.currentUser;
    if (!userSekarang) return;

    const apakahSaya = data.senderId === userSekarang.uid;
    
    // Buat baris pembungkus pesan
    const row = document.createElement("div");
    row.className = `msg-row ${apakahSaya ? 'me' : 'them'}`;

    // Format jam menit (HH:MM)
    const jamFormat = data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

    // Cek apakah ada data Voice Note
    let isiKonten = `<div class="msg-text">${data.text}</div>`;
    if (data.audioData) {
        isiKonten = `
            <div class="msg-text">🎤 *Voice Note*</div>
            <audio controls src="${data.audioData}" style="width: 200px; height: 30px; margin-top: 5px;"></audio>
        `;
    }

    // Cek apakah pesan ini hasil dari Reply (Membalas pesan orang lain)
    let tampilanReply = "";
    if (data.replyTo) {
        tampilanReply = `
            <div style="background: rgba(0,0,0,0.05); border-left: 3px solid var(--wa-green-dark); padding: 4px; margin-bottom: 5px; font-size: 12px; border-radius: 4px;">
                <strong>@${data.replyTo.senderName}</strong>: ${data.replyTo.text.substring(0, 30)}...
            </div>
        `;
    }

    // Cek apakah ada reaksi emoji
    let tampilanReaksi = "";
    if (data.reactions && data.reactions.length > 0) {
        // Ambil emoji-emoji unik yang diberikan
        const totalEmoji = data.reactions.map(r => r.emoji).join("");
        tampilanReaksi = `
            <div style="position: absolute; bottom: -12px; right: 10px; background: var(--header-bg); border-radius: 10px; padding: 1px 5px; font-size: 11px; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
                ${totalEmoji}
            </div>
        `;
    }

    // Gabungkan seluruh komponen menjadi satu Balon Chat utuh
    row.innerHTML = `
        <div class="msg-bubble" style="position: relative;">
            ${!apakahSaya ? `<span class="msg-sender">@${data.senderName}</span>` : ''}
            ${tampilanReply}
            ${isiKonten}
            <div class="msg-meta">
                <span>${jamFormat}</span>
                ${apakahSaya ? `<span class="icon-tick">✓✓</span>` : ''}
            </div>
            ${tampilanReaksi}
        </div>
    `;

    // Pasang fitur menu aksi tak terlihat saat balon chat diklik dua kali / tahan lama
    row.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // Matikan menu klik kanan bawaan browser
        pemicuMenuAksi(msgId, data, apakahSaya);
    });

    if (chatContainer) chatContainer.appendChild(row);
}

// ==========================================================================
// FUNGSI 3: MENU AKSI (REPLY, EDIT, FORWARD, EMOJI) VIA PROMPT
// ==========================================================================
function pemicuMenuAksi(msgId, data, apakahSaya) {
    const pilihan = prompt(
        `Pilih Aksi Pesan:\n\n` +
        `1. Balas (Reply)\n` +
        `2. Teruskan (Forward)\n` +
        `3. Beri Reaksi Emoji (Ketik: 👍, ❤️, 😂, atau 🔥)\n` +
        (apakahSaya ? `4. Edit Pesan\n` : "") + 
        `\nKetik nomor atau emojinya langsung:`
    );

    if (!pilihan) return;

    // Aksi 1: Reply
    if (pilihan === "1") {
        window.dispatchEvent(new CustomEvent("setReply", { detail: { senderName: data.senderName, text: data.text } }));
    } 
    // Aksi 2: Forward
    else if (pilihan === "2") {
        window.dispatchEvent(new CustomEvent("setForward", { detail: { text: data.text } }));
    } 
    // Aksi 4: Edit (Hanya jika pesan milik sendiri)
    else if (pilihan === "4" && apakahSaya) {
        window.dispatchEvent(new CustomEvent("setEdit", { detail: { msgId: msgId, oldText: data.text } }));
    } 
    // Aksi 3 / Langsung mengetik emoji: Beri Reaksi
    else {
        let emojiDipilih = pilihan;
        if (pilihan === "3") {
            emojiDipilih = prompt("Ketik emoji reaksi kamu (👍/❤️/😂/🔥):") || "👍";
        }
        
        // Simpan reaksi emoji ke dokumen pesan di Firebase Firestore
        const userSekarang = auth.currentUser;
        const pesanRef = doc(db, "messages", msgId);
        updateDoc(pesanRef, {
            reactions: arrayUnion({
                userId: userSekarang.uid,
                emoji: emojiDiphibited = ["👍", "❤️", "😂", "🔥"].includes(emojiDipilih) ? emojiDipilih : "👍"
            })
        });
    }
}

// ==========================================================================
// FUNGSI 4: FITUR PENCARIAN CHAT (SEARCH BAR)
// ==========================================================================
if (searchBar) {
    searchBar.addEventListener("input", (e) => {
        const kataKunci = e.target.value.toLowerCase().trim();
        
        // Bersihkan layar chat untuk menyaring ulang secara lokal
        if (chatContainer) chatContainer.innerHTML = "";

        semuaPesanGrup.forEach((msg) => {
            // Jika teks isi chat mengandung kata kunci, tampilkan kembali balonnya
            if (msg.text.toLowerCase().includes(kataKunci) || msg.senderName.toLowerCase().includes(kataKunci)) {
                renderBalonChat(msg.id, msg);
            }
        });
    });
}

