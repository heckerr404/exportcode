import { onSchedule } from 'firebase-functions/v2/scheduler';

// Firebase Scheduled Function kept for reference only.
// Not used in Vercel deployment.
export const nightlySync = onSchedule(
  { schedule: 'every day 17:30', timeZone: 'UTC', region: 'us-central1' },
  async () => { console.log('[Scheduled] No-op on Vercel.'); },
);
