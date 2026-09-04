import fs from 'fs';
import path from 'path';
import { getUserDocs } from '../lib/firestore';
import type { AppConfig, Secrets, Ledger } from '../types/index';

const DATA_DIR = path.resolve(__dirname, '../../data');
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalJson<T>(filename: string, fallback: T): T {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      return { ...fallback, ...JSON.parse(fs.readFileSync(filePath, 'utf-8')) };
    }
  } catch {}
  return fallback;
}

function writeLocalJson<T>(filename: string, data: T): void {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Local Storage] Failed to write ${filename}:`, err);
  }
}

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
    if (!snap.exists) return readLocalJson('config.json', { ...DEFAULT_CONFIG });
    return { ...DEFAULT_CONFIG, ...(snap.data() as Partial<AppConfig>) };
  } catch {
    return readLocalJson('config.json', { ...DEFAULT_CONFIG });
  }
}

export async function saveConfig(uid: string, partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig(uid);
  const merged = { ...current, ...partial };
  try {
    await getUserDocs(uid).config().set(merged);
  } catch {
    // Local fallback
    writeLocalJson('config.json', merged);
  }
  return merged;
}

// ─── Secrets ──────────────────────────────────────────────────────────────────

export async function getSecrets(uid: string): Promise<Secrets> {
  const envPat = process.env.GITHUB_PAT || '';
  const localSecrets = readLocalJson('secrets.json', { githubPat: envPat });
  try {
    const snap = await getUserDocs(uid).secrets().get();
    if (!snap.exists) return { githubPat: localSecrets.githubPat || envPat };
    const stored = snap.data() as Partial<Secrets>;
    return { githubPat: stored.githubPat || localSecrets.githubPat || envPat };
  } catch {
    return { githubPat: localSecrets.githubPat || envPat };
  }
}

export async function saveSecrets(uid: string, partial: Partial<Secrets>): Promise<void> {
  const current = await getSecrets(uid);
  const merged = { ...current, ...partial };
  try {
    await getUserDocs(uid).secrets().set(merged);
  } catch {
    writeLocalJson('secrets.json', merged);
  }
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export async function getLedger(uid: string): Promise<Ledger> {
  try {
    const snap = await getUserDocs(uid).ledger().get();
    if (!snap.exists) return readLocalJson('ledger.json', { ...DEFAULT_LEDGER, problems: {} });
    return snap.data() as Ledger;
  } catch {
    return readLocalJson('ledger.json', { ...DEFAULT_LEDGER, problems: {} });
  }
}

export async function saveLedger(uid: string, ledger: Ledger): Promise<void> {
  try {
    await getUserDocs(uid).ledger().set(ledger);
  } catch {
    writeLocalJson('ledger.json', ledger);
  }
}
