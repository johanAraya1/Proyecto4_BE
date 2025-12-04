import { supabase } from '../../CenfoCoffee/backend/utils/supabaseClient';

// NOTE: Adjust table name and keys according to your Supabase schema
const TEST_TABLE = 'users';

describe('Supabase integration tests', () => {
  beforeAll(async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('Skipping supabase integration tests: SUPABASE_URL or SUPABASE_KEY not set');
      return;
    }
  });

  test('insert, fetch and delete a user', async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return;
    }

    const email = `test+${Date.now()}@example.com`;
    const payload = { email, name: 'Test User', password: 'secret', role: 'player' };

    // Insert
    const { data: insertData, error: insertError } = await supabase.from(TEST_TABLE).insert(payload).select();
    expect(insertError).toBeNull();
    expect(insertData).toBeDefined();
    const inserted = (insertData as any[])[0];
    expect(inserted.email).toBe(email);

    // Fetch
    const { data: fetchData, error: fetchError } = await supabase.from(TEST_TABLE).select('*').eq('email', email);
    expect(fetchError).toBeNull();
    expect(fetchData && (fetchData as any[]).length).toBeGreaterThanOrEqual(1);

    // Cleanup
    const { error: delError } = await supabase.from(TEST_TABLE).delete().eq('email', email);
    expect(delError).toBeNull();
  });
});
