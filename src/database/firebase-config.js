/* ==========================================================================
   Pusat Koneksi Firebase - WhatsApp Clone (Rafly)
   ========================================================================== */

// 1. Import modul Firebase SDK versi 10+ (Menggunakan CDN resmi agar ringan)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Kunci Akses (Config) Firebase
// KODE DI BAWAH INI ADALAH TEMPAT KUNCI AKSES UTAMA. 
// Kamu wajib mengganti isi tanda kutip di bawah ini dengan konfigurasi asli dari Firebase Console milikmu nanti!
const firebaseConfig = {
    apiKey: "PASTE_API_KEY_KAMU_DI_SINI",
    authDomain: "raflymusyaf.firebaseapp.com",
    projectId: "raflymusyaf",
    storageBucket: "raflymusyaf.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID_KAMU_DI_SINI",
    appId: "PASTE_APP_ID_KAMU_DI_SINI"
};

// 3. Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// 4. Inisialisasi Layanan yang Kita Gunakan (Sesuai Prioritas Hemat Server)
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Tambahan parameter agar login Google selalu memunculkan pilihan akun
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 5. Ekspor semua fungsi agar bisa dipakai oleh file login.js, send.js, dll.
export { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    collection,
    addDoc,
    doc,
    setDoc,
    query,
    orderBy,
    onSnapshot
};

console.log("🚀 Firebase Config berhasil dimuat! Siap menyambungkan aplikasi.");

