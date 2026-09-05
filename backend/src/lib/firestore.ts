import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let firestoreInstance: Firestore | null = null;

// Initialize only once — supports both local (ADC) and Vercel (env vars)
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Vercel / explicit service account credentials
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Vercel escapes \n — restore actual newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      firestoreInstance = getFirestore();
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp();
      firestoreInstance = getFirestore();
    }
  } catch (err) {
    console.warn('[Firebase Admin] Initialization fallback to local storage:', err);
  }
} else {
  try {
    firestoreInstance = getFirestore();
  } catch {}
}

export const db = firestoreInstance;

// ─── Per-user collection/document helpers ─────────────────────────────────────
// All user data lives under users/{uid}/codesync/{doc}

export function getUserDocs(uid: string) {
  if (!db) {
    throw new Error('Firestore not initialized in local mode');
  }
  const base = db.collection('users').doc(uid).collection('codesync');
  return {
    config:  () => base.doc('config'),
    secrets: () => base.doc('secrets'),
    ledger:  () => base.doc('ledger'),
  };
}
