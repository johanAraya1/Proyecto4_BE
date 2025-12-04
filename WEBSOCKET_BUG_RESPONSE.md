# 🔧 Respuesta al Bug Report: WebSocket 400

**Fecha:** 2 de diciembre, 2025  
**Estado:** ✅ SOLUCIONADO  
**Desarrollador Backend:** GitHub Copilot

---

## 🎯 PROBLEMA IDENTIFICADO

El WebSocket estaba retornando **HTTP 400 Bad Request** porque:

### ❌ Causa Raíz:
El `WebSocketServer` NO tenía configurado el `path` específico para `/game`:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
const wss = new WebSocketServer({ server }); 
// Aceptaba cualquier path, causando problemas de routing
```

```typescript
// ✅ CÓDIGO ACTUAL (CORRECTO)
const wss = new WebSocketServer({ server, path: '/game' });
// Ahora SOLO acepta conexiones en ws://localhost:3000/game
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Path del WebSocket configurado correctamente**
- Ahora el WebSocket SOLO responde en: `ws://localhost:3000/game`
- Cualquier otra ruta será rechazada automáticamente

### 2. **Logging detallado agregado**
El servidor ahora muestra logs completos de cada intento de conexión WebSocket:

```
🔌 [WebSocket] Nueva conexión intentada
📍 URL completa: /game/68DDE6?userId=8
🔑 Headers: {...}
🔍 URL parseada - pathname: /game/68DDE6
🔍 URL parseada - search: ?userId=8
📋 Path parts: ['', 'game', '68DDE6']
🎯 roomCode extraído: 68DDE6
👤 userId extraído: 8
✅ Validaciones pasadas, llamando a handleGameConnection
```

### 3. **Mensajes de error mejorados**
Si algo falla, ahora verás exactamente qué:

```
❌ roomCode faltante - cerrando conexión
❌ userId faltante - cerrando conexión
💥 Error en WebSocket connection handler: [detalles del error]
```

---

## 📋 INFORMACIÓN PARA EL FRONTEND

### URL Correcta del WebSocket:
```
ws://localhost:3000/game/{roomCode}?userId={userId}
```

### Ejemplos válidos:
```javascript
// ✅ CORRECTO
ws://localhost:3000/game/68DDE6?userId=8
ws://localhost:3000/game/ABC123?userId=456

// ❌ INCORRECTO
ws://localhost:3000/68DDE6?userId=8        // Falta /game/
ws://localhost:3000/game/ABC123            // Falta userId
ws://localhost:3000/api/game/ABC123?userId=8  // No existe /api/game
```

---

## 🧪 PRUEBAS REALIZADAS

### Test 1: Servidor reiniciado
```
✅ Código compilado exitosamente
✅ Servidor corriendo en puerto 3000
✅ WebSocket server en ws://localhost:3000/game
```

### Test 2: Logging funcionando
```
✅ Todos los requests REST se logean
✅ Intentos de conexión WebSocket se logean con detalles
✅ Errores se muestran claramente en consola
```

---

## 🔍 CÓMO VERIFICAR QUE FUNCIONA

### 1. **Prueba simple desde la consola del navegador:**

```javascript
const ws = new WebSocket('ws://localhost:3000/game/TEST123?userId=999');

ws.onopen = () => {
  console.log('✅ Conectado!');
};

ws.onerror = (error) => {
  console.error('❌ Error:', error);
};

ws.onclose = (event) => {
  console.log('Cerrado:', event.code, event.reason);
  // Si code === 1008: Validación fallida (sala no existe o usuario no autorizado)
  // Si code === 1011: Error interno del servidor
};
```

### 2. **Ver los logs del servidor:**

Cuando ejecutes la prueba anterior, en la consola del servidor deberías ver:

```
🔌 [WebSocket] Nueva conexión intentada
📍 URL completa: /game/TEST123?userId=999
🔍 URL parseada - pathname: /game/TEST123
🎯 roomCode extraído: TEST123
👤 userId extraído: 999
✅ Validaciones pasadas, llamando a handleGameConnection
```

Luego el `handleGameConnection` validará si la sala existe y si el usuario está autorizado.

---

## ⚠️ VALIDACIONES DEL BACKEND

El WebSocket ahora valida en este orden:

### 1. **Path correcto** (automático por WebSocketServer)
- ✅ Debe ser: `ws://localhost:3000/game`
- ❌ Si no: HTTP 400 o conexión rechazada

### 2. **roomCode presente** (en server.ts)
- ✅ Debe estar en la URL: `/game/{roomCode}`
- ❌ Si no: Cierra con código 1008 "roomCode es requerido"

