import type { Problem, Ledger, LedgerEntry } from '../types/index';

export function ledgerKey(platform: string, slug: string): string {
  return `${platform}:${slug}`;
}

/**
 * Returns only problems NOT yet in the ledger.
 */
export function diffProblems(problems: Problem[], ledger: Ledger): Problem[] {
  return problems.filter(p => {
    const key = ledgerKey(p.platform, p.slug);
    return !ledger.problems[key];
  });
}

/**
 * Marks a problem as synced in the ledger.
 * Call ONLY after a confirmed successful GitHub commit.
 */
export function markSynced(
  ledger: Ledger,
  problem: Problem,
  filePath: string,
  commitSha?: string,
  commitUrl?: string,
): LedgerEntry {
  const key = ledgerKey(problem.platform, problem.slug);
  const entry: LedgerEntry = {
    platform: problem.platform,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    syncedAt: new Date().toISOString(),
    commitSha,
    commitUrl,
    filePath,
  };
  ledger.problems[key] = entry;
  return entry;
}

/**
 * Updates the lastSync timestamp in the ledger.
 */
export function touchLastSync(ledger: Ledger): void {
  ledger.lastSync = new Date().toISOString();
}
