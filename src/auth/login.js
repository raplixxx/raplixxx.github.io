// src/auth/login.js - SIMPLE VERSION NO LOADING

import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../database/firebase-config.js';
import { showNotification } from '../utils/notification.js';
import storageLocal from '../utils/storage-local.js';

class AuthManager {
    constructor() {
        this.user = null;
        this.data = null;
        this._init();
    }

    _init() {
        console.log('🔐 Auth init...');

        // Listen auth state
        onAuthStateChanged(auth, async (u) => {
            if (u) {
                this.user = u;
                await this._handleLogin(u);
            } else {
                this.user = null;
                this.data = null;
                this._showLogin();
            }
        }, (err) => {
            console.error('Auth error:', err);
            this._showLogin();
        });

        // Button listeners
        document.getElementById('googleLoginBtn')?.addEventListener('click', () => this.login());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        
        // Online/Offline detection
        this._setupStatus();
    }

    async login() {
        const btn = document.getElementById('googleLoginBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghubungkan...';
        
        try {
            await signInWithPopup(auth, googleProvider);
            showNotification('Berhasil masuk!', 'success');
        } catch (e) {
            console.error('Login error:', e);
            let msg = 'Gagal login. Coba lagi.';
            if (e.code === 'auth/popup-closed-by-user') msg = 'Login dibatalkan.';
            if (e.code === 'auth/popup-blocked') msg = 'Izinkan popup browser!';
            if (e.code === 'auth/configuration-not-found') msg = 'Login Google belum dikonfigurasi.';
            showNotification(msg, 'error');
        }
        
        btn.disabled = false;
        btn.innerHTML = '<img src="https://www.google.com/favicon.ico" alt="G"> Masuk dengan Google';
    }

    async _handleLogin(u) {
        try {
            const ref = doc(db, 'users', u.uid);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                const link = storageLocal.generateUserInviteLink(u.uid);
                const data = {
                    uid: u.uid,
                    displayName: u.displayName || 'Pengguna',
                    email: u.email,
                    photoURL: u.photoURL || '',
                    inviteLink: link,
                    createdAt: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                    status: 'online',
                    groups: []
                };
                await setDoc(ref, data);
                this.data = data;
            } else {
                this.data = snap.data();
                await updateDoc(ref, { lastSeen: serverTimestamp(), status: 'online' }).catch(() => {});
            }

            // Update UI
            this._updateUI(u);
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            
            const statusEl = document.getElementById('userStatus');
            if (statusEl) {
                statusEl.className = 'status-badge online';
                statusEl.textContent = 'Online';
            }

        } catch (e) {
            console.error('Handle login error:', e);
            showNotification('Gagal memuat data pengguna', 'error');
            this._showLogin();
        }
    }

    _updateUI(u) {
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        
        if (nameEl) nameEl.textContent = u.displayName || 'Pengguna';
        
        if (avatarEl) {
            if (u.photoURL) {
                avatarEl.src = u.photoURL;
                avatarEl.onerror = () => { avatarEl.src = this._defaultAvatar(u.displayName); };
            } else {
                avatarEl.src = this._defaultAvatar(u.displayName);
            }
        }
    }

    _defaultAvatar(name) {
        const char = (name || 'U')[0].toUpperCase();
        return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#667eea"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-weight="bold">${char}</text></svg>`)}`;
    }

    _setupStatus() {
        const updateStatus = (online) => {
            const el = document.getElementById('userStatus');
            if (el) {
                el.className = `status-badge ${online ? 'online' : 'offline'}`;
                el.textContent = online ? 'Online' : 'Offline';
            }
        };
        
        window.addEventListener('online', () => updateStatus(true));
        window.addEventListener('offline', () => updateStatus(false));
        
        // Initial check
        updateStatus(navigator.onLine);
    }

    async logout() {
        try {
            if (this.user) {
                await updateDoc(doc(db, 'users', this.user.uid), { 
                    status: 'offline', 
                    lastSeen: serverTimestamp() 
                }).catch(() => {});
            }
            await signOut(auth);
            showNotification('Berhasil keluar', 'success');
        } catch (e) {
            console.error('Logout error:', e);
            showNotification('Gagal keluar', 'error');
        }
    }

    _showLogin() {
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    getUser() { return this.user; }
    getUserData() { return this.data; }
}

const authManager = new AuthManager();
export default authManager;
