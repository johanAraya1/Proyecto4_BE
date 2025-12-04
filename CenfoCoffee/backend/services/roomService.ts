import { supabase } from '../utils/supabaseClient';
import { Room, CreateRoomRequest } from '../models/Room';

// Creates a new game room with unique code generation
export const createRoom = async (createRoomData: CreateRoomRequest): Promise<Room> => {
  const { user_id } = createRoomData;
  const creatorId = String(user_id);

  const roomData = {
    creator_id: creatorId,
    status: 'waiting' as const
  };

  const { data, error } = await supabase
    .from('game_rooms')
    .insert([roomData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear la sala: ${error.message}`);
  }

  return data as Room;
};

// Retrieves a room by its UUID
export const getRoomById = async (roomId: string): Promise<Room | null> => {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al obtener la sala: ${error.message}`);
  }

  return data as Room;
};

// Gets all active rooms (waiting or playing status)
export const getActiveRooms = async (): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .in('status', ['waiting', 'playing'])
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener las salas: ${error.message}`);
  }

  return data as Room[];
};

// Gets all rooms created by a specific user
export const getRoomsByCreator = async (userId: string | number): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('creator_id', String(userId))
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener las salas del usuario: ${error.message}`);
  }

  return data as Room[];
};

// Finds a room by its unique 6-character code and includes player names
export const getRoomByCode = async (code: string): Promise<Room | null> => {
  const { data: roomData, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (roomError) {
    if (roomError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al obtener la sala: ${roomError.message}`);
  }

  // Fetch player names from users table
  const userIds = [roomData.creator_id, roomData.opponent_id].filter(id => id !== null);

  let users: any[] = [];
  if (userIds.length > 0) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    if (userError) {
      throw new Error(`Error al obtener usuarios: ${userError.message}`);
    }
    users = userData || [];
  }

  const creatorUser = users.find(user => String(user.id) === String(roomData.creator_id));
  const opponentUser = users.find(user => String(user.id) === String(roomData.opponent_id));

  const room = {
    ...roomData,
    creator_name: creatorUser?.name || null,
    opponent_name: opponentUser?.name || null
  };

  return room as Room;
};

// Allows a player to join an existing room as opponent
export const joinRoom = async (roomId: string, opponentId: string | number): Promise<Room> => {
  // Validate room exists and is available
  const existingRoom = await getRoomById(roomId);
  
  if (!existingRoom) {
    throw new Error('La sala no existe o no está disponible');
  }

  if (existingRoom.opponent_id) {
    throw new Error('Esta sala ya tiene un oponente. ¡Busca otra sala para jugar!');
  }

  if (existingRoom.status !== 'waiting') {
    if (existingRoom.status === 'playing') {
      throw new Error('Esta sala ya está en progreso y no se puede unir');
    } else if (existingRoom.status === 'finished') {
      throw new Error('Esta sala ya ha terminado y no se puede unir');
    } else {
      throw new Error('Esta sala no está disponible para unirse');
    }
  }

  // Atomically update room with opponent and start game
  const { data, error } = await supabase
    .from('game_rooms')
    .update({ 
      opponent_id: String(opponentId),
      status: 'playing',
      started_at: new Date().toISOString()
    })
    .eq('id', roomId)
    .eq('status', 'waiting')
    .is('opponent_id', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al unirse a la sala: ${error.message}`);
  }

  if (!data) {
    throw new Error('No se pudo unir a la sala. Es posible que otro jugador se haya unido al mismo tiempo');
  }

  return data as Room;
};

// Obtiene detalles completos de una sala para el juego incluyendo información de jugadores
export const getGameDetailsByCode = async (code: string): Promise<any> => {
  const { data: roomData, error: roomError } = await supabase
    .from('game_rooms')
    .select(`
      id,
      code,
      status,
      creator_id,
      opponent_id,
      creator:users!creator_id(id, name, elo),
      opponent:users!opponent_id(id, name, elo)
    `)
    .eq('code', code.toUpperCase())
    .single();

  if (roomError) {
    if (roomError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al obtener detalles del juego: ${roomError.message}`);
  }

  const creator = Array.isArray(roomData.creator) ? roomData.creator[0] : roomData.creator;
  const opponent = Array.isArray(roomData.opponent) ? roomData.opponent[0] : roomData.opponent;

  return {
    id: roomData.id,
    code: roomData.code,
    status: roomData.status,
    creator: {
      id: roomData.creator_id,
      name: creator?.name || null,
      elo: creator?.elo || null
    },
    opponent: {
      id: roomData.opponent_id,
      name: opponent?.name || null,
      elo: opponent?.elo || null
    }
  };
};

// Obtiene TODAS las salas donde el usuario participa (creador u oponente) con resumen
// Usa función RPC de PostgreSQL para mejor performance
export const getUserRoomsWithSummary = async (userId: string | number): Promise<any> => {
  const { data, error } = await supabase
    .rpc('get_user_rooms_with_summary', { 
      user_id_param: parseInt(String(userId)) 
    });

  if (error) {
    throw new Error(`Error al obtener salas del usuario: ${error.message}`);
  }

  return data;
};