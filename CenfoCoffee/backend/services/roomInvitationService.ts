import { supabase } from '../utils/supabaseClient';
import { 
  RoomInvitation, 
  SendRoomInvitationRequest, 
  RoomInvitationWithDetails,
  SentRoomInvitationWithDetails 
} from '../models/RoomInvitation';

export class RoomInvitationService {

  // Enviar invitación a una sala
  async sendRoomInvitation(fromUserId: number, toUserId: number, roomId: string): Promise<RoomInvitation> {
    try {
      // Verificar que no sean el mismo usuario
      if (fromUserId === toUserId) {
        throw new Error('No puedes enviarte una invitación a ti mismo');
      }

      // Verificar que el usuario destinatario existe
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', toUserId)
        .single();

      if (userError || !targetUser) {
        throw new Error('Usuario destinatario no encontrado');
      }

      // Verificar que la sala existe y obtener su código
      console.log('🔍 Buscando sala con ID:', roomId);
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('id, code, creator_id, status')
        .eq('id', roomId)
        .single();

      console.log('📊 Resultado búsqueda sala:', { room, roomError });

      if (roomError) {
        console.error('❌ Error de Supabase al buscar sala:', roomError);
        throw new Error(`Sala no encontrada: ${roomError.message}`);
      }

      if (!room) {
        console.error('❌ Sala no existe en la base de datos');
        throw new Error('Sala no encontrada');
      }

      console.log('✅ Sala encontrada:', room);

      // Verificar que quien envía la invitación es el creador de la sala
      if (String(room.creator_id) !== String(fromUserId)) {
        throw new Error('Solo el creador de la sala puede enviar invitaciones');
      }

      // Verificar que la sala está en estado 'waiting'
      if (room.status !== 'waiting') {
        throw new Error('Solo se pueden enviar invitaciones a salas en espera');
      }

      // Verificar que ya son amigos
      const { data: friendship, error: friendError } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_a.eq.${fromUserId},user_b.eq.${toUserId}),and(user_a.eq.${toUserId},user_b.eq.${fromUserId})`)
        .single();

      if (friendError && friendError.code !== 'PGRST116') {
        throw new Error('Error verificando amistad');
      }

      if (!friendship) {
        throw new Error('Solo puedes enviar invitaciones a tus amigos');
      }

      // Verificar que no existe una invitación pendiente para esta sala
      const { data: existingInvitation, error: invitationError } = await supabase
        .from('room_invitation')
        .select('id, status')
        .eq('room_id', roomId)
        .eq('to_user', toUserId)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        throw new Error('Ya existe una invitación pendiente para esta sala a este usuario');
      }

      // Crear la invitación
      const { data, error } = await supabase
        .from('room_invitation')
        .insert({
          from_user: fromUserId,
          to_user: toUserId,
          room_id: roomId,
          room_code: room.code,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error enviando invitación: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Error en invitación a sala: ${error.message}`);
    }
  }

  // Obtener invitaciones recibidas
  async getReceivedInvitations(userId: number): Promise<RoomInvitationWithDetails[]> {
    try {
      console.log('🔍 getReceivedInvitations - Buscando invitaciones para userId:', userId);
      
      // Obtener las invitaciones
      const { data: invitations, error } = await supabase
        .from('room_invitation')
        .select('*')
        .eq('to_user', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📊 Resultado query invitaciones:', { 
        invitationsCount: invitations?.length || 0, 
        invitations,
        error 
      });

      if (error) {
        console.error('❌ Error obteniendo invitaciones:', error);
        throw new Error(`Error obteniendo invitaciones: ${error.message}`);
      }

      if (!invitations || invitations.length === 0) {
        console.log('⚠️ No se encontraron invitaciones pendientes para userId:', userId);
        return [];
      }

      // Obtener detalles de usuarios y salas
      const fromUserIds = [...new Set(invitations.map((inv: any) => inv.from_user))];
      const roomIds = [...new Set(invitations.map((inv: any) => inv.room_id))];

      console.log('🔍 Buscando detalles - fromUserIds:', fromUserIds, 'roomIds:', roomIds);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', fromUserIds);

      console.log('👥 Usuarios encontrados:', { users, usersError });

      const { data: rooms, error: roomsError } = await supabase
        .from('game_rooms')
        .select('id, status')
        .in('id', roomIds);

      console.log('🏠 Salas encontradas:', { rooms, roomsError });

      // Transformar los datos al formato esperado
      const result: RoomInvitationWithDetails[] = invitations.map((invitation: any) => {
        const fromUser = users?.find((u: any) => u.id === invitation.from_user);
        const room = rooms?.find((r: any) => r.id === invitation.room_id);

        return {
          id: invitation.id,
          from_user: invitation.from_user,
          from_user_name: fromUser?.name || 'Usuario desconocido',
          from_user_email: fromUser?.email || '',
          to_user: invitation.to_user,
          room_id: invitation.room_id,
          room_code: invitation.room_code,
          room_status: room?.status || 'unknown',
          status: invitation.status,
          created_at: invitation.created_at
        };
      });

      console.log('✅ Resultado final getReceivedInvitations:', JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.error('❌ Error en getReceivedInvitations:', error);
      throw new Error(`Error obteniendo invitaciones recibidas: ${error.message}`);
    }
  }

  // Obtener invitaciones enviadas
  async getSentInvitations(userId: number): Promise<SentRoomInvitationWithDetails[]> {
    try {
      // Obtener las invitaciones
      const { data: invitations, error } = await supabase
        .from('room_invitation')
        .select('*')
        .eq('from_user', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo invitaciones enviadas:', error);
        throw new Error(`Error obteniendo invitaciones enviadas: ${error.message}`);
      }

      if (!invitations || invitations.length === 0) {
        return [];
      }

      // Obtener detalles de usuarios y salas
      const toUserIds = [...new Set(invitations.map((inv: any) => inv.to_user))];
      const roomIds = [...new Set(invitations.map((inv: any) => inv.room_id))];

      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', toUserIds);

      const { data: rooms } = await supabase
        .from('game_rooms')
        .select('id, status')
        .in('id', roomIds);

      // Transformar los datos al formato esperado
      const result: SentRoomInvitationWithDetails[] = invitations.map((invitation: any) => {
        const toUser = users?.find((u: any) => u.id === invitation.to_user);
        const room = rooms?.find((r: any) => r.id === invitation.room_id);

        return {
          id: invitation.id,
          to_user: invitation.to_user,
          to_user_name: toUser?.name || 'Usuario desconocido',
          to_user_email: toUser?.email || '',
          room_id: invitation.room_id,
          room_code: invitation.room_code,
          room_status: room?.status || 'unknown',
          status: invitation.status,
          created_at: invitation.created_at
        };
      });

      return result;
    } catch (error: any) {
      console.error('❌ Error en getSentInvitations:', error);
      throw new Error(`Error obteniendo invitaciones enviadas: ${error.message}`);
    }
  }

  // Aceptar invitación a sala
  async acceptInvitation(invitationId: number, userId: number): Promise<{ invitation: RoomInvitation; roomCode: string }> {
    try {
      console.log('✅ acceptInvitation - Parámetros:', { 
        invitationId, 
        invitationIdType: typeof invitationId,
        userId, 
        userIdType: typeof userId 
      });

      // Obtener la invitación
      const { data: invitation, error: invitationError } = await supabase
        .from('room_invitation')
        .select('*')
        .eq('id', invitationId)
        .eq('to_user', userId)
        .eq('status', 'pending')
        .single();

      console.log('📋 Query invitación - Resultado:', { 
        invitation, 
        error: invitationError,
        errorCode: invitationError?.code,
        errorDetails: invitationError?.details
      });

      if (invitationError || !invitation) {
        console.error('❌ Invitación no encontrada o no válida');
        throw new Error('Invitación no encontrada o no válida');
      }

      // Verificar que la sala aún existe y está disponible
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('status, opponent_id')
        .eq('id', invitation.room_id)
        .single();

      console.log('🏠 Estado de la sala:', { room, error: roomError });

      if (roomError || !room) {
        // Marcar la invitación como expirada
        await supabase
          .from('room_invitation')
          .update({ status: 'expired' })
          .eq('id', invitationId);
        
        throw new Error('La sala ya no está disponible');
      }

      if (room.status !== 'waiting') {
        // Marcar la invitación como expirada
        await supabase
          .from('room_invitation')
          .update({ status: 'expired' })
          .eq('id', invitationId);
        
        throw new Error('La sala ya no está en espera');
      }

      if (room.opponent_id) {
        // Marcar la invitación como expirada
        await supabase
          .from('room_invitation')
          .update({ status: 'expired' })
          .eq('id', invitationId);
        
        throw new Error('La sala ya tiene un oponente');
      }

      // Actualizar el estado de la invitación
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('room_invitation')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error actualizando invitación:', updateError);
        throw new Error(`Error actualizando invitación: ${updateError.message}`);
      }

      console.log('✅ Invitación aceptada exitosamente');

      // Retornar la invitación aceptada y el código de la sala
      return {
        invitation: updatedInvitation,
        roomCode: invitation.room_code
      };
    } catch (error: any) {
      console.error('❌ Error en acceptInvitation:', error);
      throw new Error(`Error aceptando invitación: ${error.message}`);
    }
  }

  // Rechazar invitación a sala
  async rejectInvitation(invitationId: number, userId: number): Promise<void> {
    try {
      console.log('❌ rejectInvitation - Parámetros:', { 
        invitationId, 
        invitationIdType: typeof invitationId,
        userId, 
        userIdType: typeof userId 
      });

      const { data, error } = await supabase
        .from('room_invitation')
        .update({ status: 'rejected' })
        .eq('id', invitationId)
        .eq('to_user', userId)
        .eq('status', 'pending')
        .select();

      console.log('📋 Query rechazo - Resultado:', { 
        data,
        dataLength: data?.length || 0,
        error,
        errorCode: error?.code,
        errorDetails: error?.details
      });

      if (error) {
        console.error('❌ Error rechazando invitación:', error);
        throw new Error(`Error rechazando invitación: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Invitación no encontrada o ya fue procesada');
      }

      console.log('✅ Invitación rechazada exitosamente');
    } catch (error: any) {
      console.error('❌ Error en rejectInvitation:', error);
      throw new Error(`Error rechazando invitación: ${error.message}`);
    }
  }

  // Cancelar una invitación enviada (solo el creador)
  async cancelInvitation(invitationId: number, userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('room_invitation')
        .delete()
        .eq('id', invitationId)
        .eq('from_user', userId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Error cancelando invitación: ${error.message}`);
      }
    } catch (error: any) {
      throw new Error(`Error cancelando invitación: ${error.message}`);
    }
  }
}

export const roomInvitationService = new RoomInvitationService();
