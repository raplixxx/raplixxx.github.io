# Web Ahay — Vesta AI

SPA chatbot AI premium. Hosting statis di GitHub Pages (domain: `raflymusyaf.web.id` via Cloudflare DNS), Firebase hanya untuk Authentication + Firestore.

## Struktur
```
index.html          Halaman utama (login + dashboard chat)
shared.html          Halaman publik read-only untuk chat yang dibagikan
css/style.css        Tema dark cyberpunk glassmorphism
js/config.js         SATU-SATUNYA tempat API key & konfigurasi (lihat catatan keamanan di dalamnya)
js/auth.js           Login Google + auto-login + auto-provisioning profil
js/firestore.js       Sesi, pesan, share chat
js/chat.js            Persona Vesta AI, panggilan SumoPod AI, Tavily search, memori 20 pesan
js/ui.js              Toast, escape HTML (anti-XSS), util
js/app.js             Merangkai semua modul ke index.html
js/shared.js          Merangkai firestore.js ke shared.html
firestore.rules        Aturan keamanan Firestore
```

## Cara deploy
1. **Firebase Console** → aktifkan *Authentication → Google* sebagai sign-in provider, dan buat *Firestore Database* (mode production).
2. Deploy `firestore.rules` ke project Firebase (`firebase deploy --only firestore:rules`), atau tempel manual di tab Rules Firestore Console.
3. Tambahkan domain `raflymusyaf.web.id` (dan `<username>.github.io` bila dipakai untuk testing) ke **Authorized domains** di Firebase Auth settings — wajib, kalau tidak popup Google Sign-In akan gagal.
4. Push semua file ini ke repo GitHub → aktifkan **GitHub Pages** dari branch tersebut.
5. Di **Cloudflare DNS**, arahkan `raflymusyaf.web.id` (CNAME) ke `<username>.github.io`, lalu tambahkan file `CNAME` berisi `raflymusyaf.web.id` di root repo (dibuat otomatis oleh GitHub Pages saat custom domain diset lewat Settings → Pages).
6. Upload `logoweb.png` dan `logodash.png` ke root domain agar meta tag & tampilan logo aktif.

## ⚠️ Catatan keamanan penting
Situs ini murni statis (tanpa backend), jadi **semua isi `js/config.js` — termasuk API key SumoPod & Tavily — otomatis terlihat oleh siapa pun** yang membuka DevTools / view-source, walau sudah dipisah ke satu file. Ini bukan bug dari pemisahan file, melainkan keterbatasan arsitektur "API key di client tanpa backend proxy".

Agar aman untuk produksi sungguhan:
- Idealnya panggil SumoPod AI & Tavily lewat **Cloud Function** (server-side), bukan langsung dari browser, supaya key tidak pernah dikirim ke client.
- Jika tetap dipakai langsung dari client (seperti implementasi saat ini sesuai permintaan), **rotasi key secara berkala** dan pantau penggunaan/kuota di dashboard SumoPod & Tavily untuk mendeteksi penyalahgunaan.
- Firebase `apiKey` memang aman untuk client (dibatasi oleh Firestore Security Rules yang sudah disertakan), tapi tetap aktifkan **App Check** bila memungkinkan untuk lapisan proteksi tambahan.
