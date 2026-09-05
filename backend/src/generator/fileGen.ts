import type { Problem, AppConfig, SupportedLanguage } from '../types/index';

const EXTENSIONS: Record<SupportedLanguage, string> = {
  python: 'py',
  cpp: 'cpp',
  java: 'java',
  javascript: 'js',
  typescript: 'ts',
};

/**
 * Returns the file extension for a given language.
 */
export function getFileExtension(language: SupportedLanguage = 'python'): string {
  return EXTENSIONS[language] || 'py';
}

/**
 * Builds the relative file path in the GitHub repo for a problem.
 * Examples:
 *   by-difficulty: leetcode/easy/two-sum.py
 *   flat:          leetcode/two-sum.cpp
 */
export function buildFilePath(problem: Problem, config: AppConfig): string {
  const ext = getFileExtension(config.language);
  const platform = problem.platform === 'leetcode' ? 'leetcode' : 'gfg';

  if (config.folderStructure === 'flat') {
    return `${platform}/${problem.slug}.${ext}`;
  }

  const difficulty = (problem.difficulty || 'unknown').toLowerCase().replace(/\s+/g, '-');
  return `${platform}/${difficulty}/${problem.slug}.${ext}`;
}

/**
 * Formats a comment block header based on the target language.
 */
function formatHeader(problem: Problem, language: SupportedLanguage): string {
  const date = new Date(problem.solvedAt).toISOString().split('T')[0];
  const tagsStr = problem.tags.length > 0 ? problem.tags.join(', ') : 'N/A';
  const platformLabel = problem.platform === 'leetcode' ? 'LeetCode' : 'GeeksForGeeks';

  if (language === 'python') {
    const separator = '# ' + '═'.repeat(62);
    return [
      separator,
      `# Problem   : ${problem.title}`,
      `# Platform  : ${platformLabel}`,
      `# Difficulty: ${problem.difficulty}`,
      `# Tags      : ${tagsStr}`,
      `# Link      : ${problem.link}`,
      `# Date      : ${date}`,
      separator,
      '',
      '',
    ].join('\n');
  }

  const separator = '// ' + '═'.repeat(62);
  return [
    separator,
    `// Problem   : ${problem.title}`,
    `// Platform  : ${platformLabel}`,
    `// Difficulty: ${problem.difficulty}`,
    `// Tags      : ${tagsStr}`,
    `// Link      : ${problem.link}`,
    `// Date      : ${date}`,
    separator,
    '',
    '',
  ].join('\n');
}

/**
 * Generates solution template content according to problem and selected programming language.
 */
export function generateSolutionFile(problem: Problem, config: AppConfig): string {
  const lang = config.language || 'python';
  const header = formatHeader(problem, lang);
  const body = generateTemplateBody(problem, lang);
  return header + body;
}

/**
 * Backward-compatible helper for generating python files directly.
 */
export function generatePythonFile(problem: Problem): string {
  const mockConfig: AppConfig = {
    leetcodeUsername: '',
    gfgUsername: '',
    githubUsername: '',
    githubRepo: '',
    language: 'python',
    scheduleEnabled: false,
    scheduleCron: '',
    commitMessageTemplate: '',
    folderStructure: 'by-difficulty',
  };
  return generateSolutionFile(problem, mockConfig);
}

function generateTemplateBody(problem: Problem, language: SupportedLanguage): string {
  const { title, slug, platform } = problem;
  const fnName = toCamelCase(slug);

  switch (language) {
    case 'cpp':
      return `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

using namespace std;

class Solution {
public:
    void solve() {
        // TODO: Implement solution for ${title}
    }
};

int main() {
    Solution sol;
    // sol.solve();
    return 0;
}
`;

    case 'java':
      return `import java.util.*;

public class Solution {
    public void solve() {
        // TODO: Implement solution for ${title}
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        // sol.solve();
    }
}
`;

    case 'javascript':
      return `/**
 * ${title}
 * Platform: ${platform === 'leetcode' ? 'LeetCode' : 'GFG'}
 *
 * @return {void}
 */
function ${fnName}() {
    // TODO: Implement solution
}

module.exports = { ${fnName} };
`;

    case 'typescript':
      return `/**
 * ${title}
 * Platform: ${platform === 'leetcode' ? 'LeetCode' : 'GFG'}
 */
export function ${fnName}(): void {
    // TODO: Implement solution
}
`;

    case 'python':
    default:
      if (platform === 'leetcode') {
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
    # sol.solve()
`;
      } else {
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
}

function toCamelCase(slug: string): string {
  const words = slug.split('-');
  if (words.length === 0) return 'solve';
  return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
