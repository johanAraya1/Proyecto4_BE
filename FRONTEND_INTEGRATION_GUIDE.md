# 🚀 GUÍA DE INTEGRACIÓN FRONTEND - Backend localhost:3000

**Para:** Desarrollador Frontend
**Fecha:** 2 de diciembre, 2025
**Estado del Backend:** ✅ Corriendo y probado

---

## 🎯 CAMBIOS CRÍTICOS QUE DEBES HACER

### ❌ RUTAS INCORRECTAS (Las que tienes ahora)
```
http://localhost:3000/api/rooms          ❌ NO EXISTE
ws://localhost:3000/api/game/...         ❌ NO EXISTE
```

### ✅ RUTAS CORRECTAS (Las que debes usar)
```
http://localhost:3000/rooms              ✅ CORRECTO
ws://localhost:3000/game/{roomCode}?userId={userId}  ✅ CORRECTO
```

---

## 📍 ENDPOINTS REST - COPIAR Y PEGAR

### 1. Crear una sala
```javascript
const createRoom = async (userId, roomName) => {
  const response = await fetch('http://localhost:3000/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId.toString()
    },
    body: JSON.stringify({
      name: roomName || 'Nueva Sala'
    })
  });
  
  const room = await response.json();
  // room = { id, code, name, creator_id, opponent_id, status }
  return room;
};

// USO:
const room = await createRoom(123, 'Mi Sala');
console.log('Código de sala:', room.code); // Ej: "ABC123"
```

### 2. Listar salas activas
```javascript
const getActiveRooms = async () => {
  const response = await fetch('http://localhost:3000/rooms', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const rooms = await response.json();
  return rooms;
};

// USO:
const rooms = await getActiveRooms();
console.log('Salas disponibles:', rooms);
```

### 3. Obtener sala por código
```javascript
const getRoomByCode = async (roomCode) => {
  const response = await fetch(`http://localhost:3000/rooms/code/${roomCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Sala no encontrada');
  }
  
  const room = await response.json();
  return room;
};

// USO:
const room = await getRoomByCode('ABC123');
```

### 4. Unirse a una sala
```javascript
const joinRoom = async (roomId, userId) => {
  const response = await fetch(`http://localhost:3000/rooms/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId.toString()
    }
  });
  
  const result = await response.json();
  return result;
};

// USO:
const result = await joinRoom('uuid-de-sala', 456);
```

### 5. Obtener detalles del juego
```javascript
const getGameDetails = async (roomCode) => {
  const response = await fetch(`http://localhost:3000/rooms/${roomCode}/game-details`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const details = await response.json();
  return details;
};

// USO:
const gameDetails = await getGameDetails('ABC123');
```

---

## 🔌 WEBSOCKET DEL JUEGO - COPIAR Y PEGAR

### Clase completa para manejar WebSocket del juego

```javascript
class GameWebSocket {
  constructor(roomCode, userId) {
    this.roomCode = roomCode;
    this.userId = userId;
    this.ws = null;
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      // URL CORRECTA del WebSocket
      const wsUrl = `ws://localhost:3000/game/${this.roomCode}?userId=${this.userId}`;
      
      console.log('🔌 Conectando a:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('🔴 WebSocket cerrado:', event.code, event.reason);
        
        // Códigos de cierre del servidor:
        // 1008 - Validación fallida (roomCode, userId, autorización)
        // 1011 - Error interno del servidor
        
        if (event.code === 1008) {
          console.error('Validación fallida:', event.reason);
        }
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📨 Mensaje recibido:', message);
        
        // Emitir a los listeners registrados
        const listeners = this.listeners.get(message.type) || [];
        listeners.forEach(callback => callback(message.payload));
      };
    });
  }

  // Registrar listener para un tipo de mensaje
  on(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType).push(callback);
  }

  // Enviar mensaje al servidor
  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload: {
          ...payload,
          userId: this.userId,
          roomCode: this.roomCode
        }
      };
      
      console.log('📤 Enviando:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket no está conectado');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ===============================
// USO DE LA CLASE
// ===============================

