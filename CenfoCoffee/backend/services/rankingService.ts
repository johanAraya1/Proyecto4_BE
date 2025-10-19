import { supabase } from '../utils/supabaseClient';

export async function getTop10Players() {
  const { data, error } = await supabase.rpc("get_top10_players");

  if (error) throw error;
  return data;
}