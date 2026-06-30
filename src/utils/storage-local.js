/* ==========================================================================
   Logika Penyimpanan Lokal (Hemat Server) - WhatsApp Clone
   ========================================================================== */

// Fungsi untuk menyimpan media (Foto Status / VN Base64) ke LocalStorage HP
export function simpanMediaLokal(key, dataBase64) {
    try {
        // LocalStorage punya batas maksimal sekitar 5MB per HP, sangat cukup untuk foto terkompresi & audio pendek
        localStorage.setItem(key, dataBase64);
        return true;
    } catch (e) {
        console.error("Memori lokal HP penuh, gagal menyimpan media:", e);
        return false;
    }
}

// Fungsi untuk mengambil kembali media yang disimpan di HP
export function ambilMediaLokal(key) {
    return localStorage.getItem(key);
}

// Fungsi untuk menghapus media lama agar HP tidak penuh
export function hapusMediaLokal(key) {
    localStorage.removeItem(key);
}

