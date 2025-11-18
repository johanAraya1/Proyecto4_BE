import { Order } from '../models/GameEvent';

/**
 * Recetas de café disponibles
 * - Puntos: 50-300
 * - Ingredientes: 2-4 por orden
 * - Total: 20 recetas variadas
 */
const COFFEE_RECIPES = [
  { name: 'Café Solo', ingredients: ['AGUA', 'CAFE'], points: 100 },
  { name: 'Latte', ingredients: ['AGUA', 'CAFE', 'LECHE'], points: 200 },
  { name: 'Mocha', ingredients: ['AGUA', 'CAFE', 'LECHE', 'CARAMELO'], points: 300 },
  { name: 'Cappuccino', ingredients: ['CAFE', 'LECHE'], points: 150 },
  { name: 'Americano', ingredients: ['AGUA', 'CAFE'], points: 80 },
  { name: 'Macchiato', ingredients: ['CAFE', 'LECHE', 'CARAMELO'], points: 250 },
  { name: 'Café con Leche', ingredients: ['CAFE', 'LECHE'], points: 120 },
  { name: 'Espresso', ingredients: ['AGUA', 'CAFE'], points: 90 },
  { name: 'Flat White', ingredients: ['CAFE', 'LECHE'], points: 140 },
  { name: 'Affogato', ingredients: ['CAFE', 'LECHE', 'CARAMELO'], points: 220 },
  { name: 'Cortado', ingredients: ['CAFE', 'LECHE'], points: 110 },
  { name: 'Café Vienés', ingredients: ['AGUA', 'CAFE', 'CARAMELO'], points: 180 },
  { name: 'Irish Coffee', ingredients: ['AGUA', 'CAFE', 'CARAMELO'], points: 190 },
  { name: 'Ristretto', ingredients: ['AGUA', 'CAFE'], points: 70 },
  { name: 'Lungo', ingredients: ['AGUA', 'CAFE'], points: 85 },
  { name: 'Café Bombón', ingredients: ['CAFE', 'LECHE', 'CARAMELO'], points: 210 },
  { name: 'Caramel Latte', ingredients: ['AGUA', 'CAFE', 'LECHE', 'CARAMELO'], points: 280 },
  { name: 'Café Frappé', ingredients: ['AGUA', 'CAFE', 'LECHE'], points: 170 },
  { name: 'Con Panna', ingredients: ['CAFE', 'CARAMELO'], points: 130 },
  { name: 'Café Crema', ingredients: ['AGUA', 'CAFE', 'LECHE'], points: 160 },
];

/**
 * Genera un ID único para una orden
 */
function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `order_${timestamp}_${random}`;
}

/**
 * Selecciona una receta aleatoria evitando las que ya están en uso
 */
function selectRandomRecipe(excludeNames: Set<string>): typeof COFFEE_RECIPES[0] {
  const availableRecipes = COFFEE_RECIPES.filter(recipe => 
    !excludeNames.has(recipe.name)
  );
  
  if (availableRecipes.length === 0) {
    // Si todas las recetas están en uso, permitir duplicados
    return COFFEE_RECIPES[Math.floor(Math.random() * COFFEE_RECIPES.length)];
  }
  
  return availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
}

/**
 * Genera órdenes únicas evitando duplicados con las órdenes existentes
 * ⭐ Cada orden nueva tiene turn: 1
 * ⭐ Todas las órdenes son diferentes entre sí
 * 
 * @param count - Número de órdenes a generar (1-3)
 * @param existingOrders - Órdenes que ya tiene el jugador
 * @returns Array de órdenes nuevas con turn: 1
 */
export function generateUniqueOrders(count: number, existingOrders: Order[] = []): Order[] {
  if (count < 1 || count > 3) {
    throw new Error('El número de órdenes debe estar entre 1 y 3');
  }

  const newOrders: Order[] = [];
  const usedRecipes = new Set<string>();
  
  // Agregar recetas existentes al set para evitar duplicados
  existingOrders.forEach(order => {
    if (order.name) {
      usedRecipes.add(order.name);
    }
  });
  
  // Generar nuevas órdenes únicas
  for (let i = 0; i < count; i++) {
    const recipe = selectRandomRecipe(usedRecipes);
    usedRecipes.add(recipe.name); // Evitar duplicados dentro de las nuevas órdenes también
    
    const id = generateOrderId();
    
    newOrders.push({
      id,
      turn: 1,  // ⭐ Siempre 1 para órdenes nuevas
      name: recipe.name,
      ingredients: recipe.ingredients,
      points: recipe.points
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
