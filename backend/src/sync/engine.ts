import { fetchLeetCodeSolved } from '../integrations/leetcode';
import { fetchGFGSolved } from '../integrations/gfg';
import { diffProblems, markSynced, touchLastSync } from '../ledger/ledger';
import { buildFilePath, generateSolutionFile } from '../generator/fileGen';
import { commitFile } from '../git/github';
import { getConfig, getSecrets, getLedger, saveLedger } from '../config/manager';
import type { SyncJob, SyncResult, CommitResult, Problem } from '../types/index';

// ─── Per-user Job State ────────────────────────────────────────────────────────
// Each user gets their own in-memory job tracker keyed by uid.
// On Vercel serverless this is per-invocation; for local dev it persists in memory.

const userJobs = new Map<string, SyncJob>();

function defaultJob(): SyncJob {
  return {
    id: '',
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    progress: { total: 0, processed: 0, synced: 0, failed: 0, skipped: 0 },
    log: [],
    result: null,
  };
}

export function getSyncStatus(uid: string): SyncJob {
  return { ...(userJobs.get(uid) ?? defaultJob()) };
}

function log(uid: string, msg: string): void {
  const job = userJobs.get(uid);
  if (!job) return;
  const entry = `[${new Date().toISOString()}] ${msg}`;
  console.log(entry);
  job.log.push(entry);
  // Keep last 500 log lines
  if (job.log.length > 500) job.log.shift();
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export async function runSync(uid: string): Promise<SyncResult> {
  const existing = userJobs.get(uid);
  if (existing?.status === 'running') {
    throw new Error('A sync is already in progress.');
  }

  const jobId = Date.now().toString();
  const job: SyncJob = {
    id: jobId,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    progress: { total: 0, processed: 0, synced: 0, failed: 0, skipped: 0 },
    log: [],
    result: null,
  };
  userJobs.set(uid, job);

  const config = await getConfig(uid);
  const secrets = await getSecrets(uid);
  const commits: CommitResult[] = [];
  const errors: string[] = [];

  try {
    // Validate prerequisites
    if (!secrets.githubPat) throw new Error('GitHub PAT is not configured. Go to Settings and add your token.');
    if (!config.githubUsername) throw new Error('GitHub username is not configured.');
    if (!config.githubRepo) throw new Error('GitHub repository is not configured.');

    const ledger = await getLedger(uid);
    let allProblems: Problem[] = [];

    // ── Fetch LeetCode ────────────────────────────────────────────────────────
    if (config.leetcodeUsername) {
      log(uid, `Fetching LeetCode submissions for @${config.leetcodeUsername}...`);
      try {
        const lcProblems = await fetchLeetCodeSolved(config.leetcodeUsername);
        log(uid, `LeetCode: fetched ${lcProblems.length} solved problems.`);
        allProblems = allProblems.concat(lcProblems);
      } catch (err: any) {
        const msg = `LeetCode fetch failed: ${err?.message ?? err}`;
        log(uid, `⚠️ ${msg}`);
        errors.push(msg);
      }
    } else {
      log(uid, 'LeetCode username not set — skipping.');
    }

    // ── Fetch GFG ─────────────────────────────────────────────────────────────
    if (config.gfgUsername) {
      log(uid, `Fetching GFG submissions for @${config.gfgUsername}...`);
      try {
        const gfgProblems = await fetchGFGSolved(config.gfgUsername);
        log(uid, `GFG: fetched ${gfgProblems.length} solved problems.`);
        allProblems = allProblems.concat(gfgProblems);
      } catch (err: any) {
        const msg = `GFG fetch failed: ${err?.message ?? err}`;
        log(uid, `⚠️ ${msg}`);
        errors.push(msg);
      }
    } else {
      log(uid, 'GFG username not set — skipping.');
    }

    // ── Diff ──────────────────────────────────────────────────────────────────
    const newProblems = diffProblems(allProblems, ledger);
    const skipped = allProblems.length - newProblems.length;

    log(uid, `Found ${allProblems.length} total problems. ${newProblems.length} new, ${skipped} already synced.`);
    job.progress.total = newProblems.length;
    job.progress.skipped = skipped;

    if (newProblems.length === 0) {
      log(uid, '✅ Already up to date — nothing to commit.');
    }

    // ── Commit each new problem ───────────────────────────────────────────────
    for (const problem of newProblems) {
      const filePath = buildFilePath(problem, config);
      const fileContent = generateSolutionFile(problem, config);
      const commitMessage = config.commitMessageTemplate
        .replace('{title}', problem.title)
        .replace('{platform}', problem.platform === 'leetcode' ? 'LeetCode' : 'GFG')
        .replace('{difficulty}', problem.difficulty)
        .replace('{slug}', problem.slug);

      log(uid, `Committing: ${commitMessage}`);

      try {
        const result = await commitFile(
          secrets.githubPat,
          config.githubUsername,
          config.githubRepo,
          filePath,
          fileContent,
          commitMessage,
        );

        // Mark in ledger ONLY after confirmed commit
        markSynced(ledger, problem, filePath, result.sha, result.url);
        await saveLedger(uid, ledger);

        log(uid, `✅ Committed: ${filePath} → ${result.url || '(no-op, identical content)'}`);
        job.progress.synced++;
        commits.push({
          platform: problem.platform,
          title: problem.title,
          difficulty: problem.difficulty,
          commitUrl: result.url,
          filePath,
          success: true,
        });
      } catch (err: any) {
        const msg = `Failed to commit "${problem.title}": ${err?.message ?? err}`;
        log(uid, `❌ ${msg}`);
        errors.push(msg);
        job.progress.failed++;
        commits.push({
          platform: problem.platform,
          title: problem.title,
          difficulty: problem.difficulty,
          commitUrl: '',
          filePath,
          success: false,
          error: err?.message ?? String(err),
        });
      }

      job.progress.processed++;
    }

    // ── Finalize ──────────────────────────────────────────────────────────────
    touchLastSync(ledger);
    await saveLedger(uid, ledger);

    const result: SyncResult = {
      synced: job.progress.synced,
      skipped,
      failed: job.progress.failed,
      errors,
      commits,
    };

    job.status = 'done';
    job.finishedAt = new Date().toISOString();
    job.result = result;
    log(uid, `Sync complete. Synced: ${result.synced}, Skipped: ${result.skipped}, Failed: ${result.failed}`);

    return result;
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    log(uid, `❌ Fatal sync error: ${msg}`);
    job.status = 'error';
    job.finishedAt = new Date().toISOString();
    const result: SyncResult = { synced: 0, skipped: 0, failed: 1, errors: [msg], commits };
    job.result = result;
    throw err;
  }
}
