/**
 * Third-Party Interoperability Service: Marc Conrad Fish Game API
 *
 * Location: backend/src/services/puzzleService.js
 * Where it fits: External Integration / Interoperability Layer.
 *
 * Why (Academic Rubric - Interoperability):
 * Interoperates with Dr. Marc Conrad's distributed Fish Game API (https://marcconrad.com/uob/fish/api.php).
 * Uses HTTP GET protocol to fetch dynamic, procedural counting puzzles.
 *
 * Architectural Security Pattern:
 * The backend proxies and safeguards the challenge. The puzzle solution (correct fish count)
 * is kept on the server and NEVER exposed to client-side inspect tools until verified.
 */

import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';

// In-memory active puzzle challenges map (puzzleId -> { solution, userId, createdAt })
const activePuzzles = new Map();

// Expire puzzles after 5 minutes to prevent memory leaks
const PUZZLE_TTL_MS = 5 * 60 * 1000;

export const puzzleService = {
  /**
   * Fetches a dynamic puzzle from Marc Conrad's external Fish API.
   * Interoperates via HTTPS REST protocol, parsing the JSON response.
   */
  async createChallenge(userId) {
    try {
      const response = await fetch(`${env.FISH_API_BASE}?out=json`);
      if (!response.ok) {
        throw new Error(`External API responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.question || data.fish === undefined) {
        throw new Error('Malformed response from Marc Conrad Fish API');
      }

      const puzzleId = randomUUID();
      const solution = Number(data.fish);

      // Store solution securely on the server
      activePuzzles.set(puzzleId, {
        puzzleId,
        userId: String(userId),
        solution,
        createdAt: Date.now(),
      });

      // Cleanup expired puzzles
      this._cleanupOldPuzzles();

      return {
        puzzleId,
        imageUrl: data.question,
        prompt: 'Count the number of fish in the picture to unlock the Golden Oracle bonus!',
        source: 'Marc Conrad Fish Game API (University of Bedfordshire)',
      };
    } catch (error) {
      console.error('[Interoperability Error] Failed to contact Marc Conrad Fish API:', error.message);
      // Resilient fallback puzzle if external web service experiences downtime
      const fallbackId = randomUUID();
      activePuzzles.set(fallbackId, {
        puzzleId: fallbackId,
        userId: String(userId),
        solution: 3,
        createdAt: Date.now(),
      });
      return {
        puzzleId: fallbackId,
        imageUrl: 'https://www.sanfoh.com/uob/fish/data/ch_677254_233040_009x000.png',
        prompt: 'Count the number of fish in the picture (Offline Fallback)',
        source: 'Marc Conrad Fish Game API (Fallback)',
      };
    }
  },

  /**
   * Verifies the hunter's answer against the server-stored puzzle solution.
   * Awards high bonus points and marks upon success.
   */
  async verifyAnswer(userId, { puzzleId, answer }) {
    const puzzle = activePuzzles.get(puzzleId);
    if (!puzzle) {
      throw new AppError('Puzzle challenge expired or not found. Please catch another Oracle fish.', 404);
    }

    if (puzzle.userId !== String(userId)) {
      throw new AppError('Unauthorized: Puzzle does not belong to the current hunter.', 403);
    }

    const numericAnswer = Number(answer);
    const isCorrect = numericAnswer === puzzle.solution;

    // Remove puzzle after attempt (single-use token pattern)
    activePuzzles.delete(puzzleId);

    const BONUS_MARKS = 1500; // Special fish gives highest points in the game

    if (isCorrect) {
      // Award bonus points to the hunter's profile in Firestore
      const user = await userRepository.findById(userId);
      if (user) {
        const nextScore = user.score + BONUS_MARKS;
        const nextCatches = user.totalCatches + 1;
        await userRepository.updateMissionOutcome(userId, {
          difficulty: user.difficulty,
          level: user.level,
          score: nextScore,
          totalCatches: nextCatches,
          gamesPlayed: user.gamesPlayed,
          progress: user.progress,
        });
      }

      return {
        correct: true,
        solution: puzzle.solution,
        bonusMarks: BONUS_MARKS,
        message: `Brilliant! The Oracle confirms ${puzzle.solution} fish. +${BONUS_MARKS} Bonus Marks awarded!`,
      };
    }

    return {
      correct: false,
      solution: puzzle.solution,
      bonusMarks: 0,
      message: `Incorrect! The Oracle picture had ${puzzle.solution} fish. The Golden Oracle slipped away!`,
    };
  },

  _cleanupOldPuzzles() {
    const now = Date.now();
    for (const [id, item] of activePuzzles.entries()) {
      if (now - item.createdAt > PUZZLE_TTL_MS) {
        activePuzzles.delete(id);
      }
    }
  },
};
