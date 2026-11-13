import { Router } from 'express';
import { gameController } from '../controllers/gameController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Every game route requires an authenticated user
router.use(requireAuth);

router.get('/state', gameController.getState);
router.post('/complete', gameController.completeMission);
router.post('/save-session', gameController.saveSession);
router.delete('/save-session', gameController.clearSession);
router.put('/settings', gameController.updateSettings);
router.get('/leaderboard', gameController.getLeaderboard);

export default router;
