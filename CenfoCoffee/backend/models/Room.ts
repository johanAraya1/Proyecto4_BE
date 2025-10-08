// Estados de estado de sala de juego
export type RoomStatus = 'waiting' | 'playing' | 'finished';

// Modelo de entidad de sala de juego
export interface Room {
  id: string;
  code: string; // Código único de sala de 6 caracteres
  creator_id: string;
  opponent_id?: string; // Nulo hasta que alguien se una
  status: RoomStatus;
  created_at: string;
  started_at?: string; // Cuando comienza el juego
  finished_at?: string; // Cuando termina el juego
  creator_name?: string; // Poblado desde unión de usuario
  opponent_name?: string; // Poblado desde unión de usuario
}

// Cuerpo de solicitud para crear nuevas salas
export interface CreateRoomRequest {
  user_id: string | number;
}

// Respuesta de API para creación de sala
export interface CreateRoomResponse {
  message: string;
  room: Room;
}