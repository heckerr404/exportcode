import { useState, useEffect, useRef } from 'react';
import type { AppConfig, SyncJob, SyncHistory, RepoInfo } from './types/index';
import * as api from './api/client';
import { onAuthChange, signOut, type User } from './lib/firebase';
import { Login } from './components/Login';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconSync() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function IconGitHub() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function difficultyClass(d: string): string {
  const dl = d?.toLowerCase();
  if (dl === 'easy' || dl === 'school' || dl === 'basic') return 'badge-easy';
  if (dl === 'medium') return 'badge-medium';
  if (dl === 'hard') return 'badge-hard';
  return 'bg-white/10 text-white/50 text-xs font-medium px-2 py-0.5 rounded-full';
}

function platformBadge(p: string) {
  if (p === 'leetcode') return 'bg-amber-500/15 text-amber-400';
  return 'bg-green-500/15 text-green-400';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'settings' | 'history';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null);
  const [history, setHistory] = useState<SyncHistory | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Auth listener ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Initial load — only after user is confirmed
  useEffect(() => {
    if (!user) return;
    loadConfig();
    loadHistory();
    loadSyncStatus();
  }, [user]);

  // Poll sync status when running
  useEffect(() => {
    if (syncJob?.status === 'running') {
      pollRef.current = setInterval(async () => {
        const status = await api.getSyncStatus();
        setSyncJob(status);
        if (status.status !== 'running') {
          clearInterval(pollRef.current!);
          loadHistory();
        }
      }, 2000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [syncJob?.status]);

  async function loadConfig() {
    try { setConfig(await api.getConfig()); } catch { /* backend not ready */ }
  }
  async function loadHistory() {
    try { setHistory(await api.getSyncHistory()); } catch { /* ignore */ }
  }
  async function loadSyncStatus() {
    try { setSyncJob(await api.getSyncStatus()); } catch { /* ignore */ }
  }

  async function handleSync() {
    if (syncJob?.status === 'running') return;
    try {
      await api.startSync();
      const status = await api.getSyncStatus();
      setSyncJob(status);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to start sync');
    }
  }

  const isRunning = syncJob?.status === 'running';

  // Stats derived from history
  const totalSynced = history?.total ?? 0;
  const lcCount = history?.entries.filter(e => e.platform === 'leetcode').length ?? 0;
  const gfgCount = history?.entries.filter(e => e.platform === 'gfg').length ?? 0;

  // ── Auth gates ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white/40 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col w-64
        bg-surface-800/90 backdrop-blur-md border-r border-white/5
        transition-transform duration-300 md:translate-x-0 md:static md:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">CodeSync</div>
            <div className="text-xs text-white/30">LC & GFG → GitHub</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {([
            { id: 'dashboard', label: 'Dashboard', Icon: IconHome },
            { id: 'settings', label: 'Settings', Icon: IconSettings },
            { id: 'history', label: 'Sync History', Icon: IconHistory },
          ] as { id: Page; label: string; Icon: () => JSX.Element }[]).map(({ id, label, Icon }) => (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => { setPage(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                page === id
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        {/* Sync button in sidebar */}
        <div className="px-3 pb-5">
          <button
            id="sidebar-sync-btn"
            onClick={handleSync}
            disabled={isRunning}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              isRunning
                ? 'bg-brand-600/40 text-brand-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95'
            }`}
          >
            <span className={isRunning ? 'animate-spin' : ''}><IconSync /></span>
            {isRunning ? 'Syncing...' : 'Sync Now'}
          </button>

          {/* Last sync */}
          {history?.lastSync && (
            <p className="text-center text-white/30 text-xs mt-2">
              Last sync: {timeAgo(history.lastSync)}
            </p>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-surface-900/50 backdrop-blur-sm">
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white capitalize">{page}</h1>
          </div>
          {/* Connection status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config ? 'bg-emerald-400 animate-pulse-slow' : 'bg-red-400'}`} />
              <span className="text-xs text-white/40 hidden sm:block">{config ? 'Connected' : 'Disconnected'}</span>
            </div>
            {/* User avatar + sign out */}
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'User'}
                  className="w-7 h-7 rounded-full ring-2 ring-white/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
                </div>
              )}
              <button
                id="btn-sign-out"
                onClick={() => signOut()}
                title="Sign out"
                className="text-xs text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {page === 'dashboard' && (
            <DashboardPage
              config={config}
              syncJob={syncJob}
              history={history}
              totalSynced={totalSynced}
              lcCount={lcCount}
              gfgCount={gfgCount}
              isRunning={isRunning}
              onSync={handleSync}
              onGoSettings={() => setPage('settings')}
            />
          )}
          {page === 'settings' && (
            <SettingsPage
              config={config}
              onSaved={c => { setConfig(c); loadHistory(); }}
            />
          )}
          {page === 'history' && (
            <HistoryPage history={history} />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

interface DashboardProps {
  config: AppConfig | null;
  syncJob: SyncJob | null;
  history: SyncHistory | null;
  totalSynced: number;
  lcCount: number;
  gfgCount: number;
  isRunning: boolean;
  onSync: () => void;
  onGoSettings: () => void;
}

function DashboardPage({ config, syncJob, history, totalSynced, lcCount, gfgCount, isRunning, onSync, onGoSettings }: DashboardProps) {
  const isConfigured = config?.hasGithubPat && config?.githubRepo && (config?.leetcodeUsername || config?.gfgUsername);

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Setup banner */}
      {!isConfigured && (
        <div className="glass-card p-5 border-brand-500/30 bg-brand-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Complete your setup</div>
              <div className="text-xs text-white/50">Add your GitHub PAT, usernames, and target repo to start syncing.</div>
            </div>
          </div>
          <button id="go-settings-btn" onClick={onGoSettings} className="btn-primary text-sm whitespace-nowrap">
            Go to Settings →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Synced" value={totalSynced} color="brand" icon="⚡" />
        <StatCard label="LeetCode" value={lcCount} color="amber" icon="🟡" />
        <StatCard label="GeeksForGeeks" value={gfgCount} color="green" icon="🟢" />
        <StatCard label="Last Sync" value={history?.lastSync ? timeAgo(history.lastSync) : '—'} color="violet" icon="🕐" isText />
      </div>

      {/* Sync progress */}
      {syncJob && syncJob.status !== 'idle' && (
        <SyncProgressCard job={syncJob} />
      )}

      {/* Recent commits */}
      {(history?.entries ?? []).length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Commits</h2>
            <span className="text-xs text-white/40">{history!.total} total</span>
          </div>
          <div className="divide-y divide-white/5">
            {history!.entries.slice(0, 8).map(entry => (
              <div key={`${entry.platform}:${entry.slug}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformBadge(entry.platform)}`}>
                  {entry.platform === 'leetcode' ? 'LC' : 'GFG'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{entry.title}</div>
                  <div className="text-xs text-white/30 font-mono truncate">{entry.filePath}</div>
                </div>
                <span className={`shrink-0 ${difficultyClass(entry.difficulty)}`}>{entry.difficulty}</span>
                <span className="text-xs text-white/30 shrink-0 hidden sm:block">{timeAgo(entry.syncedAt)}</span>
                {entry.commitUrl && (
                  <a href={entry.commitUrl} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-white/20 hover:text-brand-400 transition-colors">
                    <IconGitHub />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isConfigured && (history?.entries ?? []).length === 0 && !isRunning && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <IconSync />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No synced problems yet</h3>
          <p className="text-white/40 text-sm mb-6">Hit <strong>Sync Now</strong> to pull your solved problems from LeetCode and GFG and commit them to GitHub.</p>
          <button id="empty-sync-btn" onClick={onSync} className="btn-primary">
            Run First Sync
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon, isText }: { label: string; value: number | string; color: string; icon: string; isText?: boolean }) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/10 border-brand-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
  };
  return (
    <div className={`glass-card bg-gradient-to-br ${colorMap[color] ?? ''} p-4`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className={`font-bold text-white ${isText ? 'text-base' : 'text-2xl'}`}>{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function SyncProgressCard({ job }: { job: SyncJob }) {
  const p = job.progress;
  const pct = p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0;
  const statusColor = job.status === 'done' ? 'text-emerald-400' : job.status === 'error' ? 'text-red-400' : 'text-brand-400';
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job.log.length]);

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <span className={`${statusColor} ${job.status === 'running' ? 'animate-spin' : ''}`}><IconSync /></span>
        <span className="text-sm font-semibold text-white">
          {job.status === 'running' ? 'Syncing...' : job.status === 'done' ? 'Sync Complete' : 'Sync Failed'}
        </span>
        {job.status === 'done' && job.result && (
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="text-emerald-400">✓ {job.result.synced} synced</span>
            <span className="text-white/40">{job.result.skipped} skipped</span>
            {job.result.failed > 0 && <span className="text-red-400">{job.result.failed} failed</span>}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {job.status === 'running' && p.total > 0 && (
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>{p.processed} / {p.total} problems</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Log */}
      <div className="bg-surface-900/60 px-5 py-3 max-h-48 overflow-y-auto font-mono">
        {job.log.slice(-30).map((line, i) => (
          <div key={i} className={`text-xs py-0.5 ${
            line.includes('✅') ? 'text-emerald-400' :
            line.includes('❌') ? 'text-red-400' :
            line.includes('⚠️') ? 'text-amber-400' :
            'text-white/40'
          }`}>{line}</div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────

interface SettingsProps {
  config: AppConfig | null;
  onSaved: (c: AppConfig) => void;
}

function SettingsPage({ config, onSaved }: SettingsProps) {
  const [form, setForm] = useState({
    leetcodeUsername: config?.leetcodeUsername ?? '',
    gfgUsername: config?.gfgUsername ?? '',
    githubPat: '',
    githubUsername: config?.githubUsername ?? '',
    githubRepo: config?.githubRepo ?? '',
    language: 'python',
    scheduleEnabled: config?.scheduleEnabled ?? false,
    scheduleCron: config?.scheduleCron ?? '0 23 * * *',
    commitMessageTemplate: config?.commitMessageTemplate ?? 'feat: solved {title} ({platform}, {difficulty})',
    folderStructure: config?.folderStructure ?? 'by-difficulty',
  });
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [patStatus, setPatStatus] = useState<{ valid?: boolean; username?: string; error?: string; loading: boolean }>({ loading: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reposLoading, setReposLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(f => ({
        ...f,
        leetcodeUsername: config.leetcodeUsername,
        gfgUsername: config.gfgUsername,
        githubUsername: config.githubUsername,
        githubRepo: config.githubRepo,
        scheduleEnabled: config.scheduleEnabled,
        scheduleCron: config.scheduleCron,
        commitMessageTemplate: config.commitMessageTemplate,
        folderStructure: config.folderStructure,
      }));
    }
  }, [config]);

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleValidatePat() {
    if (!form.githubPat) return;
    setPatStatus({ loading: true });
    const result = await api.validatePat(form.githubPat);
    setPatStatus({ ...result, loading: false });
    if (result.valid && result.username) {
      set('githubUsername', result.username);
    }
  }

  async function handleLoadRepos() {
    setReposLoading(true);
    try {
      // save PAT first so the repos endpoint can use it
      if (form.githubPat) await api.saveConfig({ githubPat: form.githubPat, githubUsername: form.githubUsername });
      const r = await api.listRepos();
      setRepos(r);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to load repos. Make sure your PAT is saved.');
    } finally {
      setReposLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.saveConfig(form as any);
      onSaved(saved);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 animate-fade-in max-w-2xl mx-auto">
      <form onSubmit={handleSave} className="space-y-6">

        {/* Platform usernames */}
        <Section title="Platforms" icon="🎯">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="LeetCode Username">
              <input id="lc-username" className="input-field" placeholder="e.g. john_doe"
                value={form.leetcodeUsername} onChange={e => set('leetcodeUsername', e.target.value)} />
            </Field>
            <Field label="GeeksForGeeks Username">
              <input id="gfg-username" className="input-field" placeholder="e.g. johndoe"
                value={form.gfgUsername} onChange={e => set('gfgUsername', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* GitHub */}
        <Section title="GitHub" icon="🐙">
          <Field label="Personal Access Token (PAT)">
            <div className="flex gap-2">
              <input
                id="github-pat"
                type="password"
                className="input-field"
                placeholder={config?.githubPatPreview || 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                value={form.githubPat}
                onChange={e => { set('githubPat', e.target.value); setPatStatus({ loading: false }); }}
              />
              <button type="button" id="validate-pat-btn" onClick={handleValidatePat}
                disabled={!form.githubPat || patStatus.loading}
                className="btn-ghost text-sm whitespace-nowrap">
                {patStatus.loading ? '...' : 'Verify'}
              </button>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=CodeSync"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-1 transition-colors"
            >
              🔑 Generate a token on GitHub →
            </a>
            {patStatus.valid === true && (
              <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                <IconCheck /> Valid — logged in as @{patStatus.username}
              </p>
            )}
            {patStatus.valid === false && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <IconX /> {patStatus.error}
              </p>
            )}
            {config?.hasGithubPat && !form.githubPat && (
              <p className="text-white/30 text-xs mt-1">PAT already saved: {config.githubPatPreview} — leave blank to keep</p>
            )}
          </Field>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label="GitHub Username">
              <input id="gh-username" className="input-field" placeholder="e.g. johndoe"
                value={form.githubUsername} onChange={e => set('githubUsername', e.target.value)} />
            </Field>

            <Field label="Target Repository">
              <div className="flex gap-2">
                {repos.length > 0 ? (
                  <select id="gh-repo" className="input-field"
                    value={form.githubRepo} onChange={e => set('githubRepo', e.target.value)}>
                    <option value="">Select a repo…</option>
                    {repos.map(r => (
                      <option key={r.id} value={r.name}>{r.name}{r.private ? ' 🔒' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <input id="gh-repo-input" className="input-field" placeholder="my-solutions"
                    value={form.githubRepo} onChange={e => set('githubRepo', e.target.value)} />
                )}
                <button type="button" id="load-repos-btn" onClick={handleLoadRepos}
                  disabled={reposLoading} className="btn-ghost text-sm whitespace-nowrap">
                  {reposLoading ? '...' : 'Browse'}
                </button>
              </div>
            </Field>
          </div>
        </Section>

        {/* Sync options */}
        <Section title="Sync Options" icon="⚙️">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Folder Structure">
              <select id="folder-structure" className="input-field"
                value={form.folderStructure} onChange={e => set('folderStructure', e.target.value)}>
                <option value="by-difficulty">By Difficulty (leetcode/easy/…)</option>
                <option value="flat">Flat (leetcode/…)</option>
              </select>
            </Field>
            <Field label="Commit Message Template">
              <input id="commit-template" className="input-field font-mono text-xs"
                value={form.commitMessageTemplate}
                onChange={e => set('commitMessageTemplate', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Auto-Sync Schedule" icon="🕐">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              id="schedule-toggle"
              onClick={() => set('scheduleEnabled', !form.scheduleEnabled)}
              className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                form.scheduleEnabled ? 'bg-brand-500' : 'bg-surface-600'
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                form.scheduleEnabled ? 'translate-x-4.5' : ''
              }`} />
            </button>
            <span className="text-sm text-white/70">Enable nightly auto-sync</span>
          </div>
          {form.scheduleEnabled && (
            <Field label="Cron Expression">
              <input id="cron-input" className="input-field font-mono"
                value={form.scheduleCron} onChange={e => set('scheduleCron', e.target.value)}
                placeholder="0 23 * * *" />
              <p className="text-white/30 text-xs mt-1">Default: <code className="font-mono">0 23 * * *</code> = every night at 11 PM</p>
            </Field>
          )}
        </Section>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" id="save-settings-btn" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-emerald-400 text-sm flex items-center gap-1 animate-fade-in">
              <IconCheck /> Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// ─── History Page ──────────────────────────────────────────────────────────────

interface HistoryProps { history: SyncHistory | null; }

function HistoryPage({ history }: HistoryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'leetcode' | 'gfg'>('all');

  const entries = (history?.entries ?? []).filter(e => {
    if (filter !== 'all' && e.platform !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 animate-fade-in max-w-5xl mx-auto space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="history-search"
          className="input-field max-w-xs"
          placeholder="Search problems…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {(['all', 'leetcode', 'gfg'] as const).map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-brand-600 text-white' : 'btn-ghost'
              }`}
            >
              {f === 'all' ? 'All' : f === 'leetcode' ? 'LeetCode' : 'GFG'}
            </button>
          ))}
        </div>
        <span className="text-white/30 text-xs ml-auto">{entries.length} problems</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {entries.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            {history?.total === 0 ? 'No synced problems yet — run your first sync!' : 'No matching problems found.'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map(entry => (
              <div key={`${entry.platform}:${entry.slug}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors group">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${platformBadge(entry.platform)}`}>
                  {entry.platform === 'leetcode' ? 'LC' : 'GFG'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{entry.title}</div>
                  <div className="text-xs text-white/25 font-mono truncate">{entry.filePath}</div>
                </div>
                <span className={`shrink-0 ${difficultyClass(entry.difficulty)}`}>{entry.difficulty}</span>
                <span className="text-xs text-white/30 shrink-0 hidden md:block">
                  {new Date(entry.syncedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {entry.commitUrl && (
                    <a href={entry.commitUrl} target="_blank" rel="noopener noreferrer"
                      title="View commit on GitHub"
                      className="text-white/30 hover:text-brand-400 transition-colors">
                      <IconGitHub />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


