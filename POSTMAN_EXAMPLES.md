# 📮 Ejemplos Copy-Paste para Postman

Este archivo contiene ejemplos que puedes copiar y pegar directamente en Postman para probar el sistema de invitaciones a salas.

---

## 🔧 Configuración Inicial

### Variables de Entorno
Crea un entorno en Postman con estas variables:

```
base_url = http://localhost:3000
user1 = 1
user2 = 2
```

---

## 📝 Requests de Postman

### 1. Crear Sala (Prerequisito)

**Método:** `POST`  
**URL:** `{{base_url}}/rooms`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "user_id": "{{user1}}"
}
```

**Tests (Scripts):** Guarda el room_id y code automáticamente
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("room_id", jsonData.room.id);
    pm.environment.set("room_code", jsonData.room.code);
    console.log("✅ Sala creada:", jsonData.room);
}
```

---

### 2. Enviar Invitación a Sala

**Método:** `POST`  
**URL:** `{{base_url}}/api/room-invitations/send`

**Headers:**
```
Content-Type: application/json
x-user-id: {{user1}}
```

**Body (raw JSON):**
```json
{
  "toUserId": {{user2}},
  "roomId": "{{room_id}}"
}
```

**Tests:** Guarda el invitation_id
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("invitation_id", jsonData.invitation.id);
    console.log("✅ Invitación enviada:", jsonData.invitation);
}
```

---

### 3. Ver Invitaciones Recibidas

**Método:** `GET`  
**URL:** `{{base_url}}/api/room-invitations/received`

**Headers:**
```
x-user-id: {{user2}}
```

**Tests:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    console.log("📥 Invitaciones recibidas:", jsonData.invitations.length);
    jsonData.invitations.forEach((inv, i) => {
        console.log(`  ${i+1}. De: ${inv.from_user_name}, Código: ${inv.room_code}`);
    });
}
```

---

### 4. Ver Invitaciones Enviadas

**Método:** `GET`  
**URL:** `{{base_url}}/api/room-invitations/sent`

**Headers:**
```
x-user-id: {{user1}}
```

**Tests:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    console.log("📤 Invitaciones enviadas:", jsonData.invitations.length);
    jsonData.invitations.forEach((inv, i) => {
        console.log(`  ${i+1}. Para: ${inv.to_user_name}, Estado: ${inv.status}`);
    });
}
```

---

### 5. Aceptar Invitación

**Método:** `POST`  
**URL:** `{{base_url}}/api/room-invitations/accept`

**Headers:**
```
Content-Type: application/json
x-user-id: {{user2}}
```

**Body (raw JSON):**
```json
{
  "invitationId": {{invitation_id}}
}
```

**Tests:** Muestra el código de sala
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    console.log("✅ Invitación aceptada!");
    console.log("   Código de sala:", jsonData.roomCode);
    pm.environment.set("accepted_room_code", jsonData.roomCode);
}
```

---

### 6. Rechazar Invitación

**Método:** `POST`  
**URL:** `{{base_url}}/api/room-invitations/reject`

**Headers:**
```
Content-Type: application/json
x-user-id: {{user2}}
```

**Body (raw JSON):**
```json
{
  "invitationId": {{invitation_id}}
}
```

**Tests:**
```javascript
if (pm.response.code === 200) {
    console.log("❌ Invitación rechazada");
}
```

---

### 7. Cancelar Invitación

**Método:** `DELETE`  
**URL:** `{{base_url}}/api/room-invitations/{{invitation_id}}`

**Headers:**
```
x-user-id: {{user1}}
```

**Tests:**
```javascript
if (pm.response.code === 200) {
    console.log("🗑️ Invitación cancelada");
}
```

---

### 8. Unirse a Sala con Código (Después de Aceptar)

**Método:** `POST`  
**URL:** `{{base_url}}/rooms/join-by-code`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "code": "{{accepted_room_code}}",
  "user_id": "{{user2}}"
}
```

**Tests:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    console.log("✅ Usuario unido a la sala!");
    console.log("   Creador:", jsonData.room.creator_name);
    console.log("   Oponente:", jsonData.room.opponent_name);
}
```

---

## 🔄 Colección Completa (JSON para Importar)

Copia este JSON completo y pégalo en Postman (Import → Raw text):

