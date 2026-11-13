/**
 * Game Controller
 *
 * Location: backend/src/controllers/gameController.js
 * Where it fits: HTTP interface layer. Bridges game routes to gameService.
 *
 * Why: Pure controller with Single Responsibility (handling HTTP status codes, request extraction,
 * and passing errors to the global error middleware via next(err)).
 */

import { authService } from '../services/authService.js';
import { gameService } from '../services/gameService.js';

export const gameController = {
  async getState(req, res, next) {
    try {
      const state = await authService.getProfile(req.userId);
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  async completeMission(req, res, next) {
    try {
      const result = await gameService.completeMission(req.userId, req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async saveSession(req, res, next) {
    try {
      const state = await gameService.saveGameSession(req.userId, req.body || {});
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  async clearSession(req, res, next) {
    try {
      const state = await gameService.clearGameSession(req.userId);
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const state = await gameService.updateSettings(req.userId, req.body || {});
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  async getLeaderboard(req, res, next) {
    try {
      const entries = await gameService.getLeaderboard(req.userId);
      res.json({ entries });
    } catch (err) {
      next(err);
    }
  },
};
