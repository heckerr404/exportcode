import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFilePath, generateSolutionFile, getFileExtension } from '../generator/fileGen';
import type { Problem, AppConfig } from '../types/index';

describe('fileGen generator', () => {
  const sampleProblem: Problem = {
    platform: 'leetcode',
    id: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    link: 'https://leetcode.com/problems/two-sum/',
    solvedAt: 1700000000000,
  };

  const baseConfig: AppConfig = {
    leetcodeUsername: 'testuser',
    gfgUsername: 'testuser',
    githubUsername: 'testuser',
    githubRepo: 'my-solutions',
    language: 'python',
    scheduleEnabled: false,
    scheduleCron: '0 23 * * *',
    commitMessageTemplate: 'feat: solved {title}',
    folderStructure: 'by-difficulty',
  };

  it('correctly identifies file extensions', () => {
    assert.strictEqual(getFileExtension('python'), 'py');
    assert.strictEqual(getFileExtension('cpp'), 'cpp');
    assert.strictEqual(getFileExtension('java'), 'java');
    assert.strictEqual(getFileExtension('javascript'), 'js');
    assert.strictEqual(getFileExtension('typescript'), 'ts');
  });

  it('builds relative path with by-difficulty hierarchy', () => {
    const filePath = buildFilePath(sampleProblem, baseConfig);
    assert.strictEqual(filePath, 'leetcode/easy/two-sum.py');
  });

  it('builds relative path with flat structure', () => {
    const flatConfig: AppConfig = { ...baseConfig, folderStructure: 'flat', language: 'cpp' };
    const filePath = buildFilePath(sampleProblem, flatConfig);
    assert.strictEqual(filePath, 'leetcode/two-sum.cpp');
  });

  it('generates python solution with problem metadata and class structure', () => {
    const content = generateSolutionFile(sampleProblem, baseConfig);
    assert.match(content, /Problem\s*:\s*Two Sum/);
    assert.match(content, /Platform\s*:\s*LeetCode/);
    assert.match(content, /Difficulty:\s*Easy/);
    assert.match(content, /class Solution:/);
  });

  it('generates cpp solution template with include directives and class', () => {
    const cppConfig: AppConfig = { ...baseConfig, language: 'cpp' };
    const content = generateSolutionFile(sampleProblem, cppConfig);
    assert.match(content, /#include <iostream>/);
    assert.match(content, /class Solution/);
    assert.match(content, /\/\/ Problem\s*:\s*Two Sum/);
  });

  it('generates typescript solution template', () => {
    const tsConfig: AppConfig = { ...baseConfig, language: 'typescript' };
    const content = generateSolutionFile(sampleProblem, tsConfig);
    assert.match(content, /export function twoSum/);
  });
});
