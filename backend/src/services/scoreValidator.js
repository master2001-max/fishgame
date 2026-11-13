/**
 * Score Validator Module (Anti-Cheat Engine)
 *
 * Location: backend/src/services/scoreValidator.js
 * Where it fits: Domain / Business Logic Layer. Invoked by gameService before recording scores.
 *
 * Why: Security Principle of "Never Trust Client Input". A compromised client or malicious user
 * could send an arbitrary score (e.g. 99,999,999) to the /api/game/complete endpoint.
 * This validator calculates physical, time-based, and mathematical upper bounds to verify
 * that the submitted score is legitimate before saving to Firestore.
 */

import { AppError } from '../utils/appError.js';

// Game physics & economic constraints
const MAX_FISH_BASE_POINTS = 400; // Abyssal Biolume (highest base score)
const PEARL_MAX_BONUS = 500;      // Maximum possible bonus pearls in a single mission
const MIN_CATCH_DURATION_SEC = 1.5; // Physical time required to drop, hook, and retract line

const DIFFICULTY_LIMITS = {
  Easy: {
    duration: 90,
    multiplier: 0.5,
    maxCatches: Math.ceil(90 / MIN_CATCH_DURATION_SEC), // ~60 max
  },
  Normal: {
    duration: 60,
    multiplier: 1.0,
    maxCatches: Math.ceil(60 / MIN_CATCH_DURATION_SEC), // ~40 max
  },
  Hard: {
    duration: 30,
    multiplier: 2.0,
    maxCatches: Math.ceil(30 / MIN_CATCH_DURATION_SEC), // ~20 max
  },
};

export const scoreValidator = {
  /**
   * Validates submitted mission metrics against mathematical and physical boundaries.
   * Throws an AppError(400) if any anomaly or impossible metric is detected.
   */
  validateMissionOutcome({ difficulty, level, score, catches, won }) {
    const diff = DIFFICULTY_LIMITS[difficulty];
    if (!diff) {
      throw new AppError(`Invalid difficulty mode: ${difficulty}`, 400);
    }

    const numScore = Number(score);
    const numCatches = Number(catches);
    const numLevel = Number(level);

    // 1. Basic type and range checks
    if (!Number.isFinite(numScore) || numScore < 0) {
      throw new AppError('Score must be a non-negative finite number.', 400);
    }
    if (!Number.isInteger(numCatches) || numCatches < 0) {
      throw new AppError('Catches must be a non-negative integer.', 400);
    }
    if (!Number.isInteger(numLevel) || numLevel < 1 || numLevel > 6) {
      throw new AppError('Level must be an integer between 1 and 6.', 400);
    }

    // 2. Physical catch limit check based on level duration
    if (numCatches > diff.maxCatches) {
      throw new AppError(
        `Anti-cheat: Impossible catch count (${numCatches}) for ${difficulty} mode (max: ${diff.maxCatches}).`,
        400
      );
    }

    // 3. Mathematical score ceiling check
    // Even if every single fish was the rarest fish + all pearls collected
    const theoreticalMax = Math.ceil(
      (numCatches * MAX_FISH_BASE_POINTS + PEARL_MAX_BONUS) * diff.multiplier
    );

    // If catches == 0, score cannot be positive (unless small pearl bonus only)
    if (numCatches === 0 && numScore > PEARL_MAX_BONUS * diff.multiplier) {
      throw new AppError('Anti-cheat: Cannot earn points without catching fish.', 400);
    }

    if (numScore > theoreticalMax) {
      throw new AppError(
        `Anti-cheat: Submitted score (${numScore}) exceeds theoretical maximum (${theoreticalMax}) for ${numCatches} catches.`,
        400
      );
    }

    return true;
  },
};
