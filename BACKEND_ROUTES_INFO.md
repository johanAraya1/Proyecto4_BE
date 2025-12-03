# 🔧 INFORMACIÓN COMPLETA DEL BACKEND - localhost:3000

**Última actualización:** 2 de diciembre, 2025
**Estado:** ✅ Servidor corriendo y actualizado

---

## 📍 RUTAS REST API

### Salas de Juego (/rooms)

```
POST   http://localhost:3000/rooms
GET    http://localhost:3000/rooms
GET    http://localhost:3000/rooms/user/:userId
GET    http://localhost:3000/rooms/code/:code
GET    http://localhost:3000/rooms/:code/game-details
GET    http://localhost:3000/rooms/:code/load-state
GET    http://localhost:3000/rooms/:roomId
POST   http://localhost:3000/rooms/:roomId/join
```

### Autenticación (/auth)
```
POST   http://localhost:3000/auth/register
POST   http://localhost:3000/auth/login
```

### Ranking (/api/ranking)
```
GET    http://localhost:3000/api/ranking
```

### Amigos (/api/friends)
```
Routes disponibles en /api/friends/*
```

### Invitaciones a Salas (/api/room-invitations)
```
Routes disponibles en /api/room-invitations/*
```

### Feature Flags (/api/feature-flags)
```
Routes disponibles en /api/feature-flags/*
```

---

## 🔌 WEBSOCKET DEL JUEGO

### URL del WebSocket:
```
ws://localhost:3000/game/{roomCode}?userId={userId}
```

### Ejemplo:
```
ws://localhost:3000/game/ABC123?userId=456
```

### Estructura del Path:
- **Path base:** `/game/`
- **roomCode:** Código de la sala (ej: ABC123)
- **userId:** Query parameter con el ID del usuario

---

## ✅ VALIDACIONES DEL WEBSOCKET

El WebSocket rechazará la conexión (código 1008) si:

1. ❌ **No se proporciona roomCode** en la URL
   - Error: "roomCode es requerido"

2. ❌ **No se proporciona userId** en query params
   - Error: "userId es requerido"

3. ❌ **La sala no existe** en la base de datos
   - Error: "Sala no encontrada"

4. ❌ **El usuario no es parte de la sala**
   - El usuario debe ser creator_id u opponent_id
   - Error: "No autorizado para esta sala"

---

## 🔑 HEADERS REQUERIDOS

### Para REST API:
```json
{
  "Content-Type": "application/json",
  "x-user-id": "123"  // Opcional, depende del endpoint
}
```

### Para WebSocket:
- ✅ **NO requiere headers de autenticación**
- ✅ **NO requiere token**
- ✅ Solo necesita roomCode y userId en la URL

---

## 🐛 DIFERENCIAS CON NGROK

### En localhost:3000:
- Rutas REST en `/rooms` (NO `/api/rooms`)
- WebSocket en `ws://localhost:3000/game/{roomCode}?userId={userId}`

### Si en ngrok funciona `/api/rooms`:
- Significa que hay una versión diferente del backend en ngrok
- O hay un proxy/gateway que reescribe las rutas

---

## 📝 CÓMO CREAR UNA SALA

### 1. Crear sala:
```bash
POST http://localhost:3000/rooms
Content-Type: application/json
x-user-id: 123

{
  "name": "Mi Sala de Prueba"
}
```

### 2. Respuesta esperada:
```json
{
  "id": "uuid-de-la-sala",
  "code": "ABC123",
  "name": "Mi Sala de Prueba",
  "creator_id": 123,
  "opponent_id": null,
  "status": "waiting"
}
```

### 3. Conectar al WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:3000/game/ABC123?userId=123');

ws.onopen = () => {
  console.log('Conectado a la sala ABC123');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'CONNECTED') {
    console.log('Bienvenida recibida:', message.payload);
  }
};
```

---

## 🔍 DEBUGGING

### Ver logs del servidor:
El servidor muestra en consola:
```
=== INCOMING REQUEST ===
Method: GET
URL: /rooms
Headers: {...}
Body: {...}
========================
```

### Verificar que el servidor esté corriendo:
```bash
netstat -ano | findstr :3000
```

Debería mostrar:
```
TCP    0.0.0.0:3000    LISTENING    [PID]
```

---

## 🚨 PROBLEMAS COMUNES

### ❌ Error 404 en /api/rooms
**Causa:** La ruta correcta es `/rooms`, NO `/api/rooms`
**Solución:** Cambiar la URL a `http://localhost:3000/rooms`

### ❌ WebSocket retorna 400
**Causas posibles:**
1. Falta roomCode en la URL
2. Falta userId en query params
3. La sala no existe
4. El usuario no es parte de la sala

**Solución:** 
1. Crear la sala primero con POST /rooms
2. Usar el código retornado
3. Conectar con el userId correcto

### ❌ WebSocket retorna 404
**Causa:** Path incorrecto del WebSocket
**Solución:** Usar `ws://localhost:3000/game/{roomCode}?userId={userId}`

---

## 📊 CONFIGURACIÓN ACTUAL

### CORS:
```typescript
{
  origin: '*',  // Permite cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true
}
```

### Puerto:
```
3000 (configurable con variable de entorno PORT)
```

### WebSocket Server:
```typescript
path: '/game'  // Acepta conexiones en ws://localhost:3000/game/*
```

---

## 🎯 RESUMEN PARA FRONTEND

### Para crear y unirse a una sala:
1. **POST** `/rooms` → Obtener código de sala
2. **WS** `ws://localhost:3000/game/{code}?userId={id}` → Conectar

### Para listar salas activas:
1. **GET** `/rooms` → Lista de salas

### Para obtener detalles de una sala:
1. **GET** `/rooms/code/{code}` → Detalles por código
2. **GET** `/rooms/{roomId}` → Detalles por ID