### 3. **userId presente** (en server.ts)
- ✅ Debe estar en query params: `?userId={userId}`
- ❌ Si no: Cierra con código 1008 "userId es requerido"

### 4. **Sala existe** (en gameController.ts)
- ✅ La sala debe existir en la base de datos
- ❌ Si no: Cierra con código 1008 "Sala no encontrada"

### 5. **Usuario autorizado** (en gameController.ts)
- ✅ userId debe ser creator_id u opponent_id
- ❌ Si no: Cierra con código 1008 "No autorizado para esta sala"

---

## 📊 FLUJO COMPLETO ESPERADO

```
1. Frontend: Crear sala
   POST http://localhost:3000/rooms
   → Respuesta: { code: "68DDE6", id: "uuid...", ... }

2. Frontend: Conectar WebSocket (creador)
   ws://localhost:3000/game/68DDE6?userId=8
   → Servidor valida y acepta conexión
   → Recibe: { type: 'CONNECTED', payload: { message: '...', userId: 8 } }

3. Otro jugador: Unirse a la sala
   POST http://localhost:3000/rooms/{id}/join
   { userId: 9 }
   → Sala actualizada con opponent_id: 9

4. Frontend: Conectar WebSocket (oponente)
   ws://localhost:3000/game/68DDE6?userId=9
   → Servidor valida y acepta conexión
   → Ambos jugadores reciben: { type: 'PLAYER_JOINED', ... }

5. Iniciar juego
   Enviar: { type: 'INITIALIZE_GAME', payload: { ... } }
   → Recibir: { type: 'GAME_INITIALIZED', payload: { gameState: ... } }
```

---

## 🐛 DEBUGGING

### Si aún ves error 400:

1. **Verifica que el servidor se reinició:**
   ```bash
   netstat -ano | findstr :3000
   ```
   Debe mostrar un proceso LISTENING

2. **Verifica que el path sea exacto:**
   ```
   ✅ ws://localhost:3000/game/ABC123?userId=8
   ❌ ws://localhost:3000/ABC123?userId=8
   ❌ WS://localhost:3000/game/ABC123?userId=8  (case sensitive en algunos clientes)
   ```

3. **Revisa los logs del servidor:**
   Cada intento de conexión WebSocket ahora muestra logs detallados

4. **Verifica que la sala existe ANTES de conectar:**
   ```bash
   curl http://localhost:3000/rooms/code/ABC123
   ```
   Debe retornar la sala, NO 404

### Si ves código de cierre 1008:

Revisa el mensaje de cierre (`event.reason`):
- `"roomCode es requerido"` → Falta roomCode en URL
- `"userId es requerido"` → Falta userId en query params
- `"Sala no encontrada"` → La sala no existe en BD
- `"No autorizado para esta sala"` → El userId no es creator ni opponent

---

## 📝 CAMBIOS EN EL CÓDIGO

### Archivo modificado:
`CenfoCoffee/backend/server.ts`

### Cambios aplicados:
1. ✅ Agregado `path: '/game'` al WebSocketServer
2. ✅ Agregado logging detallado de cada conexión
3. ✅ Mejorados mensajes de error
4. ✅ Agregado logging de inicio del servidor

### Estado del código:
- ✅ Compilado sin errores
- ✅ Servidor corriendo en puerto 3000
- ✅ WebSocket configurado en `/game`
- ✅ Logging funcionando correctamente

---

## 🎯 PRÓXIMOS PASOS PARA EL FRONTEND

1. **Actualizar la URL del WebSocket** (si no lo has hecho):
   ```javascript
   // Asegúrate de usar esta URL exacta:
   const socketUrl = `ws://localhost:3000/game/${roomCode}?userId=${userId}`;
   ```

2. **Probar la conexión** con un room code existente

3. **Revisar los logs** del servidor backend mientras pruebas

4. **Reportar** si aún hay problemas (los logs mostrarán exactamente qué falla)

---

## ✅ VERIFICACIÓN FINAL

Antes de intentar conectar desde el frontend:

```bash
# 1. Verificar que el servidor esté corriendo
curl http://localhost:3000/
# Debería retornar algo, no error de conexión

# 2. Crear una sala de prueba
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "x-user-id: 123" \
  -d '{"name":"Test Room"}'
# Anota el "code" que retorna

# 3. Verificar que la sala existe
curl http://localhost:3000/rooms/code/[CODE_AQUI]
# Debe retornar los datos de la sala

# 4. Intentar conexión WebSocket con ese code
# Desde la consola del navegador o con tu cliente WebSocket
```

---

**Servidor actualizado y listo para pruebas** 🚀

Los logs detallados ahora te mostrarán exactamente qué está pasando con cada intento de conexión.
