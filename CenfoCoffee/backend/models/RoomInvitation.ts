// Modelo para la tabla room_invitation
export interface RoomInvitation {
  id: number;
  from_user: number;  // ID del usuario que envía la invitación
  to_user: number;    // ID del usuario que recibe la invitación
  room_id: string;    // UUID de la sala
  room_code: string;  // Código de 6 caracteres de la sala
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at?: string;
  updated_at?: string;
}

// DTO para enviar invitación
export interface SendRoomInvitationRequest {
  toUserId: number;
  roomId: string;
}

// DTO para respuesta de invitación con detalles del usuario y sala
export interface RoomInvitationWithDetails {
  id: number;
  from_user: number;
  from_user_name: string;
  from_user_email: string;
  to_user: number;
  room_id: string;
  room_code: string;
  room_status: string;
  status: string;
  created_at?: string;
}

// DTO para respuesta de invitaciones enviadas
export interface SentRoomInvitationWithDetails {
  id: number;
  to_user: number;
  to_user_name: string;
  to_user_email: string;
  room_id: string;
  room_code: string;
  room_status: string;
  status: string;
  created_at?: string;
}
