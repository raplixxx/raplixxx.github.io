// src/auth/login.js
// Authentication Module - Handles Google Login, User Status, and Profile

import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    updateDoc,
    Timestamp
} from '../database/firebase-config.js';

import { showNotification } from '../utils/notification.js';
import { generateUserInviteLink } from '../utils/storage-local.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.onlineStatusRef = null;
        this.initializeAuth();
    }

    initializeAuth() {
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.handleUserLogin(user);
            } else {
                this.currentUser = null;
                this.userData = null;
                this.showLoginModal();
                document.getElementById('app').style.display = 'none';
            }
            document.getElementById('loadingScreen').style.display = 'none';
        });

        // Setup Google Login Button
        document.getElementById('googleLoginBtn').addEventListener('click', () => this.googleLogin());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Setup online/offline detection
        this.setupOnlineStatus();
    }

    async googleLogin() {
        try {
            const loginBtn = document.getElementById('googleLoginBtn');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';

            const result = await signInWithPopup(auth, googleProvider);
            
            showNotification('Berhasil masuk! Selamat datang.', 'success');
        } catch (error) {
            console.error('Login Error:', error);
            
            let errorMessage = 'Gagal login. Silakan coba lagi.';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Login dibatalkan.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup diblokir browser. Izinkan popup untuk login.';
            }
            
            showNotification(errorMessage, 'error');
        } finally {
            const loginBtn = document.getElementById('googleLoginBtn');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<img src="https://www.google.com/favicon.ico" alt="Google"> Masuk dengan Google';
        }
    }

    async handleUserLogin(user) {
        try {
            // Get or create user document
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // Generate unique invite link for new user
                const inviteLink = generateUserInviteLink(user.uid);
                
                // Create new user document
                const userData = {
                    uid: user.uid,
                    displayName: user.displayName || 'Pengguna',
                    email: user.email,
                    photoURL: user.photoURL || '',
                    inviteLink: inviteLink,
                    createdAt: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                    status: 'online',
                    groups: []
                };
                
                await setDoc(userRef, userData);
                this.userData = userData;
            } else {
                this.userData = userDoc.data();
                // Update last seen and status
                await updateDoc(userRef, {
                    lastSeen: serverTimestamp(),
                    status: 'online'
                });
            }

            // Update UI
            this.updateUserInterface(user);
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('app').style.display = 'flex';

            // Setup online presence
            this.setupOnlinePresence(user.uid);

        } catch (error) {
            console.error('Error handling user login:', error);
            showNotification('Gagal memuat data pengguna', 'error');
        }
    }

    setupOnlinePresence(userId) {
        const userStatusRef = doc(db, 'users', userId);

        // Set online
        updateDoc(userStatusRef, {
            status: 'online',
            lastSeen: serverTimestamp()
        });

        // Handle disconnect
        window.addEventListener('beforeunload', () => {
            updateDoc(userStatusRef, {
                status: 'offline',
                lastSeen: serverTimestamp()
            });
        });

        // Handle online/offline events
        window.addEventListener('online', () => {
            updateDoc(userStatusRef, {
                status: 'online',
                lastSeen: serverTimestamp()
            });
            document.getElementById('userStatus').className = 'status-badge online';
            document.getElementById('userStatus').textContent = 'Online';
        });

        window.addEventListener('offline', () => {
            updateDoc(userStatusRef, {
                status: 'offline',
                lastSeen: serverTimestamp()
            });
            document.getElementById('userStatus').className = 'status-badge offline';
            document.getElementById('userStatus').textContent = 'Offline';
        });
    }

    setupOnlineStatus() {
        // Initial check
        if (navigator.onLine) {
            document.getElementById('userStatus').className = 'status-badge online';
            document.getElementById('userStatus').textContent = 'Online';
        } else {
            document.getElementById('userStatus').className = 'status-badge offline';
            document.getElementById('userStatus').textContent = 'Offline';
        }

        // Listen for changes
        window.addEventListener('online', () => {
            document.getElementById('userStatus').className = 'status-badge online';
            document.getElementById('userStatus').textContent = 'Online';
        });

        window.addEventListener('offline', () => {
            document.getElementById('userStatus').className = 'status-badge offline';
            document.getElementById('userStatus').textContent = 'Offline';
        });
    }

    updateUserInterface(user) {
        document.getElementById('userName').textContent = user.displayName || 'Pengguna';
        document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/40';
        
        if (user.photoURL) {
            document.getElementById('userAvatar').src = user.photoURL;
        } else {
            document.getElementById('userAvatar').src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <rect width="40" height="40" fill="#667eea"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">
                        ${(user.displayName || 'U').charAt(0).toUpperCase()}
                    </text>
                </svg>
            `);
        }
    }

    async logout() {
        try {
            // Update status before logout
            if (this.currentUser) {
                const userRef = doc(db, 'users', this.currentUser.uid);
                await updateDoc(userRef, {
                    status: 'offline',
                    lastSeen: serverTimestamp()
                });
            }

            await signOut(auth);
            this.currentUser = null;
            this.userData = null;
            
            showNotification('Berhasil keluar', 'success');
        } catch (error) {
            console.error('Logout Error:', error);
            showNotification('Gagal keluar', 'error');
        }
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'flex';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserData() {
        return this.userData;
    }
}

// Initialize auth manager
const authManager = new AuthManager();
export default authManager;