async function iniciarJuego() {
  try {
    // 1. Crear sala
    const room = await createRoom(123, 'Sala de Prueba');
    console.log('Sala creada:', room.code);

    // 2. Conectar WebSocket
    const gameWS = new GameWebSocket(room.code, 123);
    
    // 3. Registrar listeners ANTES de conectar
    gameWS.on('CONNECTED', (data) => {
      console.log('✅ Bienvenida del servidor:', data);
    });

    gameWS.on('GAME_INITIALIZED', (data) => {
      console.log('🎮 Juego inicializado:', data);
    });

    gameWS.on('PLAYER_JOINED', (data) => {
      console.log('👥 Jugador unido:', data);
    });

    gameWS.on('GAME_STATE_UPDATE', (data) => {
      console.log('📊 Estado actualizado:', data);
    });

    gameWS.on('MOVEMENT', (data) => {
      console.log('🏃 Movimiento:', data);
    });

    gameWS.on('COLLECT_INGREDIENT', (data) => {
      console.log('🍕 Ingrediente recolectado:', data);
    });

    gameWS.on('SUBMIT_ORDER', (data) => {
      console.log('📦 Orden enviada:', data);
    });

    gameWS.on('ERROR', (data) => {
      console.error('⚠️ Error del servidor:', data);
    });

    // 4. Conectar
    await gameWS.connect();

    // 5. Enviar mensajes (ejemplos)
    
    // Inicializar juego
    gameWS.send('INITIALIZE_GAME', {});

    // Mover jugador
    gameWS.send('MOVE', {
      direction: 'UP' // o 'DOWN', 'LEFT', 'RIGHT'
    });

    // Recolectar ingrediente
    gameWS.send('COLLECT_INGREDIENT', {
      ingredient: 'CAFE'
    });

    // Enviar orden
    gameWS.send('SUBMIT_ORDER', {
      order: ['CAFE', 'LECHE']
    });

    // Desconectar cuando termines
    // gameWS.disconnect();

  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🎮 TIPOS DE MENSAJES WEBSOCKET

### 📤 MENSAJES QUE PUEDES ENVIAR (Frontend → Backend)

```javascript
// 1. Inicializar juego
{
  type: 'INITIALIZE_GAME',
  payload: {
    userId: 123,
    roomCode: 'ABC123'
  }
}

// 2. Mover jugador
{
  type: 'MOVE',
  payload: {
    userId: 123,
    roomCode: 'ABC123',
    direction: 'UP' // 'UP', 'DOWN', 'LEFT', 'RIGHT'
  }
}

// 3. Recolectar ingrediente
{
  type: 'COLLECT_INGREDIENT',
  payload: {
    userId: 123,
    roomCode: 'ABC123',
    ingredient: 'CAFE' // 'CAFE', 'LECHE', 'AGUA', 'CARAMELO'
  }
}

// 4. Enviar orden
{
  type: 'SUBMIT_ORDER',
  payload: {
    userId: 123,
    roomCode: 'ABC123',
    order: ['CAFE', 'LECHE'] // Array de ingredientes
  }
}

// 5. Cambiar turno
{
  type: 'TOGGLE_TURN',
  payload: {
    userId: 123,
    roomCode: 'ABC123'
  }
}
```

### 📥 MENSAJES QUE RECIBIRÁS (Backend → Frontend)

```javascript
// 1. Conexión exitosa
{
  type: 'CONNECTED',
  payload: {
    message: 'Conectado a la sala ABC123',
    userId: 123
  }
}

// 2. Juego inicializado
{
  type: 'GAME_INITIALIZED',
  payload: {
    gameState: {
      currentTurn: 'player1',
      movementCount: 0,
      ingredientGrid: [...],
      playerPositions: { player1: [0,0], player2: [7,7] },
      player1: { name: '123', score: 0, inventory: [], orders: [] },
      player2: { name: '456', score: 0, inventory: [], orders: [] }
    }
  }
}

// 3. Jugador se unió
{
  type: 'PLAYER_JOINED',
  payload: {
    userId: 456,
    playerNumber: 2
  }
}

// 4. Estado actualizado
{
  type: 'GAME_STATE_UPDATE',
  payload: {
    gameState: { ... }
  }
}

// 5. Movimiento realizado
{
  type: 'MOVEMENT',
  payload: {
    userId: 123,
    direction: 'UP',
    newPosition: [0, 1]
  }
}

// 6. Ingrediente recolectado
{
  type: 'COLLECT_INGREDIENT',
  payload: {
    userId: 123,
    ingredient: 'CAFE',
    inventory: ['CAFE']
  }
}

// 7. Orden enviada
{
  type: 'SUBMIT_ORDER',
  payload: {
    userId: 123,
    valid: true,
    score: 10,
    newOrders: [['CAFE', 'LECHE']]
  }
}

// 8. Error
{
  type: 'ERROR',
  payload: {
    message: 'Descripción del error'
  }
}
```

---

## 🔐 VALIDACIONES IMPORTANTES

### El WebSocket se cerrará (código 1008) si:

1. ❌ **No envías roomCode en la URL**
   ```javascript
   // INCORRECTO
   ws://localhost:3000/game/?userId=123
   
   // CORRECTO
   ws://localhost:3000/game/ABC123?userId=123
   ```

2. ❌ **No envías userId en query params**
   ```javascript
   // INCORRECTO
   ws://localhost:3000/game/ABC123
   
   // CORRECTO
   ws://localhost:3000/game/ABC123?userId=123
   ```

3. ❌ **La sala no existe**
   - Debes crear la sala PRIMERO con POST /rooms
   - Luego conectarte al WebSocket con el código recibido

4. ❌ **El usuario no es parte de la sala**
   - Solo creator_id u opponent_id pueden conectarse
   - Si eres un tercer usuario, primero únete con POST /rooms/:roomId/join

---

## 🧪 SCRIPT DE PRUEBA COMPLETO

### Prueba en la consola del navegador:

```javascript
// ==================================
// SCRIPT DE PRUEBA - COPIAR TODO
// ==================================

async function testBackend() {
  const userId = Math.floor(Math.random() * 10000); // Usuario aleatorio
  
  console.log('👤 Usuario de prueba:', userId);

  // 1. CREAR SALA
  console.log('\n1️⃣ Creando sala...');
  const createResponse = await fetch('http://localhost:3000/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId.toString()
    },
    body: JSON.stringify({ name: 'Sala de Prueba' })
  });

  if (!createResponse.ok) {
    console.error('❌ Error al crear sala:', await createResponse.text());
    return;
  }

  const room = await createResponse.json();
  console.log('✅ Sala creada:', room);

  // 2. LISTAR SALAS
  console.log('\n2️⃣ Listando salas activas...');
  const listResponse = await fetch('http://localhost:3000/rooms');
  const rooms = await listResponse.json();
  console.log('✅ Salas activas:', rooms);

  // 3. OBTENER SALA POR CÓDIGO
  console.log('\n3️⃣ Obteniendo sala por código...');
  const getRoomResponse = await fetch(`http://localhost:3000/rooms/code/${room.code}`);
  const roomByCode = await getRoomResponse.json();
  console.log('✅ Sala obtenida:', roomByCode);

  // 4. CONECTAR WEBSOCKET
  console.log('\n4️⃣ Conectando al WebSocket...');
  const wsUrl = `ws://localhost:3000/game/${room.code}?userId=${userId}`;
  console.log('🔌 URL:', wsUrl);
  
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ WebSocket conectado');

    // 5. INICIALIZAR JUEGO
    console.log('\n5️⃣ Inicializando juego...');
    ws.send(JSON.stringify({
      type: 'INITIALIZE_GAME',
      payload: { userId, roomCode: room.code }
    }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('📨 Mensaje recibido:', message);

    // Si recibimos GAME_INITIALIZED, hacer un movimiento de prueba
    if (message.type === 'GAME_INITIALIZED') {
      console.log('\n6️⃣ Enviando movimiento de prueba...');
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'MOVE',
          payload: { userId, roomCode: room.code, direction: 'UP' }
        }));
      }, 1000);
    }
  };

  ws.onerror = (error) => {
    console.error('❌ Error en WebSocket:', error);
  };

  ws.onclose = (event) => {
    console.log('🔴 WebSocket cerrado:', event.code, event.reason);
  };

  // Guardar referencia global para poder cerrar después
  window.testWS = ws;
  window.testRoom = room;
  
  console.log('\n💡 Usa window.testWS para interactuar con el WebSocket');
  console.log('💡 Usa window.testRoom para ver los datos de la sala');
  console.log('💡 Cierra con: window.testWS.close()');
}

