/* ==========================================================================
   Logika Sistem Login & Pengaman URL Link Acak - WhatsApp Clone
   ========================================================================== */

// 1. Ambil fungsi Firebase yang kita perlukan dari file pintu gerbang kemarin
import { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    doc,
    setDoc
} from "../database/firebase-config.js";

// 2. Ambil elemen-elemen HTML yang akan kita manipulasi
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const btnLoginGoogle = document.getElementById("btnLoginGoogle");
const btnLogout = document.getElementById("btnLogout");
const userAvatar = document.getElementById("userAvatar");

// ==========================================================================
// FUNGSI UTAMA: VALIDASI & PENGUNCIAN LINK URL ACAK
// ==========================================================================
function kelolaLinkDanLayar(user) {
    if (user) {
        // A. PENGGUNA BERHASIL LOGIN
        const userUID = user.uid; // ID acak unik sepanjang 28 karakter dari Google/Firebase

        // Baca URL browser saat ini
        const urlParams = new URLSearchParams(window.location.search);
        const userDiUrl = urlParams.get('user');

        // Proteksi Pembajakan URL (Anti-Hijacking):
        // Jika teks '?user=...' di browser kosong ATAU tidak sama dengan ID Google yang login, paksa perbarui!
        if (userDiUrl !== userUID) {
            const linkBaru = `${window.location.origin}${window.location.pathname}?user=${userUID}`;
            window.history.pushState({ path: linkBaru }, '', linkBaru);
        }

        // Tampilkan foto profil Google ke pojok kiri atas aplikasi
        if (userAvatar && user.photoURL) {
            userAvatar.src = user.photoURL;
        }

        // Simpan atau perbarui data pengguna ke database Firestore (Termasuk status Online)
        simpanStatusUserKeDatabase(user, "online");

        // Buka tirai aplikasi utama, sembunyikan layar login
        loginScreen.classList.add("hidden");
        mainApp.classList.remove("hidden");

    } else {
        // B. PENGGUNA BELUM LOGIN / LOGOUT
        // Bersihkan parameter ?user= dari URL browser agar kembali bersih
        if (window.location.search.includes('user=')) {
            const linkBersih = `${window.location.origin}${window.location.pathname}`;
            window.history.pushState({ path: linkBersih }, '', linkBersih);
        }

        // Sembunyikan aplikasi utama, munculkan kembali layar login awal
        mainApp.classList.add("hidden");
        loginScreen.classList.remove("hidden");
    }
}

// ==========================================================================
// FUNGSI PEMBANTU: SIMPAN DATA LOGIN & STATUS ONLINE KE FIREBASE
// ==========================================================================
async function simpanStatusUserKeDatabase(user, statusAktif) {
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            nama: user.displayName,
            email: user.email,
            foto: user.photoURL,
            statusPresence: statusAktif, // Mencatat status "online" / "offline"
            lastSeen: new Date().toISOString() // Jam terakhir aktif
        }, { merge: true }); // Menggunakan merge agar tidak menimpa data lama yang penting
    } catch (error) {
        console.error("Gagal memperbarui status user di database:", error);
    }
}

// ==========================================================================
// EVENT LISTENER (AKSI TOMBOL KLIK)
// ==========================================================================

// Aksi ketika tombol "Masuk dengan Google" diklik
if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            console.log("Login sukses!");
        } catch (error) {
            console.error("Gagal login Google:", error);
            alert("Gagal masuk dengan Google, silakan coba lagi.");
        }
    });
}

// Aksi ketika tombol "Keluar" (Logout) diklik
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        const userSekarang = auth.currentUser;
        if (userSekarang) {
            // Ubah status menjadi offline dulu di database sebelum keluar
            await simpanStatusUserKeDatabase(userSekarang, "offline");
        }
        signOut(auth).then(() => {
            console.log("Berhasil keluar.");
        });
    });
}

// ==========================================================================
// SATPAM OTOMATIS (Mendeteksi perubahan status login setiap saat)
// ==========================================================================
onAuthStateChanged(auth, (user) => {
    kelolaLinkDanLayar(user);
});

// Deteksi jika pengguna langsung menutup tab browser / mematikan HP
window.addEventListener("beforeunload", () => {
    const userSekarang = auth.currentUser;
    if (userSekarang) {
        simpanStatusUserKeDatabase(userSekarang, "offline");
    }
});

