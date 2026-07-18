// vesta.ai - Web Ahay Authentication & Onboarding
// Firebase Initialization, Google Sign-In, Username Creation

// Global State
let currentUser = null;
let userData = null;
let auth, db;

// Initialize Firebase after SDKs are loaded
function initAuth() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Enable offline persistence (optional)
    db.enablePersistence().catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.warn('Persistence not supported');
      }
    });
    
    // Listen to auth state changes
    auth.onAuthStateChanged(async (user) => {
      const loadingScreen = document.getElementById('loadingScreen');
      const authModal = document.getElementById('authModal');
      const mainChat = document.getElementById('mainChat');
      const usernameModal = document.getElementById('usernameModal');
      
      if (user) {
        currentUser = user;
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            userData = userDoc.data();
            if (!userData.username) {
              // Username not set yet
              loadingScreen.style.display = 'none';
              showModal('usernameModal');
              // Prefill suggestion
              const suggestion = user.email.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 20);
              document.getElementById('usernameInput').value = suggestion || '';
            } else {
              // Proceed to main chat
              loadingScreen.style.display = 'none';
              showMainChat();
              // Load initial sessions
              if (typeof loadSessions === 'function') loadSessions('');
            }
          } else {
            // New user
            await db.collection('users').doc(user.uid).set({
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            loadingScreen.style.display = 'none';
            showModal('usernameModal');
            const suggestion = user.email.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 20);
            document.getElementById('usernameInput').value = suggestion || '';
          }
        } catch (error) {
          console.error('Firestore error:', error);
          showToast('Gagal memuat data pengguna. Silakan muat ulang.', 'error');
          loadingScreen.style.display = 'none';
        }
      } else {
        // Logged out
        currentUser = null;
        userData = null;
        loadingScreen.style.display = 'none';
        showModal('authModal');
        hideMainChat();
      }
    });
  } catch (error) {
    console.error('Auth initialization error:', error);
    document.getElementById('loadingScreen').innerHTML = '<div class="error-message">Gagal menginisialisasi aplikasi. Periksa koneksi.</div>';
  }
}

// Helper Functions

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    // Trigger animation by adding class
    setTimeout(() => modal.classList.add('visible'), 10);
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

function hideLoading() {
  document.getElementById('loadingScreen').style.display = 'none';
}

function showMainChat() {
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('mainChat').style.display = 'flex';
  document.getElementById('usernameModal').style.display = 'none';
  updateUserUI();
  // Re-trigger session loading
  if (typeof loadSessions === 'function') loadSessions('');
}

function hideMainChat() {
  document.getElementById('mainChat').style.display = 'none';
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function avatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4'];
  return colors[Math.abs(hash) % colors.length];
}

function updateUserUI() {
  if (!userData) return;
  const userEl = document.getElementById('sidebarUserInfo');
  if (userEl) {
    userEl.innerHTML = `
      <div class="user-avatar" style="background: ${avatarColor(userData.email)}">
        ${userData.photoURL ? `<img src="${userData.photoURL}" alt="avatar">` : userData.email.charAt(0).toUpperCase()}
      </div>
      <div class="user-details">
        <span class="user-name">${escHtml(userData.username || userData.email)}</span>
        <span class="user-email">${escHtml(userData.email)}</span>
      </div>
    `;
  }
}

// Escape HTML utility
function escHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, function (m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
    }
  });
}

// ========== Google Sign-In Button ==========
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  
  const googleBtn = document.getElementById('googleLoginBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const spinner = document.getElementById('googleBtnSpinner');
      const btnText = document.getElementById('googleBtnText');
      googleBtn.disabled = true;
      spinner.style.display = 'inline-block';
      btnText.textContent = 'Menghubungkan...';
      
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await auth.signInWithPopup(provider);
        // Auth state observer handles the rest
      } catch (error) {
        console.error('Google Sign-In error:', error);
        let errorMessage = 'Gagal login dengan Google.';
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Popup login ditutup. Silakan coba lagi.';
        } else if (error.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Permintaan login dibatalkan.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Popup diblokir browser. Izinkan popup untuk situs ini.';
        }
        showToast(errorMessage, 'error');
      } finally {
        googleBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Lanjutkan dengan Google';
      }
    });
  }
  
  // Username onboarding form
  const usernameForm = document.getElementById('usernameForm');
  if (usernameForm) {
    usernameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('usernameInput');
      const errorEl = document.getElementById('usernameError');
      const btn = document.getElementById('usernameSubmitBtn');
      const val = input.value.trim().toLowerCase();
      
      // Validation
      const regex = /^[a-z0-9]{3,20}$/;
      if (!regex.test(val)) {
        errorEl.textContent = 'Username harus 3-20 karakter, hanya huruf kecil dan angka.';
        input.focus();
        return;
      }
      
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Memeriksa...';
      errorEl.textContent = '';
      
      try {
        // Check uniqueness
        const snapshot = await db.collection('users').where('username', '==', val).get();
        if (!snapshot.empty) {
          errorEl.textContent = 'Username sudah digunakan. Silakan pilih yang lain.';
          btn.disabled = false;
          btn.innerHTML = 'Lanjutkan';
          input.focus();
          return;
        }
        
        // Create unique link ID
        const uniqueLinkId = 'ahay-' + Math.random().toString(36).substring(2, 7);
        
        // Update user document
        await db.collection('users').doc(currentUser.uid).update({
          username: val,
          uniqueLinkId: uniqueLinkId,
          avatarColor: avatarColor(currentUser.email)
        });
        
        // Refresh userData
        const updatedDoc = await db.collection('users').doc(currentUser.uid).get();
        userData = updatedDoc.data();
        
        hideModal('usernameModal');
        showMainChat();
        showToast(`Selamat datang, ${val}! 🎉`, 'success');
        // Load sessions
        if (typeof loadSessions === 'function') loadSessions('');
      } catch (error) {
        console.error('Onboarding error:', error);
        errorEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Lanjutkan';
      }
    });
  }
  
  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        currentUser = null;
        userData = null;
        showModal('authModal');
        hideMainChat();
        showToast('Anda telah logout.', 'info');
      } catch (error) {
        console.error('Logout error:', error);
        showToast('Gagal logout.', 'error');
      }
    });
  }
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      hideModal(e.target.id);
    }
  });
});
