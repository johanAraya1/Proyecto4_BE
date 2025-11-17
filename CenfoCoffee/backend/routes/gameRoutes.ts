import { Router } from 'express';
import { getGameStateController } from '../controllers/gameStateController';

// Rutas REST para el estado del juego
const router = Router();

router.get('/:matchId/state', getGameStateController);  // GET /api/game/:matchId/state

export default router;
