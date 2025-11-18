import { Order } from '../models/GameEvent';

/**
 * Recetas de café disponibles en el juego
 */
const COFFEE_RECIPES = [
  { name: 'Café Solo', ingredients: ['CAFE', 'AGUA'], reward: 100 },
  { name: 'Café con Leche', ingredients: ['CAFE', 'LECHE'], reward: 150 },
  { name: 'Café Caramel', ingredients: ['CAFE', 'CARAMELO'], reward: 150 },
  { name: 'Latte', ingredients: ['CAFE', 'LECHE', 'AGUA'], reward: 200 },
  { name: 'Caramel Latte', ingredients: ['CAFE', 'LECHE', 'CARAMELO'], reward: 250 },
  { name: 'Espresso', ingredients: ['CAFE', 'CAFE', 'AGUA'], reward: 180 },
  { name: 'Mocha', ingredients: ['CAFE', 'LECHE', 'CARAMELO', 'AGUA'], reward: 300 },
  { name: 'Cappuccino', ingredients: ['CAFE', 'CAFE', 'LECHE'], reward: 220 },
  { name: 'Americano', ingredients: ['CAFE', 'AGUA', 'AGUA'], reward: 120 },
  { name: 'Macchiato', ingredients: ['CAFE', 'CAFE', 'LECHE', 'CARAMELO'], reward: 280 }
];

/**
 * Genera un ID único para una orden
 */
function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Selecciona una receta aleatoria que no esté en la lista de excluidos
 */
function selectRandomRecipe(excludeIds: Set<string>): { id: string; recipe: typeof COFFEE_RECIPES[0] } {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const recipe = COFFEE_RECIPES[Math.floor(Math.random() * COFFEE_RECIPES.length)];
    const id = generateOrderId();
    
    if (!excludeIds.has(id)) {
      excludeIds.add(id);
      return { id, recipe };
    }
    
    attempts++;
  }
  
  // Fallback: generar con timestamp único
  const recipe = COFFEE_RECIPES[Math.floor(Math.random() * COFFEE_RECIPES.length)];
  const id = `order_${Date.now()}_${attempts}_${Math.random().toString(36).substr(2, 9)}`;
  excludeIds.add(id);
  return { id, recipe };
}

/**
 * Genera órdenes únicas para un jugador
 * 
 * @param count - Número de órdenes a generar (1-3)
 * @param existingOrders - Órdenes existentes para evitar duplicados
 * @returns Array de órdenes únicas
 */
export function generateUniqueOrders(count: number, existingOrders: Order[] = []): Order[] {
  // Validar count
  const validCount = Math.max(1, Math.min(3, count));
  
  // IDs existentes para evitar duplicados
  const existingIds = new Set<string>(existingOrders.map(o => o.id?.toString() || ''));
  
  const newOrders: Order[] = [];
  
  for (let i = 0; i < validCount; i++) {
    const { id, recipe } = selectRandomRecipe(existingIds);
    
    newOrders.push({
      id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      points: recipe.reward
    });
  }
  
  return newOrders;
}

/**
 * Genera órdenes iniciales para ambos jugadores
 * Garantiza que sean diferentes entre sí
 */
export function generateInitialOrders(): { player1Orders: Order[]; player2Orders: Order[] } {
  const usedIds = new Set<string>();
  
  // Generar 1 orden para Player 1
  const player1Orders = generateUniqueOrders(1, []);
  player1Orders.forEach(o => usedIds.add(o.id?.toString() || ''));
  
  // Generar 1 orden para Player 2 (diferente a Player 1)
  let player2Orders: Order[] = [];
  let attempts = 0;
  
  while (attempts < 10) {
    player2Orders = generateUniqueOrders(1, []);
    // Verificar que no sea la misma receta
    if (player2Orders[0].name !== player1Orders[0].name) {
      break;
    }
    attempts++;
  }
  
  return { player1Orders, player2Orders };
}
