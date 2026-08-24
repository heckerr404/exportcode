import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
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

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    return;
  }

  const idToken = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired ID token.', detail: err?.message });
  }
}
