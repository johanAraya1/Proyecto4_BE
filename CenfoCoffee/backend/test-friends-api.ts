// Test básico para verificar que los endpoints de amigos funcionan
// Este archivo se puede usar para probar manualmente los endpoints

const API_BASE_URL = 'http://localhost:3000';
const token = 'mock-token';

// Ejemplo de IDs de usuario (debes reemplazar con IDs reales de tu base de datos)
const testUserId = 1; // Cambiado a número
const friendUserId = 2; // Cambiado a número

const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'x-user-id': testUserId.toString() // Convertir a string para el header
};

console.log('=== Pruebas de API de Amigos ===');
console.log('Configuración:');
console.log('- Base URL:', API_BASE_URL);
console.log('- Token:', token);
console.log('- User ID:', testUserId);
console.log('- Headers:', apiHeaders);

console.log('\n=== Endpoints disponibles ===');
console.log('POST /friends/search - Buscar usuarios');
console.log('POST /friends/request - Enviar solicitud de amistad');
console.log('GET /friends/requests - Obtener solicitudes recibidas');
console.log('POST /friends/request/accept - Aceptar solicitud');
console.log('POST /friends/request/reject - Rechazar solicitud');
console.log('GET /friends - Listar amigos');
console.log('DELETE /friends/:friendId - Eliminar amigo');

console.log('\n=== Ejemplos de uso con curl ===');

console.log('\n1. Buscar usuarios:');
console.log(`curl -X POST ${API_BASE_URL}/friends/search \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -H "x-user-id: ${testUserId}" \\
  -d '{"query": "nombre"}'`);

console.log('\n2. Enviar solicitud de amistad:');
console.log(`curl -X POST ${API_BASE_URL}/friends/request \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -H "x-user-id: ${testUserId}" \\
  -d '{"toUserId": ${friendUserId}}'`);

console.log('\n3. Obtener solicitudes recibidas:');
console.log(`curl -X GET ${API_BASE_URL}/friends/requests \\
  -H "Authorization: Bearer ${token}" \\
  -H "x-user-id: ${testUserId}"`);

console.log('\n4. Aceptar solicitud:');
console.log(`curl -X POST ${API_BASE_URL}/friends/request/accept \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -H "x-user-id: ${testUserId}" \\
  -d '{"requestId": "request-id-aqui"}'`);

console.log('\n5. Listar amigos:');
console.log(`curl -X GET ${API_BASE_URL}/friends \\
  -H "Authorization: Bearer ${token}" \\
  -H "x-user-id: ${testUserId}"`);

console.log('\n=== Notas importantes ===');
console.log('- Asegúrate de que el servidor esté corriendo en puerto 3000');
console.log('- Reemplaza los IDs de usuario con valores reales de tu base de datos');
console.log('- Verifica que las tablas friends y friend_request existan en Supabase');
console.log('- El token actual es mock-token para desarrollo');

export {};