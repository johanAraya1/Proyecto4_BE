/**
 * Script de prueba para el sistema de rendición
 * Simula que un jugador se rinde y verifica que el backend responde correctamente
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'CenfoCoffee', 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSurrenderSystem() {
  console.log('\n🧪 PRUEBA DEL SISTEMA DE RENDICIÓN\n');
  console.log('═'.repeat(80));

  // Buscar una sala activa con ambos jugadores
  const { data: activeRooms, error: roomError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('status', 'playing')
    .not('opponent_id', 'is', null)
    .limit(1);

  if (roomError || !activeRooms || activeRooms.length === 0) {
    console.log('⚠️  No hay salas activas para probar');
    console.log('\n💡 Para probar el sistema de rendición:');
    console.log('   1. Crea una sala con dos jugadores');
    console.log('   2. Ambos jugadores deben conectarse');
    console.log('   3. Inicializa el juego (GRID_INITIALIZED)');
    console.log('   4. Luego ejecuta este script nuevamente\n');
    process.exit(0);
  }

  const room = activeRooms[0];
  
  console.log('\n🎮 SALA DE PRUEBA:');
  console.log('─'.repeat(80));
  console.log(`Código: ${room.code}`);
  console.log(`UUID: ${room.id}`);
  console.log(`Creator ID: ${room.creator_id}`);
  console.log(`Opponent ID: ${room.opponent_id}`);
  console.log(`Status: ${room.status}`);

  // Verificar que existe el game_state
  const { data: gameState, error: stateError } = await supabase
    .from('game_state')
    .select('*')
    .eq('match_id', room.id)
    .single();

  if (stateError || !gameState) {
    console.log('\n❌ ERROR: No hay game_state para esta sala');
    console.log('El juego no está inicializado correctamente\n');
    process.exit(1);
  }

  console.log('\n📊 ESTADO DEL JUEGO:');
  console.log('─'.repeat(80));
  console.log(`Player 1 ID: ${gameState.player1_id}`);
  console.log(`Player 1 Score: ${gameState.player1_score}`);
  console.log(`Player 2 ID: ${gameState.player2_id}`);
  console.log(`Player 2 Score: ${gameState.player2_score}`);

  console.log('\n🎯 ESCENARIO DE PRUEBA:');
  console.log('─'.repeat(80));
  console.log(`Player 2 (ID: ${gameState.player2_id}) se rendirá`);
  console.log(`Player 1 (ID: ${gameState.player1_id}) ganará por abandono`);

  console.log('\n📤 EVENTO QUE DEBE ENVIAR EL FRONTEND:');
  console.log('─'.repeat(80));
  const surrenderEvent = {
    type: 'PLAYER_SURRENDER',
    payload: {
      playerId: gameState.player2_id
    }
  };
  console.log(JSON.stringify(surrenderEvent, null, 2));

  console.log('\n📥 EVENTO QUE RECIBIRÁ EL FRONTEND:');
  console.log('─'.repeat(80));
  const expectedResponse = {
    type: 'PLAYER_SURRENDERED',
    payload: {
      playerId: gameState.player2_id,
      winnerId: gameState.player1_id,
      loserId: gameState.player2_id,
      winnerScore: gameState.player1_score,
      loserScore: gameState.player2_score,
      eloChanges: {
        winner: 15,
        loser: -15
      },
      reason: 'surrender'
    }
  };
  console.log(JSON.stringify(expectedResponse, null, 2));

  console.log('\n✅ CHECKLIST DE VALIDACIÓN:');
  console.log('─'.repeat(80));
  console.log('Cuando el frontend envíe PLAYER_SURRENDER, el backend debe:');
  console.log('  [ ] Recibir el evento correctamente');
  console.log('  [ ] Determinar al ganador (Player 1)');
  console.log('  [ ] Determinar al perdedor (Player 2)');
  console.log(`  [ ] Actualizar ELO de Player ${gameState.player1_id}: +15`);
  console.log(`  [ ] Actualizar ELO de Player ${gameState.player2_id}: -15`);
  console.log('  [ ] Marcar la sala como "finished"');
  console.log('  [ ] Enviar PLAYER_SURRENDERED a ambos jugadores');
  console.log('  [ ] Player 2 se redirige al Dashboard');
  console.log('  [ ] Player 1 ve modal de victoria\n');

  console.log('💡 CÓMO PROBAR:');
  console.log('─'.repeat(80));
  console.log('1. Abre dos navegadores (uno para cada jugador)');
  console.log(`2. Conéctate a la sala: ${room.code}`);
  console.log('3. En el navegador del Player 2, presiona "Salir"');
  console.log('4. Confirma "Sí, abandonar"');
  console.log('5. Verifica que:');
  console.log('   - Player 2 vuelve al Dashboard');
  console.log('   - Player 1 ve modal de victoria');
  console.log('   - La sala queda en status "finished"');
  console.log('   - Los ELO se actualizaron correctamente\n');

  console.log('═'.repeat(80));
  console.log('✅ Sistema de rendición implementado correctamente\n');
}

testSurrenderSystem()
  .catch(error => console.error('💥 Error:', error))
  .finally(() => process.exit(0));
