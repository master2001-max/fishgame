import { authService } from '../services/authService.js';
import { gameService } from '../services/gameService.js';

export const gameController = {
  getState(req, res, next) {
    try {
      const state = authService.getProfile(req.userId);
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  completeMission(req, res, next) {
    try {
      const result = gameService.completeMission(req.userId, req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  saveSession(req, res, next) {
    try {
      const state = gameService.saveGameSession(req.userId, req.body || {});
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  clearSession(req, res, next) {
    try {
      const state = gameService.clearGameSession(req.userId);
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  updateSettings(req, res, next) {
    try {
      const state = gameService.updateSettings(req.userId, req.body || {});
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },

  getLeaderboard(req, res, next) {
    try {
      const entries = gameService.getLeaderboard(req.userId);
      res.json({ entries });
    } catch (err) {
      next(err);
    }
  },
};