// EJECUTAR PRUEBA
testBackend();
```

---

## 🐛 DEBUGGING

### Ver todos los logs en el servidor:
El servidor muestra TODOS los requests en consola:
```
=== INCOMING REQUEST ===
Method: POST
URL: /rooms
Headers: { ... }
Body: { ... }
========================
```

### Verificar que el servidor esté corriendo:
```bash
# PowerShell
netstat -ano | findstr :3000
```

Deberías ver:
```
TCP    0.0.0.0:3000    LISTENING    [PID]
```

---

## 📋 CHECKLIST DE INTEGRACIÓN

- [ ] Cambiar URLs de `/api/rooms` a `/rooms`
- [ ] Cambiar WebSocket de `/api/game/...` a `/game/{roomCode}?userId={userId}`
- [ ] Crear sala ANTES de conectar WebSocket
- [ ] Usar el código de sala retornado por POST /rooms
- [ ] Pasar userId como query parameter en WebSocket
- [ ] Registrar listeners ANTES de conectar el WebSocket
- [ ] Manejar código de cierre 1008 (validación fallida)
- [ ] Probar con el script de prueba primero

---

## ❓ FAQ

### ¿Por qué devuelve 404 en /api/rooms?
**R:** Porque las rutas están en `/rooms`, NO en `/api/rooms`. Cambia tu código.

### ¿Por qué el WebSocket devuelve 400?
**R:** Verifica que:
1. La URL incluya roomCode: `ws://localhost:3000/game/ABC123?userId=123`
2. La sala exista (créala primero)
3. El userId sea correcto

### ¿Cómo sé si el backend está corriendo?
**R:** Abre `http://localhost:3000/` en el navegador. Deberías ver una respuesta JSON.

### ¿Qué pasa si otro jugador se une?
**R:** Recibirás un mensaje tipo `PLAYER_JOINED` por WebSocket.

### ¿Cómo inicio el juego?
**R:** Envía mensaje tipo `INITIALIZE_GAME` después de conectar el WebSocket.

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecuta el script de prueba** en la consola del navegador
2. **Verifica que funcione** todo antes de integrar
3. **Actualiza tu código** con las URLs correctas
4. **Prueba la integración** paso a paso
5. **Revisa los logs** del servidor si algo falla

---

**¿Dudas?** Revisa los logs del servidor - muestran TODOS los requests entrantes.
