// Modelo para la tabla friends
export interface Friend {
  id: number;
  user_a: number;  // ID del primer usuario
  user_b: number;  // ID del segundo usuario
  created_at: string;
}

// Modelo para la tabla friend_request
export interface FriendRequest {
  id: number;
  from_user: number;  // ID del usuario que envía la solicitud
  to_user: number;    // ID del usuario que recibe la solicitud
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
}

// DTO para respuesta de búsqueda de usuarios
export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  elo?: number;
}

// DTO para respuesta de amigos
export interface FriendWithDetails {
  id: number;
  friend_id: number;
  friend_name: string;
  friend_email: string;
  friend_elo?: number;
  created_at: string;
}

// DTO para respuesta de solicitudes de amistad
export interface FriendRequestWithDetails {
  id: number;
  from_user: number;
  from_user_name: string;
  from_user_email: string;
  from_user_elo?: number;
  status: string;
  created_at?: string;
}