import { supabase } from '../utils/supabaseClient';
import { User } from '../models/User';

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'player' = 'player',
  elo: number = 1000 // default elo for players
): Promise<User> => {
  const userData = { email, password, name, role, elo: role === 'player' ? elo : undefined };
  const { data, error } = await supabase.from('users').insert([userData]).select();
  if (error) throw new Error(error.message);
  // Supabase returns the inserted row with auto-generated id
  return data[0] as User;
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password);
  if (error || !data || data.length === 0) throw new Error('Invalid credentials');
  // Return a mock token for now
  return 'Access completed';
};
