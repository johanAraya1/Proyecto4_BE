"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roomController_1 = require("../controllers/roomController");
// Rutas de gestión de salas de juego - creación, unión y consultas
const router = (0, express_1.Router)();
router.post('/', roomController_1.createRoomController); // POST /api/rooms
router.get('/', roomController_1.getActiveRoomsController); // GET /api/rooms
router.get('/code/:code', roomController_1.getRoomByCodeController); // GET /api/rooms/code/:code
router.get('/:roomId', roomController_1.getRoomController); // GET /api/rooms/:roomId
router.post('/:roomId/join', roomController_1.joinRoomController); // POST /api/rooms/:roomId/join
router.get('/user/:userId', roomController_1.getUserRoomsController); // GET /api/rooms/user/:userId
exports.default = router;
