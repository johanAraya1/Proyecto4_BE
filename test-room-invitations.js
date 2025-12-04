/**
 * Script de prueba para el sistema de invitaciones a salas
 * Ejecutar con: node test-room-invitations.js
 * 
 * Prerequisitos:
 * - Servidor corriendo en http://localhost:3000
 * - Usuarios 1 y 2 existen en la base de datos
 * - Usuarios 1 y 2 son amigos
 */

const BASE_URL = 'http://localhost:3000';

// Utilidad para hacer peticiones
async function request(method, endpoint, data = null, userId = 1) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId.toString()
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData
  };
}

// Pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas del sistema de invitaciones a salas...\n');

  try {
    // Test 1: Crear una sala
    console.log('📝 Test 1: Crear sala...');
    const createRoomResult = await request('POST', '/rooms', { user_id: '1' }, 1);
    
    if (createRoomResult.status !== 201) {
      console.error('❌ Error creando sala:', createRoomResult.data);
      return;
    }
    
    const roomId = createRoomResult.data.room.id;
    const roomCode = createRoomResult.data.room.code;
    console.log(`✅ Sala creada: ID=${roomId}, Código=${roomCode}\n`);

    // Test 2: Enviar invitación
    console.log('📝 Test 2: Enviar invitación de Usuario 1 a Usuario 2...');
    const sendInvitationResult = await request(
      'POST', 
      '/api/room-invitations/send', 
      { toUserId: 2, roomId: roomId }, 
      1
    );
    
    if (sendInvitationResult.status !== 201) {
      console.error('❌ Error enviando invitación:', sendInvitationResult.data);
      return;
    }
    
    const invitationId = sendInvitationResult.data.invitation.id;
    console.log(`✅ Invitación enviada: ID=${invitationId}\n`);

    // Test 3: Ver invitaciones recibidas
    console.log('📝 Test 3: Ver invitaciones recibidas por Usuario 2...');
    const receivedResult = await request('GET', '/api/room-invitations/received', null, 2);
    
    if (receivedResult.status !== 200) {
      console.error('❌ Error obteniendo invitaciones recibidas:', receivedResult.data);
      return;
    }
    
    console.log(`✅ Invitaciones recibidas: ${receivedResult.data.invitations.length}`);
    console.log('   Detalles:', JSON.stringify(receivedResult.data.invitations[0], null, 2));
    console.log('');

    // Test 4: Ver invitaciones enviadas
    console.log('📝 Test 4: Ver invitaciones enviadas por Usuario 1...');
    const sentResult = await request('GET', '/api/room-invitations/sent', null, 1);
    
    if (sentResult.status !== 200) {
      console.error('❌ Error obteniendo invitaciones enviadas:', sentResult.data);
      return;
    }
    
    console.log(`✅ Invitaciones enviadas: ${sentResult.data.invitations.length}`);
    console.log('   Detalles:', JSON.stringify(sentResult.data.invitations[0], null, 2));
    console.log('');

    // Test 5: Aceptar invitación
    console.log('📝 Test 5: Aceptar invitación como Usuario 2...');
    const acceptResult = await request(
      'POST', 
      '/api/room-invitations/accept', 
      { invitationId: invitationId }, 
      2
    );
    
    if (acceptResult.status !== 200) {
      console.error('❌ Error aceptando invitación:', acceptResult.data);
      return;
    }
    
    console.log(`✅ Invitación aceptada. Código de sala: ${acceptResult.data.roomCode}\n`);

    // Test 6: Unirse a la sala con el código
    console.log('📝 Test 6: Unirse a la sala usando el código...');
    const joinResult = await request(
      'POST', 
      '/rooms/join-by-code', 
      { code: roomCode, user_id: '2' }, 
      2
    );
    
    if (joinResult.status !== 200) {
      console.error('❌ Error uniéndose a la sala:', joinResult.data);
      return;
    }
    
    console.log('✅ Usuario 2 se unió exitosamente a la sala');
    console.log('   Detalles de la sala:', JSON.stringify(joinResult.data.room, null, 2));
    console.log('');

    // Test 7: Intentar enviar otra invitación (debe fallar porque sala está playing)
    console.log('📝 Test 7: Intentar enviar invitación a sala en juego (debe fallar)...');
    const failResult = await request(
      'POST', 
      '/api/room-invitations/send', 
      { toUserId: 2, roomId: roomId }, 
      1
    );
    
    if (failResult.status === 400) {
      console.log('✅ Validación correcta: No se pueden enviar invitaciones a salas que no están en espera');
      console.log('   Error esperado:', failResult.data.error);
      console.log('');
    } else {
      console.error('❌ Se esperaba un error pero la invitación fue enviada');
      return;
    }

    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!\n');
    console.log('📊 Resumen:');
    console.log('   ✓ Creación de sala');
    console.log('   ✓ Envío de invitación');
    console.log('   ✓ Listado de invitaciones recibidas');
    console.log('   ✓ Listado de invitaciones enviadas');
    console.log('   ✓ Aceptación de invitación');
    console.log('   ✓ Unirse a sala con código');
    console.log('   ✓ Validación de estado de sala');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    console.error(error);
  }
}

// Test de prerequisitos
async function checkPrerequisites() {
  console.log('🔍 Verificando prerequisitos...\n');

  try {
    // Verificar que el servidor está corriendo
    console.log('📡 Verificando servidor...');
    const serverCheck = await fetch(`${BASE_URL}/health`).catch(() => null);
    if (!serverCheck) {
      console.error('❌ El servidor no está corriendo en http://localhost:3000');
      console.log('   Ejecuta: cd CenfoCoffee/backend && npm run dev');
      return false;
    }
    console.log('✅ Servidor corriendo\n');

    // Verificar que los usuarios son amigos
    console.log('👥 Verificando amistad entre usuarios...');
    const friendsCheck = await request('GET', '/api/friends/list', null, 1);
    
    if (friendsCheck.status !== 200) {
      console.error('❌ Error verificando amigos');
      return false;
    }

    const isFriend = friendsCheck.data.friends.some(f => f.friend_id === 2);
    
    if (!isFriend) {
      console.log('⚠️  Los usuarios 1 y 2 no son amigos');
      console.log('   Para hacerlos amigos:');
      console.log('   1. POST /api/friends/request (x-user-id: 1) { "toUserId": 2 }');
      console.log('   2. POST /api/friends/request/accept (x-user-id: 2) { "requestId": <id> }');
      return false;
    }
    
    console.log('✅ Usuarios 1 y 2 son amigos\n');
    return true;

  } catch (error) {
    console.error('❌ Error verificando prerequisitos:', error.message);
    return false;
  }
}

// Ejecutar
(async () => {
  const prerequisitesOk = await checkPrerequisites();
  
  if (prerequisitesOk) {
    await runTests();
  } else {
    console.log('\n⚠️  Por favor, resuelve los prerequisitos antes de ejecutar las pruebas.');
  }
})();
