/**
 * Unit Tests: Authentication Middleware
 *
 * Location: backend/tests/authMiddleware.test.js
 * Purpose: Verifies Bearer token extraction, Firebase ID token verification, and 401 rejection.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { requireAuth } from '../src/middleware/authMiddleware.js';

function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('requireAuth Middleware', () => {
  it('should return 401 if Authorization header is missing', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.match(res.body.error, /Authentication required/);
  });

  it('should return 401 if scheme is not Bearer', async () => {
    const req = { headers: { authorization: 'Basic 123456' } };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
  });

  it('should return 401 if token is invalid or malformed', async () => {
    const req = { headers: { authorization: 'Bearer totally-invalid-token' } };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.match(res.body.error, /Invalid or expired/);
  });
});
