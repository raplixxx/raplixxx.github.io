/* ==========================================================================
   Logika Manajemen Grup, Admin & Link Undangan - WhatsApp Clone
   ========================================================================== */

// 1. Ambil koneksi database dari pintu gerbang utama
import { db, auth } from "../database/firebase-config.js";
import { 
    collection, 
    addDoc, 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    query, 
    where, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Ambil elemen HTML yang dibutuhkan
const btnCreateGroup = document.getElementById("btnCreateGroup");
const groupListContainer = document.getElementById("groupListContainer");
const activeGroupName = document.getElementById("activeGroupName");
const activeGroupMembersCount = document.getElementById("activeGroupMembersCount");
const activeChatScreen = document.getElementById("activeChatScreen");
const blankChatScreen = document.getElementById("blankChatScreen");

let IDGrupAktif = null; // Menyimpan ID grup yang sedang dibuka oleh pengguna

// ==========================================================================
// FUNGSI 1: MEMBUAT GRUP BARU (OTOMATIS JADI ADMIN)
// ==========================================================================
if (btnCreateGroup) {
    btnCreateGroup.addEventListener("click", async () => {
        const userSekarang = auth.currentUser;
        if (!userSekarang) return alert("Kamu harus login terlebih dahulu!");

        const namaGrup = prompt("Masukkan nama grup baru:");
        if (!namaGrup || namaGrup.trim() === "") return;

        const deskripsiGrup = prompt("Masukkan deskripsi/aturan grup:") || "Selamat datang di grup baru!";

        try {
            // Membuat dokumen grup baru di Firebase Firestore
            const grupRef = await addDoc(collection(db, "groups"), {
                name: namaGrup,
                description: deskripsiGrup,
                createdBy: userSekarang.uid,
                createdAt: new Date().toISOString(),
                // Pembuat grup otomatis masuk ke daftar anggota awal
                members: [userSekarang.uid], 
                // Pembuat grup ditandai sebagai Admin utama
                admins: [userSekarang.uid] 
            });

            // Membuat token/link undangan acak unik berbasis ID dokumen grup
            const linkUndangan = `${window.location.origin}${window.location.pathname}?join=${grupRef.id}`;
            
            // Simpan link undangan tersebut kembali ke dalam dokumen grup
            await updateDoc(doc(db, "groups", grupRef.id), {
                inviteLink: linkUndangan
            });

            alert(`Grup "${namaGrup}" berhasil dibuat!\n\nSalin Link Undangan ini untuk disebar ke teman:\n${linkUndangan}`);
        } catch (error) {
            console.error("Gagal membuat grup:", error);
            alert("Terjadi kesalahan saat membuat grup.");
        }
    });
}

// ==========================================================================
// FUNGSI 2: MEMBACA & MENAMPILKAN DAFTAR GRUP SECARA REAL-TIME
// ==========================================================================
function muatDaftarGrup() {
    const userSekarang = auth.currentUser;
    if (!userSekarang) return;

    // Cari grup di Firestore yang di dalam array 'members'-nya ada ID pengguna saat ini
    const q = query(collection(db, "groups"), where("members", "array-contains", userSekarang.uid));

    // Listen data secara real-time
    onSnapshot(q, (snapshot) => {
        if (groupListContainer) groupListContainer.innerHTML = ""; // Bersihkan daftar lama

        snapshot.forEach((grupDoc) => {
            const dataGrup = grupDoc.data();
            const totalAnggota = dataGrup.members ? dataGrup.members.length : 0;

            // Racik elemen tampilan item daftar grup di sidebar kiri
            const grupItem = document.createElement("div");
            grupItem.className = "list-item";
            grupItem.innerHTML = `
                <img src="https://via.placeholder.com/45/00a884/ffffff?text=${dataGrup.name.charAt(0)}" alt="Avatar" class="item-avatar">
                <div class="item-info">
                    <h4>${dataGrup.name}</h4>
                    <p>${dataGrup.description || ''}</p>
                </div>
                <span style="font-size: 11px; color: #667781;">👥 ${totalAnggota}</span>
            `;

            // Aksi ketika salah satu grup di sidebar diklik
            grupItem.addEventListener("click", () => {
                bukaRuangObrolanGrup(grupDoc.id, dataGrup);
            });

            if (groupListContainer) groupListContainer.appendChild(grupItem);
        });
    });
}

// ==========================================================================
// FUNGSI 3: MEMBUKA RUANG OBROLAN GRUP YANG DIPILIH
// ==========================================================================
function bukaRuangObrolanGrup(groupId, dataGrup) {
    IDGrupAktif = groupId;
    
    // Ganti teks nama grup dan jumlah anggota di header chat kanan
    if (activeGroupName) activeGroupName.textContent = dataGrup.name;
    if (activeGroupMembersCount) {
        activeGroupMembersCount.textContent = `${dataGrup.members.length} / 1000 Anggota`;
    }

    // Tukar layar dari blank screen menjadi layar chat aktif
    if (blankChatScreen) blankChatScreen.classList.add("hidden");
    if (activeChatScreen) activeChatScreen.classList.remove("hidden");

    // Kirim sinyal ke file render.js (yang akan kita buat nanti) untuk mulai memuat obrolan teks grup ini
    window.dispatchEvent(new CustomEvent("grupBerubah", { detail: { groupId: groupId } }));
}

// ==========================================================================
// FUNGSI 4: SISTEM VALIDASI LINK UNDANGAN & PEMBATASAN MAKSIMAL 1.000 ANGGOTA
// ==========================================================================
async function cekLinkUndanganGrup() {
    const urlParams = new URLSearchParams(window.location.search);
    const joinGroupId = urlParams.get('join');

    if (joinGroupId) {
        const userSekarang = auth.currentUser;
        if (!userSekarang) {
            alert("Kamu mendeteksi link undangan grup. Silakan login terlebih dahulu untuk bergabung!");
            return;
        }

        try {
            const grupDocRef = doc(db, "groups", joinGroupId);
            const grupSnap = await getDoc(grupDocRef);

            if (grupSnap.exists()) {
                const dataGrup = grupSnap.data();
                const daftarAnggota = dataGrup.members || [];

                // 1. Cek apakah pengguna sudah bergabung di dalam grup tersebut
                if (daftarAnggota.includes(userSekarang.uid)) {
                    // Bersihkan kode ?join= dari URL agar kembali rapi setelah masuk
                    bersihkanParameterURL();
                    bukaRuangObrolanGrup(joinGroupId, dataGrup);
                    return;
                }

                // 2. PROTEKSI KRUSIAL: Batasi maksimal 1.000 anggota
                if (daftarAnggota.length >= 1000) {
                    alert("Maaf, grup ini gagal dimasuki karena kuota anggota sudah penuh (Maksimal 1.000 orang)!");
                    bersihkanParameterURL();
                    return;
                }

                // 3. Jika kuota aman, masukkan ID pengguna ke dalam array members di database
                const konfirmasi = confirm(`Apakah kamu ingin bergabung ke dalam grup "${dataGrup.name}"?`);
                if (konfirmasi) {
                    await updateDoc(grupDocRef, {
                        members: arrayUnion(userSekarang.uid)
                    });
                    alert(`Selamat! Kamu berhasil bergabung ke grup "${dataGrup.name}".`);
                    bersihkanParameterURL();
                    bukaRuangObrolanGrup(joinGroupId, dataGrup);
                } else {
                    bersihkanParameterURL();
                }

            } else {
                alert("Link undangan grup tidak valid atau grup sudah dihapus.");
                bersihkanParameterURL();
            }
        } catch (error) {
            console.error("Gagal memproses link undangan:", error);
        }
    }
}

function bersihkanParameterURL() {
    // Ambil parameter user untuk dipertahankan privasinya, buang parameter join
    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('user');
    let linkBaru = `${window.location.origin}${window.location.pathname}`;
    if (uid) linkBaru += `?user=${uid}`;
    window.history.pushState({ path: linkBaru }, '', linkBaru);
}

// Trigger pemuatan grup begitu status login pengguna sudah terdeteksi aktif
window.addEventListener("load", () => {
    // Beri jeda kecil agar objek auth dari Firebase siap
    setTimeout(() => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                muatDaftarGrup();
                cekLinkUndanganGrup();
            }
        });
    }, 1000);
});

export { IDGrupAktif };

