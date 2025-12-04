// Tipos de rol de usuario
export type UserRole = 'admin' | 'player';

// Modelo de entidad de usuario
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  elo?: number; // Rating ELO solo para jugadores
}
