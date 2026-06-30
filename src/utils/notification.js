/* ==========================================================================
   Logika Sistem Pemberitahuan (Notification & Sound) - WhatsApp Clone
   ========================================================================== */

// 1. Minta izin ke pengguna untuk memunculkan notifikasi di HP/Laptop
export function mintaIzinNotifikasi() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("🔔 Izin notifikasi diberikan oleh pengguna!");
            }
        });
    }
}

// 2. Fungsi untuk membunyikan suara "Ting!" khas chat masuk
export function bunyikanSuaraNotif() {
    try {
        // Kita racik suara bip pendek digital murni lewat kode browser (Tanpa download file .mp3 raksasa)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nada D5 (Tinggi estetik)
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.start();
        // Bunyi hanya selama 0.15 detik saja
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (error) {
        console.error("Gagal memutar suara notifikasi:", error);
    }
}

// 3. Fungsi untuk memunculkan spanduk pop-up notifikasi di layar HP
export function tampilkanNotifSistem(judul, isiPesan) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(judul, {
            body: isiPesan,
            icon: "https://via.placeholder.com/100/00a884/ffffff?text=WA" // Bisa diganti icon WA kamu nanti
        });
    }
}

// Otomatis minta izin begitu aplikasi pertama kali dibuka oleh pengguna
window.addEventListener("load", () => {
    setTimeout(mintaIzinNotifikasi, 2000);
});

