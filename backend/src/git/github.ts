import { Octokit } from '@octokit/rest';

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  description: string | null;
}

export interface CommitResult {
  sha: string;
  url: string;
}

function createClient(pat: string): Octokit {
  return new Octokit({ auth: pat });
}

// ─── Repos ────────────────────────────────────────────────────────────────────

export async function listRepos(pat: string, username: string): Promise<RepoInfo[]> {
  const octokit = createClient(pat);
  const repos: RepoInfo[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      page,
      sort: 'updated',
      direction: 'desc',
    });
    if (!data.length) break;
    for (const r of data) {
      repos.push({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        url: r.html_url,
        description: r.description,
      });
    }
    if (data.length < 100) break;
    page++;
  }

  return repos;
}

export async function getAuthenticatedUser(pat: string): Promise<string> {
  const octokit = createClient(pat);
  const { data } = await octokit.users.getAuthenticated();
  return data.login;
}

// ─── File Commit ──────────────────────────────────────────────────────────────

/**
 * Creates or updates a single file in the repo.
 * Idempotent — if the file already exists with identical content, it's a no-op.
 * Returns the commit SHA and HTML URL.
 */
export async function commitFile(
  pat: string,
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  commitMessage: string,
): Promise<CommitResult> {
  const octokit = createClient(pat);
  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

  // Check if the file already exists (to get its SHA for update)
  let existingSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
    if (!Array.isArray(data) && data.type === 'file') {
      // Compare content — if identical, skip the commit
      const existingContent = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
      if (existingContent === content) {
        return { sha: data.sha, url: '' }; // no-op
      }
      existingSha = data.sha;
    }
  } catch (err: any) {
    // 404 = file doesn't exist yet — that's fine
    if (err?.status !== 404) throw err;
  }

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage,
    content: contentBase64,
    ...(existingSha ? { sha: existingSha } : {}),
  });

  return {
    sha: data.commit.sha ?? '',
    url: data.commit.html_url ?? '',
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validatePat(pat: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const username = await getAuthenticatedUser(pat);
    return { valid: true, username };
  } catch (err: any) {
    const status = err?.status;
    if (status === 401) return { valid: false, error: 'Invalid token — check your GitHub PAT.' };
    return { valid: false, error: err?.message ?? 'Unknown error' };
  }
}
