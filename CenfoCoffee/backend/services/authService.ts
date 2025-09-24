import { supabase } from '../utils/supabaseClient';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'player' = 'player',
  elo: number = 1000 // default elo for players
): Promise<User> => {
  const id = uuidv4();
  const user: User = { id, email, password, name, role, elo: role === 'player' ? elo : undefined };
  const { error } = await supabase.from('users').insert([user]);
  if (error) throw new Error(error.message);
  return user;
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password);
  if (error || !data || data.length === 0) throw new Error('Invalid credentials');
  // Return a mock token for now
  return 'mock-token';
};
