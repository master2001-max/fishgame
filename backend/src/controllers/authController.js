/**
 * Authentication Controller
 *
 * Location: backend/src/controllers/authController.js
 * Where it fits: HTTP interface layer. Bridges routes to authService.
 *
 * Why: Pure controller with Single Responsibility (handling HTTP status codes, request extraction,
 * and passing errors to the global error middleware via next(err)).
 */

import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body || {});
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const state = await authService.getProfile(req.userId);
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },
};
