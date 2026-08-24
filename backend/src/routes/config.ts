import { Router } from 'express';
import { getConfig, saveConfig, getSecrets, saveSecrets } from '../config/manager';
import { validatePat, listRepos } from '../git/github';
import { restartScheduler } from '../scheduler/cron';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth to all config routes
router.use(authMiddleware);

// GET /api/config — return current config (never return the actual PAT)
router.get('/', async (req, res) => {
  const config = await getConfig(req.uid);
  const secrets = await getSecrets(req.uid);
  res.json({
    ...config,
    hasGithubPat: !!secrets.githubPat,
    // Mask PAT — only tell frontend it exists
    githubPatPreview: secrets.githubPat
      ? `${secrets.githubPat.slice(0, 7)}${'•'.repeat(20)}`
      : '',
  });
});

// POST /api/config — save config + secrets
router.post('/', async (req, res) => {
  try {
    const { githubPat, ...configFields } = req.body as Record<string, string>;

    if (githubPat) await saveSecrets(req.uid, { githubPat });
    const updated = await saveConfig(req.uid, configFields);

    // Restart scheduler if schedule config changed
    restartScheduler();

    res.json({ ok: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? 'Failed to save config' });
  }
});

// POST /api/config/validate-pat — test that the PAT is valid
router.post('/validate-pat', async (req, res) => {
  const { githubPat } = req.body as { githubPat?: string };
  const secrets = await getSecrets(req.uid);
  const pat = githubPat || secrets.githubPat;
  if (!pat) {
    res.status(400).json({ valid: false, error: 'No PAT provided' });
    return;
  }
  const result = await validatePat(pat);
  res.json(result);
});

// GET /api/config/repos — list GitHub repos for the authenticated user
router.get('/repos', async (req, res) => {
  try {
    const secrets = await getSecrets(req.uid);
    const config = await getConfig(req.uid);
    if (!secrets.githubPat) {
      res.status(400).json({ error: 'GitHub PAT not configured' });
      return;
    }
    const repos = await listRepos(secrets.githubPat, config.githubUsername);
    res.json(repos);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to list repos' });
  }
});

export default router;