```json
{
  "info": {
    "name": "Room Invitations - Complete",
    "description": "Sistema completo de invitaciones a salas",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Room",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 201) {",
              "    const jsonData = pm.response.json();",
              "    pm.environment.set('room_id', jsonData.room.id);",
              "    pm.environment.set('room_code', jsonData.room.code);",
              "    console.log('✅ Sala creada:', jsonData.room);",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"user_id\": \"{{user1}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/rooms",
          "host": ["{{base_url}}"],
          "path": ["rooms"]
        }
      }
    },
    {
      "name": "2. Send Room Invitation",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 201) {",
              "    const jsonData = pm.response.json();",
              "    pm.environment.set('invitation_id', jsonData.invitation.id);",
              "    console.log('✅ Invitación enviada:', jsonData.invitation);",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-user-id",
            "value": "{{user1}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"toUserId\": {{user2}},\n  \"roomId\": \"{{room_id}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/room-invitations/send",
          "host": ["{{base_url}}"],
          "path": ["api", "room-invitations", "send"]
        }
      }
    },
    {
      "name": "3. Get Received Invitations",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const jsonData = pm.response.json();",
              "    console.log('📥 Invitaciones recibidas:', jsonData.invitations.length);",
              "    jsonData.invitations.forEach((inv, i) => {",
              "        console.log(`  ${i+1}. De: ${inv.from_user_name}, Código: ${inv.room_code}`);",
              "    });",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-user-id",
            "value": "{{user2}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/room-invitations/received",
          "host": ["{{base_url}}"],
          "path": ["api", "room-invitations", "received"]
        }
      }
    },
    {
      "name": "4. Get Sent Invitations",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const jsonData = pm.response.json();",
              "    console.log('📤 Invitaciones enviadas:', jsonData.invitations.length);",
              "    jsonData.invitations.forEach((inv, i) => {",
              "        console.log(`  ${i+1}. Para: ${inv.to_user_name}, Estado: ${inv.status}`);",
              "    });",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-user-id",
            "value": "{{user1}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/room-invitations/sent",
          "host": ["{{base_url}}"],
          "path": ["api", "room-invitations", "sent"]
        }
      }
    },
    {
      "name": "5. Accept Invitation",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const jsonData = pm.response.json();",
              "    console.log('✅ Invitación aceptada!');",
              "    console.log('   Código de sala:', jsonData.roomCode);",
              "    pm.environment.set('accepted_room_code', jsonData.roomCode);",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-user-id",
            "value": "{{user2}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invitationId\": {{invitation_id}}\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/room-invitations/accept",
          "host": ["{{base_url}}"],
          "path": ["api", "room-invitations", "accept"]
        }
      }
    },
    {
      "name": "6. Reject Invitation",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    console.log('❌ Invitación rechazada');",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-user-id",
            "value": "{{user2}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invitationId\": {{invitation_id}}\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/room-invitations/reject",
          "host": ["{{base_url}}"],
          "path": ["api", "room-invitations", "reject"]
        }
      }
    },
    {
      "name": "7. Cancel Invitation",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    console.log('🗑️ Invitación cancelada');",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "x-user-id",
            "value": "{{user1}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/room-invitations/{{invitation_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "room-invitations", "{{invitation_id}}"]
        }
      }
    },
    {
      "name": "8. Join Room by Code",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const jsonData = pm.response.json();",
              "    console.log('✅ Usuario unido a la sala!');",
              "    console.log('   Creador:', jsonData.room.creator_name);",
              "    console.log('   Oponente:', jsonData.room.opponent_name);",
              "}"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"code\": \"{{accepted_room_code}}\",\n  \"user_id\": \"{{user2}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/rooms/join-by-code",
          "host": ["{{base_url}}"],
          "path": ["rooms", "join-by-code"]
        }
      }
    }
  ]
}
```

---

## 🎯 Orden de Ejecución Recomendado

Ejecuta los requests en este orden para una prueba completa:

1. **Create Room** → Guarda `room_id` y `room_code`
2. **Send Room Invitation** → Guarda `invitation_id`
3. **Get Received Invitations** → Verifica que aparece la invitación
4. **Get Sent Invitations** → Verifica desde el lado del creador
5. **Accept Invitation** → Guarda `accepted_room_code`
6. **Join Room by Code** → Completa el flujo

---

## 🧪 Tests Adicionales

### Test: Invitación Duplicada (Debe Fallar)

**Método:** `POST`  
**URL:** `{{base_url}}/api/room-invitations/send`

**Headers:**
```
Content-Type: application/json
x-user-id: {{user1}}
```

**Body:**
```json
{
  "toUserId": {{user2}},
  "roomId": "{{room_id}}"
}
```

**Respuesta Esperada:** `400 Bad Request`
```json
{
  "error": "Ya existe una invitación pendiente para esta sala a este usuario"
}
```

---

### Test: Invitar a No-Amigo (Debe Fallar)

**Método:** `POST`  
**URL:** `{{base_url}}/api/room-invitations/send`

**Headers:**
```
Content-Type: application/json
x-user-id: {{user1}}
```

**Body:**
```json
{
  "toUserId": 999,
  "roomId": "{{room_id}}"
}
```

**Respuesta Esperada:** `400 Bad Request`
```json
{
  "error": "Solo puedes enviar invitaciones a tus amigos"
}
```

---

### Test: Aceptar Sala Llena (Debe Fallar)

**Prerequisito:** Otra persona se une a la sala primero

**Método:** `POST`  
**URL:** `{{base_url}}/api/room-invitations/accept`

**Headers:**
```
Content-Type: application/json
x-user-id: {{user2}}
```

**Body:**
```json
{
  "invitationId": {{invitation_id}}
}
```

**Respuesta Esperada:** `400 Bad Request`
```json
{
  "error": "La sala ya tiene un oponente"
}
```

---

## 📊 Variables de Entorno Completas

Crea estas variables en tu entorno de Postman:

```
base_url = http://localhost:3000
user1 = 1
user2 = 2
room_id = (se guarda automáticamente)
room_code = (se guarda automáticamente)
invitation_id = (se guarda automáticamente)
accepted_room_code = (se guarda automáticamente)
```

---

## 🚀 Quick Start

1. **Importar la colección** (copiar el JSON de arriba)
2. **Crear entorno** con las variables
3. **Ejecutar en orden:**
   - Create Room
   - Send Room Invitation
   - Get Received Invitations
   - Accept Invitation
   - Join Room by Code
4. **Ver resultados** en la consola de Postman

---

## 💡 Tips

- Usa la pestaña "Console" en Postman para ver los logs detallados
- Las variables se guardan automáticamente con los scripts de Tests
- Ejecuta "Get Received Invitations" varias veces para ver cambios en tiempo real
- Usa "Runner" de Postman para ejecutar toda la colección automáticamente

---

**✅ ¡Todo listo para probar!**
