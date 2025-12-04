# 🔧 Fix: Reconexión automática después de rendición

## 📋 Problema
Cuando un jugador se rinde y el backend cierra la conexión WebSocket, el frontend está reconectándose automáticamente a la sala terminada. Esto causa:

```
✅ Mensaje enviado correctamente
🔄 Navegando al Dashboard...
✅ WebSocket conectado a sala: E00FD6  ❌ NO DEBERÍA RECONECTAR
```

## 🎯 Solución requerida en el Frontend

### 1️⃣ Desactivar reconexión cuando la partida termina

En `gameWebSocketService.js`, necesitas agregar una bandera para desactivar la reconexión automática:

```javascript
class GameWebSocketService {
  constructor() {
    this.ws = null;
    this.roomCode = null;
    this.shouldReconnect = true; // 👈 AGREGAR ESTA BANDERA
    // ... resto de propiedades
  }

  // Método para desconectar permanentemente
  disconnectPermanently() {
    console.log('🔌 Desconectando permanentemente del WebSocket');
    this.shouldReconnect = false; // 👈 DESACTIVAR RECONEXIÓN
    
    if (this.ws) {
      this.ws.close(1000, 'Partida terminada');
      this.ws = null;
    }
    
    this.roomCode = null;
  }

  // Modificar el evento 'close' del WebSocket
  setupWebSocket() {
    // ... código existente ...

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket cerrado:', event.code, event.reason);
      
      // Solo reconectar si shouldReconnect es true
      if (this.shouldReconnect && this.roomCode) {
        console.log('🔄 Intentando reconectar...');
        setTimeout(() => this.connect(this.roomCode), 3000);
      } else {
        console.log('❌ No se reconectará - partida terminada o desconectado manualmente');
      }
    };

    // ... resto del código ...
  }

  // Al recibir PLAYER_SURRENDERED
  handlePlayerSurrendered(payload) {
    console.log('🏳️ Jugador se rindió:', payload);
    
    // 👈 DESACTIVAR RECONEXIÓN ANTES DE CERRAR
    this.shouldReconnect = false;
    
    // Procesar el evento de rendición
    // ... mostrar mensaje, actualizar UI, etc ...
    
    // Cerrar WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Partida terminada por rendición');
      this.ws = null;
    }
  }

  // Resetear la bandera cuando se conecta a una nueva sala
  connect(roomCode) {
    this.shouldReconnect = true; // 👈 RESETEAR para permitir reconexión en nuevas partidas
    // ... resto del código de conexión ...
  }
}
```

### 2️⃣ En GameScreen.js - Al presionar "Rendirse"

Modificar el flujo de rendición:

```javascript
const handleSurrender = async () => {
  try {
    console.log('🏳️ Iniciando rendición...');
    
    // 1. Desactivar reconexión ANTES de enviar el evento
    gameWebSocketService.shouldReconnect = false;
    
    // 2. Enviar evento de rendición
    gameWebSocketService.sendPlayerSurrender(userData.id);
    console.log('✅ Evento PLAYER_SURRENDER enviado');
    
    // 3. Esperar un momento para que el servidor procese
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Desconectar permanentemente
    gameWebSocketService.disconnectPermanently();
    
    // 5. Navegar al Dashboard
    console.log('🔄 Navegando al Dashboard...');
    navigation.navigate('Dashboard');
    
  } catch (error) {
    console.error('❌ Error al rendirse:', error);
  }
};
```

### 3️⃣ Listener para PLAYER_SURRENDERED

Si el **otro jugador** se rinde, también debes desconectar:

```javascript
// En el listener de mensajes WebSocket
this.ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'PLAYER_SURRENDERED':
      console.log('🏳️ Otro jugador se rindió');
      
      // Desactivar reconexión
      this.shouldReconnect = false;
      
      // Mostrar mensaje de victoria
      Alert.alert(
        '¡Victoria!',
        `El oponente se rindió. Has ganado ${message.payload.eloChanges.winner} puntos ELO.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Desconectar y volver al Dashboard
              this.disconnectPermanently();
              navigation.navigate('Dashboard');
            }
          }
        ]
      );
      break;
      
    // ... otros casos ...
  }
};
```

## 🔍 Verificación

Después de implementar estos cambios, el flujo debe ser:

1. ✅ Jugador presiona "Rendirse"
2. ✅ `shouldReconnect = false`
3. ✅ Envía `PLAYER_SURRENDER`
4. ✅ Backend procesa y cierra conexión
5. ✅ Frontend recibe cierre sin intentar reconectar
6. ✅ Navega al Dashboard
7. ✅ **NO hay mensaje**: "WebSocket conectado a sala: E00FD6"

## 📊 Logs esperados

### ✅ Correcto:
```
📤 Enviando PLAYER_SURRENDER
✅ Mensaje enviado correctamente
🔌 Desconectando permanentemente del WebSocket
🔄 Navegando al Dashboard...
🔌 WebSocket cerrado: 1000 Partida terminada
❌ No se reconectará - partida terminada o desconectado manualmente
```

### ❌ Incorrecto (estado actual):
```
📤 Enviando PLAYER_SURRENDER
✅ Mensaje enviado correctamente
🔄 Navegando al Dashboard...
✅ WebSocket conectado a sala: E00FD6  👈 ESTO NO DEBE PASAR
```

## 🎯 Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `gameWebSocketService.js` | Agregar `shouldReconnect` flag |
| `gameWebSocketService.js` | Método `disconnectPermanently()` |
| `gameWebSocketService.js` | Modificar `ws.onclose` para verificar flag |
| `gameWebSocketService.js` | Resetear flag en `connect()` |
| `GameScreen.js` | Llamar `disconnectPermanently()` al rendirse |
| `GameScreen.js` | Manejar `PLAYER_SURRENDERED` del oponente |

---

**Notas importantes:**
- El backend ahora rechaza conexiones a salas con status `'finished'`
- El frontend debe desactivar proactivamente la reconexión
- Ambos cambios trabajan juntos para prevenir reconexiones no deseadas
