"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roomController_1 = require("../controllers/roomController");
// Rutas de gestión de salas de juego - creación, unión y consultas
const router = (0, express_1.Router)();
router.post('/', roomController_1.createRoomController); // POST /rooms
router.get('/', roomController_1.getActiveRoomsController); // GET /rooms
router.get('/user/:userId', roomController_1.getUserRoomsController); // GET /rooms/user/:userId (DEBE IR ANTES DE /:roomId)
router.get('/code/:code', roomController_1.getRoomByCodeController); // GET /rooms/code/:code
router.get('/:code/game-details', roomController_1.getGameDetailsController); // GET /rooms/:code/game-details
router.get('/:code/load-state', roomController_1.loadGameStateController); // GET /rooms/:code/load-state
router.get('/:roomId', roomController_1.getRoomController); // GET /rooms/:roomId (DEBE IR AL FINAL)
router.post('/:roomId/join', roomController_1.joinRoomController); // POST /rooms/:roomId/join
exports.default = router;
