/**
 * Authentication Routes
 *
 * Location: backend/src/routes/authRoutes.js
 * Where it fits: Routing Layer. Maps URL paths to input validation and controller actions.
 */

import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);

export default router;
