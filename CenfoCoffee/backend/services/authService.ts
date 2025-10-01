import { supabase } from '../utils/supabaseClient';
import { User } from '../models/User';

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'player' = 'player',
  elo: number = 1000 // default elo for players
): Promise<User> => {
  const user: Omit<User, 'id'> = { email, password, name, role, elo: role === 'player' ? elo : undefined };
  const { data, error } = await supabase.from('users').insert([user]).select();
  if (error) throw new Error(error.message);
  return data[0] as User;
};

export const loginUser = async (email: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password);
  if (error || !data || data.length === 0) throw new Error('Invalid credentials');
  
  const user = data[0] as User;
  const { password: _, ...userWithoutPassword } = user;
  
  // Return both token and user info (excluding password)
  return {
    token: 'mock-token',
    user: userWithoutPassword
  };
};
