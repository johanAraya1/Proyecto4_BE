import { Order } from '../models/GameEvent';

/**
 * Constantes de validación de órdenes
 */
export const ORDER_LIMITS = {
  MIN: 1,
  MAX: 3
} as const;

/**
 * Valida y normaliza un array de órdenes según las reglas del negocio:
 * - Mínimo 1 orden, máximo 3 órdenes
 * - Elimina duplicados por ID
 * - Filtra órdenes inválidas (sin ID o datos corruptos)
 * 
 * @param orders - Array de órdenes a validar
 * @returns Array normalizado de órdenes (1-3 elementos)
 */
export function validateOrders(orders: any[]): Order[] {
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  // Eliminar órdenes inválidas y duplicados
  const uniqueOrders: Order[] = [];
  const seenIds = new Set<string | number>();

  for (const order of orders) {
    // Validar que la orden tenga los campos mínimos requeridos
    if (!order || !order.id) {
      continue;
    }

    // Evitar duplicados por ID
    if (seenIds.has(order.id)) {
      continue;
    }

    seenIds.add(order.id);
    uniqueOrders.push(order);

    // Limitar a máximo 3 órdenes
    if (uniqueOrders.length >= ORDER_LIMITS.MAX) {
      break;
    }
  }

  return uniqueOrders;
}

/**
 * Agrega nuevas órdenes a un array existente, respetando el límite máximo
 * 
 * @param currentOrders - Órdenes actuales del jugador
 * @param newOrders - Nuevas órdenes a agregar
 * @returns Array actualizado de órdenes (máximo 3)
 */
export function addOrders(currentOrders: Order[], newOrders: Order[]): Order[] {
  const combined = [...currentOrders, ...newOrders];
  return validateOrders(combined);
}

/**
 * Remueve órdenes completadas del array actual
 * 
 * @param currentOrders - Órdenes actuales del jugador
 * @param completedOrderIds - IDs de órdenes completadas a remover
 * @returns Array de órdenes restantes
 */
export function removeCompletedOrders(
  currentOrders: Order[], 
  completedOrderIds: (string | number)[]
): Order[] {
  return currentOrders.filter(order => order.id && !completedOrderIds.includes(order.id));
}

/**
 * Normaliza input de órdenes (puede ser array o objeto único) a array
 * 
 * @param input - Órdenes en cualquier formato
 * @returns Array normalizado de órdenes
 */
export function normalizeOrderInput(input: any): Order[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return validateOrders(input);
  }

  // Si es un objeto único, convertir a array
  if (typeof input === 'object' && input.id) {
    return validateOrders([input]);
  }

  return [];
}
