import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import configRouter from './routes/config';
import syncRouter from './routes/sync';
import { startScheduler } from './scheduler/cron';

export const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Vercel preview/production domains
  process.env.HOSTING_ORIGIN,
  // Allow all Vercel preview URLs for this project
  /^https:\/\/codesync.*\.vercel\.app$/,
].filter(Boolean) as (string | RegExp)[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(null, allowed);
  },
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/config', configRouter);
app.use('/api/sync', syncRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Local dev only ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, async () => {
    console.log(`\n🚀 CodeSync backend → http://localhost:${PORT}\n`);
    await startScheduler();
  });
}

export default app;
