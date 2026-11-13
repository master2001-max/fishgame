import { authService } from '../services/authService.js';

export const authController = {
  register(req, res, next) {
    try {
      const result = authService.register(req.body || {});
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  login(req, res, next) {
    try {
      const result = authService.login(req.body || {});
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  me(req, res, next) {
    try {
      const state = authService.getProfile(req.userId);
      res.json({ state });
    } catch (err) {
      next(err);
    }
  },
};
