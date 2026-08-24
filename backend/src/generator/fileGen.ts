import type { Problem, AppConfig } from '../types/index';

/**
 * Builds the relative file path in the GitHub repo for a problem.
 * Examples:
 *   by-difficulty: leetcode/easy/two-sum.py
 *   flat:          leetcode/two-sum.py
 */
export function buildFilePath(problem: Problem, config: AppConfig): string {
  const ext = 'py'; // language is always python per user config
  const platform = problem.platform === 'leetcode' ? 'leetcode' : 'gfg';

  if (config.folderStructure === 'flat') {
    return `${platform}/${problem.slug}.${ext}`;
  }

  const difficulty = (problem.difficulty || 'unknown').toLowerCase().replace(/\s+/g, '-');
  return `${platform}/${difficulty}/${problem.slug}.${ext}`;
}

/**
 * Generates a fully-formatted Python solution file for a problem.
 */
export function generatePythonFile(problem: Problem): string {
  const date = new Date(problem.solvedAt).toISOString().split('T')[0];
  const tagsStr = problem.tags.length > 0 ? problem.tags.join(', ') : 'N/A';
  const platformLabel = problem.platform === 'leetcode' ? 'LeetCode' : 'GeeksForGeeks';

  const separator = '# ' + '═'.repeat(62);

  const header = [
    separator,
    `# Problem   : ${problem.title}`,
    `# Platform  : ${platformLabel}`,
    `# Difficulty: ${problem.difficulty}`,
    `# Tags      : ${tagsStr}`,
    `# Link      : ${problem.link}`,
    `# Date      : ${date}`,
    separator,
    '',
  ].join('\n');

  const classTemplate = generateClassTemplate(problem);

  return header + classTemplate;
}

function generateClassTemplate(problem: Problem): string {
  const slug = problem.slug;
  const title = problem.title;
  const platform = problem.platform;

  if (platform === 'leetcode') {
    // LeetCode almost always uses a Solution class
    return `from typing import List, Optional, Dict, Tuple
import collections
import heapq


class Solution:
    def solve(self) -> None:
        """
        ${title}

        Approach:
            - TODO: Describe your approach

        Complexity:
            Time : O(?)
            Space: O(?)
        """
        pass


# ─── Quick Test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sol = Solution()
    # TODO: Add test cases
    # print(sol.solve(...))
`;
  } else {
    // GFG typically uses a function-based approach
    const fnName = toCamelCase(slug);
    return `# ${title}


def ${fnName}():
    """
    ${title}

    Approach:
        - TODO: Describe your approach

    Complexity:
        Time : O(?)
        Space: O(?)
    """
    pass


# ─── Quick Test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # TODO: Add test cases
    pass
`;
  }
}

function toCamelCase(slug: string): string {
  const words = slug.split('-');
  if (words.length === 0) return 'solve';
  return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
