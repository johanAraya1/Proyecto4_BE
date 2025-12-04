"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGameConnection = void 0;
exports.getRoomPlayerCount = getRoomPlayerCount;
const ws_1 = require("ws");
const telemetryService_1 = require("../services/telemetryService");
const gameService_1 = require("../services/gameService");
const roomService_1 = require("../services/roomService");
const orderProgression_1 = require("../utils/orderProgression");
const orderGenerator_1 = require("../utils/orderGenerator");
// Mapa de salas activas: roomCode -> Set de WebSockets
const gameRooms = new Map();
// Mapa de conexiones: WebSocket -> información del jugador
const connections = new Map();
// Mapa de timers de desconexión: userId -> NodeJS.Timeout
const disconnectionTimers = new Map();
// Timeout de reconexión: 60 segundos
const RECONNECTION_TIMEOUT = 60000;
// Función para sanitizar ingredientes (eliminar acentos, normalizar)
function sanitizeIngredient(ingredient) {
    const ingredientMap = {
        'Café': 'CAFE',
        'Cafe': 'CAFE',
        'CAFÉ': 'CAFE',
        'cafe': 'CAFE',
        'CAFE': 'CAFE',
        'Leche': 'LECHE',
        'leche': 'LECHE',
        'LECHE': 'LECHE',
        'Agua': 'AGUA',
        'agua': 'AGUA',
        'AGUA': 'AGUA',
        'Caramelo': 'CARAMELO',
        'caramelo': 'CARAMELO',
        'CARAMELO': 'CARAMELO'
    };
    return ingredientMap[ingredient] || ingredient.toUpperCase();
}
// WebSocket connection handler for real-time game interactions
const handleGameConnection = async (ws, userId, roomCode) => {
    const userIdNum = parseInt(userId);
    telemetryService_1.telemetryService.incrementEvent('websocket_connection');
    // Validar que el usuario pertenece a la sala
    try {
        const room = await (0, roomService_1.getRoomByCode)(roomCode);
        if (!room) {
            ws.close(1008, 'Sala no encontrada');
            return;
        }
        // Verificar si la sala ya terminó
        if (room.status === 'finished') {
            console.log(`⚠️ Intento de conexión a sala terminada: ${roomCode} (status: ${room.status})`);
            ws.close(1000, 'La partida ya ha terminado');
            return;
        }
        const isCreator = String(room.creator_id) === userId;
        const isOpponent = room.opponent_id ? String(room.opponent_id) === userId : false;
        if (!isCreator && !isOpponent) {
            ws.close(1008, 'No autorizado para esta sala');
            return;
        }
    }
    catch (error) {
        console.error(`❌ [WebSocket] Error al validar usuario:`, error);
        ws.close(1008, 'Error de validación');
        return;
    }
    // Agregar a la sala
    if (!gameRooms.has(roomCode)) {
        gameRooms.set(roomCode, new Set());
    }
    gameRooms.get(roomCode).add(ws);
    connections.set(ws, { userId: userIdNum, roomCode });
    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
        type: 'CONNECTED',
        payload: { message: `Conectado a la sala ${roomCode}`, userId: userIdNum }
    }));
    // Manejar mensajes entrantes
    ws.on('message', async (message) => {
        try {
            const rawEvent = JSON.parse(message);
            // Obtener el UUID de la sala
            const room = await (0, roomService_1.getRoomByCode)(roomCode);
            if (!room) {
                throw new Error(`Sala ${roomCode} no encontrada`);
            }
            // Determinar el actor_id correcto
            let actorId;
            if (rawEvent.actor_id) {
                actorId = rawEvent.actor_id;
            }
            else {
                const gameState = await (0, gameService_1.getGameState)(room.id);
                if (gameState && rawEvent.payload?.currentPlayer) {
                    actorId = rawEvent.payload.currentPlayer;
                }
                else if (gameState && gameState.current_turn) {
                    actorId = gameState.current_turn === 1 ? Number(room.creator_id) : Number(room.opponent_id || room.creator_id);
                }
                else {
                    actorId = userIdNum;
                }
            }
            // Construir el evento completo con los campos requeridos
            const event = {
                match_id: room.id,
                actor_type: rawEvent.actor_type || 'player',
                actor_id: actorId,
                type: rawEvent.type,
                payload: rawEvent.payload
            };
            telemetryService_1.telemetryService.incrementEvent('game_action');
            // 1. Guardar evento en la base de datos
            await (0, gameService_1.saveGameEvent)(event);
            // 2. Actualizar game_state según el tipo de evento
            await handleGameEvent(event);
            // 3. Hacer broadcast a todos los jugadores de la sala
            const outgoingMessage = {
                type: event.type,
                payload: event.payload,
                actor_id: event.actor_id
            };
            broadcastToRoom(roomCode, outgoingMessage);
        }
        catch (error) {
            console.error(`❌ [WebSocket] Error al procesar mensaje:`, error);
            ws.send(JSON.stringify({
                type: 'ERROR',
                payload: { message: error.message || 'Error al procesar evento' }
            }));
        }
    });
    // Manejar desconexión
    ws.on('close', async () => {
        const connInfo = connections.get(ws);
        if (connInfo) {
            const { userId, roomCode } = connInfo;
            console.log(`🔌 WebSocket cerrado para jugador ${userId} en sala ${roomCode}`);
            // Limpiar conexión
            gameRooms.get(roomCode)?.delete(ws);
            connections.delete(ws);
            if (gameRooms.get(roomCode)?.size === 0) {
                gameRooms.delete(roomCode);
            }
            // Obtener la sala y verificar si hay un juego activo
            try {
                const room = await (0, roomService_1.getRoomByCode)(roomCode);
                if (room) {
                    const gameState = await (0, gameService_1.getGameState)(room.id);
                    // Solo iniciar timer si hay un juego activo
                    if (gameState) {
                        console.log(`⏰ Iniciando timer de reconexión (${RECONNECTION_TIMEOUT / 1000}s) para jugador ${userId}`);
                        // Establecer timer de 60 segundos para reconexión
                        const timer = setTimeout(async () => {
                            console.log(`⏰ Timeout de reconexión alcanzado para jugador ${userId}`);
                            // Verificar nuevamente que el juego sigue activo
                            const currentGameState = await (0, gameService_1.getGameState)(room.id);
                            const currentRoom = await (0, roomService_1.getRoomById)(room.id);
                            if (currentGameState && currentRoom && currentRoom.status === 'playing') {
                                console.log(`🚪 Declarando rendición por desconexión - Jugador ${userId}`);
                                // Procesar como rendición
                                await handlePlayerSurrender(room.id, userId, roomCode);
                            }
                            else {
                                console.log(`ℹ️ Juego ya finalizado para jugador ${userId} - no se aplica rendición`);
                            }
                            disconnectionTimers.delete(userId);
                        }, RECONNECTION_TIMEOUT);
                        disconnectionTimers.set(userId, timer);
                    }
                }
            }
            catch (error) {
                console.error(`❌ Error al manejar desconexión:`, error);
            }
        }
    });
    // Cancelar timer de desconexión si el jugador se reconecta
    const existingTimer = disconnectionTimers.get(userIdNum);
    if (existingTimer) {
        clearTimeout(existingTimer);
        disconnectionTimers.delete(userIdNum);
        console.log(`✅ Jugador ${userIdNum} reconectado - timer de desconexión cancelado`);
    }
    // Manejar errores
    ws.on('error', (error) => {
        console.error(`❌ [WebSocket] Error de conexión:`, error);
    });
};
exports.handleGameConnection = handleGameConnection;
// Procesa eventos según su tipo y actualiza el estado del juego
async function handleGameEvent(event) {
    const { match_id, actor_id, type, payload } = event;
    switch (type) {
        case 'GRID_INITIALIZED':
            try {
                const gridPayload = payload;
                const room = await (0, roomService_1.getRoomById)(match_id);
                if (room && room.creator_id && room.opponent_id) {
                    const playerPositions = gridPayload.playerPositions;
                    // Aceptar arrays de órdenes o formato legacy (order singular)
                    const player1Orders = gridPayload.player1Orders || gridPayload.player1?.orders || gridPayload.player1Order || gridPayload.player1?.order;
                    const player2Orders = gridPayload.player2Orders || gridPayload.player2?.orders || gridPayload.player2Order || gridPayload.player2?.order;
                    await (0, gameService_1.initializeGameState)(match_id, Number(room.creator_id), Number(room.opponent_id), gridPayload.grid, gridPayload.gridString, playerPositions, player1Orders, player2Orders);
                }
            }
            catch (error) {
                console.error(`Error al inicializar estado del juego:`, error);
            }
            break;
        case 'MOVE':
            const movePayload = payload;
            const roomForMove = await (0, roomService_1.getRoomById)(match_id);
            if (roomForMove) {
                // Sanitizar ingrediente (eliminar acentos, normalizar a mayúsculas)
                const sanitizedIngredient = sanitizeIngredient(movePayload.ingredient);
                await (0, gameService_1.updatePlayerPosition)(match_id, actor_id, {
                    row: movePayload.to[0],
                    col: movePayload.to[1]
                });
                await (0, gameService_1.updatePlayerInventory)(match_id, actor_id, sanitizedIngredient, 1);
                if (movePayload.movementCount !== undefined) {
                    await (0, gameService_1.updateMovementCount)(match_id, movePayload.movementCount);
                }
            }
            break;
        case 'TRADE':
            const tradePayload = payload;
            const roomForTrade = await (0, roomService_1.getRoomById)(match_id);
            if (roomForTrade) {
                // Soportar ambos formatos: completedOrders (array) y completedOrder (legacy)
                const completedOrders = tradePayload.completedOrders || (tradePayload.completedOrder ? [tradePayload.completedOrder] : null);
                if (completedOrders && completedOrders.length > 0) {
                    const currentGameState = await (0, gameService_1.getGameState)(match_id);
                    const isPlayer1 = actor_id === currentGameState?.player1_id;
                    // Actualizar inventario según el updatedInventory enviado por el frontend
                    if (tradePayload.updatedInventory) {
                        const currentInventory = isPlayer1 ? currentGameState?.player1_inventory : currentGameState?.player2_inventory;
                        // Actualizar cada ingrediente según la diferencia
                        for (const [ingredient, newCount] of Object.entries(tradePayload.updatedInventory)) {
                            const currentCount = currentInventory?.[ingredient] || 0;
                            const difference = newCount - currentCount;
                            if (difference !== 0) {
                                await (0, gameService_1.updatePlayerInventory)(match_id, actor_id, ingredient, difference);
                            }
                        }
                    }
                    // ⭐ ELIMINAR SOLO LAS ÓRDENES COMPLETADAS (mantener las demás)
                    const currentOrders = isPlayer1 ? (currentGameState?.player1_order || []) : (currentGameState?.player2_order || []);
                    const completedOrderIds = completedOrders.map((o) => o.id);
                    const remainingOrders = currentOrders.filter((order) => !completedOrderIds.includes(order.id));
                    // Actualizar órdenes (solo las que quedan) y score con totalPoints
                    if (tradePayload.totalPoints !== undefined) {
                        await (0, gameService_1.updatePlayerOrderAndScore)(match_id, actor_id, remainingOrders, tradePayload.totalPoints);
                    }
                    const updatedGameState = await (0, gameService_1.getGameState)(match_id);
                    if (updatedGameState) {
                        const player1Score = updatedGameState.player1_score;
                        const player2Score = updatedGameState.player2_score;
                        if (player1Score >= 100 || player2Score >= 100) {
                            const winnerId = player1Score >= player2Score ? updatedGameState.player1_id : updatedGameState.player2_id;
                            const loserId = winnerId === updatedGameState.player1_id ? updatedGameState.player2_id : updatedGameState.player1_id;
                            const winnerScore = winnerId === updatedGameState.player1_id ? player1Score : player2Score;
                            const loserScore = winnerId === updatedGameState.player1_id ? player2Score : player1Score;
                            // Actualizar ELO
                            await (0, gameService_1.updatePlayerElo)(winnerId, 500);
                            await (0, gameService_1.updatePlayerElo)(loserId, -250);
                            // Finalizar sala
                            await (0, gameService_1.finishGameRoom)(match_id);
                            // Broadcast GAME_ENDED
                            broadcastToRoom(roomForTrade.code, {
                                type: 'GAME_ENDED',
                                payload: {
                                    winnerId,
                                    loserId,
                                    winnerScore,
                                    loserScore,
                                    reason: 'SCORE_LIMIT',
                                    eloChanges: {
                                        winner: 500,
                                        loser: -250
                                    }
                                }
                            });
                            return; // Terminar ejecución, no continuar con broadcast normal
                        }
                    }
                }
                else {
                    // Legacy: Intercambio simple de ingrediente sin completar orden
                    const sanitizedIngredient = sanitizeIngredient(tradePayload.ingredient);
                    await (0, gameService_1.updatePlayerInventory)(match_id, actor_id, sanitizedIngredient, -1);
                }
            }
            break;
        case 'END_TURN':
            const endTurnPayload = payload;
            const gameStateBeforeEndTurn = await (0, gameService_1.getGameState)(match_id);
            if (gameStateBeforeEndTurn && actor_id) {
                const isCurrentPlayer1 = actor_id === gameStateBeforeEndTurn.player1_id;
                // Incrementar turnos completados del jugador actual
                await (0, gameService_1.incrementPlayerTurnsCompleted)(match_id, actor_id);
            }
            break;
        case 'TURN_CHANGED':
            const turnPayload = payload;
            const roomForTurn = await (0, roomService_1.getRoomById)(match_id);
            if (roomForTurn) {
                const newTurn = turnPayload.turnNumber || turnPayload.currentPlayer;
                if (newTurn !== 1 && newTurn !== 2) {
                    throw new Error(`Turno inválido: ${newTurn}. Debe ser 1 o 2`);
                }
                await (0, gameService_1.updateCurrentTurn)(match_id, newTurn);
                const gameStateTurnChanged = await (0, gameService_1.getGameState)(match_id);
                if (gameStateTurnChanged) {
                    // JUGADOR QUE INICIA SU TURNO
                    const currentPlayerId = newTurn === 1 ? gameStateTurnChanged.player1_id : gameStateTurnChanged.player2_id;
                    const currentPlayerTurnsCompleted = newTurn === 1 ?
                        (gameStateTurnChanged.player1_turns_completed || 0) :
                        (gameStateTurnChanged.player2_turns_completed || 0);
                    const currentPlayerOrders = newTurn === 1 ?
                        (gameStateTurnChanged.player1_order || []) :
                        (gameStateTurnChanged.player2_order || []);
                    // PASO 1: Incrementar 'turn' y aplicar penalización (en una sola operación atómica)
                    let penaltyApplied = 0;
                    if (currentPlayerOrders.length > 0) {
                        const result = await (0, gameService_1.incrementOrderTurnsAndApplyPenalty)(match_id, currentPlayerId);
                        penaltyApplied = result.penaltyApplied;
                    }
                    // PASO 2: Calcular cuántas órdenes nuevas agregar
                    const ordersToAdd = (0, orderProgression_1.calculateOrdersToAdd)(currentPlayerOrders.length, currentPlayerTurnsCompleted);
                    if (ordersToAdd > 0) {
                        const newOrders = (0, orderGenerator_1.generateUniqueOrders)(ordersToAdd, currentPlayerOrders);
                        await (0, gameService_1.addPlayerOrders)(match_id, currentPlayerId, newOrders);
                    }
                    // SIEMPRE hacer broadcast después de TURN_CHANGED (con penalización y órdenes actualizadas)
                    const updatedState = await (0, gameService_1.getGameState)(match_id);
                    const roomForBroadcast = await (0, roomService_1.getRoomById)(match_id);
                    if (updatedState && roomForBroadcast) {
                        const broadcastPayload = {
                            gameState: {
                                currentTurn: updatedState.current_turn,
                                movementCount: updatedState.movement_count || 0,
                                player1: {
                                    id: updatedState.player1_id,
                                    score: updatedState.player1_score,
                                    inventory: updatedState.player1_inventory,
                                    orders: updatedState.player1_order,
                                    turnsCompleted: updatedState.player1_turns_completed || 0
                                },
                                player2: {
                                    id: updatedState.player2_id,
                                    score: updatedState.player2_score,
                                    inventory: updatedState.player2_inventory,
                                    orders: updatedState.player2_order,
                                    turnsCompleted: updatedState.player2_turns_completed || 0
                                }
                            }
                        };
                        // Agregar información de penalización si se aplicó
                        if (penaltyApplied > 0) {
                            const oldOrdersCount = currentPlayerOrders.filter(order => (order.turn || 1) > 2).length;
                            broadcastPayload.penalty = {
                                playerId: currentPlayerId,
                                amount: penaltyApplied,
                                ordersCount: oldOrdersCount,
                                message: `Penalización de ${penaltyApplied} puntos por ${oldOrdersCount} orden(es) antigua(s)`
                            };
                        }
                        broadcastToRoom(roomForBroadcast.code, {
                            type: 'GAME_STATE_UPDATE',
                            payload: broadcastPayload
                        });
                    }
                }
            }
            break;
        case 'GAME_STATE_UPDATE':
            const gameStatePayload = payload;
            const gameState = gameStatePayload.gameState;
            // NO actualizar currentTurn aquí - se maneja con TURN_CHANGED
            // El frontend puede enviar currentTurn desactualizado
            if (gameState.movementCount !== undefined) {
                await (0, gameService_1.updateMovementCount)(match_id, gameState.movementCount);
            }
            if (gameState.playerPositions) {
                const room = await (0, roomService_1.getRoomById)(match_id);
                if (room) {
                    if (gameState.playerPositions.player1) {
                        await (0, gameService_1.updatePlayerPosition)(match_id, Number(room.creator_id), gameState.playerPositions.player1);
                    }
                    if (gameState.playerPositions.player2 && room.opponent_id) {
                        await (0, gameService_1.updatePlayerPosition)(match_id, Number(room.opponent_id), gameState.playerPositions.player2);
                    }
                }
            }
            // Actualizar órdenes si vienen en el payload (sistema progresivo)
            const roomForUpdate = await (0, roomService_1.getRoomById)(match_id);
            const currentGameState = await (0, gameService_1.getGameState)(match_id);
            if (roomForUpdate && currentGameState && gameState.player1?.orders) {
                await (0, gameService_1.updateCompletePlayerState)(match_id, Number(roomForUpdate.creator_id), gameState.playerPositions?.player1 || currentGameState.player1_position, gameState.player1.inventory || currentGameState.player1_inventory, gameState.player1.score ?? currentGameState.player1_score, gameState.player1.orders);
            }
            if (roomForUpdate && currentGameState && gameState.player2?.orders && roomForUpdate.opponent_id) {
                await (0, gameService_1.updateCompletePlayerState)(match_id, Number(roomForUpdate.opponent_id), gameState.playerPositions?.player2 || currentGameState.player2_position, gameState.player2.inventory || currentGameState.player2_inventory, gameState.player2.score ?? currentGameState.player2_score, gameState.player2.orders);
            }
            // GAME_STATE_UPDATE ahora solo actualiza posiciones
            // El inventario se maneja con MOVE (suma) y TRADE (resta)
            // El score se maneja con TRADE
            // Las órdenes se manejan con TRADE
            // Solo actualizar posiciones si vienen
            if (gameState.playerPositions) {
                const roomForUpdate = await (0, roomService_1.getRoomById)(match_id);
                if (roomForUpdate) {
                    if (gameState.playerPositions.player1) {
                        await (0, gameService_1.updatePlayerPosition)(match_id, Number(roomForUpdate.creator_id), gameState.playerPositions.player1);
                    }
                    if (gameState.playerPositions.player2 && roomForUpdate.opponent_id) {
                        await (0, gameService_1.updatePlayerPosition)(match_id, Number(roomForUpdate.opponent_id), gameState.playerPositions.player2);
                    }
                }
            }
            break;
        case 'PLAYER_SURRENDER':
            try {
                const surrenderPayload = payload;
                const surrenderingPlayerId = surrenderPayload.playerId || actor_id;
                // Obtener sala por match_id
                const room = await (0, roomService_1.getRoomById)(match_id);
                if (!room) {
                    throw new Error('Sala no encontrada');
                }
                // Procesar rendición
                await handlePlayerSurrender(match_id, Number(surrenderingPlayerId), room.code);
            }
            catch (error) {
                console.error('❌ Error al procesar rendición:', error);
            }
            break;
        default:
            break;
    }
}
// Función auxiliar para procesar la rendición de un jugador
async function handlePlayerSurrender(matchId, surrenderingPlayerId, roomCode) {
    try {
        console.log(`🚪 Jugador ${surrenderingPlayerId} se ha rendido en match ${matchId}`);
        // Obtener estado del juego
        const gameState = await (0, gameService_1.getGameState)(matchId);
        if (!gameState) {
            console.log('⚠️ No hay game_state - el juego ya terminó o no se inició');
            return;
        }
        // Determinar ganador y perdedor
        const loserId = surrenderingPlayerId;
        const winnerId = gameState.player1_id === loserId ? gameState.player2_id : gameState.player1_id;
        // Obtener scores actuales
        const winnerScore = winnerId === gameState.player1_id ? gameState.player1_score : gameState.player2_score;
        const loserScore = winnerId === gameState.player1_id ? gameState.player2_score : gameState.player1_score;
        console.log(`🎮 Match ID: ${matchId}`);
        console.log(`🏆 Ganador: ${winnerId}, Perdedor: ${loserId}`);
        // Calcular cambios de ELO (menos puntos por rendición que por victoria normal)
        const eloWinner = 15; // Menos puntos por victoria por rendición
        const eloLoser = -15; // Menos pérdida por rendirse
        console.log(`📊 ELO Changes - Winner: +${eloWinner}, Loser: ${eloLoser}`);
        // Actualizar ELO de ambos jugadores
        await (0, gameService_1.updatePlayerElo)(winnerId, eloWinner);
        await (0, gameService_1.updatePlayerElo)(loserId, eloLoser);
        // Finalizar la sala
        await (0, gameService_1.finishGameRoom)(matchId);
        console.log(`✅ Partida terminada por rendición`);
        // Cancelar cualquier timer de desconexión pendiente para ambos jugadores
        if (disconnectionTimers.has(winnerId)) {
            clearTimeout(disconnectionTimers.get(winnerId));
            disconnectionTimers.delete(winnerId);
        }
        if (disconnectionTimers.has(loserId)) {
            clearTimeout(disconnectionTimers.get(loserId));
            disconnectionTimers.delete(loserId);
        }
        // Notificar a ambos jugadores
        broadcastToRoom(roomCode, {
            type: 'PLAYER_SURRENDERED',
            payload: {
                playerId: loserId,
                winnerId: winnerId,
                loserId: loserId,
                winnerScore: winnerScore,
                loserScore: loserScore,
                eloChanges: {
                    winner: eloWinner,
                    loser: eloLoser
                },
                reason: 'surrender'
            }
        });
        // Esperar un momento para asegurar que la DB se actualizó
        await new Promise(resolve => setTimeout(resolve, 300));
        // Cerrar todas las conexiones WebSocket de esta sala
        console.log(`🔌 Cerrando conexiones WebSocket para sala ${roomCode}`);
        const room = gameRooms.get(roomCode);
        if (room) {
            room.forEach(client => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.close(1000, 'Partida terminada por rendición');
                }
            });
            // Limpiar la sala del mapa
            gameRooms.delete(roomCode);
        }
        // Limpiar conexiones del mapa
        connections.forEach((value, key) => {
            if (value.roomCode === roomCode) {
                connections.delete(key);
            }
        });
    }
    catch (error) {
        console.error('❌ Error al procesar rendición:', error);
        throw error;
    }
}
// Envía un mensaje a todos los clientes de una sala
function broadcastToRoom(roomCode, message) {
    const room = gameRooms.get(roomCode);
    if (!room)
        return;
    const messageStr = JSON.stringify(message);
    room.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}
// Obtiene el número de jugadores conectados en una sala
function getRoomPlayerCount(roomCode) {
    return gameRooms.get(roomCode)?.size || 0;
}
