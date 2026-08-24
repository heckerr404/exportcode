import { Router } from 'express';
import { runSync, getSyncStatus } from '../sync/engine';
import { getLedger } from '../config/manager';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth to all sync routes
router.use(authMiddleware);

// POST /api/sync — start a sync job (fire-and-forget, poll /status)
router.post('/', async (req, res) => {
  const current = getSyncStatus(req.uid);
  if (current.status === 'running') {
    res.status(409).json({ error: 'Sync already in progress', job: current });
    return;
  }

  // Kick off sync asynchronously
  runSync(req.uid).catch(err => {
    console.error('[Sync Route] Unhandled sync error:', err?.message ?? err);
  });

  // Return immediately — client polls /status
  res.json({ ok: true, message: 'Sync started' });
});

// GET /api/sync/status — current job status + progress
router.get('/status', (req, res) => {
  res.json(getSyncStatus(req.uid));
});

// GET /api/sync/history — all problems in the ledger (sorted newest first)
router.get('/history', async (req, res) => {
  const ledger = await getLedger(req.uid);
  const entries = Object.values(ledger.problems).sort(
    (a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime(),
  );
  res.json({
    lastSync: ledger.lastSync,
    total: entries.length,
    entries,
  });
});

export default router;
