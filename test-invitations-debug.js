const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testInvitations() {
  console.log(`\n${colors.cyan}=== DIAGNÓSTICO DE INVITACIONES ===${colors.reset}\n`);

  try {
    // 1. Verificar que hay usuarios
    console.log(`${colors.blue}1. Verificando usuarios...${colors.reset}`);
    
    // 2. Verificar invitaciones recibidas (usuario 2)
    console.log(`\n${colors.blue}2. Obteniendo invitaciones recibidas (usuario 2)...${colors.reset}`);
    try {
      const receivedResponse = await axios.get(`${BASE_URL}/api/room-invitations/received`, {
        headers: { 'x-user-id': '2' }
      });
      console.log(`${colors.green}✓ Respuesta:${colors.reset}`, JSON.stringify(receivedResponse.data, null, 2));
    } catch (error) {
      console.log(`${colors.red}✗ Error:${colors.reset}`, error.response?.data || error.message);
    }

    // 3. Verificar invitaciones enviadas (usuario 1)
    console.log(`\n${colors.blue}3. Obteniendo invitaciones enviadas (usuario 1)...${colors.reset}`);
    try {
      const sentResponse = await axios.get(`${BASE_URL}/api/room-invitations/sent`, {
        headers: { 'x-user-id': '1' }
      });
      console.log(`${colors.green}✓ Respuesta:${colors.reset}`, JSON.stringify(sentResponse.data, null, 2));
    } catch (error) {
      console.log(`${colors.red}✗ Error:${colors.reset}`, error.response?.data || error.message);
    }

    // 4. Intentar crear una sala
    console.log(`\n${colors.blue}4. Creando una sala de prueba (usuario 1)...${colors.reset}`);
    let roomId;
    let roomCode;
    try {
      const createRoomResponse = await axios.post(`${BASE_URL}/api/rooms`, 
        { difficulty: 'medium' },
        { headers: { 'x-user-id': '1' } }
      );
      roomId = createRoomResponse.data.id;
      roomCode = createRoomResponse.data.code;
      console.log(`${colors.green}✓ Sala creada:${colors.reset} ID=${roomId}, Code=${roomCode}`);
    } catch (error) {
      console.log(`${colors.red}✗ Error creando sala:${colors.reset}`, error.response?.data || error.message);
      return;
    }

    // 5. Enviar invitación
    console.log(`\n${colors.blue}5. Enviando invitación a usuario 2...${colors.reset}`);
    let invitationId;
    try {
      const sendResponse = await axios.post(`${BASE_URL}/api/room-invitations/send`,
        {
          toUserId: 2,
          roomId: roomId
        },
        { headers: { 'x-user-id': '1' } }
      );
      invitationId = sendResponse.data.invitation.id;
      console.log(`${colors.green}✓ Invitación enviada:${colors.reset}`, JSON.stringify(sendResponse.data, null, 2));
    } catch (error) {
      console.log(`${colors.red}✗ Error enviando invitación:${colors.reset}`, error.response?.data || error.message);
      return;
    }

    // 6. Ver invitaciones recibidas nuevamente
    console.log(`\n${colors.blue}6. Verificando invitaciones recibidas (usuario 2)...${colors.reset}`);
    try {
      const receivedResponse = await axios.get(`${BASE_URL}/api/room-invitations/received`, {
        headers: { 'x-user-id': '2' }
      });
      console.log(`${colors.green}✓ Invitaciones recibidas:${colors.reset}`, JSON.stringify(receivedResponse.data, null, 2));
    } catch (error) {
      console.log(`${colors.red}✗ Error:${colors.reset}`, error.response?.data || error.message);
    }

    // 7. Intentar aceptar invitación
    console.log(`\n${colors.blue}7. Aceptando invitación ${invitationId}...${colors.reset}`);
    try {
      const acceptResponse = await axios.post(`${BASE_URL}/api/room-invitations/accept`,
        { invitationId: invitationId },
        { headers: { 'x-user-id': '2' } }
      );
      console.log(`${colors.green}✓ Invitación aceptada:${colors.reset}`, JSON.stringify(acceptResponse.data, null, 2));
    } catch (error) {
      console.log(`${colors.red}✗ Error aceptando:${colors.reset}`, error.response?.data || error.message);
    }

    // 8. Crear otra sala y probar rechazo
    console.log(`\n${colors.blue}8. Creando otra sala para probar rechazo...${colors.reset}`);
    try {
      const createRoomResponse2 = await axios.post(`${BASE_URL}/api/rooms`, 
        { difficulty: 'hard' },
        { headers: { 'x-user-id': '1' } }
      );
      const roomId2 = createRoomResponse2.data.id;
      console.log(`${colors.green}✓ Segunda sala creada:${colors.reset} ID=${roomId2}`);

      // Enviar segunda invitación
      const sendResponse2 = await axios.post(`${BASE_URL}/api/room-invitations/send`,
        {
          toUserId: 2,
          roomId: roomId2
        },
        { headers: { 'x-user-id': '1' } }
      );
      const invitationId2 = sendResponse2.data.invitation.id;
      console.log(`${colors.green}✓ Segunda invitación enviada:${colors.reset} ID=${invitationId2}`);

      // Rechazar
      console.log(`\n${colors.blue}9. Rechazando invitación ${invitationId2}...${colors.reset}`);
      const rejectResponse = await axios.post(`${BASE_URL}/api/room-invitations/reject`,
        { invitationId: invitationId2 },
        { headers: { 'x-user-id': '2' } }
      );
      console.log(`${colors.green}✓ Invitación rechazada:${colors.reset}`, JSON.stringify(rejectResponse.data, null, 2));
    } catch (error) {
      console.log(`${colors.red}✗ Error:${colors.reset}`, error.response?.data || error.message);
    }

    console.log(`\n${colors.cyan}=== DIAGNÓSTICO COMPLETADO ===${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}Error general:${colors.reset}`, error.message);
  }
}

// Ejecutar
testInvitations();
