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
  updatePlayerStateWithoutOrders
} from '../services/gameService';
import { getRoomByCode, getRoomById } from '../services/roomService';

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

        // Obtener estado actualizado para mostrar inventarios
        const gameState = await getGameState(match_id);
        console.log('\n🎮 ═══════════════════════════════════════');
        console.log('📍 MOVIMIENTO EJECUTADO');
        console.log('═══════════════════════════════════════');
        console.log('👤 Jugador en turno:', gameState?.current_turn === 1 ? 'PLAYER 1' : 'PLAYER 2');
        console.log('🎯 Tipo de evento: MOVE');
        console.log('🔢 Movimiento #:', movePayload.movementCount || gameState?.movement_count || 'N/A');
        console.log('🧪 Ingrediente recogido:', sanitizedIngredient);
        console.log('📦 Inventario Player 1:', JSON.stringify(gameState?.player1_inventory || {}));
        console.log('📦 Inventario Player 2:', JSON.stringify(gameState?.player2_inventory || {}));
        console.log('═══════════════════════════════════════\n');
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
          
          // Actualizar órdenes y score con totalPoints
          if (tradePayload.newOrders && tradePayload.totalPoints !== undefined) {
            await updatePlayerOrderAndScore(
              match_id,
              actor_id as number,
              tradePayload.newOrders,
              tradePayload.totalPoints
            );
          }
        } else {
          // Legacy: Intercambio simple de ingrediente sin completar orden
          const sanitizedIngredient = sanitizeIngredient(tradePayload.ingredient);
          await updatePlayerInventory(match_id, actor_id as number, sanitizedIngredient, -1);
        }

        // Obtener estado actualizado para mostrar inventarios
        const gameState = await getGameState(match_id);
        console.log('\n🎮 ═══════════════════════════════════════');
        console.log('💱 TRADE EJECUTADO');
        console.log('═══════════════════════════════════════');
        console.log('👤 Jugador en turno:', gameState?.current_turn === 1 ? 'PLAYER 1' : 'PLAYER 2');
        console.log('🎯 Tipo de evento: TRADE');
        console.log('🔢 Movimiento #:', gameState?.movement_count || 'N/A');
        console.log('✅ Órdenes completadas:', completedOrders?.length || 0);
        if (completedOrders && completedOrders.length > 0) {
          console.log('🏆 Puntos totales ganados:', tradePayload.totalPoints || 0);
          console.log('📋 Órdenes completadas:', completedOrders.map((o: any) => o.recipe || o.name).join(', '));
          const newOrdersCount = tradePayload.newOrders?.length || 0;
          console.log(`📝 Nuevas órdenes recibidas: ${newOrdersCount}`);
          if (newOrdersCount > 0) {
            console.log('📝 Órdenes:', tradePayload.newOrders.map((o: any) => o.recipe || o.name).join(', '));
          }
        }
        console.log('📦 Inventario Player 1:', JSON.stringify(gameState?.player1_inventory || {}));
        console.log('📦 Inventario Player 2:', JSON.stringify(gameState?.player2_inventory || {}));
        console.log('═══════════════════════════════════════\n');
      }
      break;

    case 'END_TURN':
      // END_TURN ya NO actualiza el estado porque GAME_STATE_UPDATE lo hace
      const gameStateEndTurn = await getGameState(match_id);
      console.log('\n🎮 ═══════════════════════════════════════');
      console.log('🔄 FIN DE TURNO');
      console.log('═══════════════════════════════════════');
      console.log('👤 Turno que termina:', gameStateEndTurn?.current_turn === 1 ? 'PLAYER 1' : 'PLAYER 2');
      console.log('🎯 Tipo de evento: END_TURN');
      console.log('🔢 Movimientos realizados:', gameStateEndTurn?.movement_count || 'N/A');
      console.log('📦 Inventario Player 1:', JSON.stringify(gameStateEndTurn?.player1_inventory || {}));
      console.log('📦 Inventario Player 2:', JSON.stringify(gameStateEndTurn?.player2_inventory || {}));
      console.log('═══════════════════════════════════════\n');
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
        console.log('\n🎮 ═══════════════════════════════════════');
        console.log('🔀 CAMBIO DE TURNO');
        console.log('═══════════════════════════════════════');
        console.log('👤 Nuevo turno:', newTurn === 1 ? 'PLAYER 1' : 'PLAYER 2');
        console.log('🎯 Tipo de evento: TURN_CHANGED');
        console.log('🔢 Contador de movimientos reseteado a: 0');
        console.log('📦 Inventario Player 1:', JSON.stringify(gameStateTurnChanged?.player1_inventory || {}));
        console.log('📦 Inventario Player 2:', JSON.stringify(gameStateTurnChanged?.player2_inventory || {}));
        console.log('═══════════════════════════════════════\n');
      }
      break;

    case 'GAME_STATE_UPDATE':
      const gameStatePayload = payload as any;
      const gameState = gameStatePayload.gameState;
      
      // ❌ NO actualizar currentTurn aquí - se maneja con TURN_CHANGED
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

      // Obtener estado actualizado para mostrar inventarios
      const gameStateUpdate = await getGameState(match_id);
      console.log('\n🎮 ═══════════════════════════════════════');
      console.log('📊 ACTUALIZACIÓN DE ESTADO');
      console.log('═══════════════════════════════════════');
      console.log('👤 Jugador en turno:', gameStateUpdate?.current_turn === 1 ? 'PLAYER 1' : 'PLAYER 2');
      console.log('🎯 Tipo de evento: GAME_STATE_UPDATE');
      console.log('🔢 Movimiento #:', gameStateUpdate?.movement_count || 'N/A');
      console.log('📦 Inventario Player 1:', JSON.stringify(gameStateUpdate?.player1_inventory || {}));
      console.log('📦 Inventario Player 2:', JSON.stringify(gameStateUpdate?.player2_inventory || {}));
      console.log('═══════════════════════════════════════\n');
      
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
