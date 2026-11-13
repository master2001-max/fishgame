/**
 * Unit Tests: Puzzle Service (Marc Conrad Fish Game API Interoperability)
 *
 * Location: backend/tests/puzzleService.test.js
 * Purpose: Verifies external API challenge generation, token isolation, and answer verification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { puzzleService } from '../src/services/puzzleService.js';

describe('PuzzleService (Marc Conrad Fish API Interoperability)', () => {
  const testUserId = 'test_hunter_123';

  it('should create a challenge without exposing the solution to the client', async () => {
    const challenge = await puzzleService.createChallenge(testUserId);

    assert.ok(challenge.puzzleId, 'Challenge should have a unique puzzleId');
    assert.ok(challenge.imageUrl, 'Challenge should have an imageUrl');
    assert.ok(challenge.prompt, 'Challenge should have a user prompt');
    assert.ok(challenge.source, 'Challenge should state the interoperability source');

    // Security Verification: Client must never receive the solution
    assert.strictEqual(challenge.solution, undefined, 'Solution must NEVER be exposed in challenge');
    assert.strictEqual(challenge.fish, undefined, 'Raw fish count must NEVER be exposed');
  });

  it('should verify answer correctly when guess matches or does not match', async () => {
    const challenge = await puzzleService.createChallenge(testUserId);
    const puzzleId = challenge.puzzleId;

    // Test incorrect answer (99 is out of range 0-9)
    const resultWrong = await puzzleService.verifyAnswer(testUserId, {
      puzzleId,
      answer: 99,
    });

    assert.strictEqual(resultWrong.correct, false);
    assert.strictEqual(resultWrong.bonusMarks, 0);
    assert.ok(typeof resultWrong.solution === 'number');

    // Challenge should be single-use (token consumed)
    await assert.rejects(
      async () => {
        await puzzleService.verifyAnswer(testUserId, {
          puzzleId,
          answer: resultWrong.solution,
        });
      },
      /expired or not found/
    );
  });

  it('should prevent another user from answering someone else\'s puzzle', async () => {
    const challenge = await puzzleService.createChallenge('user_owner');

    await assert.rejects(
      async () => {
        await puzzleService.verifyAnswer('user_intruder', {
          puzzleId: challenge.puzzleId,
          answer: 3,
        });
      },
      /Unauthorized/
    );
  });
});
