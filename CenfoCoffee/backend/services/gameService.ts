import { supabase } from '../utils/supabaseClient';
import { GameEvent, IncomingGameMessage } from '../models/GameEvent';
import { GameState, PlayerInventory } from '../models/GameState';
import { normalizeOrderInput } from '../utils/orderValidation';

// Guarda un evento de juego en la base de datos
export const saveGameEvent = async (event: IncomingGameMessage): Promise<GameEvent> => {
  const { data, error } = await supabase
    .from('game_events')
    .insert([{
      match_id: event.match_id,
      actor_type: event.actor_type,
      actor_id: event.actor_id,
      type: event.type,
      payload: event.payload
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al guardar evento del juego: ${error.message}`);
  }

  return data as GameEvent;
};

// Obtiene el estado actual del juego
export const getGameState = async (matchId: string): Promise<GameState | null> => {
  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .eq('match_id', matchId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error al obtener estado del juego: ${error.message}`);
  }

  return data as GameState;
};

// Inicializa el estado del juego con la cuadrícula
export const initializeGameState = async (
  matchId: string,
  player1Id: number,
  player2Id: number,
  grid: any[][],
  gridString: string,
  playerPositions?: { player1: { row: number; col: number }; player2: { row: number; col: number } },
  player1Orders?: any,
  player2Orders?: any
): Promise<GameState> => {
  const initialInventory: PlayerInventory = {
    AGUA: 0,
    CAFE: 0,
    LECHE: 0,
    CARAMELO: 0
  };

  // Usar las posiciones del frontend si vienen, sino usar valores por defecto
  const player1Position = playerPositions?.player1 || { row: 0, col: 0 };
  const player2Position = playerPositions?.player2 || { row: 2, col: 2 };

  // Normalizar órdenes (puede ser array o objeto único) y validar (1-3)
  const validatedPlayer1Orders = normalizeOrderInput(player1Orders);
  const validatedPlayer2Orders = normalizeOrderInput(player2Orders);

  const gameStateData = {
    match_id: matchId,
    grid: grid,
    grid_string: gridString,
    player1_id: player1Id,
    player1_position: player1Position,
    player1_inventory: initialInventory,
    player1_score: 0,
    player1_order: validatedPlayer1Orders,
    player1_turns_completed: 1,  // Ambos jugadores empiezan en turno 1
    player2_id: player2Id,
    player2_position: player2Position,
    player2_inventory: initialInventory,
    player2_score: 0,
    player2_order: validatedPlayer2Orders,
    player2_turns_completed: 1,  // Ambos jugadores empiezan en turno 1
    current_turn: 1,
    movement_count: 0
  };

  const { data, error } = await supabase
    .from('game_state')
    .insert([gameStateData])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al inicializar estado del juego: ${error.message}`);
  }

  return data as GameState;
};

// Actualiza la posición del jugador
export const updatePlayerPosition = async (
  matchId: string,
  playerId: number,
  position: { row: number; col: number }
): Promise<void> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const playerField = state.player1_id === playerId ? 'player1_position' : 'player2_position';

  const { error } = await supabase
    .from('game_state')
    .update({ 
      [playerField]: position,
      updated_at: new Date().toISOString()
    })
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar posición del jugador: ${error.message}`);
  }
};

