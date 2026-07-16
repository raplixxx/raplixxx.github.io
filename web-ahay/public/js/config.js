// public/js/config.js
// Firebase & Third-party API Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
    authDomain: "wa-clone-rafly.firebaseapp.com",
    projectId: "wa-clone-rafly",
    storageBucket: "wa-clone-rafly.firebasestorage.app",
    messagingSenderId: "217952329083",
    appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

const SUMOPOD_CONFIG = {
    apiKey: "sk-QTrGoAspLLuYSacIKQyuww",
    baseURL: "https://ai.sumopod.com/v1",
    model: "gpt-4o-mini"
};

const TAVILY_CONFIG = {
    apiKey: "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"
};

const APP_CONFIG = {
    domain: "raflymusyaf.web.id",
    appName: "Web Ahay",
    branding: "vesta.ai"
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIREBASE_CONFIG, SUMOPOD_CONFIG, TAVILY_CONFIG, APP_CONFIG };
}
