import { WebSocket } from 'ws';
import { telemetryService } from '../services/telemetryService';
import { IncomingGameMessage, OutgoingGameMessage } from '../models/GameEvent';
import {
  saveGameEvent,
  getGameState,
  initializeGameState,
  updatePlayerPosition,
  updatePlayerInventory,
  updateCompletePlayerState,
  updateCurrentTurn,
  updateMovementCount,
  updatePlayerOrderAndScore,
  updatePlayerStateWithoutOrders,
  incrementPlayerTurnsCompleted,
  incrementOrderTurnsAndApplyPenalty,
  addPlayerOrders,
  updatePlayerElo,
  finishGameRoom
} from '../services/gameService';
import { getRoomByCode, getRoomById } from '../services/roomService';
import { calculateOrdersToAdd, calculateTargetOrders } from '../utils/orderProgression';
import { generateUniqueOrders } from '../utils/orderGenerator';

// Mapa de salas activas: roomCode -> Set de WebSockets
const gameRooms = new Map<string, Set<WebSocket>>();

// Mapa de conexiones: WebSocket -> información del jugador
const connections = new Map<WebSocket, { userId: number; roomCode: string }>();

// Función para sanitizar ingredientes (eliminar acentos, normalizar)
function sanitizeIngredient(ingredient: string): string {
  const ingredientMap: { [key: string]: string } = {
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
export const handleGameConnection = async (ws: WebSocket, userId: string, roomCode: string): Promise<void> => {
  const userIdNum = parseInt(userId);
  
  telemetryService.incrementEvent('websocket_connection');

  // Validar que el usuario pertenece a la sala
  try {
    const room = await getRoomByCode(roomCode);
    
    if (!room) {
      ws.close(1008, 'Sala no encontrada');
      return;
    }

    const isCreator = String(room.creator_id) === userId;
    const isOpponent = room.opponent_id ? String(room.opponent_id) === userId : false;

    if (!isCreator && !isOpponent) {
      ws.close(1008, 'No autorizado para esta sala');
      return;
    }

  } catch (error) {
    console.error(`❌ [WebSocket] Error al validar usuario:`, error);
    ws.close(1008, 'Error de validación');
    return;
  }

  // Agregar a la sala
  if (!gameRooms.has(roomCode)) {
    gameRooms.set(roomCode, new Set());
  }
  gameRooms.get(roomCode)!.add(ws);
  connections.set(ws, { userId: userIdNum, roomCode });

  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    payload: { message: `Conectado a la sala ${roomCode}`, userId: userIdNum }
  }));

  // Manejar mensajes entrantes
  ws.on('message', async (message: string) => {
    try {
      const rawEvent = JSON.parse(message);
      
      // Obtener el UUID de la sala
      const room = await getRoomByCode(roomCode);
      if (!room) {
        throw new Error(`Sala ${roomCode} no encontrada`);
      }

      // Determinar el actor_id correcto
      let actorId: number;
      
      if (rawEvent.actor_id) {
        actorId = rawEvent.actor_id;
      } else {
        const gameState = await getGameState(room.id);
        
        if (gameState && rawEvent.payload?.currentPlayer) {
          actorId = rawEvent.payload.currentPlayer;
        } else if (gameState && gameState.current_turn) {
          actorId = gameState.current_turn === 1 ? Number(room.creator_id) : Number(room.opponent_id || room.creator_id);
        } else {
          actorId = userIdNum;
        }
      }

      // Construir el evento completo con los campos requeridos
      const event: IncomingGameMessage = {
        match_id: room.id,
        actor_type: rawEvent.actor_type || 'player',
        actor_id: actorId,
        type: rawEvent.type,
        payload: rawEvent.payload
      };

      telemetryService.incrementEvent('game_action');

      // 1. Guardar evento en la base de datos
      await saveGameEvent(event);

      // 2. Actualizar game_state según el tipo de evento
      await handleGameEvent(event);

      // 3. Hacer broadcast a todos los jugadores de la sala
      const outgoingMessage: OutgoingGameMessage = {
        type: event.type,
        payload: event.payload,
        actor_id: event.actor_id
      };

      broadcastToRoom(roomCode, outgoingMessage);

    } catch (error: any) {
      console.error(`❌ [WebSocket] Error al procesar mensaje:`, error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: error.message || 'Error al procesar evento' }
      }));
    }
  });

  // Manejar desconexión
  ws.on('close', () => {
    const connInfo = connections.get(ws);
    if (connInfo) {
      const { roomCode } = connInfo;
      gameRooms.get(roomCode)?.delete(ws);
      connections.delete(ws);
      
      if (gameRooms.get(roomCode)?.size === 0) {
        gameRooms.delete(roomCode);
      }
    }
  });

  // Manejar errores
  ws.on('error', (error) => {
    console.error(`❌ [WebSocket] Error de conexión:`, error);
  });
};

