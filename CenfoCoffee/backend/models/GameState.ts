import { Position, Ingredient, Order, GridCell } from './GameEvent';

// Inventario del jugador (objeto con contadores)
export interface PlayerInventory {
  AGUA: number;
  CAFE: number;
  LECHE: number;
  CARAMELO: number;
}

// Estado de un jugador
export interface PlayerState {
  id: number;
  position: Position;
  inventory: PlayerInventory;
  score: number;
  orders: Order[];  // Array de 1-3 órdenes
  turnsCompleted?: number;  // Número de turnos completados (0, 1, 2+)
}

// Estado completo del juego
export interface GameState {
  id?: number;
  match_id: string;
  grid: GridCell[][];
  grid_string: string;
  player1_id: number;
  player1_position: Position;
  player1_inventory: PlayerInventory;
  player1_score: number;
  player1_order: Order[];  // Array de 1-3 órdenes
  player1_turns_completed?: number;  // Turnos completados por player1
  player2_id: number;
  player2_position: Position;
  player2_inventory: PlayerInventory;
  player2_score: number;
  player2_order: Order[];  // Array de 1-3 órdenes
  player2_turns_completed?: number;  // Turnos completados por player2
  current_turn: number;
  movement_count?: number;
  updated_at?: string;
}

// Respuesta de la API para obtener el estado del juego
export interface GetGameStateResponse {
  success: boolean;
  gameState: {
    ingredientGrid: GridCell[][];
    gridString: string;
    player1: PlayerState;
    player2: PlayerState;
    currentTurn: number;
    movementCount?: number;
  };
}