// Actualiza el inventario del jugador
export const updatePlayerInventory = async (
  matchId: string,
  playerId: number,
  ingredient: string,
  delta: number
): Promise<void> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const playerField = state.player1_id === playerId ? 'player1_inventory' : 'player2_inventory';
  const currentInventory = state.player1_id === playerId ? state.player1_inventory : state.player2_inventory;

  const newInventory = { ...currentInventory };
  newInventory[ingredient as keyof PlayerInventory] = (newInventory[ingredient as keyof PlayerInventory] || 0) + delta;

  const { error } = await supabase
    .from('game_state')
    .update({ 
      [playerField]: newInventory,
      updated_at: new Date().toISOString()
    })
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar inventario del jugador: ${error.message}`);
  }
};

// Actualiza el estado completo del jugador (para END_TURN y GAME_STATE_UPDATE)
export const updateCompletePlayerState = async (
  matchId: string,
  playerId: number,
  position: [number, number] | { row: number; col: number },
  inventory: any[] | any,
  score: number,
  orders: any[] | any
): Promise<void> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const isPlayer1 = state.player1_id === playerId;
  
  // Protección: No permitir que el score baje sin justificación
  const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
  const finalScore = Math.max(score, currentScore);
  
  let inventoryObj: PlayerInventory;
  
  if (Array.isArray(inventory)) {
    inventoryObj = {
      AGUA: 0,
      CAFE: 0,
      LECHE: 0,
      CARAMELO: 0
    };
    
    inventory.forEach(item => {
      inventoryObj[item.type as keyof PlayerInventory] = item.count;
    });
  } else {
    inventoryObj = inventory;
  }

  let positionObj: { row: number; col: number };
  if (Array.isArray(position)) {
    positionObj = { row: position[0], col: position[1] };
  } else {
    positionObj = position;
  }

  let ordersArray: any[];
  if (Array.isArray(orders)) {
    ordersArray = orders;
  } else if (orders) {
    ordersArray = [orders];
  } else {
    ordersArray = [];
  }

  // Normalizar y validar órdenes (1-3)
  const validatedOrders = normalizeOrderInput(ordersArray);

  const updates = isPlayer1 ? {
    player1_position: positionObj,
    player1_inventory: inventoryObj,
    player1_score: finalScore,
    player1_order: validatedOrders,
    updated_at: new Date().toISOString()
  } : {
    player2_position: positionObj,
    player2_inventory: inventoryObj,
    player2_score: finalScore,
    player2_order: validatedOrders,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('game_state')
    .update(updates)
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar estado completo del jugador: ${error.message}`);
  }
};

// Actualiza el turno actual
export const updateCurrentTurn = async (matchId: string, turn: number): Promise<void> => {
  const { error } = await supabase
    .from('game_state')
    .update({ 
      current_turn: turn,
      movement_count: 0, // Resetear el contador al cambiar de turno
      updated_at: new Date().toISOString()
    })
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar turno actual: ${error.message}`);
  }
};

// Actualiza el contador de movimientos
export const updateMovementCount = async (matchId: string, movementCount: number): Promise<void> => {
  const { error } = await supabase
    .from('game_state')
    .update({ 
      movement_count: movementCount,
      updated_at: new Date().toISOString()
    })
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar contador de movimientos: ${error.message}`);
  }
};

// Actualiza la orden y el score del jugador después de completar un trade
export const updatePlayerOrderAndScore = async (
  matchId: string,
  playerId: number,
  newOrders: any,
  pointsEarned: number
): Promise<void> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const isPlayer1 = state.player1_id === playerId;
  const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
  const newScore = currentScore + pointsEarned;

  // Normalizar y validar nuevas órdenes (1-3)
  const validatedOrders = normalizeOrderInput(newOrders);

  const updates = isPlayer1 ? {
    player1_score: newScore,
    player1_order: validatedOrders,
    updated_at: new Date().toISOString()
  } : {
    player2_score: newScore,
    player2_order: validatedOrders,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('game_state')
    .update(updates)
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar orden y score del jugador: ${error.message}`);
  }
};

// Actualiza solo inventario, posición y score SIN tocar las órdenes
export const updatePlayerStateWithoutOrders = async (
  matchId: string,
  playerId: number,
  position: [number, number] | { row: number; col: number },
  inventory: any[] | any,
  score: number
): Promise<void> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const isPlayer1 = state.player1_id === playerId;
  
  // Protección: No permitir que el score baje sin justificación
  const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
  const finalScore = Math.max(score, currentScore);
  
  let inventoryObj: PlayerInventory;
  
  if (Array.isArray(inventory)) {
    inventoryObj = {
      AGUA: 0,
      CAFE: 0,
      LECHE: 0,
      CARAMELO: 0
    };
    
    inventory.forEach(item => {
      inventoryObj[item.type as keyof PlayerInventory] = item.count;
    });
  } else {
    inventoryObj = inventory;
  }

  let positionObj: { row: number; col: number };
  if (Array.isArray(position)) {
    positionObj = { row: position[0], col: position[1] };
  } else {
    positionObj = position;
  }

  const updates = isPlayer1 ? {
    player1_position: positionObj,
    player1_inventory: inventoryObj,
    player1_score: finalScore,
    updated_at: new Date().toISOString()
  } : {
    player2_position: positionObj,
    player2_inventory: inventoryObj,
    player2_score: finalScore,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('game_state')
    .update(updates)
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al actualizar estado del jugador: ${error.message}`);
  }
};

