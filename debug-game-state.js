/**
 * Script de diagnóstico para verificar el estado de las salas y el juego
 * Uso: node debug-game-state.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'CenfoCoffee', 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno SUPABASE_URL y SUPABASE_KEY no encontradas');
  console.log('📍 Buscando en:', path.join(__dirname, 'CenfoCoffee', 'backend', '.env'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGameState() {
  console.log('\n🔍 DIAGNÓSTICO DE ESTADO DEL JUEGO\n');
  console.log('═'.repeat(80));

  // 1. Verificar salas activas
  console.log('\n📋 TODAS LAS SALAS (activas y finalizadas):');
  console.log('─'.repeat(80));
  
  const { data: rooms, error: roomsError } = await supabase
    .from('game_rooms')
    .select('id, code, creator_id, opponent_id, status, created_at')
    .or('creator_id.eq.8,opponent_id.eq.9')
    .order('created_at', { ascending: false })
    .limit(10);

  if (roomsError) {
    console.error('❌ Error al obtener salas:', roomsError);
    return;
  }

  rooms.forEach(room => {
    console.log(`\n🎮 Sala: ${room.code}`);
    console.log(`   UUID: ${room.id}`);
    console.log(`   Creator ID: ${room.creator_id}`);
    console.log(`   Opponent ID: ${room.opponent_id}`);
    console.log(`   Status: ${room.status}`);
  });

  // 2. Verificar usuarios (Jugador 5 y ZERO)
  console.log('\n\n👥 USUARIOS:');
  console.log('─'.repeat(80));
  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', [8, 9]);

  if (usersError) {
    console.error('❌ Error al obtener usuarios:', usersError);
    return;
  }

  users.forEach(user => {
    console.log(`\n👤 ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
  });

  // 3. Verificar estados del juego
  console.log('\n\n🎲 ESTADOS DEL JUEGO (game_state):');
  console.log('─'.repeat(80));

  const roomIds = rooms.map(r => r.id);
  
  const { data: gameStates, error: statesError } = await supabase
    .from('game_state')
    .select('*')
    .in('match_id', roomIds);

  if (statesError) {
    console.error('❌ Error al obtener estados del juego:', statesError);
    return;
  }

  if (gameStates.length === 0) {
    console.log('\n⚠️  No hay estados de juego inicializados para estas salas');
  }

  gameStates.forEach(state => {
    const room = rooms.find(r => r.id === state.match_id);
    console.log(`\n🎯 Estado para sala: ${room?.code || state.match_id}`);
    console.log(`   Match ID: ${state.match_id}`);
    console.log(`   Player 1 ID: ${state.player1_id}`);
    console.log(`   Player 2 ID: ${state.player2_id}`);
    console.log(`   Current Turn: ${state.current_turn}`);
    console.log(`   Movement Count: ${state.movement_count}`);
    console.log('\n   Player 1 Inventory:', JSON.stringify(state.player1_inventory, null, 2));
    console.log('   Player 1 Score:', state.player1_score);
    console.log('   Player 1 Position:', JSON.stringify(state.player1_position));
    console.log('\n   Player 2 Inventory:', JSON.stringify(state.player2_inventory, null, 2));
    console.log('   Player 2 Score:', state.player2_score);
    console.log('   Player 2 Position:', JSON.stringify(state.player2_position));
  });

  // 4. Verificar eventos recientes
  console.log('\n\n📜 EVENTOS RECIENTES (últimos 20):');
  console.log('─'.repeat(80));

  const { data: events, error: eventsError } = await supabase
    .from('game_events')
    .select('match_id, actor_id, type, created_at')
    .in('match_id', roomIds)
    .order('created_at', { ascending: false })
    .limit(20);

  if (eventsError) {
    console.error('❌ Error al obtener eventos:', eventsError);
    return;
  }

  events.forEach(event => {
    const room = rooms.find(r => r.id === event.match_id);
    console.log(`\n📝 ${event.type}`);
    console.log(`   Sala: ${room?.code || event.match_id}`);
    console.log(`   Actor ID: ${event.actor_id}`);
    console.log(`   Timestamp: ${new Date(event.created_at).toLocaleString()}`);
  });

  console.log('\n' + '═'.repeat(80));
  console.log('✅ Diagnóstico completado\n');
}

// Ejecutar diagnóstico
debugGameState()
  .catch(error => {
    console.error('\n💥 Error en el diagnóstico:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
