/**
 * Game Routes
 *
 * Location: backend/src/routes/gameRoutes.js
 * Where it fits: Routing Layer. Protects game endpoints with requireAuth and validates schemas.
 */

import { Router } from 'express';
import { gameController } from '../controllers/gameController.js';
import { puzzleController } from '../controllers/puzzleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import {
  completeMissionSchema,
  saveSessionSchema,
  updateSettingsSchema,
  puzzleVerifySchema,
} from '../validators/schemas.js';

const router = Router();

// Every game route requires an authenticated user
router.use(requireAuth);

router.get('/state', gameController.getState);
router.post('/complete', validateBody(completeMissionSchema), gameController.completeMission);
router.post('/save-session', validateBody(saveSessionSchema), gameController.saveSession);
router.delete('/save-session', gameController.clearSession);
router.put('/settings', validateBody(updateSettingsSchema), gameController.updateSettings);
router.get('/leaderboard', gameController.getLeaderboard);

// Third-Party Interoperability: Marc Conrad Fish Game API
router.get('/puzzle/challenge', puzzleController.getChallenge);
router.post('/puzzle/verify', validateBody(puzzleVerifySchema), puzzleController.verifyAnswer);

export default router;
