const firebaseConfig = {
  apiKey: "AIzaSyDl9TVQ9B6G-PY6PtQJjyPkrqDMqeMhkrE",
  authDomain: "wa-clone-rafly.firebaseapp.com",
  projectId: "wa-clone-rafly",
  storageBucket: "wa-clone-rafly.firebasestorage.app",
  messagingSenderId: "217952329083",
  appId: "1:217952329083:web:644aafe82e9b40794b31de"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ ignoreUndefinedProperties: true });
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const microsoftProvider = new firebase.auth.OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });
console.log('✅ Firebase ready');
