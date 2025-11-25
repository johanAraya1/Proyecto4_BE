# 🎮 Sistema de Invitaciones a Salas - Diagrama de Flujo

## 📱 Flujo Visual de Usuario

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO A (Creador)                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Crea Sala    │
                    │  POST /rooms  │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Obtiene ID y  │
                    │ Código: ABC123│
                    └───────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Presiona botón "Invitar Amigo"       │
        │  Selecciona: USUARIO B                │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  POST /api/room-invitations/send      │
        │  { toUserId: 2, roomId: "..." }       │
        └───────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ ✅ Invitación Enviada │
                └───────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  USUARIO B recibe notificación        │
        │  "Usuario A te invitó a su sala"      │
        └───────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO B (Invitado)                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Ve sus invitaciones pendientes       │
        │  GET /api/room-invitations/received   │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Lista muestra:                       │
        │  • De: Usuario A                      │
        │  • Código: ABC123                     │
        │  • Estado: Esperando                  │
        └───────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌──────────┐            ┌──────────┐
        │ Aceptar  │            │ Rechazar │
        └──────────┘            └──────────┘
                │                       │
                ▼                       ▼
    ┌────────────────┐        ┌────────────────┐
    │ POST /accept   │        │ POST /reject   │
    └────────────────┘        └────────────────┘
                │                       │
                ▼                       │
    ┌────────────────┐                 │
    │ Recibe código  │                 │
    │ ABC123         │                 │
    └────────────────┘                 │
                │                       │
                ▼                       │
    ┌────────────────┐                 │
    │ POST /join-by- │                 │
    │ code: ABC123   │                 │
    └────────────────┘                 │
                │                       │
                ▼                       ▼
    ┌────────────────┐        ┌────────────────┐
    │ ✅ En la sala  │        │ ❌ Rechazada   │
    │ Jugando!       │        └────────────────┘
    └────────────────┘
```

---

## 🔄 Estado de la Base de Datos

### Antes de Enviar Invitación

```
┌─────────────────────────────────┐
│        TABLE: game_rooms        │
├─────────────────────────────────┤
│ id: 550e8400-...                │
│ code: ABC123                    │
│ creator_id: 1 (Usuario A)       │
│ opponent_id: NULL               │
│ status: waiting                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    TABLE: room_invitation       │
├─────────────────────────────────┤
│          (vacía)                │
└─────────────────────────────────┘
```

### Después de Enviar Invitación

```
┌─────────────────────────────────┐
│        TABLE: game_rooms        │
├─────────────────────────────────┤
│ id: 550e8400-...                │
│ code: ABC123                    │
│ creator_id: 1                   │
│ opponent_id: NULL               │
│ status: waiting                 │ ← Sin cambios
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    TABLE: room_invitation       │
├─────────────────────────────────┤
│ id: 1                           │
│ from_user: 1 (Usuario A)        │
│ to_user: 2 (Usuario B)          │
│ room_id: 550e8400-...           │
│ room_code: ABC123               │
│ status: pending                 │ ← NUEVO
└─────────────────────────────────┘
```

### Después de Aceptar Invitación

```
┌─────────────────────────────────┐
│        TABLE: game_rooms        │
├─────────────────────────────────┤
│ id: 550e8400-...                │
│ code: ABC123                    │
│ creator_id: 1                   │
│ opponent_id: NULL               │ ← Aún NULL
│ status: waiting                 │ ← Aún waiting
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    TABLE: room_invitation       │
├─────────────────────────────────┤
│ id: 1                           │
│ from_user: 1                    │
│ to_user: 2                      │
│ room_id: 550e8400-...           │
│ room_code: ABC123               │
│ status: accepted                │ ← CAMBIÓ
└─────────────────────────────────┘
```

### Después de Unirse con el Código

```
┌─────────────────────────────────┐
│        TABLE: game_rooms        │
├─────────────────────────────────┤
│ id: 550e8400-...                │
│ code: ABC123                    │
│ creator_id: 1                   │
│ opponent_id: 2 (Usuario B)      │ ← CAMBIÓ
│ status: playing                 │ ← CAMBIÓ
└─────────────────────────────────┘

