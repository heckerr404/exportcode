import axios from 'axios';
import type { AppConfig, SyncJob, SyncHistory, RepoInfo } from '../types/index';
import { getIdToken } from '../lib/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// ─── Auth interceptor ─────────────────────────────────────────────────────────
// Attach the Firebase ID token to every request as a Bearer token.
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<AppConfig> {
  const { data } = await api.get<AppConfig>('/config');
  return data;
}

export async function saveConfig(config: Partial<AppConfig> & { githubPat?: string }): Promise<AppConfig> {
  const { data } = await api.post<{ ok: boolean; config: AppConfig }>('/config', config);
  return data.config;
}

export async function validatePat(pat: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  const { data } = await api.post('/config/validate-pat', { githubPat: pat });
  return data;
}

export async function listRepos(): Promise<RepoInfo[]> {
  const { data } = await api.get<RepoInfo[]>('/config/repos');
  return data;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function startSync(): Promise<void> {
  await api.post('/sync');
}

export async function getSyncStatus(): Promise<SyncJob> {
  const { data } = await api.get<SyncJob>('/sync/status');
  return data;
}

export async function getSyncHistory(): Promise<SyncHistory> {
  const { data } = await api.get<SyncHistory>('/sync/history');
  return data;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}
