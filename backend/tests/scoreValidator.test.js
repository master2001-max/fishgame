/**
 * Unit Tests: Server-Side Score Validation (Anti-Cheat)
 *
 * Location: backend/tests/scoreValidator.test.js
 * Purpose: Verifies that forged or impossible client scores are strictly rejected.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scoreValidator } from '../src/services/scoreValidator.js';

describe('ScoreValidator (Anti-Cheat)', () => {
  it('should accept valid mission scores within physical limits', () => {
    const outcome = {
      difficulty: 'Easy',
      level: 1,
      score: 350,
      catches: 4,
      won: true,
    };
    assert.strictEqual(scoreValidator.validateMissionOutcome(outcome), true);
  });

  it('should accept valid Hard mode high score', () => {
    const outcome = {
      difficulty: 'Hard',
      level: 3,
      score: 4800,
      catches: 6,
      won: true,
    };
    assert.strictEqual(scoreValidator.validateMissionOutcome(outcome), true);
  });

  it('should reject negative scores', () => {
    assert.throws(
      () =>
        scoreValidator.validateMissionOutcome({
          difficulty: 'Easy',
          level: 1,
          score: -50,
          catches: 2,
          won: false,
        }),
      /non-negative/
    );
  });

  it('should reject impossible score with zero catches', () => {
    assert.throws(
      () =>
        scoreValidator.validateMissionOutcome({
          difficulty: 'Easy',
          level: 1,
          score: 2500,
          catches: 0,
          won: true,
        }),
      /Cannot earn points without catching fish/
    );
  });

  it('should reject cheat score exceeding mathematical ceiling (e.g., 999,999)', () => {
    assert.throws(
      () =>
        scoreValidator.validateMissionOutcome({
          difficulty: 'Normal',
          level: 2,
          score: 999999,
          catches: 5,
          won: true,
        }),
      /exceeds theoretical maximum/
    );
  });

  it('should reject impossible catch counts exceeding level duration', () => {
    assert.throws(
      () =>
        scoreValidator.validateMissionOutcome({
          difficulty: 'Hard', // 30 second level
          level: 1,
          score: 1000,
          catches: 150, // physically impossible in 30 seconds
          won: true,
        }),
      /Impossible catch count/
    );
  });

  it('should reject invalid difficulty modes', () => {
    assert.throws(
      () =>
        scoreValidator.validateMissionOutcome({
          difficulty: 'SuperImpossibleMode',
          level: 1,
          score: 500,
          catches: 3,
          won: true,
        }),
      /Invalid difficulty mode/
    );
  });
});