// Procesa eventos según su tipo y actualiza el estado del juego
async function handleGameEvent(event: IncomingGameMessage): Promise<void> {
  const { match_id, actor_id, type, payload } = event;

  switch (type) {
    case 'GRID_INITIALIZED':
      try {
        const gridPayload = payload as any;
        const room = await getRoomById(match_id);
        
        if (room && room.creator_id && room.opponent_id) {
          const playerPositions = gridPayload.playerPositions;
          // Aceptar arrays de órdenes o formato legacy (order singular)
          const player1Orders = gridPayload.player1Orders || gridPayload.player1?.orders || gridPayload.player1Order || gridPayload.player1?.order;
          const player2Orders = gridPayload.player2Orders || gridPayload.player2?.orders || gridPayload.player2Order || gridPayload.player2?.order;
          
          await initializeGameState(
            match_id,
            Number(room.creator_id),
            Number(room.opponent_id),
            gridPayload.grid,
            gridPayload.gridString,
            playerPositions,
            player1Orders,
            player2Orders
          );
        }
      } catch (error: any) {
        console.error(`Error al inicializar estado del juego:`, error);
      }
      break;

    case 'MOVE':
      const movePayload = payload as any;
      const roomForMove = await getRoomById(match_id);
      if (roomForMove) {
        // Sanitizar ingrediente (eliminar acentos, normalizar a mayúsculas)
        const sanitizedIngredient = sanitizeIngredient(movePayload.ingredient);
        
        await updatePlayerPosition(match_id, actor_id as number, {
          row: movePayload.to[0],
          col: movePayload.to[1]
        });
        await updatePlayerInventory(match_id, actor_id as number, sanitizedIngredient, 1);
        
        if (movePayload.movementCount !== undefined) {
          await updateMovementCount(match_id, movePayload.movementCount);
        }

      }
      break;

    case 'TRADE':
      const tradePayload = payload as any;
      const roomForTrade = await getRoomById(match_id);
      if (roomForTrade) {
        // Soportar ambos formatos: completedOrders (array) y completedOrder (legacy)
        const completedOrders = tradePayload.completedOrders || (tradePayload.completedOrder ? [tradePayload.completedOrder] : null);
        
        if (completedOrders && completedOrders.length > 0) {
          const currentGameState = await getGameState(match_id);
          const isPlayer1 = actor_id === currentGameState?.player1_id;
          
          // Actualizar inventario según el updatedInventory enviado por el frontend
          if (tradePayload.updatedInventory) {
            const currentInventory = isPlayer1 ? currentGameState?.player1_inventory : currentGameState?.player2_inventory;
            
            // Actualizar cada ingrediente según la diferencia
            for (const [ingredient, newCount] of Object.entries(tradePayload.updatedInventory)) {
              const currentCount = currentInventory?.[ingredient as keyof typeof currentInventory] || 0;
              const difference = (newCount as number) - currentCount;
              
              if (difference !== 0) {
                await updatePlayerInventory(match_id, actor_id as number, ingredient, difference);
              }
            }
          }
          
          // ⭐ ELIMINAR SOLO LAS ÓRDENES COMPLETADAS (mantener las demás)
          const currentOrders = isPlayer1 ? (currentGameState?.player1_order || []) : (currentGameState?.player2_order || []);
          const completedOrderIds = completedOrders.map((o: any) => o.id);
          const remainingOrders = currentOrders.filter((order: any) => !completedOrderIds.includes(order.id));
          
          // Actualizar órdenes (solo las que quedan) y score con totalPoints
          if (tradePayload.totalPoints !== undefined) {
            await updatePlayerOrderAndScore(
              match_id,
              actor_id as number,
              remainingOrders,
              tradePayload.totalPoints
            );
          }
          
          const updatedGameState = await getGameState(match_id);
          if (updatedGameState) {
            const player1Score = updatedGameState.player1_score;
            const player2Score = updatedGameState.player2_score;
            
            if (player1Score >= 100 || player2Score >= 100) {
              const winnerId = player1Score >= player2Score ? updatedGameState.player1_id : updatedGameState.player2_id;
              const loserId = winnerId === updatedGameState.player1_id ? updatedGameState.player2_id : updatedGameState.player1_id;
              const winnerScore = winnerId === updatedGameState.player1_id ? player1Score : player2Score;
              const loserScore = winnerId === updatedGameState.player1_id ? player2Score : player1Score;
              
              // Actualizar ELO
              await updatePlayerElo(winnerId, 500);
              await updatePlayerElo(loserId, -250);
              
              // Finalizar sala
              await finishGameRoom(match_id);
              
              
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
        } else {
          // Legacy: Intercambio simple de ingrediente sin completar orden
          const sanitizedIngredient = sanitizeIngredient(tradePayload.ingredient);
          await updatePlayerInventory(match_id, actor_id as number, sanitizedIngredient, -1);
        }

      }
      break;

    case 'END_TURN':
      const endTurnPayload = payload as any;
      const gameStateBeforeEndTurn = await getGameState(match_id);
      
      if (gameStateBeforeEndTurn && actor_id) {
        const isCurrentPlayer1 = actor_id === gameStateBeforeEndTurn.player1_id;
        
        // Incrementar turnos completados del jugador actual
        await incrementPlayerTurnsCompleted(match_id, actor_id as number);
      }
      break;

    case 'TURN_CHANGED':
      const turnPayload = payload as any;
      const roomForTurn = await getRoomById(match_id);
      if (roomForTurn) {
        const newTurn = turnPayload.turnNumber || turnPayload.currentPlayer;
        
        if (newTurn !== 1 && newTurn !== 2) {
          throw new Error(`Turno inválido: ${newTurn}. Debe ser 1 o 2`);
        }
        
        await updateCurrentTurn(match_id, newTurn);

        const gameStateTurnChanged = await getGameState(match_id);
        
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
          const result = await incrementOrderTurnsAndApplyPenalty(match_id, currentPlayerId);
          penaltyApplied = result.penaltyApplied;
        }
        
        // PASO 2: Calcular cuántas órdenes nuevas agregar
        const ordersToAdd = calculateOrdersToAdd(currentPlayerOrders.length, currentPlayerTurnsCompleted);
        
        if (ordersToAdd > 0) {
          const newOrders = generateUniqueOrders(ordersToAdd, currentPlayerOrders);
          await addPlayerOrders(match_id, currentPlayerId, newOrders);
        }
        
        // SIEMPRE hacer broadcast después de TURN_CHANGED (con penalización y órdenes actualizadas)
        const updatedState = await getGameState(match_id);
        const roomForBroadcast = await getRoomById(match_id);
        
        if (updatedState && roomForBroadcast) {
          const broadcastPayload: any = {
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
      const gameStatePayload = payload as any;
      const gameState = gameStatePayload.gameState;
      
      // NO actualizar currentTurn aquí - se maneja con TURN_CHANGED
      // El frontend puede enviar currentTurn desactualizado
      
      if (gameState.movementCount !== undefined) {
        await updateMovementCount(match_id, gameState.movementCount);
      }
      
      if (gameState.playerPositions) {
        const room = await getRoomById(match_id);
        if (room) {
          if (gameState.playerPositions.player1) {
            await updatePlayerPosition(match_id, Number(room.creator_id), gameState.playerPositions.player1);
          }
          if (gameState.playerPositions.player2 && room.opponent_id) {
            await updatePlayerPosition(match_id, Number(room.opponent_id), gameState.playerPositions.player2);
          }
        }
      }

      // Actualizar órdenes si vienen en el payload (sistema progresivo)
      const roomForUpdate = await getRoomById(match_id);
      const currentGameState = await getGameState(match_id);
      
      if (roomForUpdate && currentGameState && gameState.player1?.orders) {
        await updateCompletePlayerState(
          match_id,
          Number(roomForUpdate.creator_id),
          gameState.playerPositions?.player1 || currentGameState.player1_position,
          gameState.player1.inventory || currentGameState.player1_inventory,
          gameState.player1.score ?? currentGameState.player1_score,
          gameState.player1.orders
        );
      }
      
      if (roomForUpdate && currentGameState && gameState.player2?.orders && roomForUpdate.opponent_id) {
        await updateCompletePlayerState(
          match_id,
          Number(roomForUpdate.opponent_id),
          gameState.playerPositions?.player2 || currentGameState.player2_position,
          gameState.player2.inventory || currentGameState.player2_inventory,
          gameState.player2.score ?? currentGameState.player2_score,
          gameState.player2.orders
        );
      }

      // GAME_STATE_UPDATE ahora solo actualiza posiciones
      // El inventario se maneja con MOVE (suma) y TRADE (resta)
      // El score se maneja con TRADE
      // Las órdenes se manejan con TRADE
      
      // Solo actualizar posiciones si vienen
      if (gameState.playerPositions) {
        const roomForUpdate = await getRoomById(match_id);
        if (roomForUpdate) {
          if (gameState.playerPositions.player1) {
            await updatePlayerPosition(match_id, Number(roomForUpdate.creator_id), gameState.playerPositions.player1);
          }
          if (gameState.playerPositions.player2 && roomForUpdate.opponent_id) {
            await updatePlayerPosition(match_id, Number(roomForUpdate.opponent_id), gameState.playerPositions.player2);
          }
        }
      }
      break;

    default:
      break;
  }
}

// Envía un mensaje a todos los clientes de una sala
function broadcastToRoom(roomCode: string, message: OutgoingGameMessage): void {
  const room = gameRooms.get(roomCode);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  room.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Obtiene el número de jugadores conectados en una sala
export function getRoomPlayerCount(roomCode: string): number {
  return gameRooms.get(roomCode)?.size || 0;
}
