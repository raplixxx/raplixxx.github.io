/**
 * Web Ahay - Authentication Module
 * Handles Google Sign-In, Username Creation, and User Session Management
 * @version 1.0.0
 */

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    try {
        firebase.initializeApp(FIREBASE_CONFIG);
        if (FEATURE_FLAGS && FEATURE_FLAGS.enableDebugMode) {
            console.log("✅ Firebase initialized successfully");
        }
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
    }
}

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account",
    access_type: "offline"
});
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Global State Management
const AppState = {
    currentUser: null,
    userData: null,
    isAuthenticated: false,
    isUsernameSet: false,
    isLoading: true,
    authReady: false
};

// DOM Elements Cache
const DOM = {
    loadingScreen: null,
    authModal: null,
    usernameModal: null,
    mainChat: null,
    googleLoginBtn: null,
    usernameForm: null,
    usernameInput: null,
    usernamePreview: null,
    previewLink: null,
    logoutSidebarBtn: null,
    sidebarUsername: null,
    sidebarEmail: null,
    userAvatar: null,
    toastContainer: null
};

// Initialize DOM references
function initDOM() {
    DOM.loadingScreen = document.getElementById("loadingScreen");
    DOM.authModal = document.getElementById("authModal");
    DOM.usernameModal = document.getElementById("usernameModal");
    DOM.mainChat = document.getElementById("mainChat");
    DOM.googleLoginBtn = document.getElementById("googleLoginBtn");
    DOM.usernameForm = document.getElementById("usernameForm");
    DOM.usernameInput = document.getElementById("usernameInput");
    DOM.usernamePreview = document.getElementById("usernamePreview");
    DOM.previewLink = document.getElementById("previewLink");
    DOM.logoutSidebarBtn = document.getElementById("logoutSidebarBtn");
    DOM.sidebarUsername = document.getElementById("sidebarUsername");
    DOM.sidebarEmail = document.getElementById("sidebarEmail");
    DOM.userAvatar = document.getElementById("userAvatar");
    DOM.toastContainer = document.getElementById("toastContainer");
}

/**
 * Show/hide modals with animation
 */
function showModal(modalElement) {
    // Hide all modals first
    const modals = [DOM.authModal, DOM.usernameModal];
    modals.forEach(modal => {
        if (modal) {
            modal.style.display = "none";
            modal.classList.remove("fade-in");
        }
    });
    
    // Show target modal
    if (modalElement) {
        modalElement.style.display = "flex";
        // Trigger reflow for animation
        modalElement.offsetHeight;
        modalElement.classList.add("fade-in");
    }
}

function showMainChat() {
    // Hide all modals
    if (DOM.authModal) DOM.authModal.style.display = "none";
    if (DOM.usernameModal) DOM.usernameModal.style.display = "none";
    
    // Show main chat
    if (DOM.mainChat) {
        DOM.mainChat.style.display = "flex";
        DOM.mainChat.classList.add("fade-in");
    }
    
    // Hide loading screen
    hideLoading();
}

function hideLoading() {
    if (DOM.loadingScreen) {
        DOM.loadingScreen.style.opacity = "0";
        DOM.loadingScreen.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
            if (DOM.loadingScreen) {
                DOM.loadingScreen.style.display = "none";
            }
        }, 500);
    }
}

function showLoading() {
    if (DOM.loadingScreen) {
        DOM.loadingScreen.style.display = "flex";
        DOM.loadingScreen.style.opacity = "1";
    }
}

/**
 * Toast Notification System
 */
function showToast(message, type = "info", duration = 3000) {
    if (!DOM.toastContainer) {
        // Create toast container if it doesn't exist
        const container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
        DOM.toastContainer = container;
    }
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        info: "fa-info-circle",
        warning: "fa-exclamation-triangle"
    };
    
    const messages = {
        success: "Berhasil!",
        error: "Error!",
        info: "Info",
        warning: "Peringatan"
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <p class="toast-title">${messages[type] || messages.info}</p>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });
    
    // Auto remove
    const removeTimeout = setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
    
    // Store timeout for manual close
    toast._timeout = removeTimeout;
}

/**
 * Utility Functions
 */
function generateRandomString(length) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += chars.charAt(array[i] % chars.length);
    }
    return result;
}

