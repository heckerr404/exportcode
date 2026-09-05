import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
const rawProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  !rawApiKey.startsWith('your-') &&
  !rawApiKey.includes('mock') &&
  rawProjectId &&
  !rawProjectId.startsWith('your-') &&
  !rawProjectId.includes('mock')
);

const firebaseConfig = {
  apiKey:            rawApiKey || 'mock-api-key',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mock-project',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0000000000',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:0000000000:web:0000000000',
};

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    // Check if user is returning from a redirect sign-in
    getRedirectResult(auth).catch((err) => {
      console.warn('[Firebase Auth] Redirect result error:', err);
    });
  } catch (err) {
    console.warn('[Firebase] Initialization failed, falling back to local mode:', err);
  }
}

export { auth };

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Guest / Local demo user
export const mockDevUser = {
  uid: 'local-user',
  displayName: 'Demo User',
  email: 'user@codesync.dev',
  photoURL: null,
  getIdToken: async () => 'dev-token',
} as unknown as User;

const GUEST_STORAGE_KEY = 'codesync_guest_session';
let localDevUser: User | null = typeof window !== 'undefined' && localStorage.getItem(GUEST_STORAGE_KEY) === 'true'
  ? mockDevUser
  : (!isFirebaseConfigured ? mockDevUser : null);

const authSubscribers = new Set<(user: User | null) => void>();

function notifySubscribers(user: User | null) {
  authSubscribers.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
}

/** Sign in with Google popup (with redirect fallback for blocked popups). */
export async function signInWithGoogle(): Promise<User> {
  if (auth) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (typeof window !== 'undefined') localStorage.removeItem(GUEST_STORAGE_KEY);
      return result.user;
    } catch (err: any) {
      console.warn('[Firebase Auth] Sign-in error:', err);

      if (err?.code === 'auth/popup-blocked') {
        // Fallback to full page redirect if browser blocks popups
        await signInWithRedirect(auth, googleProvider);
        return mockDevUser;
      }

      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. Please try again.');
      }

      const isConfigError =
        err?.code === 'auth/api-key-not-valid' ||
        err?.code === 'auth/invalid-api-key' ||
        err?.code === 'auth/project-not-found' ||
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/unauthorized-domain' ||
        err?.code === 'auth/operation-not-allowed';

      if (isConfigError) {
        console.info('[Firebase Auth] Fallback to guest mode due to config status.');
        return signInAsGuest();
      }
      throw err;
    }
  }
  return signInAsGuest();
}

/** Sign in as Guest / Local user. */
export async function signInAsGuest(): Promise<User> {
  localDevUser = mockDevUser;
  if (typeof window !== 'undefined') localStorage.setItem(GUEST_STORAGE_KEY, 'true');
  notifySubscribers(localDevUser);
  return mockDevUser;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') localStorage.removeItem(GUEST_STORAGE_KEY);
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch {}
  }
  localDevUser = null;
  notifySubscribers(null);
}

/**
 * Returns the current user's Firebase ID token (JWT).
 * Pass this in the Authorization header on every API call.
 */
export async function getIdToken(): Promise<string | null> {
  if (auth?.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return 'dev-token';
    }
  }
  if (localDevUser) {
    return 'dev-token';
  }
  return null;
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback(user);
      } else if (localDevUser) {
        callback(localDevUser);
      } else {
        callback(null);
      }
    });
  }
  authSubscribers.add(callback);
  setTimeout(() => callback(localDevUser), 0);
  return () => {
    authSubscribers.delete(callback);
  };
}

export type { User };
