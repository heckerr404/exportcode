import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
const isConfigured = Boolean(
  apiKey &&
  !apiKey.startsWith('your-') &&
  projectId &&
  !projectId.startsWith('your-')
);

const firebaseConfig = {
  apiKey:            apiKey || 'mock-api-key',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mock-project',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0000000000',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:0000000000:web:0000000000',
};

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isConfigured) {
  try {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
  } catch (err) {
    console.warn('[Firebase] Initialization failed, falling back to local mode:', err);
  }
}

export { auth };

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Mock user for local development
const mockDevUser = {
  uid: 'local-user',
  displayName: 'Local User',
  email: 'local@codesync.dev',
  photoURL: null,
  getIdToken: async () => 'dev-token',
} as unknown as User;

let localDevUser: User | null = mockDevUser;
const authSubscribers = new Set<(user: User | null) => void>();

/** Sign in with Google popup. Returns the signed-in user. */
export async function signInWithGoogle(): Promise<User> {
  if (auth) {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
  localDevUser = mockDevUser;
  authSubscribers.forEach((cb) => cb(localDevUser));
  return mockDevUser;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
    return;
  }
  localDevUser = null;
  authSubscribers.forEach((cb) => cb(null));
}

/**
 * Returns the current user's Firebase ID token (JWT).
 * Pass this in the Authorization header on every API call.
 */
export async function getIdToken(): Promise<string | null> {
  if (auth?.currentUser) {
    return auth.currentUser.getIdToken();
  }
  if (!isConfigured && localDevUser) {
    return 'dev-token';
  }
  return null;
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  }
  authSubscribers.add(callback);
  // Asynchronously trigger with current local state
  setTimeout(() => callback(localDevUser), 0);
  return () => {
    authSubscribers.delete(callback);
  };
}

export type { User };
