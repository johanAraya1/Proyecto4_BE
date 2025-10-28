const http = require('http');

console.log('🧪 Probando endpoints...');

// Test friends/list
http.get('http://localhost:3000/friends/list', (res) => {
  console.log(`\n📋 GET /friends/list - Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data.substring(0, 200));
    
    // Test feature-flags después
    http.get('http://localhost:3000/feature-flags', (res2) => {
      console.log(`\n🚩 GET /feature-flags - Status: ${res2.statusCode}`);
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log('Response:', data2.substring(0, 200));
        console.log('\n✅ Pruebas completadas');
      });
    }).on('error', e => console.log('Error feature-flags:', e.message));
  });
}).on('error', e => console.log('Error friends/list:', e.message));