function generateAvatarColor(str) {
    const colors = [
        "#667eea", "#764ba2", "#f093fb", "#f5576c",
        "#4facfe", "#00f2fe", "#43e97b", "#38f9d7",
        "#fa709a", "#fee140", "#a18cd1", "#fbc2eb",
        "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4",
        "#ffeaa7", "#dfe6e9", "#6c5ce7", "#a29bfe"
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
}

function validateUsername(username) {
    if (!username || username.length < APP_CONFIG.minUsernameLength) {
        return { valid: false, message: `Username minimal ${APP_CONFIG.minUsernameLength} karakter` };
    }
    if (username.length > APP_CONFIG.maxUsernameLength) {
        return { valid: false, message: `Username maksimal ${APP_CONFIG.maxUsernameLength} karakter` };
    }
    if (!/^[a-z0-9]+$/.test(username)) {
        return { valid: false, message: "Username hanya boleh huruf kecil dan angka" };
    }
    return { valid: true };
}

function updateUserUI() {
    if (!AppState.userData) return;
    
    // Update sidebar user info
    if (DOM.sidebarUsername) {
        DOM.sidebarUsername.textContent = AppState.userData.username || "User";
    }
    if (DOM.sidebarEmail) {
        DOM.sidebarEmail.textContent = AppState.currentUser?.email || "";
    }
    
    // Update avatar
    if (DOM.userAvatar) {
        const initial = (AppState.userData.username || AppState.currentUser?.email || "U")[0].toUpperCase();
        DOM.userAvatar.style.backgroundColor = AppState.userData.avatarColor || "#667eea";
        DOM.userAvatar.textContent = initial;
        
        // If user has photo, use it
        if (AppState.currentUser?.photoURL) {
            DOM.userAvatar.style.backgroundImage = `url(${AppState.currentUser.photoURL})`;
            DOM.userAvatar.style.backgroundSize = "cover";
            DOM.userAvatar.textContent = "";
        }
    }
}

/**
 * Google Sign-In Handler
 */
async function handleGoogleLogin() {
    if (!DOM.googleLoginBtn) return;
    
    DOM.googleLoginBtn.addEventListener("click", async () => {
        try {
            // Disable button and show loading
            DOM.googleLoginBtn.disabled = true;
            DOM.googleLoginBtn.innerHTML = `
                <div class="btn-spinner"></div>
                <span>Menghubungkan...</span>
            `;
            
            // Attempt Google Sign-In
            const result = await auth.signInWithPopup(googleProvider);
            
            if (FEATURE_FLAGS.enableDebugMode) {
                console.log("✅ Google login successful:", result.user.email);
            }
            
            showToast("Login berhasil! Selamat datang! 🎉", "success");
            
        } catch (error) {
            console.error("Google login error:", error);
            
            let errorMessage = ERROR_MESSAGES.auth.googleLoginFailed;
            
            switch (error.code) {
                case "auth/popup-closed-by-user":
                    errorMessage = "Popup login ditutup. Silakan coba lagi.";
                    break;
                case "auth/popup-blocked":
                    errorMessage = "Popup diblokir browser. Izinkan popup untuk situs ini.";
                    break;
                case "auth/cancelled-popup-request":
                    errorMessage = "Permintaan login dibatalkan.";
                    break;
                case "auth/account-exists-with-different-credential":
                    errorMessage = "Email sudah terdaftar dengan metode login lain.";
                    break;
                case "auth/network-request-failed":
                    errorMessage = ERROR_MESSAGES.network.offline;
                    break;
                default:
                    errorMessage = `Gagal login: ${error.message}`;
            }
            
            showToast(errorMessage, "error");
            
        } finally {
            // Reset button
            DOM.googleLoginBtn.disabled = false;
            DOM.googleLoginBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24" class="google-svg">
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

/**
 * Username Creation Handler
 */
async function handleUsernameCreation() {
    if (!DOM.usernameForm || !DOM.usernameInput) return;
    
    // Live preview
    DOM.usernameInput.addEventListener("input", (e) => {
        let value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
        e.target.value = value;
        
        if (value.length >= APP_CONFIG.minUsernameLength) {
            if (DOM.usernamePreview) {
                DOM.usernamePreview.style.display = "block";
                DOM.previewLink.textContent = `https://${APP_CONFIG.domain}/chat/${APP_CONFIG.uniqueLinkPrefix}${value.substring(0, 5)}xxx`;
            }
        } else {
            if (DOM.usernamePreview) {
                DOM.usernamePreview.style.display = "none";
            }
        }
    });
    
    // Form submission
    DOM.usernameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = DOM.usernameInput.value.toLowerCase().trim();
        
        // Validate
        const validation = validateUsername(username);
        if (!validation.valid) {
            showToast(validation.message, "error");
            // Shake animation
            DOM.usernameInput.style.animation = "shake 0.5s ease";
            setTimeout(() => {
                DOM.usernameInput.style.animation = "";
            }, 500);
            return;
        }
        
        if (!AppState.currentUser) {
            showToast(ERROR_MESSAGES.auth.sessionExpired, "error");
            return;
        }
        
        try {
            // Check if username is already taken
            const usernameQuery = await db.collection("users")
                .where("username", "==", username)
                .limit(1)
                .get();
            
            if (!usernameQuery.empty) {
                showToast(ERROR_MESSAGES.auth.usernameTaken, "error");
                DOM.usernameInput.style.animation = "shake 0.5s ease";
                setTimeout(() => {
                    DOM.usernameInput.style.animation = "";
                }, 500);
                return;
            }
            
            // Generate unique link ID
            const uniqueLinkId = APP_CONFIG.uniqueLinkPrefix + generateRandomString(APP_CONFIG.uniqueLinkRandomLength);
            const avatarColor = generateAvatarColor(username);
            
            // Save to Firestore
            const userRef = db.collection("users").doc(AppState.currentUser.uid);
            
            await userRef.set({
                email: AppState.currentUser.email,
                displayName: AppState.currentUser.displayName || "",
                photoURL: AppState.currentUser.photoURL || "",
                username: username,
                uniqueLinkId: uniqueLinkId,
                avatarColor: avatarColor,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            // Also save to usernames collection for uniqueness
            await db.collection("usernames").doc(username).set({
                uid: AppState.currentUser.uid,
                username: username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local state
            AppState.userData = {
                username: username,
                uniqueLinkId: uniqueLinkId,
                avatarColor: avatarColor,
                email: AppState.currentUser.email,
                displayName: AppState.currentUser.displayName,
                photoURL: AppState.currentUser.photoURL
            };
            AppState.isUsernameSet = true;
            
            updateUserUI();
            showToast("Username berhasil dibuat! Selamat datang! 🚀", "success");
            
            // Show main chat after delay
            setTimeout(() => {
                showMainChat();
            }, 1000);
            
        } catch (error) {
            console.error("Username creation error:", error);
            showToast("Gagal membuat username: " + error.message, "error");
        }
    });
}

/**
 * Handle Authenticated User
 */
async function handleAuthenticatedUser(user) {
    AppState.currentUser = user;
    AppState.isAuthenticated = true;
    
    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            
            if (data.username) {
                // User has username - go to chat
                AppState.userData = data;
                AppState.isUsernameSet = true;
                updateUserUI();
                
                // Update last login
                await db.collection("users").doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(() => {}); // Ignore errors on update
                
                showMainChat();
            } else {
                // User exists but no username
                showModal(DOM.usernameModal);
                hideLoading();
            }
        } else {
            // New user - create profile
            const avatarColor = generateAvatarColor(user.email || user.uid);
            
            await db.collection("users").doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
                avatarColor: avatarColor,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            AppState.userData = {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                avatarColor: avatarColor
            };
            
            showModal(DOM.usernameModal);
            hideLoading();
        }
        
    } catch (error) {
        console.error("Error handling authenticated user:", error);
        hideLoading();
        showToast("Terjadi kesalahan. Silakan coba lagi.", "error");
    }
}

/**
 * Logout Handler
 */
function handleLogout() {
    if (!DOM.logoutSidebarBtn) return;
    
    DOM.logoutSidebarBtn.addEventListener("click", async () => {
        try {
            await auth.signOut();
            
            // Reset state
            AppState.currentUser = null;
            AppState.userData = null;
            AppState.isAuthenticated = false;
            AppState.isUsernameSet = false;
            
            // Hide main chat
            if (DOM.mainChat) {
                DOM.mainChat.style.display = "none";
            }
            
            // Show auth modal
            showModal(DOM.authModal);
            showToast("Berhasil logout! Sampai jumpa! 👋", "success");
            
        } catch (error) {
            console.error("Logout error:", error);
            showToast("Gagal logout", "error");
        }
    });
}

/**
 * Auth State Observer
 */
function setupAuthObserver() {
    auth.onAuthStateChanged(async (user) => {
        if (FEATURE_FLAGS.enableDebugMode) {
            console.log("🔄 Auth state changed:", user ? user.email : "No user");
        }
        
        if (user) {
            await handleAuthenticatedUser(user);
        } else {
            // No user signed in
            AppState.currentUser = null;
            AppState.userData = null;
            AppState.isAuthenticated = false;
            AppState.isUsernameSet = false;
            
            if (DOM.mainChat) {
                DOM.mainChat.style.display = "none";
            }
            
            showModal(DOM.authModal);
            hideLoading();
        }
        
        AppState.authReady = true;
        
        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent("authStateChanged", {
            detail: {
                user: AppState.currentUser,
                userData: AppState.userData,
                isAuthenticated: AppState.isAuthenticated,
                isUsernameSet: AppState.isUsernameSet
            }
        }));
    });
}

/**
 * Initialize Auth Module
 */
function initAuth() {
    initDOM();
    handleGoogleLogin();
    handleUsernameCreation();
    handleLogout();
    setupAuthObserver();
    
    if (FEATURE_FLAGS.enableDebugMode) {
        console.log("🔐 Auth module initialized");
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initAuth();
});

// Export for other modules
window.getCurrentUser = () => AppState.currentUser;
window.getUserData = () => AppState.userData;
window.isAuthenticated = () => AppState.isAuthenticated;
window.isUsernameSet = () => AppState.isUsernameSet;
window.showToast = showToast;
window.AppState = AppState;
