// public/js/auth.js
// Complete Authentication System for Web Ahay

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Global State
let currentUser = null;
let userData = null;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const authModal = document.getElementById('authModal');
const usernameModal = document.getElementById('usernameModal');
const mainChat = document.getElementById('mainChat');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const usernameForm = document.getElementById('usernameForm');
const usernameInput = document.getElementById('usernameInput');
const usernamePreview = document.getElementById('usernamePreview');
const previewLink = document.getElementById('previewLink');
const sidebarUsername = document.getElementById('sidebarUsername');
const sidebarEmail = document.getElementById('sidebarEmail');
const userAvatar = document.getElementById('userAvatar');
const logoutSidebarBtn = document.getElementById('logoutSidebarBtn');
const welcomeScreen = document.getElementById('welcomeScreen');

// Initialize App
async function initializeApp() {
    try {
        // Check auth state
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                await handleAuthenticatedUser(user);
            } else {
                showAuthModal();
                hideLoading();
            }
        });
    } catch (error) {
        console.error('App initialization error:', error);
        hideLoading();
        showAuthModal();
    }
}

// Handle authenticated user
async function handleAuthenticatedUser(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            
            if (userData.username) {
                // User has username, show main chat
                updateUserUI();
                showMainChat();
                hideLoading();
            } else {
                // User exists but no username
                showUsernameModal();
                hideLoading();
            }
        } else {
            // New user, create profile
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                avatarColor: generateColor(user.email || user.uid),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showUsernameModal();
            hideLoading();
        }
    } catch (error) {
        console.error('Error handling user:', error);
        hideLoading();
        showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
    }
}

// Update UI with user info
function updateUserUI() {
    if (!userData) return;
    
    // Update sidebar
    if (sidebarUsername) sidebarUsername.textContent = userData.username;
    if (sidebarEmail) sidebarEmail.textContent = currentUser.email;
    
    // Update avatar
    if (userAvatar) {
        const initial = (userData.username || currentUser.email || 'U')[0].toUpperCase();
        userAvatar.style.backgroundColor = userData.avatarColor || '#667eea';
        userAvatar.textContent = initial;
    }
}

// Show/Hide modals
function showAuthModal() {
    if (authModal) authModal.style.display = 'flex';
    if (mainChat) mainChat.style.display = 'none';
    if (usernameModal) usernameModal.style.display = 'none';
}

function showUsernameModal() {
    if (authModal) authModal.style.display = 'none';
    if (usernameModal) usernameModal.style.display = 'flex';
    if (mainChat) mainChat.style.display = 'none';
}

function showMainChat() {
    if (authModal) authModal.style.display = 'none';
    if (usernameModal) usernameModal.style.display = 'none';
    if (mainChat) {
        mainChat.style.display = 'flex';
        mainChat.classList.add('fade-in');
    }
}

function hideLoading() {
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

// Google Login
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            googleLoginBtn.disabled = true;
            googleLoginBtn.innerHTML = '<div class="btn-spinner"></div> Menghubungkan...';
            
            const result = await auth.signInWithPopup(googleProvider);
            showToast('Login berhasil! 🎉', 'success');
        } catch (error) {
            console.error('Google login error:', error);
            let errorMessage = 'Gagal login dengan Google';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Popup login ditutup';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = 'Permintaan login dibatalkan';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            googleLoginBtn.disabled = false;
            googleLoginBtn.innerHTML = `
                <svg viewBox="0 0 24 24" class="google-svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Lanjutkan dengan Google</span>
            `;
        }
    });
}

// Username Form
if (usernameForm) {
    usernameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.toLowerCase().trim();
        
        // Validation
        if (username.length < 3) {
            showToast('Username minimal 3 karakter', 'error');
            return;
        }
        
        if (!/^[a-z0-9]+$/.test(username)) {
            showToast('Username hanya boleh huruf kecil dan angka', 'error');
            return;
        }
        
        if (!currentUser) {
            showToast('Session expired, silakan login ulang', 'error');
            return;
        }
        
        try {
            // Check username availability
            const usernameQuery = await db.collection('users')
                .where('username', '==', username)
                .get();
            
            if (!usernameQuery.empty) {
                showToast('Username sudah digunakan 😢', 'error');
                return;
            }
            
            // Generate unique link
            const uniqueLinkId = 'ahay-' + generateRandomString(5);
            
            // Update user profile
            await db.collection('users').doc(currentUser.uid).update({
                username: username,
                uniqueLinkId: uniqueLinkId,
                avatarColor: generateColor(username),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local data
            userData = {
                ...userData,
                username: username,
                uniqueLinkId: uniqueLinkId
            };
            
            showToast('Username berhasil dibuat! 🚀', 'success');
            updateUserUI();
            
            // Show main chat after delay
            setTimeout(() => {
                showMainChat();
            }, 1000);
            
        } catch (error) {
            console.error('Username creation error:', error);
            showToast('Gagal membuat username', 'error');
        }
    });
    
    // Live preview
    if (usernameInput) {
        usernameInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
            e.target.value = value;
            
            if (value.length >= 3) {
                usernamePreview.style.display = 'block';
                previewLink.textContent = `https://raflymusyaf.web.id/chat/ahay-${value}xxx`;
            } else {
                usernamePreview.style.display = 'none';
            }
        });
    }
}

// Logout
if (logoutSidebarBtn) {
    logoutSidebarBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            currentUser = null;
            userData = null;
            showAuthModal();
            showToast('Berhasil logout 👋', 'success');
        } catch (error) {
            showToast('Gagal logout', 'error');
        }
    });
}

// Helper Functions
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateColor(str) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a18cd1', '#fbc2eb'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Toast Notification System
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Export for chat.js
window.getCurrentUser = () => currentUser;
window.getUserData = () => userData;
window.showToast = showToast;
