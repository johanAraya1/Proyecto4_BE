import { Request, Response } from 'express';
import { 
  createRoom, 
  getRoomById, 
  getActiveRooms, 
  getRoomsByCreator,
  getRoomByCode,
  joinRoom
} from '../services/roomService';
import { telemetryService } from '../services/telemetryService';
import { CreateRoomRequest, CreateRoomResponse } from '../models/Room';

// HTTP handler for POST /api/rooms - creates a new game room
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

// HTTP handler for GET /api/rooms/:roomId - retrieves specific room by UUID
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

// HTTP handler for GET /api/rooms - retrieves all active rooms
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

// HTTP handler for GET /api/users/:userId/rooms - retrieves rooms created by user
export const getUserRoomsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'userId es requerido' });
      return;
    }

    const rooms = await getRoomsByCreator(userId);
    telemetryService.incrementEvent('user_rooms_get_success');
    res.status(200).json({ rooms });
  } catch (error: any) {
    telemetryService.incrementEvent('user_rooms_get_failed');
    console.error('Error al obtener salas del usuario:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for GET /api/rooms/code/:code - finds room by 6-character code with player names
export const getRoomByCodeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

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

    telemetryService.incrementEvent('room_get_success');
    res.status(200).json({ room });
  } catch (error: any) {
    telemetryService.incrementEvent('room_get_failed');
    console.error('Error al obtener sala por código:', error);
    res.status(500).json({ error: error.message });
  }
};

// HTTP handler for POST /api/rooms/:roomId/join - allows player to join room as opponent
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

// HTTP handler for POST /api/rooms/join-by-code - allows player to join room using code
export const joinRoomByCodeController = async (req: Request, res: Response): Promise<void> => {
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
    const existingRoom = await getRoomByCode(code);

    if (!existingRoom) {
      telemetryService.incrementEvent('room_join_not_found');
      res.status(404).json({ error: 'Sala no encontrada con ese código' });
      return;
    }

    // Unirse a la sala usando el roomId
    const room = await joinRoom(existingRoom.id, userId);
    telemetryService.incrementEvent('room_join_by_code_success');
    res.status(200).json({ 
      message: 'Te has unido a la sala exitosamente',
      room 
    });
  } catch (error: any) {
    telemetryService.incrementEvent('room_join_by_code_failed');
    console.error('Error al unirse a la sala por código:', error);
    res.status(500).json({ error: error.message });
  }
};