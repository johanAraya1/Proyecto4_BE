import { supabase } from '../utils/supabaseClient';
import { User } from '../models/User';
import { Friend, FriendRequest, UserSearchResult, FriendWithDetails, FriendRequestWithDetails } from '../models/Friend';

export class FriendService {
  
  // Buscar usuarios por nombre o email (excluyendo el usuario actual)
  async searchUsers(query: string, currentUserId: number): Promise<UserSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, elo')
        .neq('id', currentUserId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) {
        throw new Error(`Error buscando usuarios: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      throw new Error(`Error en búsqueda de usuarios: ${error.message}`);
    }
  }

  // Enviar solicitud de amistad
  async sendFriendRequest(fromUserId: number, toUserId: number): Promise<FriendRequest> {
    try {
      // Verificar que no sean el mismo usuario
      if (fromUserId === toUserId) {
        throw new Error('No puedes enviarte una solicitud de amistad a ti mismo');
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

      // Verificar que no ya son amigos
      const { data: existingFriendship, error: friendError } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_a.eq.${fromUserId},user_b.eq.${toUserId}),and(user_a.eq.${toUserId},user_b.eq.${fromUserId})`)
        .single();

      if (existingFriendship) {
        throw new Error('Ya son amigos');
      }

      // Verificar que no existe una solicitud pendiente
      const { data: existingRequest, error: requestError } = await supabase
        .from('friend_request')
        .select('id, status')
        .or(`and(from_user.eq.${fromUserId},to_user.eq.${toUserId}),and(from_user.eq.${toUserId},to_user.eq.${fromUserId})`)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        throw new Error('Ya existe una solicitud de amistad pendiente');
      }

      // Crear la solicitud de amistad
      const { data, error } = await supabase
        .from('friend_request')
        .insert({
          from_user: fromUserId,
          to_user: toUserId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error enviando solicitud: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Error en solicitud de amistad: ${error.message}`);
    }
  }

  // Obtener solicitudes de amistad recibidas
  async getReceivedFriendRequests(userId: number): Promise<FriendRequestWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('friend_request')
        .select(`
          id,
          from_user,
          status,
          created_at,
          users:from_user (
            name,
            email,
            elo
          )
        `)
        .eq('to_user', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo solicitudes: ${error.message}`);
      }

      // Transformar los datos al formato esperado
      const requests: FriendRequestWithDetails[] = (data || []).map((request: any) => ({
        id: request.id,
        from_user: request.from_user,
        from_user_name: request.users.name,
        from_user_email: request.users.email,
        from_user_elo: request.users.elo,
        status: request.status,
        created_at: request.created_at
      }));

      return requests;
    } catch (error: any) {
      throw new Error(`Error obteniendo solicitudes recibidas: ${error.message}`);
    }
  }

  // Obtener solicitudes de amistad enviadas
  async getSentFriendRequests(userId: number): Promise<FriendRequestWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('friend_request')
        .select(`
          id,
          to_user,
          status,
          created_at,
          users:to_user (
            name,
            email,
            elo
          )
        `)
        .eq('from_user', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo solicitudes enviadas: ${error.message}`);
      }

      // Transformar los datos al formato esperado
      const requests: FriendRequestWithDetails[] = (data || []).map((request: any) => ({
        id: request.id,
        from_user: userId, // El usuario actual es quien envió
        from_user_name: '', // No necesario para solicitudes enviadas
        from_user_email: '', // No necesario para solicitudes enviadas
        from_user_elo: 0, // No necesario para solicitudes enviadas
        to_user: request.to_user,
        to_user_name: request.users.name,
        to_user_email: request.users.email,
        to_user_elo: request.users.elo,
        status: request.status,
        created_at: request.created_at
      }));

      return requests;
    } catch (error: any) {
      throw new Error(`Error obteniendo solicitudes enviadas: ${error.message}`);
    }
  }

  // Aceptar solicitud de amistad
  async acceptFriendRequest(requestId: number, userId: number): Promise<Friend> {
    try {
      // Obtener la solicitud de amistad
      const { data: request, error: requestError } = await supabase
        .from('friend_request')
        .select('*')
        .eq('id', requestId)
        .eq('to_user', userId)
        .eq('status', 'pending')
        .single();

      if (requestError || !request) {
        throw new Error('Solicitud de amistad no encontrada o no válida');
      }

      // Crear la amistad
      const { data: friendship, error: friendshipError } = await supabase
        .from('friends')
        .insert({
          user_a: request.from_user,
          user_b: request.to_user
        })
        .select()
        .single();

      if (friendshipError) {
        throw new Error(`Error creando amistad: ${friendshipError.message}`);
      }

      // Actualizar el estado de la solicitud
      const { error: updateError } = await supabase
        .from('friend_request')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        throw new Error(`Error actualizando solicitud: ${updateError.message}`);
      }

      return friendship;
    } catch (error: any) {
      throw new Error(`Error aceptando solicitud: ${error.message}`);
    }
  }

  // Rechazar solicitud de amistad
  async rejectFriendRequest(requestId: number, userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('friend_request')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('to_user', userId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Error rechazando solicitud: ${error.message}`);
      }
    } catch (error: any) {
      throw new Error(`Error rechazando solicitud: ${error.message}`);
    }
  }

  // Listar amigos del usuario
  async getFriends(userId: number): Promise<FriendWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          created_at,
          user_a,
          user_b,
          user_a_details:users!friends_user_a_fkey (
            id,
            name,
            email,
            elo
          ),
          user_b_details:users!friends_user_b_fkey (
            id,
            name,
            email,
            elo
          )
        `)
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo amigos: ${error.message}`);
      }

      // Transformar los datos para devolver la información del amigo
      const friends: FriendWithDetails[] = (data || []).map((friendship: any) => {
        const isUserA = friendship.user_a === userId;
        const friendData = isUserA ? friendship.user_b_details : friendship.user_a_details;
        
        return {
          id: friendship.id,
          friend_id: friendData.id,
          friend_name: friendData.name,
          friend_email: friendData.email,
          friend_elo: friendData.elo,
          created_at: friendship.created_at
        };
      });

      return friends;
    } catch (error: any) {
      throw new Error(`Error obteniendo lista de amigos: ${error.message}`);
    }
  }

  // Eliminar amistad
  async removeFriend(userId: number, friendId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_a.eq.${userId},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${userId})`);

      if (error) {
        throw new Error(`Error eliminando amistad: ${error.message}`);
      }
    } catch (error: any) {
      throw new Error(`Error eliminando amistad: ${error.message}`);
    }
  }
}

export const friendService = new FriendService();