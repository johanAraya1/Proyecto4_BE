// Tipos de eventos del juego
export type GameEventType = 
  | 'GRID_INITIALIZED'
  | 'MOVE'
  | 'TRADE'
  | 'END_TURN'
  | 'TURN_CHANGED'
  | 'GAME_STATE_UPDATE'
  | 'GAME_STARTED'
  | 'GAME_ENDED';

// Tipo de actor que genera el evento
export type ActorType = 'player' | 'system';

// Posición en la cuadrícula
export interface Position {
  row: number;
  col: number;
}

// Ingrediente del juego
export type Ingredient = 'AGUA' | 'CAFE' | 'LECHE' | 'AZUCAR' | 'CARAMELO';

// Celda de la cuadrícula
export interface GridCell {
  ingredient: Ingredient;
}

// Item del inventario
export interface InventoryItem {
  type: Ingredient;
  count: number;
}

// Orden del juego
export interface Order {
  id?: number | string;  // ID único de la orden (generado por frontend)
  name?: string;  // Nombre de la orden
  ingredients: string[];
  points: number;
}

// Payload para GRID_INITIALIZED
export interface GridInitializedPayload {
  grid: GridCell[][];
  gridString: string;
}

// Payload para MOVE
export interface MovePayload {
  from: [number, number];
  to: [number, number];
  ingredient: Ingredient;
}

// Payload para TRADE
export interface TradePayload {
  ingredient: Ingredient;
  order: Order;
}

// Payload para END_TURN
export interface EndTurnPayload {
  pos: [number, number];
  inventory: InventoryItem[];
  score: number;
  orders: Order[];
  movementsUsed: number;
}

// Payload para TURN_CHANGED
export interface TurnChangedPayload {
  currentPlayer: number;
}

// Payload genérico (unión de todos los payloads)
export type GameEventPayload = 
  | GridInitializedPayload
  | MovePayload
  | TradePayload
  | EndTurnPayload
  | TurnChangedPayload
  | Record<string, any>;

// Evento de juego completo
export interface GameEvent {
  id?: number;
  match_id: string;
  actor_type: ActorType;
  actor_id: number | string;
  type: GameEventType;
  payload: GameEventPayload;
  created_at?: string;
}

// Mensaje de WebSocket entrante
export interface IncomingGameMessage {
  match_id: string;
  actor_type: ActorType;
  actor_id: number;
  type: GameEventType;
  payload: GameEventPayload;
}

// Mensaje de WebSocket saliente (broadcast)
export interface OutgoingGameMessage {
  type: GameEventType;
  payload: GameEventPayload;
  actor_id?: number | string;
}
