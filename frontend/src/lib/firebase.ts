import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
	apiKey: 'AIzaSyCbjBSXYA75T7RWByOk3d10ofoMps145-M',
	authDomain: 'art-of-intent.firebaseapp.com',
	projectId: 'art-of-intent',
	storageBucket: 'art-of-intent.firebasestorage.app',
	messagingSenderId: '401277869938',
	appId: '1:401277869938:web:9d2a35d06e24ff7e8ac7eb',
	measurementId: 'G-4FJ7J37XH8',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'alpha');
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
export { httpsCallable };
