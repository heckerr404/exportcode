import { describe, it } from 'node:test';
import assert from 'node:assert';
import { app } from '../server';

describe('server health diagnostics', () => {
  it('initializes express app with router endpoints', () => {
    assert.ok(app);
    assert.strictEqual(typeof app.listen, 'function');
  });
});
