/**
 * Integration Tests: API Endpoints & Request Pipeline
 *
 * Location: backend/tests/apiEndpoints.test.js
 * Purpose: Verifies HTTP routing, Zod input validation, error handling, and security headers.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';

describe('API Endpoints & Middleware Integration', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('GET /api/health should return 200 with database status and security headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);

    // Verify Helmet security headers are present
    assert.ok(res.headers.get('x-content-type-options'), 'X-Content-Type-Options should be present');

    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.database, 'firestore');
  });

  it('POST /api/auth/register should fail with 400 when input fails Zod schema validation', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'a', // Too short (min 2)
        email: 'invalid-email',
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Input validation failed/);
  });

  it('GET /api/game/state should return 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/game/state`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.match(data.error, /Authentication required/);
  });

  it('GET /api/non-existent-route should return 404', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-route`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.error, 'API route not found.');
  });
});
