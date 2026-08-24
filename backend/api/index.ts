// Vercel Serverless Function entry point for the CodeSync backend.
// Vercel looks for files in the /api directory and serves them as functions.
// This simply re-exports the Express app so Vercel can handle requests.

import { app } from '../src/server';

export default app;
