/**
 * Script para verificar y diagnosticar el problema del game_state
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'CenfoCoffee', 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAndFix() {
  console.log('\n🔧 VERIFICACIÓN Y DIAGNÓSTICO\n');
  console.log('═'.repeat(80));

  // Verificar todos los game_states
  const { data: allStates, error } = await supabase
    .from('game_state')
    .select('match_id, player1_id, player2_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Estados de juego encontrados: ${allStates.length}\n`);

  if (allStates.length === 0) {
    console.log('⚠️  NO HAY ESTADOS DE JUEGO GUARDADOS');
    console.log('\n🔍 Esto significa que:');
    console.log('   1. El evento GRID_INITIALIZED no se está enviando desde el frontend');
    console.log('   2. O hay un error al guardar el estado inicial\n');
  } else {
    console.log('Estados recientes:');
    allStates.forEach((state, i) => {
      console.log(`\n${i + 1}. Match ID: ${state.match_id}`);
      console.log(`   Player 1: ${state.player1_id}`);
      console.log(`   Player 2: ${state.player2_id}`);
      console.log(`   Creado: ${new Date(state.created_at).toLocaleString()}`);
    });
  }

  // Verificar eventos de juego
  console.log('\n\n📜 EVENTOS DE JUEGO RECIENTES:\n');
  
  const { data: events } = await supabase
    .from('game_events')
    .select('match_id, type, actor_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (events && events.length > 0) {
    const eventTypes = {};
    events.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    console.log('Tipos de eventos registrados:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\n📝 Últimos 5 eventos:');
    events.slice(0, 5).forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.type}`);
      console.log(`   Match ID: ${event.match_id}`);
      console.log(`   Actor ID: ${event.actor_id}`);
      console.log(`   Timestamp: ${new Date(event.created_at).toLocaleString()}`);
    });
  } else {
    console.log('⚠️  NO HAY EVENTOS DE JUEGO REGISTRADOS');
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 RECOMENDACIÓN:\n');
  console.log('Si no ves eventos GRID_INITIALIZED, el problema está en el frontend.');
  console.log('El frontend debe enviar este evento al conectarse via WebSocket:\n');
  console.log('```javascript');
  console.log('ws.send(JSON.stringify({');
  console.log('  type: "GRID_INITIALIZED",');
  console.log('  payload: {');
  console.log('    grid: [...],');
  console.log('    gridString: "...",');
  console.log('    playerPositions: { player1: {...}, player2: {...} },');
  console.log('    player1Orders: [...],');
  console.log('    player2Orders: [...]');
  console.log('  }');
  console.log('}));');
  console.log('```\n');
}

verifyAndFix()
  .catch(error => console.error('💥 Error:', error))
  .finally(() => process.exit(0));
