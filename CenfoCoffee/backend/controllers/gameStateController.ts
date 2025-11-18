import { Request, Response } from 'express';
import { getGameState } from '../services/gameService';
import { telemetryService } from '../services/telemetryService';
import { GetGameStateResponse } from '../models/GameState';

// Manejador HTTP para GET /api/game/:matchId/state - obtiene el estado actual del juego
export const getGameStateController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      res.status(400).json({ 
        success: false, 
        message: 'matchId es requerido' 
      });
      return;
    }

    const gameState = await getGameState(matchId);

    if (!gameState) {
      res.status(404).json({ 
        success: false, 
        message: 'Estado del juego no encontrado' 
      });
      return;
    }

    telemetryService.incrementEvent('game_action');

    const response: GetGameStateResponse = {
      success: true,
      gameState: {
        ingredientGrid: gameState.grid,
        gridString: gameState.grid_string,
        player1: {
          id: gameState.player1_id,
          position: gameState.player1_position,
          inventory: gameState.player1_inventory,
          score: gameState.player1_score,
          orders: gameState.player1_order || [],
          turnsCompleted: gameState.player1_turns_completed || 0
        },
        player2: {
          id: gameState.player2_id,
          position: gameState.player2_position,
          inventory: gameState.player2_inventory,
          score: gameState.player2_score,
          orders: gameState.player2_order || [],
          turnsCompleted: gameState.player2_turns_completed || 0
        },
        currentTurn: gameState.current_turn
      }
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al obtener estado del juego:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};
