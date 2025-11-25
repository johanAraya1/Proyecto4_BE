# Documentación de API - Sistema de Invitaciones a Salas

## Descripción General
Este sistema permite a los usuarios enviar invitaciones a sus amigos para unirse a salas de juego. Funciona de manera similar al sistema de solicitudes de amistad.

## Configuración Inicial

### Base URL
```
http://localhost:3000/api
```

### Headers Requeridos
Todas las peticiones deben incluir:
```
Content-Type: application/json
x-user-id: <ID_DEL_USUARIO>
```

## Endpoints

### 1. Enviar Invitación a Sala
Envía una invitación a un amigo para que se una a una sala específica.

**Endpoint:** `POST /room-invitations/send`

**Headers:**
```
Content-Type: application/json
x-user-id: 1
```

**Body (JSON):**
```json
{
  "toUserId": 2,
  "roomId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Respuesta Exitosa (201):**
```json
{
  "message": "Invitación a sala enviada",
  "invitation": {
    "id": 1,
    "from_user": 1,
    "to_user": 2,
    "room_id": "550e8400-e29b-41d4-a716-446655440000",
    "room_code": "ABC123",
    "status": "pending",
    "created_at": "2025-11-11T10:30:00.000Z"
  }
}
```

**Errores Comunes:**
- `400`: "No puedes enviarte una invitación a ti mismo"
- `400`: "Usuario destinatario no encontrado"
- `400`: "Sala no encontrada"
- `400`: "Solo el creador de la sala puede enviar invitaciones"
- `400`: "Solo se pueden enviar invitaciones a salas en espera"
- `400`: "Solo puedes enviar invitaciones a tus amigos"
- `400`: "Ya existe una invitación pendiente para esta sala a este usuario"

---

### 2. Obtener Invitaciones Recibidas
Obtiene todas las invitaciones pendientes que el usuario ha recibido.

**Endpoint:** `GET /room-invitations/received`

**Headers:**
```
x-user-id: 2
```

**Respuesta Exitosa (200):**
```json
{
  "invitations": [
    {
      "id": 1,
      "from_user": 1,
      "from_user_name": "Juan Pérez",
      "from_user_email": "juan@example.com",
      "to_user": 2,
      "room_id": "550e8400-e29b-41d4-a716-446655440000",
      "room_code": "ABC123",
      "room_status": "waiting",
      "status": "pending",
      "created_at": "2025-11-11T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Obtener Invitaciones Enviadas
Obtiene todas las invitaciones que el usuario ha enviado.

**Endpoint:** `GET /room-invitations/sent`

**Headers:**
```
x-user-id: 1
```

**Respuesta Exitosa (200):**
```json
{
  "invitations": [
    {
      "id": 1,
      "to_user": 2,
      "to_user_name": "María López",
      "to_user_email": "maria@example.com",
      "room_id": "550e8400-e29b-41d4-a716-446655440000",
      "room_code": "ABC123",
      "room_status": "waiting",
      "status": "pending",
      "created_at": "2025-11-11T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Aceptar Invitación
Acepta una invitación recibida y proporciona el código de la sala.

**Endpoint:** `POST /room-invitations/accept`

**Headers:**
```
Content-Type: application/json
x-user-id: 2
```

**Body (JSON):**
```json
{
  "invitationId": 1
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Invitación aceptada. Puedes unirte a la sala usando el código",
  "roomCode": "ABC123",
  "invitation": {
    "id": 1,
    "from_user": 1,
    "to_user": 2,
    "room_id": "550e8400-e29b-41d4-a716-446655440000",
    "room_code": "ABC123",
    "status": "accepted",
    "created_at": "2025-11-11T10:30:00.000Z",
    "updated_at": "2025-11-11T10:35:00.000Z"
  }
}
```

**Errores Comunes:**
- `400`: "Invitación no encontrada o no válida"
- `400`: "La sala ya no está disponible"
- `400`: "La sala ya no está en espera"
- `400`: "La sala ya tiene un oponente"

**Nota:** Después de aceptar, el usuario debe usar el `roomCode` para unirse a la sala usando el endpoint existente de unirse a sala por código.

---

### 5. Rechazar Invitación
Rechaza una invitación recibida.

**Endpoint:** `POST /room-invitations/reject`

**Headers:**
```
Content-Type: application/json
x-user-id: 2
```

**Body (JSON):**
```json
{
  "invitationId": 1
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Invitación rechazada"
}
```

---

### 6. Cancelar Invitación Enviada
Permite al creador de la sala cancelar una invitación que envió.

**Endpoint:** `DELETE /room-invitations/:invitationId`

**Headers:**
```
x-user-id: 1
```

**Ejemplo:**
```
DELETE /room-invitations/1
```

**Respuesta Exitosa (200):**
```json
{
  "message": "Invitación cancelada"
}
```

---

## Flujo de Trabajo Completo para Postman

### Escenario: Usuario A invita a Usuario B a una sala

#### Paso 1: Usuario A crea una sala
```
POST http://localhost:3000/rooms
Headers:
  Content-Type: application/json
Body:
{
  "user_id": "1"
}

Respuesta: Guarda el room_id y room_code
```

#### Paso 2: Usuario A envía invitación a Usuario B
```
POST http://localhost:3000/api/room-invitations/send
Headers:
  Content-Type: application/json
  x-user-id: 1
Body:
{
  "toUserId": 2,
  "roomId": "<room_id_del_paso_1>"
}

Respuesta: Guarda el invitation_id
```

#### Paso 3: Usuario B verifica invitaciones recibidas
```
GET http://localhost:3000/api/room-invitations/received
Headers:
  x-user-id: 2

Respuesta: Debe aparecer la invitación del Usuario A con room_code
```

#### Paso 4: Usuario B acepta la invitación
```
POST http://localhost:3000/api/room-invitations/accept
Headers:
  Content-Type: application/json
  x-user-id: 2
Body:
{
  "invitationId": <invitation_id_del_paso_2>
}

Respuesta: Devuelve el roomCode
```

#### Paso 5: Usuario B se une a la sala usando el código
```
POST http://localhost:3000/rooms/join-by-code
Headers:
  Content-Type: application/json
Body:
{
  "code": "<roomCode_del_paso_4>",
  "user_id": "2"
}

Respuesta: Usuario B ahora está en la sala como oponente
```

---

## Pruebas Adicionales

### Verificar que solo amigos pueden recibir invitaciones
1. Intenta enviar una invitación a un usuario que no es tu amigo
2. Debe retornar error: "Solo puedes enviar invitaciones a tus amigos"

### Verificar que solo el creador puede invitar
1. Intenta enviar una invitación desde un usuario que no creó la sala
2. Debe retornar error: "Solo el creador de la sala puede enviar invitaciones"

### Verificar expiración automática
1. Envía una invitación a una sala
2. Que otra persona se una a la sala (cambiando su estado)
3. Intenta aceptar la invitación original
4. Debe retornar error: "La sala ya no está disponible" o "La sala ya tiene un oponente"

---

## Colección de Postman

Puedes importar esta colección JSON en Postman:

```json
{
  "info": {
    "name": "Room Invitations API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Send Room Invitation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-user-id",
            "value": "1"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"toUserId\": 2,\n  \"roomId\": \"550e8400-e29b-41d4-a716-446655440000\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/room-invitations/send",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "room-invitations", "send"]
        }
      }
    },
    {
      "name": "Get Received Invitations",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-user-id",
            "value": "2"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/room-invitations/received",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "room-invitations", "received"]
        }
      }
    },
    {
      "name": "Get Sent Invitations",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-user-id",
            "value": "1"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/room-invitations/sent",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "room-invitations", "sent"]
        }
      }
    },
    {
      "name": "Accept Invitation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-user-id",
            "value": "2"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invitationId\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/room-invitations/accept",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "room-invitations", "accept"]
        }
      }
    },
    {
      "name": "Reject Invitation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "x-user-id",
            "value": "2"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invitationId\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/room-invitations/reject",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "room-invitations", "reject"]
        }
      }
    },
    {
      "name": "Cancel Invitation",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "x-user-id",
            "value": "1"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/room-invitations/1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "room-invitations", "1"]
        }
      }
    }
  ]
}
```

---

## Notas Importantes

1. **Prerequisitos:**
   - Los usuarios deben ser amigos antes de poder enviarse invitaciones a salas
   - Solo el creador de la sala puede enviar invitaciones
   - La sala debe estar en estado "waiting"

2. **Estados de Invitación:**
   - `pending`: Invitación enviada pero no respondida
   - `accepted`: Invitación aceptada
   - `rejected`: Invitación rechazada
   - `expired`: La sala ya no está disponible

3. **Expiración Automática:**
   - Las invitaciones se marcan automáticamente como "expired" cuando:
     - La sala cambia de estado "waiting" a otro estado
     - La sala ya tiene un oponente
     - La sala es eliminada

4. **Testing en Postman:**
   - Asegúrate de tener el servidor corriendo en `http://localhost:3000`
   - Usa el header `x-user-id` para simular diferentes usuarios
   - Guarda los IDs devueltos en variables de entorno de Postman para facilitar las pruebas
