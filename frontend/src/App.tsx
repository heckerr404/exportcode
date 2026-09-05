import { useState, useEffect, useRef } from 'react';
import type { AppConfig, SyncJob, SyncHistory, RepoInfo } from './types/index';
import * as api from './api/client';
import { onAuthChange, signOut, type User } from './lib/firebase';
import { Login } from './components/Login';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
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
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
  return 'bg-charcoal-100 text-charcoal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full';
}

function platformBadge(p: string) {
  if (p === 'leetcode') return 'bg-amber-100/80 text-amber-800 border border-amber-200/60';
  return 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/60';
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
      <div className="flex h-screen items-center justify-center bg-warm-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="sense-orb animate-pulse-slow shadow-orb" />
          <span className="text-charcoal-500 font-semibold text-sm">Loading CodeSync…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const userFirstName = (user.displayName || 'Friend').split(' ')[0];

  return (
    <div className="flex h-screen overflow-hidden p-3 sm:p-5 gap-5">
      {/* ── Floating Sidebar ── */}
      <aside className={`
        fixed inset-y-3 left-3 z-40 flex flex-col w-64
        glass-card p-4 transition-transform duration-300 md:translate-x-0 md:static md:flex
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Sense Logo Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="sense-orb shadow-orb" />
          <div>
            <div className="text-base font-extrabold text-charcoal-900 tracking-tight">CodeSync</div>
            <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Sync Studio</div>
          </div>
        </div>

        {/* Navigation Category */}
        <div className="px-2 mb-2 text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">
          General
        </div>

        <nav className="flex-1 space-y-1.5">
          {([
            { id: 'dashboard', label: 'Dashboard', Icon: IconHome },
            { id: 'history', label: 'Sync Ledger', Icon: IconHistory },
            { id: 'settings', label: 'Preferences', Icon: IconSettings },
          ] as { id: Page; label: string; Icon: () => JSX.Element }[]).map(({ id, label, Icon }) => {
            const isActive = page === id;
            return (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => { setPage(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-charcoal-900 shadow-soft-card border border-white'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/40'
                }`}
              >
                <span className={isActive ? 'text-brand-500' : 'text-charcoal-400'}>
                  <Icon />
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Sync Trigger Action */}
        <div className="pt-3 border-t border-charcoal-300/40 space-y-3">
          <button
            id="sidebar-sync-btn"
            onClick={handleSync}
            disabled={isRunning}
            className={`w-full btn-accent flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm ${
              isRunning ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <span className={isRunning ? 'animate-spin' : ''}><IconSync /></span>
            {isRunning ? 'Syncing...' : 'Instant Sync'}
          </button>

          {/* Last sync info */}
          {history?.lastSync && (
            <p className="text-center text-charcoal-500 text-[11px] font-medium">
              Last synced {timeAgo(history.lastSync)}
            </p>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-charcoal-900/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Canvas ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden glass-card p-4 sm:p-6">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 pb-5 border-b border-charcoal-300/30">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-xl bg-white/70 text-charcoal-700 hover:text-charcoal-900 shadow-sm" onClick={() => setSidebarOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-charcoal-900 capitalize">{page}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/70 border border-white text-charcoal-600 font-semibold shadow-sm">
                v0.9.0
              </span>
            </div>
          </div>

          {/* User profile & quick status */}
          <div className="flex items-center gap-3">
            {/* Connection badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-white text-xs font-semibold text-charcoal-700 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${config ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              {config ? 'Online' : 'Pending Config'}
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/80 border border-white shadow-soft-card">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'User'}
                  className="w-7 h-7 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-400 to-accent-violet flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-charcoal-800 pr-1 hidden md:inline">
                {userFirstName}
              </span>
              <button
                id="btn-sign-out"
                onClick={() => signOut()}
                title="Sign out"
                className="text-[11px] font-semibold text-charcoal-400 hover:text-brand-600 transition-colors px-1.5 py-0.5 rounded-md hover:bg-charcoal-100"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content scrollable */}
        <div className="flex-1 overflow-y-auto pt-5 pr-1">
          {page === 'dashboard' && (
            <DashboardPage
              config={config}
              syncJob={syncJob}
              history={history}
              totalSynced={totalSynced}
              lcCount={lcCount}
              gfgCount={gfgCount}
              isRunning={isRunning}
              userFirstName={userFirstName}
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
  userFirstName: string;
  onSync: () => void;
  onGoSettings: () => void;
}

function DashboardPage({ config, syncJob, history, totalSynced, lcCount, gfgCount, isRunning, userFirstName, onSync, onGoSettings }: DashboardProps) {
  const isConfigured = config?.hasGithubPat && config?.githubRepo && (config?.leetcodeUsername || config?.gfgUsername);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Sense Welcome Card */}
      <div className="glass-card-subtle p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-white/90 via-white/70 to-accent-lavender/30">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-white text-xs font-bold text-charcoal-700 shadow-sm mb-1">
            ✨ Auto-Sync Automation Active
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            Good day <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-violet">{userFirstName}</span>, ready to sync?
          </h2>
          <p className="text-charcoal-600 text-sm font-medium max-w-xl">
            Track solved problems from LeetCode &amp; GeeksforGeeks and automatically publish structured solutions to your GitHub repositories.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="sense-orb shadow-orb animate-float" />
          <button onClick={onSync} disabled={isRunning} className="btn-primary shadow-soft-float font-bold">
            {isRunning ? 'Syncing...' : 'Sync Problems'}
          </button>
        </div>
      </div>

      {/* Setup banner if not configured */}
      {!isConfigured && (
        <div className="glass-card p-5 border-brand-300/80 bg-brand-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0 text-lg shadow-sm">
              ⚙️
            </div>
            <div>
              <div className="text-sm font-bold text-charcoal-900">Finish setting up CodeSync</div>
              <div className="text-xs text-charcoal-600 font-medium">Connect your GitHub Personal Access Token and LeetCode/GFG usernames to begin.</div>
            </div>
          </div>
          <button id="go-settings-btn" onClick={onGoSettings} className="btn-ghost font-bold text-xs whitespace-nowrap">
            Setup Preferences →
          </button>
        </div>
      )}

      {/* Stat Cards in Sense Palette */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Synced" value={totalSynced} color="brand" icon="⚡" subtitle="Completed problems" />
        <StatCard label="LeetCode" value={lcCount} color="amber" icon="🟡" subtitle="Accepted submissions" />
        <StatCard label="GeeksforGeeks" value={gfgCount} color="green" icon="🟢" subtitle="Practice solutions" />
        <StatCard label="Last Sync" value={history?.lastSync ? timeAgo(history.lastSync) : '—'} color="violet" icon="🕐" isText subtitle="Auto ledger status" />
      </div>

      {/* Sync progress card */}
      {syncJob && syncJob.status !== 'idle' && (
        <SyncProgressCard job={syncJob} />
      )}

      {/* Recent commits */}
      {(history?.entries ?? []).length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-charcoal-300/30 flex items-center justify-between bg-white/40">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Recent Synced Commits</h3>
              <p className="text-xs text-charcoal-500">Live commits tracked in ledger</p>
            </div>
            <span className="text-xs font-bold text-charcoal-600 bg-white px-3 py-1 rounded-full shadow-sm border border-white">
              {history!.total} total
            </span>
          </div>
          <div className="divide-y divide-charcoal-200/40">
            {history!.entries.slice(0, 8).map(entry => (
              <div key={`${entry.platform}:${entry.slug}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/60 transition-colors">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${platformBadge(entry.platform)}`}>
                  {entry.platform === 'leetcode' ? 'LeetCode' : 'GFG'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-charcoal-900 font-bold truncate">{entry.title}</div>
                  <div className="text-xs text-charcoal-500 font-mono truncate">{entry.filePath}</div>
                </div>
                <span className={`shrink-0 ${difficultyClass(entry.difficulty)}`}>{entry.difficulty}</span>
                <span className="text-xs text-charcoal-400 font-semibold shrink-0 hidden sm:block">{timeAgo(entry.syncedAt)}</span>
                {entry.commitUrl && (
                  <a href={entry.commitUrl} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-charcoal-400 hover:text-brand-600 transition-colors p-1.5 rounded-lg hover:bg-white shadow-sm">
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
          <div className="sense-orb-lg mx-auto mb-4 shadow-orb animate-float" />
          <h3 className="text-lg font-extrabold text-charcoal-900 mb-2">No problems synced yet</h3>
          <p className="text-charcoal-600 text-sm max-w-md mx-auto mb-6">
            Click <strong>Instant Sync</strong> to pull your solved problems from LeetCode and GeeksforGeeks and push them to GitHub.
          </p>
          <button id="empty-sync-btn" onClick={onSync} className="btn-accent font-bold px-6 py-3">
            Run First Sync
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon, isText, subtitle }: { label: string; value: number | string; color: string; icon: string; isText?: boolean; subtitle?: string }) {
  const colorMap: Record<string, { bg: string; iconBg: string; text: string }> = {
    brand: { bg: 'from-rose-50/90 via-white/80 to-accent-peach/20 border-rose-100', iconBg: 'bg-rose-100 text-rose-700', text: 'text-charcoal-900' },
    amber: { bg: 'from-amber-50/90 via-white/80 to-orange-50/30 border-amber-100', iconBg: 'bg-amber-100 text-amber-700', text: 'text-charcoal-900' },
    green: { bg: 'from-emerald-50/90 via-white/80 to-teal-50/30 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-700', text: 'text-charcoal-900' },
    violet: { bg: 'from-purple-50/90 via-white/80 to-accent-lavender/30 border-purple-100', iconBg: 'bg-purple-100 text-purple-700', text: 'text-charcoal-900' },
  };
  const theme = colorMap[color] ?? colorMap.brand;
  return (
    <div className={`glass-card bg-gradient-to-br ${theme.bg} p-5 flex flex-col justify-between hover:shadow-soft-float hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center text-sm shadow-sm font-semibold`}>
          {icon}
        </div>
      </div>
      <div>
        <div className={`font-black ${theme.text} tracking-tight ${isText ? 'text-lg' : 'text-3xl'}`}>{value}</div>
        {subtitle && <div className="text-[11px] font-semibold text-charcoal-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

function SyncProgressCard({ job }: { job: SyncJob }) {
  const p = job.progress;
  const pct = p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0;
  const statusColor = job.status === 'done' ? 'text-emerald-600' : job.status === 'error' ? 'text-rose-600' : 'text-brand-600';
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job.log.length]);

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-charcoal-300/30 flex items-center gap-3 bg-white/50">
        <span className={`${statusColor} ${job.status === 'running' ? 'animate-spin' : ''}`}><IconSync /></span>
        <span className="text-sm font-extrabold text-charcoal-900">
          {job.status === 'running' ? 'Syncing Problems…' : job.status === 'done' ? 'Sync Completed' : 'Sync Failed'}
        </span>
        {job.status === 'done' && job.result && (
          <div className="ml-auto flex items-center gap-3 text-xs font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">✓ {job.result.synced} synced</span>
            <span className="text-charcoal-500">{job.result.skipped} skipped</span>
            {job.result.failed > 0 && <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">{job.result.failed} failed</span>}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {job.status === 'running' && p.total > 0 && (
        <div className="px-6 py-3 border-b border-charcoal-300/30 bg-white/30">
          <div className="flex justify-between text-xs font-bold text-charcoal-600 mb-1.5">
            <span>{p.processed} / {p.total} problems processed</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-charcoal-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-coral via-brand-500 to-accent-violet rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Log Console */}
      <div className="bg-[#181622] text-[#e8e4f0] px-6 py-4 max-h-48 overflow-y-auto font-mono text-xs rounded-b-2xl">
        {job.log.slice(-30).map((line, i) => (
          <div key={i} className={`py-0.5 ${
            line.includes('✅') ? 'text-emerald-400' :
            line.includes('❌') ? 'text-rose-400' :
            line.includes('⚠️') ? 'text-amber-400' :
            'text-charcoal-300'
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
    language: config?.language ?? 'python',
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
        language: config.language || 'python',
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
      if (form.githubPat) await api.saveConfig({ githubPat: form.githubPat, githubUsername: form.githubUsername });
      const r = await api.listRepos();
      setRepos(r);
    } catch {
      alert('Failed to load repositories. Verify your PAT first.');
    } finally {
      setReposLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload: any = { ...form };
      if (!form.githubPat) delete payload.githubPat;
      const updated = await api.saveConfig(payload);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-2 sm:p-4 animate-fade-in max-w-2xl mx-auto">
      <form onSubmit={handleSave} className="space-y-6">

        {/* Platform usernames */}
        <Section title="Coding Platforms" icon="🎯">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="LeetCode Username">
              <input id="lc-username" className="input-field" placeholder="e.g. john_doe"
                value={form.leetcodeUsername} onChange={e => set('leetcodeUsername', e.target.value)} />
            </Field>
            <Field label="GeeksforGeeks Username">
              <input id="gfg-username" className="input-field" placeholder="e.g. johndoe"
                value={form.gfgUsername} onChange={e => set('gfgUsername', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* GitHub */}
        <Section title="GitHub Repository Target" icon="🐙">
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
                className="btn-ghost text-xs whitespace-nowrap">
                {patStatus.loading ? '...' : 'Verify'}
              </button>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=CodeSync"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold mt-1.5 transition-colors"
            >
              🔑 Generate a token on GitHub →
            </a>
            {patStatus.valid === true && (
              <p className="text-emerald-700 text-xs mt-1.5 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <IconCheck /> Valid token — logged in as @{patStatus.username}
              </p>
            )}
            {patStatus.valid === false && (
              <p className="text-rose-700 text-xs mt-1.5 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <IconX /> {patStatus.error}
              </p>
            )}
            {config?.hasGithubPat && !form.githubPat && (
              <p className="text-charcoal-500 text-xs mt-1 font-medium">PAT saved: {config.githubPatPreview} — leave empty to keep</p>
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
                  disabled={reposLoading} className="btn-ghost text-xs whitespace-nowrap">
                  {reposLoading ? '...' : 'Browse'}
                </button>
              </div>
            </Field>
          </div>
        </Section>

        {/* Sync options */}
        <Section title="Code Generation & Language" icon="⚙️">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Solution Language">
              <select id="solution-language" className="input-field font-semibold"
                value={form.language} onChange={e => set('language', e.target.value)}>
                <option value="python">Python (.py)</option>
                <option value="cpp">C++ (.cpp)</option>
                <option value="java">Java (.java)</option>
                <option value="javascript">JavaScript (.js)</option>
                <option value="typescript">TypeScript (.ts)</option>
              </select>
            </Field>
            <Field label="Folder Structure">
              <select id="folder-structure" className="input-field font-semibold"
                value={form.folderStructure} onChange={e => set('folderStructure', e.target.value)}>
                <option value="by-difficulty">By Difficulty (leetcode/easy/…)</option>
                <option value="flat">Flat (leetcode/…)</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Commit Message Template">
                <input id="commit-template" className="input-field font-mono text-xs"
                  value={form.commitMessageTemplate}
                  onChange={e => set('commitMessageTemplate', e.target.value)} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Automated Nightly Scheduler" icon="🕐">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              id="schedule-toggle"
              onClick={() => set('scheduleEnabled', !form.scheduleEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                form.scheduleEnabled ? 'bg-brand-500' : 'bg-charcoal-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                form.scheduleEnabled ? 'translate-x-5' : ''
              }`} />
            </button>
            <span className="text-sm font-bold text-charcoal-800">Enable nightly automated sync</span>
          </div>
          {form.scheduleEnabled && (
            <Field label="Cron Expression">
              <input id="cron-input" className="input-field font-mono"
                value={form.scheduleCron} onChange={e => set('scheduleCron', e.target.value)}
                placeholder="0 23 * * *" />
              <p className="text-charcoal-500 text-xs mt-1 font-medium">Default: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-charcoal-200">0 23 * * *</code> = 11:00 PM nightly</p>
            </Field>
          )}
        </Section>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" id="save-settings-btn" disabled={saving} className="btn-primary px-8 py-3 font-bold">
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
          {saved && (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 animate-fade-in">
              <IconCheck /> Settings Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-charcoal-300/30">
        <span className="w-8 h-8 rounded-xl bg-white border border-white shadow-sm flex items-center justify-center text-sm">
          {icon}
        </span>
        <h2 className="text-sm font-extrabold text-charcoal-900 tracking-tight">
          {title}
        </h2>
      </div>
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
    <div className="p-2 sm:p-4 animate-fade-in max-w-5xl mx-auto space-y-4">
      {/* Search & Filter pills */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="history-search"
          className="input-field max-w-xs"
          placeholder="🔍 Search synced problems…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {(['all', 'leetcode', 'gfg'] as const).map(f => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                filter === f ? 'bg-charcoal-900 text-white' : 'bg-white/80 text-charcoal-700 border border-white hover:bg-white'
              }`}
            >
              {f === 'all' ? 'All Platforms' : f === 'leetcode' ? 'LeetCode' : 'GeeksforGeeks'}
            </button>
          ))}
        </div>
        <span className="text-charcoal-500 text-xs font-bold ml-auto">{entries.length} problems</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {entries.length === 0 ? (
          <div className="py-16 text-center text-charcoal-500 text-sm font-medium">
            {history?.total === 0 ? 'No synced problems yet — run your first sync from the dashboard!' : 'No matching problems found.'}
          </div>
        ) : (
          <div className="divide-y divide-charcoal-200/40">
            {entries.map(entry => (
              <div key={`${entry.platform}:${entry.slug}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/60 transition-colors group">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${platformBadge(entry.platform)}`}>
                  {entry.platform === 'leetcode' ? 'LC' : 'GFG'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-charcoal-900 font-bold truncate">{entry.title}</div>
                  <div className="text-xs text-charcoal-500 font-mono truncate">{entry.filePath}</div>
                </div>
                <span className={`shrink-0 ${difficultyClass(entry.difficulty)}`}>{entry.difficulty}</span>
                <span className="text-xs text-charcoal-400 font-medium shrink-0 hidden md:block">
                  {new Date(entry.syncedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  {entry.commitUrl && (
                    <a href={entry.commitUrl} target="_blank" rel="noopener noreferrer"
                      title="View commit on GitHub"
                      className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-charcoal-600 hover:text-brand-600 transition-all shadow-sm">
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
