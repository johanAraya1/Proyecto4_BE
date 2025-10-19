import { Router } from 'express';
import { 
  createRoomController, 
  getRoomController, 
  getActiveRoomsController, 
  getUserRoomsController,
  getRoomByCodeController,
  joinRoomController
} from '../controllers/roomController';

// Rutas de gestión de salas de juego - creación, unión y consultas
const router = Router();

router.post('/', createRoomController);                      // POST /api/rooms
router.get('/', getActiveRoomsController);                   // GET /api/rooms
router.get('/code/:code', getRoomByCodeController);          // GET /api/rooms/code/:code
router.get('/:roomId', getRoomController);                   // GET /api/rooms/:roomId
router.post('/:roomId/join', joinRoomController);            // POST /api/rooms/:roomId/join
router.get('/user/:userId', getUserRoomsController);         // GET /api/rooms/user/:userId

export default router;