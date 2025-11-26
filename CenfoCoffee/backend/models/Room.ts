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
  user_id: string;
}

// Respuesta de API para creación de sala
export interface CreateRoomResponse {
  message: string;
  room: Room;
}

// Respuesta de búsqueda de sala con información de membresía del usuario
export interface RoomSearchResponse {
  room: Room;
  isUserInRoom: boolean;
  userRole?: 'creator' | 'opponent';
  isRoomFull?: boolean;
  message?: string;
}

// Respuesta detallada de sala para el juego con información de jugadores
export interface GameDetailsResponse {
  success: boolean;
  message?: string;
  room: {
    id: string;
    code: string;
    status: RoomStatus;
    creator: {
      id: string;
      name: string | null;
      elo: number | null;
    };
    opponent: {
      id: string | null;
      name: string | null;
      elo: number | null;
    };
  };
}