export type Platform = 'leetcode' | 'gfg';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'School' | 'Basic' | 'Unknown';

export interface Problem {
  platform: Platform;
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  link: string;
  solvedAt: number; // unix ms
  lang?: string;
}

export interface LedgerEntry {
  platform: Platform;
  slug: string;
  title: string;
  difficulty: string;
  syncedAt: string; // ISO string
  commitSha?: string;
  commitUrl?: string;
  filePath: string;
}

export interface Ledger {
  version: 1;
  lastSync: string | null;
  problems: Record<string, LedgerEntry>; // key: `${platform}:${slug}`
}

export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'javascript' | 'typescript';

export interface AppConfig {
  leetcodeUsername: string;
  gfgUsername: string;
  githubUsername: string;
  githubRepo: string;
  language: SupportedLanguage;
  scheduleEnabled: boolean;
  scheduleCron: string;
  commitMessageTemplate: string;
  folderStructure: 'by-difficulty' | 'flat';
}

export interface Secrets {
  githubPat: string;
}

export interface SyncProgress {
  total: number;
  processed: number;
  synced: number;
  failed: number;
  skipped: number;
}

export interface SyncJob {
  id: string;
  status: 'idle' | 'running' | 'done' | 'error';
  startedAt: string | null;
  finishedAt: string | null;
  progress: SyncProgress;
  log: string[];
  result: SyncResult | null;
}

export interface SyncResult {
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
  commits: CommitResult[];
}

export interface CommitResult {
  platform: Platform;
  title: string;
  difficulty: string;
  commitUrl: string;
  filePath: string;
  success: boolean;
  error?: string;
}
