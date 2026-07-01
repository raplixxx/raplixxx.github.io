// src/database/firebase-config.js
// KONFIGURASI FIREBASE - PASTIKAN INI BENAR

const firebaseConfig = {
  apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
  authDomain: "wa-clone-rafly.firebaseapp.com",
  projectId: "wa-clone-rafly",
  storageBucket: "wa-clone-rafly.firebasestorage.app",
  messagingSenderId: "217952329083",
  appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Buat instance global
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

console.log('✅ Firebase siap!');
console.log('🔑 Auth:', auth ? 'OK' : 'ERROR');
console.log('📦 Firestore:', db ? 'OK' : 'ERROR');
