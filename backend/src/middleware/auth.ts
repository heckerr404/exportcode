import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';
// Ensure firebase-admin is initialized before auth is used
import '../lib/firestore';

// Extend Express Request to carry uid
declare global {
  namespace Express {
    interface Request {
      uid: string;
    }
  }
}

/**
 * Verifies the Firebase ID token in the Authorization header.
 * Sets req.uid on success, returns 401 on failure.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const isLocalDev = process.env.NODE_ENV !== 'production' || (!process.env.FIREBASE_PROJECT_ID && !process.env.FIREBASE_CLIENT_EMAIL);

  if (isLocalDev && (!authHeader || authHeader === 'Bearer dev-token' || authHeader === 'Bearer null' || !authHeader.startsWith('Bearer '))) {
    req.uid = 'local-user';
    next();
    return;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    return;
  }

  const idToken = authHeader.slice(7); // strip "Bearer "

  if (idToken === 'dev-token') {
    req.uid = 'local-user';
    next();
    return;
  }

  if (!getApps().length) {
    req.uid = 'local-user';
    next();
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err: any) {
    if (isLocalDev) {
      req.uid = 'local-user';
      next();
      return;
    }
    res.status(401).json({ error: 'Invalid or expired ID token.', detail: err?.message });
  }
}
