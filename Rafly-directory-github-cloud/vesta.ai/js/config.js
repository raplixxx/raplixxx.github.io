// vesta.ai - Web Ahay Configuration
// Firebase & API Keys - All sensitive data

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
  authDomain: "wa-clone-rafly.firebaseapp.com",
  projectId: "wa-clone-rafly",
  storageBucket: "wa-clone-rafly.firebasestorage.app",
  messagingSenderId: "217952329083",
  appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

const SUMOPOD_CONFIG = {
  baseURL: "https://ai.sumopod.com/v1",
  apiKey: "sk-QTrGoAspLLuYSacIKQyuww",
  model: "gpt-4o-mini",
  maxTokens: 4096,
  temperature: 0.7
};

const TAVILY_CONFIG = {
  apiKey: "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",
  baseURL: "https://api.tavily.com/search"
};

const APP_CONFIG = {
  domain: "raflymusyaf.web.id",
  appName: "Web Ahay",
  brand: "vesta.ai",
  maxHistory: 20,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  supportedDocTypes: [".txt", ".md", ".json", ".csv", ".html", ".xml", ".log", "text/plain", "application/json"],
  welcomeMessage: "Halo! 👋 Aku asisten AI siap membantumu. Tanyakan apa saja atau bagikan gambar/dokumen untuk dianalisis.",
  // UI Configuration
  emojiSet: ["😀","😂","🤣","😍","😎","😢","😡","👍","👎","❤️","🔥","🎉","✨","💡","📎","📷","🔍","⚙️","ℹ️","⚠️"],
  soundEnabled: false
};
