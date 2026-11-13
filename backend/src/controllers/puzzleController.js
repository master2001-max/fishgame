/**
 * Puzzle Controller (Marc Conrad Fish API Interoperability)
 *
 * Location: backend/src/controllers/puzzleController.js
 * Where it fits: HTTP interface layer for external puzzle challenges.
 */

import { puzzleService } from '../services/puzzleService.js';

export const puzzleController = {
  async getChallenge(req, res, next) {
    try {
      const challenge = await puzzleService.createChallenge(req.userId);
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  },

  async verifyAnswer(req, res, next) {
    try {
      const result = await puzzleService.verifyAnswer(req.userId, req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
