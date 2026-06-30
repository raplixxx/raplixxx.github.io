// src/database/firebase-config.js
// Firebase Configuration & Initialization

const {
    initializeApp,
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    deleteDoc,
    where,
    getDocs,
    arrayUnion,
    arrayRemove,
    increment,
    Timestamp
} = window.firebaseModules;

const firebaseConfig = {
    apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
    authDomain: "wa-clone-rafly.firebaseapp.com",
    projectId: "wa-clone-rafly",
    storageBucket: "wa-clone-rafly.firebasestorage.app",
    messagingSenderId: "217952329083",
    appId: "1:217952329083:web:644aafe82e9b40794b31de"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Export Firebase instances
export {
    app,
    auth,
    db,
    googleProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    deleteDoc,
    where,
    getDocs,
    arrayUnion,
    arrayRemove,
    increment,
    Timestamp
};

export default app;
