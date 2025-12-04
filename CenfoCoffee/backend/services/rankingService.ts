import { supabase } from '../utils/supabaseClient';

// Retrieves top 10 players ranked by ELO rating using database function
export async function getTop10Players() {
  const { data, error } = await supabase.rpc("get_top10_players");

  if (error) throw error;
  return data;
}