┌─────────────────────────────────┐
│    TABLE: room_invitation       │
├─────────────────────────────────┤
│ id: 1                           │
│ from_user: 1                    │
│ to_user: 2                      │
│ room_id: 550e8400-...           │
│ room_code: ABC123               │
│ status: accepted                │
└─────────────────────────────────┘
```

---

## 🎭 Casos de Uso

### Caso 1: Invitación Exitosa
```
Usuario A → Crea sala
         → Invita a Usuario B (amigo)
         → Usuario B ve invitación
         → Usuario B acepta
         → Usuario B se une con código
         → ✅ Comienza el juego
```

### Caso 2: Invitación Rechazada
```
Usuario A → Crea sala
         → Invita a Usuario B
         → Usuario B ve invitación
         → Usuario B rechaza
         → ❌ Invitación marcada como "rejected"
         → Usuario A puede invitar a otro amigo
```

### Caso 3: Sala se Llena Antes de Aceptar
```
Usuario A → Crea sala
         → Invita a Usuario B
         → Usuario C se une directamente
         → Sala ahora tiene opponent
         → Usuario B intenta aceptar
         → ❌ Error: "La sala ya tiene un oponente"
         → Invitación automáticamente marcada como "expired"
```

### Caso 4: Múltiples Invitaciones
```
Usuario A → Crea sala X
         → Invita a Usuario B
         → Invita a Usuario C
         → Invita a Usuario D
         → Usuario B acepta primero
         → Usuario B se une
         → Todas las demás invitaciones expiran automáticamente
```

### Caso 5: Cancelar Invitación
```
Usuario A → Crea sala
         → Invita a Usuario B
         → Usuario A cambia de opinión
         → Usuario A cancela la invitación
         → DELETE /room-invitations/1
         → ✅ Invitación eliminada
         → Usuario B ya no la ve
```

---

## 🔐 Validaciones en Acción

```
┌────────────────────────────────────────────┐
│  POST /api/room-invitations/send           │
└────────────────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────┐
    │ ¿from_user == to_user?  │ ──YES→ ❌ Error: No puedes invitarte
    └─────────────────────────┘
                  │ NO
                  ▼
    ┌─────────────────────────┐
    │ ¿to_user existe?        │ ──NO→ ❌ Error: Usuario no encontrado
    └─────────────────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────┐
    │ ¿sala existe?           │ ──NO→ ❌ Error: Sala no encontrada
    └─────────────────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────┐
    │ ¿eres el creador?       │ ──NO→ ❌ Error: Solo creador puede invitar
    └─────────────────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────┐
    │ ¿sala en "waiting"?     │ ──NO→ ❌ Error: Sala no disponible
    └─────────────────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────┐
    │ ¿son amigos?            │ ──NO→ ❌ Error: Solo amigos
    └─────────────────────────┘
                  │ YES
                  ▼
    ┌─────────────────────────┐
    │ ¿ya existe invitación?  │ ──YES→ ❌ Error: Invitación duplicada
    └─────────────────────────┘
                  │ NO
                  ▼
        ┌─────────────────┐
        │ ✅ Crear        │
        │ invitación      │
        └─────────────────┘
```

---

## 📊 Relaciones de Tablas

```
┌──────────┐           ┌────────────────────┐           ┌──────────┐
│  users   │           │ room_invitation    │           │game_rooms│
├──────────┤           ├────────────────────┤           ├──────────┤
│ id (PK)  │◄─────────┤from_user (FK)      │           │ id (PK)  │
│ name     │           │to_user (FK)        │──────────►│ code     │
│ email    │           │room_id (FK)        │           │ creator  │
│ elo      │           │room_code           │           │ opponent │
└──────────┘           │status              │           │ status   │
     ▲                 │created_at          │           └──────────┘
     │                 └────────────────────┘
     │                          │
     └──────────────────────────┘

Relaciones:
• from_user → users.id (quien envía)
• to_user → users.id (quien recibe)
• room_id → game_rooms.id (la sala)
```

---

## 🔔 Flujo con Notificaciones (Futuro)

```
Usuario A envía invitación
         │
         ▼
