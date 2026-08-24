import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize only once — supports both local (ADC) and Vercel (env vars)
if (!getApps().length) {
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
  } else {
    // Local dev: uses Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
    initializeApp();
  }
}

export const db = getFirestore();

// ─── Per-user collection/document helpers ─────────────────────────────────────
// All user data lives under users/{uid}/codesync/{doc}

export function getUserDocs(uid: string) {
  const base = db.collection('users').doc(uid).collection('codesync');
  return {
    config:  () => base.doc('config'),
    secrets: () => base.doc('secrets'),
    ledger:  () => base.doc('ledger'),
  };
}

// Legacy single-user DOCS kept for backward compatibility during migration
export const DOCS = {
  config:  () => db.collection('codesync').doc('config'),
  secrets: () => db.collection('codesync').doc('secrets'),
  ledger:  () => db.collection('codesync').doc('ledger'),
} as const;
