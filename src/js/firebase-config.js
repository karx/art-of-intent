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
import { 
    getFunctions,
    httpsCallable,
    connectFunctionsEmulator
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

import { connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCbjBSXYA75T7RWByOk3d10ofoMps145-M",
    authDomain: "art-of-intent.firebaseapp.com",
    projectId: "art-of-intent",
    storageBucket: "art-of-intent.firebasestorage.app",
    messagingSenderId: "401277869938",
    appId: "1:401277869938:web:9d2a35d06e24ff7e8ac7eb",
    measurementId: "G-4FJ7J37XH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Connect to the 'alpha' database
const db = getFirestore(app, 'alpha');

// Initialize Cloud Functions
const functions = getFunctions(app);

// Use emulators if running locally
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('DEV MODE: Using Firebase emulators');

    // Point Auth to the emulator
    connectAuthEmulator(auth, 'http://localhost:9099');

    // Point Firestore to the emulator
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Point Functions to the emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Enable offline persistence (optional - disable if causing issues)
enableIndexedDbPersistence(db)
    .then(() => {
        console.log('✅ Offline persistence enabled');
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Persistence not available in this browser');
        } else {
            console.error('❌ Persistence error:', err);
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
    functions,
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
    serverTimestamp,
    // Functions
    httpsCallable
};

// Firebase state
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

console.log('🔥 Firebase initialized successfully');
