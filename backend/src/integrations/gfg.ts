import axios from 'axios';
import type { Problem } from '../types/index';

// Community-maintained GFG profile API (best-effort — may break if upstream changes)
// Source: https://geeks-for-geeks-api.vercel.app
const GFG_API_BASE = 'https://geeks-for-geeks-api.vercel.app';

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(r => setTimeout(r, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches solved problems for a GFG user.
 *
 * ⚠️ BEST-EFFORT: Uses an unofficial community API.
 * GFG does not expose an official public API. This integration
 * will degrade gracefully if the upstream API changes structure.
 */
export async function fetchGFGSolved(username: string): Promise<Problem[]> {
  let rawData: unknown;

  try {
    const res = await withRetry(() =>
      axios.get(`${GFG_API_BASE}/${username}`, {
        timeout: 15000,
        headers: { 'User-Agent': 'CodeSync/1.0' },
      }),
    );
    rawData = res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404 || status === 400) {
      throw new Error(
        `GFG: Profile "${username}" not found. Check the username and ensure the profile is public.`,
      );
    }
    throw new Error(`GFG: Network error — ${err?.message ?? 'unknown'}. The API may be temporarily down.`);
  }

  if (!rawData || typeof rawData !== 'object') {
    throw new Error('GFG: Unexpected API response format.');
  }

  const data = rawData as Record<string, unknown>;
  if (data.error || data.message) {
    throw new Error(`GFG: ${data.error ?? data.message}`);
  }

  const problems: Problem[] = [];
  const now = Date.now();

  // The API returns problems bucketed by difficulty
  // Structure: { solvedStats: { school: { questions: [...] }, basic: {...}, easy: {...}, medium: {...}, hard: {...} } }
  const BUCKETS: Record<string, string> = {
    school: 'School',
    basic: 'Basic',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  const solvedStats = (data.solvedStats ?? data.info) as Record<string, unknown> | undefined;

  if (!solvedStats) {
    // Graceful degradation — return empty with a warning instead of crash
    console.warn('[GFG] solvedStats field missing from response. API structure may have changed.');
    return [];
  }

  for (const [key, label] of Object.entries(BUCKETS)) {
    const bucket = (solvedStats[key] ?? solvedStats[label.toLowerCase()]) as
      | Record<string, unknown>
      | undefined;

    if (!bucket) continue;

    const questions = (bucket.questions ?? bucket.problems ?? []) as unknown[];

    for (const q of questions) {
      if (typeof q !== 'object' || !q) continue;
      const qObj = q as Record<string, unknown>;

      const rawTitle =
        (qObj.question ?? qObj.title ?? qObj.name ?? '') as string;
      if (!rawTitle) continue;

      const slug = slugify(rawTitle);
      const questionUrl =
        (qObj.questionUrl ?? qObj.url ?? qObj.link ?? '') as string;

      problems.push({
        platform: 'gfg',
        id: slug,
        slug,
        title: rawTitle,
        difficulty: label,
        tags: [],
        link: questionUrl || `https://practice.geeksforgeeks.org/problems/${slug}/`,
        solvedAt: now, // GFG doesn't expose solve timestamps in public API
      });
    }
  }

  return problems;
}
