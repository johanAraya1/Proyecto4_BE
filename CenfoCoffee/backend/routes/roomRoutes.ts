import { Router } from 'express';
import { 
  createRoomController, 
  getRoomController, 
  getActiveRoomsController, 
  getUserRoomsController,
  getRoomByCodeController,
  joinRoomController,
  getGameDetailsController,
  loadGameStateController
  joinRoomByCodeController
} from '../controllers/roomController';

// Rutas de gestión de salas de juego - creación, unión y consultas
const router = Router();

router.post('/', createRoomController);                      // POST /rooms
router.get('/', getActiveRoomsController);                   // GET /rooms
router.get('/user/:userId', getUserRoomsController);         // GET /rooms/user/:userId (DEBE IR ANTES DE /:roomId)
router.get('/code/:code', getRoomByCodeController);          // GET /rooms/code/:code
router.get('/:code/game-details', getGameDetailsController); // GET /rooms/:code/game-details
router.get('/:code/load-state', loadGameStateController);    // GET /rooms/:code/load-state
router.get('/:roomId', getRoomController);                   // GET /rooms/:roomId (DEBE IR AL FINAL)
router.post('/:roomId/join', joinRoomController);            // POST /rooms/:roomId/join
router.post('/', createRoomController);                      // POST /api/rooms
router.get('/', getActiveRoomsController);                   // GET /api/rooms
router.post('/join-by-code', joinRoomByCodeController);      // POST /api/rooms/join-by-code (ANTES de /:roomId)
router.get('/code/:code', getRoomByCodeController);          // GET /api/rooms/code/:code
router.get('/user/:userId', getUserRoomsController);         // GET /api/rooms/user/:userId
router.get('/:roomId', getRoomController);                   // GET /api/rooms/:roomId (DESPUÉS de rutas específicas)
router.post('/:roomId/join', joinRoomController);            // POST /api/rooms/:roomId/join

export default router;