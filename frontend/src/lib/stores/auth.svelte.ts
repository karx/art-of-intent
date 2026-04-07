import { onAuthStateChanged, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '$lib/firebase';

export const authState = $state<{ user: User | null; ready: boolean }>({
	user: null,
	ready: false,
});

// Subscribe once at module level — all pages share the same stream.
onAuthStateChanged(auth, (u) => {
	authState.user = u;
	authState.ready = true;
});

export const signInGoogle = () => signInWithPopup(auth, googleProvider);
export const signInAnon = () => signInAnonymously(auth);
export const signOutUser = () => signOut(auth);
