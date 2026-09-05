export type Platform = 'leetcode' | 'gfg';

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
  hasGithubPat: boolean;
  githubPatPreview: string;
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

export interface LedgerEntry {
  platform: Platform;
  slug: string;
  title: string;
  difficulty: string;
  syncedAt: string;
  commitSha?: string;
  commitUrl?: string;
  filePath: string;
}

export interface SyncHistory {
  lastSync: string | null;
  total: number;
  entries: LedgerEntry[];
}

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  description: string | null;
}
