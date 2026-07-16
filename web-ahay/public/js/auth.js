// public/js/auth.js
// Authentication, Username Onboarding & Dashboard Logic

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const usernameSection = document.getElementById('usernameSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const usernameForm = document.getElementById('usernameForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const goToChatBtn = document.getElementById('goToChatBtn');
const dashboardUsername = document.getElementById('dashboardUsername');
const privateChatLink = document.getElementById('privateChatLink');

// Show/Hide sections
function showSection(section) {
    [loginSection, registerSection, usernameSection, dashboardSection].forEach(sec => {
        if (sec) sec.style.display = 'none';
    });
    if (section) section.style.display = 'block';
}

// Toggle between login and register
if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => showSection(registerSection));
}
if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => showSection(loginSection));
}

// Generate unique link ID
function generateUniqueLinkId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'ahay-';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Check username availability
async function isUsernameAvailable(username) {
    const snapshot = await db.collection('users')
        .where('username', '==', username.toLowerCase())
        .get();
    return snapshot.empty;
}

// Handle Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            await checkUserProfile(userCredential.user);
        } catch (error) {
            showToast('Login gagal: ' + getErrorMessage(error.code), 'error');
        }
    });
}

// Handle Register
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (password.length < 6) {
            showToast('Password minimal 6 karakter', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            showToast('Registrasi berhasil! Silakan buat username.', 'success');
            showSection(usernameSection);
        } catch (error) {
            showToast('Registrasi gagal: ' + getErrorMessage(error.code), 'error');
        }
    });
}

// Handle Username Creation
if (usernameForm) {
    usernameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('usernameInput').value.toLowerCase().trim();
        
        if (username.length < 3) {
            showToast('Username minimal 3 karakter', 'error');
            return;
        }
        
        if (!/^[a-z0-9]+$/.test(username)) {
            showToast('Username hanya boleh huruf kecil dan angka', 'error');
            return;
        }
        
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            const isAvailable = await isUsernameAvailable(username);
            if (!isAvailable) {
                showToast('Username sudah digunakan, coba yang lain', 'error');
                return;
            }
            
            const uniqueLinkId = generateUniqueLinkId();
            
            await db.collection('users').doc(user.uid).set({
                username: username,
                email: user.email,
                uniqueLinkId: uniqueLinkId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('Username berhasil dibuat!', 'success');
            loadDashboard(user);
        } catch (error) {
            showToast('Gagal membuat username: ' + error.message, 'error');
        }
    });
}

// Check user profile and redirect accordingly
async function checkUserProfile(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists && userDoc.data().username) {
            loadDashboard(user);
        } else {
            showSection(usernameSection);
        }
    } catch (error) {
        console.error('Error checking profile:', error);
        showToast('Error memeriksa profil', 'error');
    }
}

// Load Dashboard
async function loadDashboard(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        if (userData && userData.username) {
            dashboardUsername.textContent = userData.username;
            const chatUrl = `https://raflymusyaf.web.id/chat/${userData.uniqueLinkId}`;
            privateChatLink.textContent = chatUrl;
            
            if (goToChatBtn) {
                goToChatBtn.href = chatUrl;
            }
            
            showSection(dashboardSection);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Handle Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            showSection(loginSection);
            showToast('Berhasil logout', 'success');
        } catch (error) {
            showToast('Gagal logout', 'error');
        }
    });
}

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        checkUserProfile(user);
    } else {
        showSection(loginSection);
    }
});

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = `toast toast-${type}`;
        newToast.textContent = message;
        document.body.appendChild(newToast);
        
        setTimeout(() => {
            newToast.remove();
        }, 3000);
        return;
    }
    
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Get error message from Firebase error code
function getErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'Email sudah terdaftar',
        'auth/invalid-email': 'Format email tidak valid',
        'auth/operation-not-allowed': 'Operasi tidak diizinkan',
        'auth/weak-password': 'Password terlalu lemah',
        'auth/user-disabled': 'Akun dinonaktifkan',
        'auth/user-not-found': 'Pengguna tidak ditemukan',
        'auth/wrong-password': 'Password salah',
        'auth/invalid-credential': 'Email atau password salah'
    };
    return messages[errorCode] || 'Terjadi kesalahan';
}
