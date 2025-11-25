"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoomByCodeController = exports.joinRoomController = exports.getRoomByCodeController = exports.getUserRoomsController = exports.getActiveRoomsController = exports.getRoomController = exports.createRoomController = void 0;
const roomService_1 = require("../services/roomService");
const telemetryService_1 = require("../services/telemetryService");
// HTTP handler for POST /api/rooms - creates a new game room
const createRoomController = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            telemetryService_1.telemetryService.incrementEvent('room_create_validation_failed');
            res.status(400).json({ error: 'user_id es requerido' });
            return;
        }
        const room = await (0, roomService_1.createRoom)({ user_id });
        telemetryService_1.telemetryService.incrementEvent('room_create_success');
        const response = {
            message: 'Sala creada exitosamente',
            room
        };
        res.status(201).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_create_failed');
        console.error('Error al crear sala:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.createRoomController = createRoomController;
// HTTP handler for GET /api/rooms/:roomId - retrieves specific room by UUID
const getRoomController = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) {
            res.status(400).json({ error: 'roomId es requerido' });
            return;
        }
        const room = await (0, roomService_1.getRoomById)(roomId);
        if (!room) {
            telemetryService_1.telemetryService.incrementEvent('room_get_not_found');
            res.status(404).json({ error: 'Sala no encontrada' });
            return;
        }
        telemetryService_1.telemetryService.incrementEvent('room_get_success');
        res.status(200).json({ room });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_get_failed');
        console.error('Error al obtener sala:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getRoomController = getRoomController;
// HTTP handler for GET /api/rooms - retrieves all active rooms
const getActiveRoomsController = async (req, res) => {
    try {
        const rooms = await (0, roomService_1.getActiveRooms)();
        telemetryService_1.telemetryService.incrementEvent('rooms_list_success');
        res.status(200).json({ rooms });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('rooms_list_failed');
        console.error('Error al obtener salas activas:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getActiveRoomsController = getActiveRoomsController;
// HTTP handler for GET /api/users/:userId/rooms - retrieves rooms created by user
const getUserRoomsController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'userId es requerido' });
            return;
        }
        const rooms = await (0, roomService_1.getRoomsByCreator)(userId);
        telemetryService_1.telemetryService.incrementEvent('user_rooms_get_success');
        res.status(200).json({ rooms });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('user_rooms_get_failed');
        console.error('Error al obtener salas del usuario:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getUserRoomsController = getUserRoomsController;
// HTTP handler for GET /api/rooms/code/:code - finds room by 6-character code with player names
const getRoomByCodeController = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code) {
            res.status(400).json({ error: 'code es requerido' });
            return;
        }
        const room = await (0, roomService_1.getRoomByCode)(code);
        if (!room) {
            telemetryService_1.telemetryService.incrementEvent('room_get_not_found');
            res.status(404).json({ error: 'Sala no encontrada' });
            return;
        }
        telemetryService_1.telemetryService.incrementEvent('room_get_success');
        res.status(200).json({ room });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_get_failed');
        console.error('Error al obtener sala por código:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getRoomByCodeController = getRoomByCodeController;
// HTTP handler for POST /api/rooms/:roomId/join - allows player to join room as opponent
const joinRoomController = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { user_id } = req.body;
        if (!roomId) {
            res.status(400).json({ error: 'roomId es requerido' });
            return;
        }
        if (!user_id) {
            res.status(400).json({ error: 'user_id es requerido' });
            return;
        }
        const room = await (0, roomService_1.joinRoom)(roomId, user_id);
        telemetryService_1.telemetryService.incrementEvent('room_join_success');
        res.status(200).json({
            message: 'Te has unido a la sala exitosamente',
            room
        });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_join_failed');
        console.error('Error al unirse a la sala:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.joinRoomController = joinRoomController;
// HTTP handler for POST /api/rooms/join-by-code - allows player to join room using code
const joinRoomByCodeController = async (req, res) => {
    try {
        const { code } = req.body;
        const userIdHeader = req.headers['x-user-id'];
        if (!code) {
            res.status(400).json({ error: 'code es requerido' });
            return;
        }
        if (!userIdHeader) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const userId = typeof userIdHeader === 'string' ? parseInt(userIdHeader) : userIdHeader;
        // Primero obtener la sala por código
        const existingRoom = await (0, roomService_1.getRoomByCode)(code);
        if (!existingRoom) {
            telemetryService_1.telemetryService.incrementEvent('room_join_not_found');
            res.status(404).json({ error: 'Sala no encontrada con ese código' });
            return;
        }
        // Unirse a la sala usando el roomId
        const room = await (0, roomService_1.joinRoom)(existingRoom.id, userId);
        telemetryService_1.telemetryService.incrementEvent('room_join_by_code_success');
        res.status(200).json({
            message: 'Te has unido a la sala exitosamente',
            room
        });
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_join_by_code_failed');
        console.error('Error al unirse a la sala por código:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.joinRoomByCodeController = joinRoomByCodeController;
