export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  elo?: number; // Only for players
}
