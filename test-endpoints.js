// Script de prueba rápida para verificar que los endpoints funcionen
const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de endpoints...\n');
  
  try {
    // Probar friends/list
    console.log('1. Probando GET /friends/list');
    const friendsList = await testEndpoint('/friends/list');
    console.log(`   Status: ${friendsList.status}`);
    console.log(`   Data: ${friendsList.data}\n`);

    // Probar feature-flags
    console.log('2. Probando GET /feature-flags');
    const featureFlags = await testEndpoint('/feature-flags');
    console.log(`   Status: ${featureFlags.status}`);
    console.log(`   Data: ${featureFlags.data}\n`);

    // Probar friends/find
    console.log('3. Probando POST /friends/find');
    const friendsFind = await testEndpoint('/friends/find', 'POST', { query: 'test' });
    console.log(`   Status: ${friendsFind.status}`);
    console.log(`   Data: ${friendsFind.data}\n`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

runTests();