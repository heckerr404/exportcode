import { onRequest } from 'firebase-functions/v2/https';
import { app } from '../server';

/**
 * Firebase Cloud Function — exposes the entire Express app as a single HTTP function.
 * All routes (/api/config, /api/sync, etc.) are handled by the Express router.
 */
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 300,   // sync jobs can take a while
    concurrency: 80,
  },
  app,
);
