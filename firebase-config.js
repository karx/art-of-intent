// Firebase Configuration and Initialization
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getAuth, 
    signInAnonymously,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAypVsGFaTeTZAKyJCGvtSY3wFeRwr2Ayc",
    authDomain: "art-of-intent.firebaseapp.com",
    projectId: "art-of-intent",
    storageBucket: "art-of-intent.firebasestorage.app",
    messagingSenderId: "401277869938",
    appId: "1:401277869938:web:d6e84de8cb67d56c8ac7eb",
    measurementId: "G-F8FR1HMPKV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistence not available in this browser');
        }
    });

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export Firebase services
export {
    app,
    analytics,
    auth,
    db,
    googleProvider,
    // Auth functions
    signInAnonymously,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    // Firestore functions
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
};

// Firebase state
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log('🔥 Firebase initialized successfully');
