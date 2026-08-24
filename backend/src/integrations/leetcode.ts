import axios from 'axios';
import type { Problem } from '../types/index';

const LC_GRAPHQL = 'https://leetcode.com/graphql';
const HEADERS = {
  'Content-Type': 'application/json',
  Referer: 'https://leetcode.com',
  'User-Agent': 'Mozilla/5.0 (compatible; CodeSync/1.0)',
};

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (retries === 0) throw err;
    await sleep(delayMs);
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await withRetry(() =>
    axios.post<{ data: T; errors?: { message: string }[] }>(
      LC_GRAPHQL,
      { query, variables },
      { headers: HEADERS, timeout: 15000 },
    ),
  );
  if (res.data.errors?.length) {
    throw new Error(`LeetCode API error: ${res.data.errors[0].message}`);
  }
  return res.data.data;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const RECENT_AC = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      lang
    }
  }
`;

const QUESTION_DETAIL = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      difficulty
      topicTags { name }
    }
  }
`;

interface AcSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  lang: string;
}

interface QuestionDetail {
  question: {
    difficulty: string;
    topicTags: { name: string }[];
  } | null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchLeetCodeSolved(username: string): Promise<Problem[]> {
  const data = await graphql<{ recentAcSubmissionList: AcSubmission[] }>(RECENT_AC, {
    username,
    limit: 100,
  });

  const submissions = data.recentAcSubmissionList;
  if (!submissions) {
    throw new Error(
      `LeetCode: no data for "${username}". Make sure the profile is public and the username is correct.`,
    );
  }

  // Deduplicate — keep earliest occurrence (first accepted) per slug
  const seen = new Map<string, AcSubmission>();
  for (const s of submissions) {
    if (!seen.has(s.titleSlug)) seen.set(s.titleSlug, s);
  }

  const problems: Problem[] = [];
  const unique = [...seen.values()];

  for (let i = 0; i < unique.length; i++) {
    // Respectful rate limiting: pause every 10 requests
    if (i > 0 && i % 10 === 0) await sleep(600);

    const s = unique[i];
    let difficulty = 'Unknown';
    let tags: string[] = [];

    try {
      const detail = await graphql<QuestionDetail>(QUESTION_DETAIL, { titleSlug: s.titleSlug });
      difficulty = detail.question?.difficulty ?? 'Unknown';
      tags = (detail.question?.topicTags ?? []).map(t => t.name);
    } catch {
      // Non-fatal — continue without tags/difficulty
    }

    problems.push({
      platform: 'leetcode',
      id: s.id,
      slug: s.titleSlug,
      title: s.title,
      difficulty,
      tags,
      link: `https://leetcode.com/problems/${s.titleSlug}/`,
      solvedAt: parseInt(s.timestamp, 10) * 1000,
      lang: s.lang,
    });
  }

  return problems;
}
