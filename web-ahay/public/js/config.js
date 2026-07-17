// public/js/config.js
// Web Ahay - Complete Configuration

// Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
    authDomain: "wa-clone-rafly.firebaseapp.com",
    projectId: "wa-clone-rafly",
    storageBucket: "wa-clone-rafly.firebasestorage.app",
    messagingSenderId: "217952329083",
    appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

// SumoPod AI Configuration
const SUMOPOD_CONFIG = {
    apiKey: "sk-QTrGoAspLLuYSacIKQyuww",
    baseURL: "https://ai.sumopod.com/v1",
    model: "gpt-4o-mini",
    visionModel: "gpt-4o-mini",
    maxTokens: 4096,
    temperature: 0.7
};

// Tavily Search Configuration
const TAVILY_CONFIG = {
    apiKey: "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",
    baseUrl: "https://api.tavily.com/search"
};

// Application Configuration
const APP_CONFIG = {
    domain: "raflymusyaf.web.id",
    appName: "Web Ahay",
    branding: "vesta.ai",
    maxHistoryMessages: 20,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxImageSize: 10 * 1024 * 1024, // 10MB
    chatPlaceholder: "Ketik pesan atau upload gambar...",
    welcomeMessage: "Halo! Saya asisten AI dari vesta.ai. Saya bisa membantu Anda dengan berbagai hal, termasuk mencari informasi terkini di web dan menganalisis gambar. Ada yang bisa saya bantu? 😊"
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIREBASE_CONFIG, SUMOPOD_CONFIG, TAVILY_CONFIG, APP_CONFIG };
}
