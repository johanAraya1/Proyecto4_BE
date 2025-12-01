"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadGameStateController = exports.getGameDetailsController = exports.joinRoomController = exports.getRoomByCodeController = exports.getUserRoomsController = exports.getActiveRoomsController = exports.getRoomController = exports.createRoomController = void 0;
exports.joinRoomByCodeController = exports.joinRoomController = exports.getRoomByCodeController = exports.getUserRoomsController = exports.getActiveRoomsController = exports.getRoomController = exports.createRoomController = void 0;
const roomService_1 = require("../services/roomService");
const telemetryService_1 = require("../services/telemetryService");
// HTTP handler for POST /rooms - creates a new game room
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
// HTTP handler for GET /rooms/:roomId - retrieves specific room by UUID
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
// HTTP handler for GET /rooms - retrieves all active rooms
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
// HTTP handler for GET /users/:userId/rooms - retrieves ALL rooms where user participates (creator OR opponent)
const getUserRoomsController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'userId es requerido' });
            return;
        }
        // Llamar a la función RPC de Supabase que maneja toda la lógica
        const { getUserRoomsWithSummary } = await Promise.resolve().then(() => __importStar(require('../services/roomService')));
        const result = await getUserRoomsWithSummary(userId);
        telemetryService_1.telemetryService.incrementEvent('user_rooms_get_success');
        res.status(200).json(result);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('user_rooms_get_failed');
        console.error('Error al obtener salas del usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getUserRoomsController = getUserRoomsController;
// HTTP handler for GET /rooms/code/:code - finds room by 6-character code with player names
const getRoomByCodeController = async (req, res) => {
    try {
        const { code } = req.params;
        const { user_id } = req.query; // Obtener user_id de query parameters
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
        // Verificar si el usuario ya es parte de la sala
        if (user_id) {
            const userId = String(user_id);
            const isCreator = String(room.creator_id) === userId;
            const isOpponent = room.opponent_id ? String(room.opponent_id) === userId : false;
            if (isCreator || isOpponent) {
                telemetryService_1.telemetryService.incrementEvent('room_user_already_in_room');
                const response = {
                    room,
                    isUserInRoom: true,
                    userRole: isCreator ? 'creator' : 'opponent',
                    message: 'Ya eres parte de esta sala'
                };
                res.status(200).json(response);
                return;
            }
        }
        // Verificar el estado de la sala (prioridad principal)
        let message;
        let canJoin = false;
        switch (room.status) {
            case 'waiting':
                // Solo se puede unir si no tiene oponente
                canJoin = room.opponent_id === null;
                message = canJoin ? undefined : 'Esta sala ya está llena. ¡Busca otra sala para jugar!';
                break;
            case 'playing':
                canJoin = false;
                message = 'Esta sala ya está en progreso y no se puede unir';
                break;
            case 'finished':
                canJoin = false;
                message = 'Esta sala ya ha terminado y no se puede unir';
                break;
            default:
                canJoin = false;
                message = 'Esta sala no está disponible para unirse';
        }
        telemetryService_1.telemetryService.incrementEvent('room_get_success');
        const response = {
            room,
            isUserInRoom: false,
            isRoomFull: !canJoin,
            message
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_get_failed');
        console.error('Error al obtener sala por código:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getRoomByCodeController = getRoomByCodeController;
// HTTP handler for POST /rooms/:roomId/join - allows player to join room as opponent
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
// Manejador HTTP para GET /rooms/:code/game-details - obtiene detalles completos para el juego
const getGameDetailsController = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code) {
            res.status(400).json({
                success: false,
                message: 'Código de sala es requerido'
            });
            return;
        }
        const gameDetails = await (0, roomService_1.getGameDetailsByCode)(code);
        if (!gameDetails) {
            telemetryService_1.telemetryService.incrementEvent('room_get_not_found');
            res.status(404).json({
                success: false,
                message: 'Sala no encontrada'
            });
            return;
        }
        telemetryService_1.telemetryService.incrementEvent('room_get_success');
        const response = {
            success: true,
            room: gameDetails
        };
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('room_get_failed');
        console.error('Error al obtener detalles del juego:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
exports.getGameDetailsController = getGameDetailsController;
// HTTP handler for GET /rooms/:code/load-state - carga el estado guardado del juego
const loadGameStateController = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code) {
            res.status(400).json({ error: 'Código de sala es requerido' });
            return;
        }
        const room = await (0, roomService_1.getRoomByCode)(code);
        if (!room) {
            res.status(404).json({ error: 'Sala no encontrada' });
            return;
        }
        const { getGameState } = await Promise.resolve().then(() => __importStar(require('../services/gameService')));
        const gameState = await getGameState(room.id);
        if (!gameState) {
            res.status(200).json({ gameState: null });
            return;
        }
        // Transformar el estado al formato esperado por el frontend
        const response = {
            gameState: {
                currentTurn: gameState.current_turn,
                movementCount: gameState.movement_count || 0,
                ingredientGrid: gameState.grid,
                playerPositions: {
                    player1: gameState.player1_position,
                    player2: gameState.player2_position
                },
                player1: {
                    name: gameState.player1_id?.toString() || 'Player 1',
                    score: gameState.player1_score,
                    inventory: gameState.player1_inventory,
                    orders: gameState.player1_order || [],
                    turnsCompleted: gameState.player1_turns_completed || 0
                },
                player2: {
                    name: gameState.player2_id?.toString() || 'Player 2',
                    score: gameState.player2_score,
                    inventory: gameState.player2_inventory,
                    orders: gameState.player2_order || [],
                    turnsCompleted: gameState.player2_turns_completed || 0
                },
                gridString: gameState.grid_string
            }
        };
        telemetryService_1.telemetryService.incrementEvent('game_action');
        res.status(200).json(response);
    }
    catch (error) {
        telemetryService_1.telemetryService.incrementEvent('server_error');
        console.error('❌ [Load State] Error al cargar estado:', error);
        res.status(500).json({
            error: 'Error al cargar estado del juego',
            message: error.message
        });
    }
};
exports.loadGameStateController = loadGameStateController;
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
