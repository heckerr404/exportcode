import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ledgerKey, diffProblems, markSynced, touchLastSync } from '../ledger/ledger';
import type { Problem, Ledger } from '../types/index';

describe('ledger operations', () => {
  const sampleProblem: Problem = {
    platform: 'leetcode',
    id: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array'],
    link: 'https://leetcode.com/problems/two-sum/',
    solvedAt: 1700000000000,
  };

  const sampleProblem2: Problem = {
    platform: 'gfg',
    id: '2',
    slug: 'reverse-array',
    title: 'Reverse Array',
    difficulty: 'Easy',
    tags: ['Array'],
    link: 'https://practice.geeksforgeeks.org/problems/reverse-array',
    solvedAt: 1700000001000,
  };

  it('generates consistent ledger keys', () => {
    assert.strictEqual(ledgerKey('leetcode', 'two-sum'), 'leetcode:two-sum');
    assert.strictEqual(ledgerKey('gfg', 'reverse-array'), 'gfg:reverse-array');
  });

  it('correctly filters out already synced problems in diffProblems', () => {
    const emptyLedger: Ledger = { version: 1, lastSync: null, problems: {} };
    const diff1 = diffProblems([sampleProblem, sampleProblem2], emptyLedger);
    assert.strictEqual(diff1.length, 2);

    markSynced(emptyLedger, sampleProblem, 'leetcode/easy/two-sum.py', 'sha123', 'https://github.com/...');
    const diff2 = diffProblems([sampleProblem, sampleProblem2], emptyLedger);
    assert.strictEqual(diff2.length, 1);
    assert.strictEqual(diff2[0].slug, 'reverse-array');
  });

  it('updates lastSync timestamp in touchLastSync', () => {
    const ledger: Ledger = { version: 1, lastSync: null, problems: {} };
    touchLastSync(ledger);
    assert.ok(ledger.lastSync !== null);
    assert.ok(new Date(ledger.lastSync!).getTime() > 0);
  });
});