┌────────────────────┐
│ Backend guarda en  │
│ room_invitation    │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ WebSocket/Push     │ ──┐
│ Notification       │   │
└────────────────────┘   │
                         │
                         ▼
         ┌───────────────────────────┐
         │ Usuario B recibe:         │
         │ "Usuario A te invitó a    │
         │ su sala ABC123"           │
         │ [Aceptar] [Rechazar]      │
         └───────────────────────────┘
```

---

## 📈 Métricas Rastreadas

```
Evento                              │ Cuándo se Registra
────────────────────────────────────┼────────────────────────────
room_invitation_sent                │ Al enviar invitación exitosa
room_invitation_send_failed         │ Si falla el envío
room_invitations_received_retrieved │ Al listar invitaciones recibidas
room_invitations_sent_retrieved     │ Al listar invitaciones enviadas
room_invitation_accepted            │ Al aceptar invitación
room_invitation_accept_failed       │ Si falla la aceptación
room_invitation_rejected            │ Al rechazar invitación
room_invitation_cancelled           │ Al cancelar invitación
```

Ver en: `GET http://localhost:3000/telemetry`

---

## 🎯 Testing Rápido

### Prueba Manual en 5 Pasos

```bash
# 1. Crear sala (Usuario 1)
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{"user_id":"1"}'
# Guarda el room_id

# 2. Enviar invitación
curl -X POST http://localhost:3000/api/room-invitations/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{"toUserId":2,"roomId":"<room_id>"}'
# Guarda el invitation_id

# 3. Ver invitaciones (Usuario 2)
curl http://localhost:3000/api/room-invitations/received \
  -H "x-user-id: 2"

# 4. Aceptar invitación
curl -X POST http://localhost:3000/api/room-invitations/accept \
  -H "Content-Type: application/json" \
  -H "x-user-id: 2" \
  -d '{"invitationId":<invitation_id>}'
# Guarda el roomCode

# 5. Unirse con código
curl -X POST http://localhost:3000/rooms/join-by-code \
  -H "Content-Type: application/json" \
  -d '{"code":"<roomCode>","user_id":"2"}'
```

---

## 💡 Tips para Frontend

### Botón "Invitar a Sala"

```javascript
// En el componente de la sala
async function inviteFriend(friendId, roomId) {
  try {
    const response = await fetch('/api/room-invitations/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({
        toUserId: friendId,
        roomId: roomId
      })
    });
    
    if (response.ok) {
      showNotification('✅ Invitación enviada!');
    } else {
      const error = await response.json();
      showNotification('❌ ' + error.message);
    }
  } catch (error) {
    showNotification('❌ Error enviando invitación');
  }
}
```

### Listar Invitaciones Pendientes

```javascript
async function loadInvitations() {
  const response = await fetch('/api/room-invitations/received', {
    headers: {
      'x-user-id': currentUser.id
    }
  });
  
  const data = await response.json();
  
  // data.invitations es un array con:
  // - from_user_name
  // - room_code
  // - room_status
  // - created_at
  
  displayInvitations(data.invitations);
}
```

### Aceptar Invitación

```javascript
async function acceptInvitation(invitationId) {
  const response = await fetch('/api/room-invitations/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': currentUser.id
    },
    body: JSON.stringify({ invitationId })
  });
  
  const data = await response.json();
  
  // data.roomCode contiene el código para unirse
  navigateToJoinRoom(data.roomCode);
}
```

---

## ✅ Lista de Verificación Final

- [ ] Tabla creada en Supabase
- [ ] Backend compilando sin errores
- [ ] Servidor corriendo en puerto 3000
- [ ] Usuarios de prueba existen
- [ ] Usuarios son amigos entre sí
- [ ] Endpoint POST /send funciona
- [ ] Endpoint GET /received funciona
- [ ] Endpoint POST /accept funciona
- [ ] Validaciones funcionan correctamente
- [ ] Expiración automática funciona
- [ ] Telemetría registrando eventos

---

**🎉 Sistema listo para usar!**
