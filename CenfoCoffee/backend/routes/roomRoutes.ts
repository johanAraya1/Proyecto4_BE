import { Router } from 'express';
import { 
  createRoomController, 
  getRoomController, 
  getActiveRoomsController, 
  getUserRoomsController,
  getRoomByCodeController,
  joinRoomController,
  joinRoomByCodeController
} from '../controllers/roomController';

// Rutas de gestión de salas de juego - creación, unión y consultas
const router = Router();

router.post('/', createRoomController);                      // POST /api/rooms
router.get('/', getActiveRoomsController);                   // GET /api/rooms
router.post('/join-by-code', joinRoomByCodeController);      // POST /api/rooms/join-by-code (ANTES de /:roomId)
router.get('/code/:code', getRoomByCodeController);          // GET /api/rooms/code/:code
router.get('/user/:userId', getUserRoomsController);         // GET /api/rooms/user/:userId
router.get('/:roomId', getRoomController);                   // GET /api/rooms/:roomId (DESPUÉS de rutas específicas)
router.post('/:roomId/join', joinRoomController);            // POST /api/rooms/:roomId/join

export default router;