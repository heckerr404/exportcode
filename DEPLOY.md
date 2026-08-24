# CodeSync — Vercel Deployment Guide

## Code Changes Summary (all done)

- Backend auth middleware: verifies Firebase ID tokens on every API call
- Per-user Firestore: all data scoped to users/{uid}/codesync/
- Vercel entry point: backend/api/index.ts exports Express app
- vercel.json: routes /api/* to serverless function, serves frontend as static
- Frontend Firebase Auth: Google Sign-In popup, onAuthChange listener
- Login page UI: animated blobs, feature list, Google sign-in button
- API client: auto-attaches Bearer token to every request
- User avatar + Sign Out button in app header

## Deployment Steps

### 1. Enable Google Sign-In
Firebase Console > Authentication > Sign-in method > Google > Enable

### 2. Fill in frontend/.env.production
Get values from Firebase Console > Project Settings > Your apps > Web app:
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=...
  VITE_FIREBASE_APP_ID=...
  VITE_API_BASE_URL=    (leave blank for Vercel)

### 3. Get Firebase Service Account key
Firebase Console > Project Settings > Service accounts > Generate new private key

### 4. Deploy to Vercel
  cd "/Users/riteshyadav/My code/automation/codesync"
  vercel

Root directory: . (where vercel.json lives). No override settings.
Note the deployment URL, e.g. https://codesync-abc123.vercel.app

### 5. Add env vars in Vercel Dashboard
Settings > Environment Variables:
  FIREBASE_PROJECT_ID     = value from serviceAccountKey.json project_id
  FIREBASE_CLIENT_EMAIL   = value from serviceAccountKey.json client_email
  FIREBASE_PRIVATE_KEY    = value from serviceAccountKey.json private_key
  HOSTING_ORIGIN          = https://codesync-abc123.vercel.app

### 6. Add Vercel domain to Firebase Auth
Firebase Console > Authentication > Settings > Authorized domains
Add: codesync-abc123.vercel.app

### 7. Production deploy
  vercel --prod

### 8. Firestore Security Rules
Firebase Console > Firestore > Rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}

## Firestore Data Structure
users/
  {uid}/           <- one per Google account, fully isolated
    codesync/
      config       <- LeetCode/GFG/GitHub settings
      secrets      <- GitHub PAT
      ledger       <- sync history
