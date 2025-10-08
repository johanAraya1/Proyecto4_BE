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

  console.log('Room data:', roomData);

  // Fetch player names from users table
  const userIds = [roomData.creator_id, roomData.opponent_id].filter(id => id !== null);
  
  console.log('User IDs to search:', userIds);

  let users: any[] = [];
  if (userIds.length > 0) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    console.log('User data response:', userData);
    console.log('User error:', userError);

    if (userError) {
      throw new Error(`Error al obtener usuarios: ${userError.message}`);
    }
    users = userData || [];
  }

  const creatorUser = users.find(user => String(user.id) === String(roomData.creator_id));
  const opponentUser = users.find(user => String(user.id) === String(roomData.opponent_id));

  console.log('Creator user found:', creatorUser);
  console.log('Opponent user found:', opponentUser);

  const room = {
    ...roomData,
    creator_name: creatorUser?.name || null,
    opponent_name: opponentUser?.name || null
  };

  console.log('Final room object:', room);

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

  // Prevent self-join
  if (existingRoom.creator_id === String(opponentId)) {
    throw new Error('No puedes unirte a tu propia sala');
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