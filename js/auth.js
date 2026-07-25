/**
 * js/auth.js
 * ---------------------------------------------------------------------------
 * Login Google via Firebase Auth + auto-provisioning profil Firestore.
 *
 * "Auto login kayak Google" diimplementasikan dengan:
 *  1. setPersistence(browserLocalPersistence) -> sesi login disimpan di
 *     browser (IndexedDB), jadi saat pengguna membuka web lagi besok, dia
 *     TIDAK perlu klik "Login dengan Google" lagi.
 *  2. onAuthStateChanged sebagai satu-satunya sumber kebenaran status login.
 *     Ia dipanggil otomatis oleh Firebase SDK begitu halaman dimuat, dengan
 *     data user yang sudah di-cache secara lokal -> profil (nama & foto)
 *     bisa langsung dirender ke UI TANPA menunggu network round-trip.
 *  3. Tidak ada modal onboarding username. Nama & foto diambil langsung dari
 *     akun Google (displayName, photoURL) dan langsung dipakai.
 * ---------------------------------------------------------------------------
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { FIREBASE_CONFIG } from "./config.js";
import { generateRandomAlphaNumeric, showToast } from "./ui.js";

// ---------------------------------------------------------------------------
// Inisialisasi Firebase (satu instance dipakai bersama oleh firestore.js)
// ---------------------------------------------------------------------------
export const firebaseApp = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

const googleProvider = new GoogleAuthProvider();
// Selalu tampilkan account chooser Google agar pengguna bisa ganti akun bila perlu
googleProvider.setCustomParameters({ prompt: "select_account" });

// Aktifkan persistence lokal agar sesi bertahan lintas kunjungan (auto-login)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Gagal mengatur persistence auth:", err);
});

/**
 * Login dengan Google. Mengembalikan Firebase User setelah berhasil.
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login Google gagal:", error);
    let message = "Login dengan Google gagal. Coba lagi.";
    if (error.code === "auth/popup-closed-by-user") {
      message = "Login dibatalkan.";
    } else if (error.code === "auth/network-request-failed") {
      message = "Koneksi bermasalah. Periksa internet Anda.";
    } else if (error.code === "auth/popup-blocked") {
      message = "Popup login diblokir browser. Izinkan popup untuk situs ini.";
    }
    showToast(message, "error");
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Gagal logout:", error);
    showToast("Gagal logout, coba lagi.", "error");
    throw error;
  }
}

/**
 * Alur instan: begitu Firebase melaporkan user login, langsung:
 *  - Cek apakah dokumen profil sudah ada di Firestore (users/{uid})
 *  - Jika belum ada -> buat langsung dari data Google (displayName, email,
 *    photoURL) + uniqueLinkId acak. TIDAK ADA modal / input tambahan.
 *  - Jika sudah ada -> pakai data yang tersimpan (photoURL/nama bisa saja
 *    sudah pernah di-refresh dari Google, jadi kita sync ulang foto/nama
 *    terbaru tanpa mengubah uniqueLinkId).
 *
 * @param {import("firebase/auth").User} user
 * @returns {Promise<object>} data profil Firestore
 */
export async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const existing = snap.data();
    // Sinkronkan nama/foto terbaru dari Google tanpa mengubah uniqueLinkId
    const updates = {};
    if (existing.displayName !== user.displayName) updates.displayName = user.displayName;
    if (existing.photoURL !== user.photoURL) updates.photoURL = user.photoURL;
    if (Object.keys(updates).length > 0) {
      await setDoc(userRef, updates, { merge: true });
      return { ...existing, ...updates };
    }
    return existing;
  }

  // Profil baru — langsung didaftarkan dari data akun Google, tanpa onboarding
  const uniqueLinkId = `ahay-${generateRandomAlphaNumeric(5)}`;
  const newProfile = {
    uid: user.uid,
    displayName: user.displayName || "Pengguna Web Ahay",
    uniqueLinkId,
    email: user.email || "",
    photoURL: user.photoURL || "",
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

/**
 * Daftarkan listener status login. Callback dipanggil dengan:
 *  - (user, profile) saat login & profil siap
 *  - (null, null) saat logout / belum login
 */
export function watchAuthState(onChange) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null, null);
      return;
    }
    try {
      const profile = await ensureUserProfile(user);
      onChange(user, profile);
    } catch (error) {
      console.error("Gagal memuat profil pengguna:", error);
      showToast("Gagal memuat profil. Coba muat ulang halaman.", "error");
      onChange(user, null);
    }
  });
}