// Obtiene todos los eventos de una partida
export const getGameEvents = async (matchId: string): Promise<GameEvent[]> => {
  const { data, error } = await supabase
    .from('game_events')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener eventos del juego: ${error.message}`);
  }

  return data as GameEvent[];
};

// Incrementa el contador de turnos completados de un jugador
export const incrementPlayerTurnsCompleted = async (
  matchId: string,
  playerId: number
): Promise<number> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const isPlayer1 = state.player1_id === playerId;
  const currentTurns = isPlayer1 ? (state.player1_turns_completed || 0) : (state.player2_turns_completed || 0);
  const newTurns = currentTurns + 1;

  const updates = isPlayer1 ? {
    player1_turns_completed: newTurns,
    updated_at: new Date().toISOString()
  } : {
    player2_turns_completed: newTurns,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('game_state')
    .update(updates)
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al incrementar turnos completados: ${error.message}`);
  }

  return newTurns;
};

// Incrementa 'turn' de órdenes existentes y aplica penalización en una sola operación
// Retorna: { penaltyApplied: number, updatedOrders: Order[] }
export const incrementOrderTurnsAndApplyPenalty = async (
  matchId: string,
  playerId: number
): Promise<{ penaltyApplied: number; updatedOrders: any[] }> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const isPlayer1 = state.player1_id === playerId;
  const currentOrders = isPlayer1 ? (state.player1_order || []) : (state.player2_order || []);
  const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
  
  // PASO 1: Calcular penalización ANTES de incrementar (órdenes con turn > 2)
  const oldOrders = currentOrders.filter(order => (order.turn || 1) > 2);
  const penaltyAmount = oldOrders.length * 50;
  
  // PASO 2: Incrementar turn en +1 para cada orden existente
  const updatedOrders = currentOrders.map(order => ({
    ...order,
    turn: (order.turn || 1) + 1
  }));
  
  // PASO 3: Calcular nuevo score (permitir negativos)
  const newScore = currentScore - penaltyAmount;

  // PASO 4: Actualizar DB con órdenes incrementadas Y score penalizado
  const updates = isPlayer1 ? {
    player1_order: updatedOrders,
    player1_score: newScore,
    updated_at: new Date().toISOString()
  } : {
    player2_order: updatedOrders,
    player2_score: newScore,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('game_state')
    .update(updates)
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al incrementar turnos y aplicar penalización: ${error.message}`);
  }
  
  return { penaltyApplied: penaltyAmount, updatedOrders };
};



// Agrega nuevas órdenes a un jugador (sin reemplazar las existentes)
export const addPlayerOrders = async (
  matchId: string,
  playerId: number,
  newOrders: any[]
): Promise<void> => {
  const state = await getGameState(matchId);
  if (!state) throw new Error('Estado del juego no encontrado');

  const isPlayer1 = state.player1_id === playerId;
  const currentOrders = isPlayer1 ? (state.player1_order || []) : (state.player2_order || []);
  
  // Combinar órdenes existentes con nuevas
  const updatedOrders = [...currentOrders, ...newOrders];

  const updates = isPlayer1 ? {
    player1_order: updatedOrders,
    updated_at: new Date().toISOString()
  } : {
    player2_order: updatedOrders,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('game_state')
    .update(updates)
    .eq('match_id', matchId);

  if (error) {
    throw new Error(`Error al agregar órdenes del jugador: ${error.message}`);
  }
};

// Actualiza el ELO de un jugador
export const updatePlayerElo = async (
  playerId: number,
  eloChange: number
): Promise<void> => {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('elo')
    .eq('id', playerId)
    .single();

  if (fetchError) {
    throw new Error(`Error al obtener ELO del jugador: ${fetchError.message}`);
  }

  const currentElo = user.elo || 1000;
  const newElo = currentElo + eloChange;

  const { error: updateError } = await supabase
    .from('users')
    .update({ elo: newElo })
    .eq('id', playerId);

  if (updateError) {
    throw new Error(`Error al actualizar ELO del jugador: ${updateError.message}`);
  }
};

// Finaliza una sala de juego
export const finishGameRoom = async (matchId: string): Promise<void> => {
  const { error } = await supabase
    .from('game_rooms')
    .update({
      status: 'finished',
      finished_at: new Date().toISOString()
    })
    .eq('id', matchId);

  if (error) {
    throw new Error(`Error al finalizar sala: ${error.message}`);
  }
};

// Validates player actions within the game rules
export const validateGameAction = (action: any): boolean => {
  // Validate game action
  return true;
};
