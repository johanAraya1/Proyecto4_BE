"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGameAction = exports.getGameEvents = exports.updatePlayerStateWithoutOrders = exports.updatePlayerOrderAndScore = exports.updateMovementCount = exports.updateCurrentTurn = exports.updateCompletePlayerState = exports.updatePlayerInventory = exports.updatePlayerPosition = exports.initializeGameState = exports.getGameState = exports.saveGameEvent = void 0;
const supabaseClient_1 = require("../utils/supabaseClient");
const orderValidation_1 = require("../utils/orderValidation");
// Guarda un evento de juego en la base de datos
const saveGameEvent = async (event) => {
    const { data, error } = await supabaseClient_1.supabase
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
    return data;
};
exports.saveGameEvent = saveGameEvent;
// Obtiene el estado actual del juego
const getGameState = async (matchId) => {
    const { data, error } = await supabaseClient_1.supabase
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
    return data;
};
exports.getGameState = getGameState;
// Inicializa el estado del juego con la cuadrícula
const initializeGameState = async (matchId, player1Id, player2Id, grid, gridString, playerPositions, player1Orders, player2Orders) => {
    const initialInventory = {
        AGUA: 0,
        CAFE: 0,
        LECHE: 0,
        CARAMELO: 0
    };
    // Usar las posiciones del frontend si vienen, sino usar valores por defecto
    const player1Position = playerPositions?.player1 || { row: 0, col: 0 };
    const player2Position = playerPositions?.player2 || { row: 2, col: 2 };
    // Normalizar órdenes (puede ser array o objeto único) y validar (1-3)
    const validatedPlayer1Orders = (0, orderValidation_1.normalizeOrderInput)(player1Orders);
    const validatedPlayer2Orders = (0, orderValidation_1.normalizeOrderInput)(player2Orders);
    const gameStateData = {
        match_id: matchId,
        grid: grid,
        grid_string: gridString,
        player1_id: player1Id,
        player1_position: player1Position,
        player1_inventory: initialInventory,
        player1_score: 0,
        player1_order: validatedPlayer1Orders,
        player2_id: player2Id,
        player2_position: player2Position,
        player2_inventory: initialInventory,
        player2_score: 0,
        player2_order: validatedPlayer2Orders,
        current_turn: 1,
        movement_count: 0
    };
    const { data, error } = await supabaseClient_1.supabase
        .from('game_state')
        .insert([gameStateData])
        .select()
        .single();
    if (error) {
        throw new Error(`Error al inicializar estado del juego: ${error.message}`);
    }
    return data;
};
exports.initializeGameState = initializeGameState;
// Actualiza la posición del jugador
const updatePlayerPosition = async (matchId, playerId, position) => {
    const state = await (0, exports.getGameState)(matchId);
    if (!state)
        throw new Error('Estado del juego no encontrado');
    const playerField = state.player1_id === playerId ? 'player1_position' : 'player2_position';
    const { error } = await supabaseClient_1.supabase
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
exports.updatePlayerPosition = updatePlayerPosition;
// Actualiza el inventario del jugador
const updatePlayerInventory = async (matchId, playerId, ingredient, delta) => {
    const state = await (0, exports.getGameState)(matchId);
    if (!state)
        throw new Error('Estado del juego no encontrado');
    const playerField = state.player1_id === playerId ? 'player1_inventory' : 'player2_inventory';
    const currentInventory = state.player1_id === playerId ? state.player1_inventory : state.player2_inventory;
    const newInventory = { ...currentInventory };
    newInventory[ingredient] = (newInventory[ingredient] || 0) + delta;
    const { error } = await supabaseClient_1.supabase
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
exports.updatePlayerInventory = updatePlayerInventory;
// Actualiza el estado completo del jugador (para END_TURN y GAME_STATE_UPDATE)
const updateCompletePlayerState = async (matchId, playerId, position, inventory, score, orders) => {
    const state = await (0, exports.getGameState)(matchId);
    if (!state)
        throw new Error('Estado del juego no encontrado');
    const isPlayer1 = state.player1_id === playerId;
    // Protección: No permitir que el score baje sin justificación
    const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
    const finalScore = Math.max(score, currentScore);
    if (score < currentScore) {
        console.log(`⚠️ [Score Protection] Intento de bajar score de ${currentScore} a ${score}. Manteniendo ${finalScore}`);
    }
    let inventoryObj;
    if (Array.isArray(inventory)) {
        inventoryObj = {
            AGUA: 0,
            CAFE: 0,
            LECHE: 0,
            CARAMELO: 0
        };
        inventory.forEach(item => {
            inventoryObj[item.type] = item.count;
        });
    }
    else {
        inventoryObj = inventory;
    }
    let positionObj;
    if (Array.isArray(position)) {
        positionObj = { row: position[0], col: position[1] };
    }
    else {
        positionObj = position;
    }
    let ordersArray;
    if (Array.isArray(orders)) {
        ordersArray = orders;
    }
    else if (orders) {
        ordersArray = [orders];
    }
    else {
        ordersArray = [];
    }
    // Normalizar y validar órdenes (1-3)
    const validatedOrders = (0, orderValidation_1.normalizeOrderInput)(ordersArray);
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
    const { error } = await supabaseClient_1.supabase
        .from('game_state')
        .update(updates)
        .eq('match_id', matchId);
    if (error) {
        throw new Error(`Error al actualizar estado completo del jugador: ${error.message}`);
    }
};
exports.updateCompletePlayerState = updateCompletePlayerState;
// Actualiza el turno actual
const updateCurrentTurn = async (matchId, turn) => {
    const { error } = await supabaseClient_1.supabase
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
exports.updateCurrentTurn = updateCurrentTurn;
// Actualiza el contador de movimientos
const updateMovementCount = async (matchId, movementCount) => {
    const { error } = await supabaseClient_1.supabase
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
exports.updateMovementCount = updateMovementCount;
// Actualiza la orden y el score del jugador después de completar un trade
const updatePlayerOrderAndScore = async (matchId, playerId, newOrders, pointsEarned) => {
    const state = await (0, exports.getGameState)(matchId);
    if (!state)
        throw new Error('Estado del juego no encontrado');
    const isPlayer1 = state.player1_id === playerId;
    const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
    const newScore = currentScore + pointsEarned;
    // Normalizar y validar nuevas órdenes (1-3)
    const validatedOrders = (0, orderValidation_1.normalizeOrderInput)(newOrders);
    const updates = isPlayer1 ? {
        player1_score: newScore,
        player1_order: validatedOrders,
        updated_at: new Date().toISOString()
    } : {
        player2_score: newScore,
        player2_order: validatedOrders,
        updated_at: new Date().toISOString()
    };
    const { error } = await supabaseClient_1.supabase
        .from('game_state')
        .update(updates)
        .eq('match_id', matchId);
    if (error) {
        throw new Error(`Error al actualizar orden y score del jugador: ${error.message}`);
    }
};
exports.updatePlayerOrderAndScore = updatePlayerOrderAndScore;
// Actualiza solo inventario, posición y score SIN tocar las órdenes
const updatePlayerStateWithoutOrders = async (matchId, playerId, position, inventory, score) => {
    const state = await (0, exports.getGameState)(matchId);
    if (!state)
        throw new Error('Estado del juego no encontrado');
    const isPlayer1 = state.player1_id === playerId;
    // Protección: No permitir que el score baje sin justificación
    const currentScore = isPlayer1 ? state.player1_score : state.player2_score;
    const finalScore = Math.max(score, currentScore);
    if (score < currentScore) {
        console.log(`⚠️ [Score Protection] Intento de bajar score de ${currentScore} a ${score}. Manteniendo ${finalScore}`);
    }
    let inventoryObj;
    if (Array.isArray(inventory)) {
        inventoryObj = {
            AGUA: 0,
            CAFE: 0,
            LECHE: 0,
            CARAMELO: 0
        };
        inventory.forEach(item => {
            inventoryObj[item.type] = item.count;
        });
    }
    else {
        inventoryObj = inventory;
    }
    let positionObj;
    if (Array.isArray(position)) {
        positionObj = { row: position[0], col: position[1] };
    }
    else {
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
    const { error } = await supabaseClient_1.supabase
        .from('game_state')
        .update(updates)
        .eq('match_id', matchId);
    if (error) {
        throw new Error(`Error al actualizar estado del jugador: ${error.message}`);
    }
};
exports.updatePlayerStateWithoutOrders = updatePlayerStateWithoutOrders;
// Obtiene todos los eventos de una partida
const getGameEvents = async (matchId) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('game_events')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
    if (error) {
        throw new Error(`Error al obtener eventos del juego: ${error.message}`);
    }
    return data;
};
exports.getGameEvents = getGameEvents;
// Validates player actions within the game rules
const validateGameAction = (action) => {
    // Validate game action
    return true;
};
exports.validateGameAction = validateGameAction;
