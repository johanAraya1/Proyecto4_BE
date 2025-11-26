/**
 * Utilidades para el sistema de órdenes progresivas (1 → 2 → 3)
 */

/**
 * Calcula cuántas órdenes debe tener un jugador según los turnos completados
 * 
 * @param turnsCompleted - Número de turnos que el jugador ha completado
 * @returns Número de órdenes objetivo (1, 2 o 3)
 */
export function calculateTargetOrders(turnsCompleted: number): number {
  if (turnsCompleted === 0) return 1;      // Turno 1: 1 orden
  if (turnsCompleted === 1) return 1;      // Turno 2: 1 orden
  if (turnsCompleted === 2) return 2;      // Turno 3: 2 órdenes
  return 3;                                // Turno 4+: 3 órdenes
}

/**
 * Determina si se deben agregar más órdenes después de completar un turno
 * 
 * @param currentOrders - Número actual de órdenes del jugador
 * @param turnsCompleted - Número de turnos completados
 * @returns Número de órdenes a agregar (0 si no se necesitan más)
 */
export function calculateOrdersToAdd(currentOrders: number, turnsCompleted: number): number {
  const targetOrders = calculateTargetOrders(turnsCompleted);
  const ordersNeeded = targetOrders - currentOrders;
  return Math.max(0, ordersNeeded);
}

/**
 * Valida si un jugador tiene el número correcto de órdenes para su progresión
 * 
 * @param currentOrders - Número actual de órdenes
 * @param turnsCompleted - Turnos completados
 * @returns true si el número de órdenes es válido
 */
export function isValidOrderCount(currentOrders: number, turnsCompleted: number): boolean {
  const targetOrders = calculateTargetOrders(turnsCompleted);
  return currentOrders <= targetOrders;
}
