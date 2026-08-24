import cron from 'node-cron';

// NOTE: Cron scheduler is disabled when running on Vercel (stateless serverless).
// Per-user scheduled syncs require user UIDs, best handled via Vercel Cron Jobs.

let scheduledTask: cron.ScheduledTask | null = null;

export async function startScheduler(): Promise<void> {
  console.log('[Scheduler] Auto-sync disabled (stateless deployment).');
}

export function stopScheduler(): void {
  if (scheduledTask) { scheduledTask.stop(); scheduledTask = null; }
}

export function restartScheduler(): void {
  stopScheduler();
  startScheduler();
}
