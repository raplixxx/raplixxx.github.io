/**
 * Web Ahay - Configuration File
 * Contains all API keys, endpoints, and application settings
 * @version 1.0.0
 * @author Web Ahay Team
 */

// Firebase Configuration
// IMPORTANT: These are client-side keys and are meant to be public
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
    authDomain: "wa-clone-rafly.firebaseapp.com",
    projectId: "wa-clone-rafly",
    storageBucket: "wa-clone-rafly.firebasestorage.app",
    messagingSenderId: "217952329083",
    appId: "1:217952329083:web:644aafe82e9b40794b31de",
    measurementId: null
};

// SumoPod AI Configuration
// GPT-4o-mini model via SumoPod API (OpenAI compatible)
const SUMOPOD_CONFIG = {
    apiKey: "sk-QTrGoAspLLuYSacIKQyuww",
    baseURL: "https://ai.sumopod.com/v1",
    model: "gpt-4o-mini",
    visionModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 1000
};

// Tavily Search API Configuration
// Used for real-time web search capability
const TAVILY_CONFIG = {
    apiKey: "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",
    baseUrl: "https://api.tavily.com/search",
    searchDepth: "basic",
    includeAnswer: true,
    maxResults: 5
};

// Application Configuration
const APP_CONFIG = {
    domain: "raflymusyaf.web.id",
    appName: "Web Ahay",
    branding: "vesta.ai",
    version: "1.0.0",
    maxHistoryMessages: 20,
    maxImageSize: 10 * 1024 * 1024, // 10MB in bytes
    supportedImageTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    ],
    chatPlaceholder: "Ketik pesan atau upload gambar...",
    welcomeMessage: "Halo! Saya asisten AI dari vesta.ai. Saya bisa membantu Anda dengan berbagai hal, termasuk mencari informasi terkini di web dan menganalisis gambar. Ada yang bisa saya bantu? 😊",
    defaultLanguage: "id",
    timezone: "Asia/Jakarta",
    maxSessionTitleLength: 50,
    maxUsernameLength: 20,
    minUsernameLength: 3,
    sessionIdPrefix: "session-",
    shareIdPrefix: "share-",
    uniqueLinkPrefix: "ahay-",
    uniqueLinkRandomLength: 5,
    shareRandomLength: 10
};

// UI Configuration
const UI_CONFIG = {
    animationDuration: 300,
    toastDuration: 3000,
    typingIndicatorDelay: 500,
    scrollBehavior: "smooth",
    maxTextareaHeight: 120,
    sidebarWidth: 320,
    headerHeight: 70,
    mobileBreakpoint: 768,
    smallMobileBreakpoint: 480
};

// Feature Flags
const FEATURE_FLAGS = {
    enableWebSearch: true,
    enableImageAnalysis: true,
    enableStreamingResponse: false,
    enableMessageEditing: false,
    enableMessageDeletion: false,
    enableVoiceInput: false,
    enableDarkMode: true,
    enableAnimations: true,
    enableDebugMode: false,
    enableAnalytics: false
};

// Error Messages
const ERROR_MESSAGES = {
    auth: {
        googleLoginFailed: "Gagal login dengan Google. Silakan coba lagi.",
        sessionExpired: "Sesi Anda telah berakhir. Silakan login kembali.",
        usernameTaken: "Username sudah digunakan. Silakan pilih username lain.",
        invalidUsername: "Username hanya boleh huruf kecil dan angka, 3-20 karakter.",
        usernameTooShort: "Username minimal 3 karakter.",
        notAuthenticated: "Anda harus login terlebih dahulu."
    },
    chat: {
        sendFailed: "Gagal mengirim pesan. Silakan coba lagi.",
        aiError: "Maaf, terjadi kesalahan pada AI. Silakan coba lagi.",
        searchError: "Gagal melakukan pencarian web.",
        imageTooLarge: "Ukuran gambar terlalu besar. Maksimal 10MB.",
        invalidImageType: "Format gambar tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.",
        sessionNotFound: "Sesi chat tidak ditemukan.",
        shareFailed: "Gagal membagikan chat."
    },
    network: {
        offline: "Anda sedang offline. Periksa koneksi internet Anda.",
        timeout: "Koneksi timeout. Silakan coba lagi.",
        serverError: "Terjadi kesalahan server. Silakan coba beberapa saat lagi."
    }
};

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        FIREBASE_CONFIG,
        SUMOPOD_CONFIG,
        TAVILY_CONFIG,
        APP_CONFIG,
        UI_CONFIG,
        FEATURE_FLAGS,
        ERROR_MESSAGES
    };
}

// Log configuration in debug mode
if (FEATURE_FLAGS.enableDebugMode) {
    console.log("🔧 Web Ahay Configuration Loaded");
    console.log("📱 App:", APP_CONFIG.appName, "v" + APP_CONFIG.version);
    console.log("🤖 AI Model:", SUMOPOD_CONFIG.model);
    console.log("🌐 Domain:", APP_CONFIG.domain);
}
