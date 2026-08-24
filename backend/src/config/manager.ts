import { getUserDocs } from '../lib/firestore';
import type { AppConfig, Secrets, Ledger } from '../types/index';

const DEFAULT_CONFIG: AppConfig = {
  leetcodeUsername: '',
  gfgUsername: '',
  githubUsername: '',
  githubRepo: '',
  language: 'python',
  scheduleEnabled: false,
  scheduleCron: '0 23 * * *',
  commitMessageTemplate: 'feat: solved {title} ({platform}, {difficulty})',
  folderStructure: 'by-difficulty',
};

const DEFAULT_LEDGER: Ledger = {
  version: 1,
  lastSync: null,
  problems: {},
};

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getConfig(uid: string): Promise<AppConfig> {
  try {
    const snap = await getUserDocs(uid).config().get();
    if (!snap.exists) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...(snap.data() as Partial<AppConfig>) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(uid: string, partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig(uid);
  const merged = { ...current, ...partial };
  await getUserDocs(uid).config().set(merged);
  return merged;
}

// ─── Secrets ──────────────────────────────────────────────────────────────────

export async function getSecrets(uid: string): Promise<Secrets> {
  const envPat = process.env.GITHUB_PAT || '';
  try {
    const snap = await getUserDocs(uid).secrets().get();
    if (!snap.exists) return { githubPat: envPat };
    const stored = snap.data() as Partial<Secrets>;
    return { githubPat: stored.githubPat || envPat };
  } catch {
    return { githubPat: envPat };
  }
}

export async function saveSecrets(uid: string, partial: Partial<Secrets>): Promise<void> {
  const current = await getSecrets(uid);
  await getUserDocs(uid).secrets().set({ ...current, ...partial });
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export async function getLedger(uid: string): Promise<Ledger> {
  try {
    const snap = await getUserDocs(uid).ledger().get();
    if (!snap.exists) return { ...DEFAULT_LEDGER, problems: {} };
    return snap.data() as Ledger;
  } catch {
    return { ...DEFAULT_LEDGER, problems: {} };
  }
}

export async function saveLedger(uid: string, ledger: Ledger): Promise<void> {
  await getUserDocs(uid).ledger().set(ledger);
}
