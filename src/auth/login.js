// src/auth/login.js
// LOGIN GOOGLE - VERSI SIMPLE & PASTI BERFUNGSI

let currentUser = null;

// Tombol login
document.getElementById('googleLoginBtn').addEventListener('click', function() {
    console.log('🖱️ Tombol login diklik');
    
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';
    
    auth.signInWithPopup(googleProvider)
        .then(function(result) {
            console.log('✅ Login berhasil:', result.user.email);
        })
        .catch(function(error) {
            console.error('❌ Login gagal:', error.code, error.message);
            
            let msg = 'Gagal login. ';
            if (error.code === 'auth/popup-closed-by-user') msg = 'Login dibatalkan. Coba lagi.';
            else if (error.code === 'auth/popup-blocked') msg = 'Popup diblokir! Izinkan popup di browser.';
            else if (error.code === 'auth/configuration-not-found') msg = 'Google Sign-In belum diaktifkan di Firebase Console.';
            else msg += error.message;
            
            document.getElementById('loginError').textContent = msg;
            document.getElementById('loginError').style.display = 'block';
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<img src="https://www.google.com/favicon.ico" alt="G" style="width:20px;height:20px;"> Masuk dengan Google';
        });
});

// Pantau status login
auth.onAuthStateChanged(function(user) {
    console.log('👤 Auth state:', user ? user.email : 'Tidak login');
    
    if (user) {
        currentUser = user;
        
        // Sembunyikan login, tampilkan app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        
        // Update header
        document.getElementById('headerName').textContent = user.displayName || 'Pengguna';
        document.getElementById('headerAvatar').src = user.photoURL || '';
        
        // Tampilkan link user
        const myLink = generateUserLink(user.uid);
        document.getElementById('myLinkDisplay').textContent = myLink;
        
        // Simpan data user ke Firestore
        db.collection('users').doc(user.uid).set({
            uid: user.uid,
            displayName: user.displayName || 'Pengguna',
            email: user.email,
            photoURL: user.photoURL || '',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'online'
        }, { merge: true });
        
    } else {
        currentUser = null;
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
});

// Tombol logout
document.getElementById('logoutBtnMain').addEventListener('click', function() {
    auth.signOut().then(() => console.log('👋 Logout'));
});

// Tombol salin link
document.getElementById('copyLinkBtn').addEventListener('click', function() {
    if (currentUser) {
        copyUserLink(currentUser.uid);
    }
});
