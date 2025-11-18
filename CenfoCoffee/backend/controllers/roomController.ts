import { Request, Response } from 'express';
import { 
  createRoom, 
  getRoomById, 
  getActiveRooms, 
  getRoomsByCreator,
  getRoomByCode,
  joinRoom,
  getGameDetailsByCode
} from '../services/roomService';
import { telemetryService } from '../services/telemetryService';
import { CreateRoomRequest, CreateRoomResponse, GameDetailsResponse, RoomSearchResponse } from '../models/Room';

// HTTP handler for POST /rooms - creates a new game room
export const createRoomController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id }: CreateRoomRequest = req.body;

    if (!user_id) {
      telemetryService.incrementEvent('room_create_validation_failed');
      res.status(400).json({ error: 'user_id es requerido' });
      return;
    }

    const room = await createRoom({ user_id });
    telemetryService.incrementEvent('room_create_success');
    
    const response: CreateRoomResponse = {
      message: 'Sala creada exitosamente',
      room
    };

    res.status(201).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('room_create_failed');
    console.error('Error al crear sala:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for GET /rooms/:roomId - retrieves specific room by UUID
export const getRoomController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      res.status(400).json({ error: 'roomId es requerido' });
      return;
    }

    const room = await getRoomById(roomId);

    if (!room) {
      telemetryService.incrementEvent('room_get_not_found');
      res.status(404).json({ error: 'Sala no encontrada' });
      return;
    }

    telemetryService.incrementEvent('room_get_success');
    res.status(200).json({ room });
  } catch (error: any) {
    telemetryService.incrementEvent('room_get_failed');
    console.error('Error al obtener sala:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for GET /rooms - retrieves all active rooms
export const getActiveRoomsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await getActiveRooms();
    telemetryService.incrementEvent('rooms_list_success');
    res.status(200).json({ rooms });
  } catch (error: any) {
    telemetryService.incrementEvent('rooms_list_failed');
    console.error('Error al obtener salas activas:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for GET /users/:userId/rooms - retrieves ALL rooms where user participates (creator OR opponent)
export const getUserRoomsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'userId es requerido' });
      return;
    }

    // Llamar a la función RPC de Supabase que maneja toda la lógica
    const { getUserRoomsWithSummary } = await import('../services/roomService');
    const result = await getUserRoomsWithSummary(userId);
    
    telemetryService.incrementEvent('user_rooms_get_success');
    res.status(200).json(result);
  } catch (error: any) {
    telemetryService.incrementEvent('user_rooms_get_failed');
    console.error('Error al obtener salas del usuario:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// HTTP handler for GET /rooms/code/:code - finds room by 6-character code with player names
export const getRoomByCodeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { user_id } = req.query; // Obtener user_id de query parameters

    if (!code) {
      res.status(400).json({ error: 'code es requerido' });
      return;
    }

    const room = await getRoomByCode(code);

    if (!room) {
      telemetryService.incrementEvent('room_get_not_found');
      res.status(404).json({ error: 'Sala no encontrada' });
      return;
    }

    // Verificar si el usuario ya es parte de la sala
    if (user_id) {
      const userId = String(user_id);
      const isCreator = String(room.creator_id) === userId;
      const isOpponent = room.opponent_id ? String(room.opponent_id) === userId : false;
      
      if (isCreator || isOpponent) {
        telemetryService.incrementEvent('room_user_already_in_room');
        const response: RoomSearchResponse = {
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
    let message: string | undefined;
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

    telemetryService.incrementEvent('room_get_success');
    const response: RoomSearchResponse = {
      room,
      isUserInRoom: false,
      isRoomFull: !canJoin,
      message
    };
    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('room_get_failed');
    console.error('Error al obtener sala por código:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for POST /rooms/:roomId/join - allows player to join room as opponent
export const joinRoomController = async (req: Request, res: Response): Promise<void> => {
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

    const room = await joinRoom(roomId, user_id);
    telemetryService.incrementEvent('room_join_success');
    res.status(200).json({ 
      message: 'Te has unido a la sala exitosamente',
      room 
    });
  } catch (error: any) {
    telemetryService.incrementEvent('room_join_failed');
    console.error('Error al unirse a la sala:', error);
    res.status(500).json({ error: error.message });
  }
};

// Manejador HTTP para GET /rooms/:code/game-details - obtiene detalles completos para el juego
export const getGameDetailsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ 
        success: false,
        message: 'Código de sala es requerido' 
      });
      return;
    }

    const gameDetails = await getGameDetailsByCode(code);

    if (!gameDetails) {
      telemetryService.incrementEvent('room_get_not_found');
      res.status(404).json({ 
        success: false,
        message: 'Sala no encontrada' 
      });
      return;
    }

    telemetryService.incrementEvent('room_get_success');
    
    const response: GameDetailsResponse = {
      success: true,
      room: gameDetails
    };

    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('room_get_failed');
    console.error('Error al obtener detalles del juego:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// HTTP handler for GET /rooms/:code/load-state - carga el estado guardado del juego
export const loadGameStateController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ error: 'Código de sala es requerido' });
      return;
    }

    const room = await getRoomByCode(code);
    
    if (!room) {
      res.status(404).json({ error: 'Sala no encontrada' });
      return;
    }

    const { getGameState } = await import('../services/gameService');
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

    telemetryService.incrementEvent('game_action');
    res.status(200).json(response);
  } catch (error: any) {
    telemetryService.incrementEvent('server_error');
    console.error('❌ [Load State] Error al cargar estado:', error);
    res.status(500).json({ 
      error: 'Error al cargar estado del juego',
      message: error.message 
    });
  }
};