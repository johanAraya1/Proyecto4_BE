# Sistema de Invitaciones a Salas - Guía de Implementación

## 📋 Resumen

Se ha implementado un sistema completo de invitaciones a salas de juego que permite a los usuarios invitar a sus amigos a unirse a salas específicas mediante un código.

## 🗂️ Archivos Creados/Modificados

### Nuevos Archivos:
1. **`CenfoCoffee/backend/models/RoomInvitation.ts`** - Modelos e interfaces TypeScript
2. **`CenfoCoffee/backend/services/roomInvitationService.ts`** - Lógica de negocio
3. **`CenfoCoffee/backend/controllers/roomInvitationController.ts`** - Controladores HTTP
4. **`CenfoCoffee/backend/routes/roomInvitationRoutes.ts`** - Rutas de la API
5. **`CenfoCoffee/backend/database/create_room_invitation_table.sql`** - Script SQL para Supabase
6. **`ROOM_INVITATIONS_API.md`** - Documentación completa de la API

### Archivos Modificados:
1. **`CenfoCoffee/backend/server.ts`** - Registro de nuevas rutas
2. **`CenfoCoffee/backend/models/Telemetry.ts`** - Nuevos eventos de telemetría

## 🚀 Pasos para Implementar

### 1. Crear la Tabla en Supabase

Ejecuta el siguiente script SQL en tu base de datos de Supabase:

```sql
-- Copia y pega el contenido completo del archivo:
-- CenfoCoffee/backend/database/create_room_invitation_table.sql
```

**Importante:** Este script incluye:
- Creación de la tabla `room_invitation`
- Índices para optimización de consultas
- Triggers para actualización automática de timestamps
- Políticas de Row Level Security (RLS)
- Función para expirar invitaciones automáticamente

### 2. Verificar Configuración de Supabase

Asegúrate de que tu archivo `.env` tenga configuradas las credenciales correctas:

```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_key_de_supabase
```

### 3. Instalar Dependencias (si es necesario)

```bash
cd CenfoCoffee/backend
npm install
```

### 4. Compilar y Ejecutar el Servidor

```bash
npm run dev
# O
npx ts-node server.ts
```

El servidor debería iniciar en `http://localhost:3000`

## 🧪 Pruebas con Postman

### Configuración Inicial en Postman

1. **Importar la Colección:**
   - Abre Postman
   - Importa el JSON de la colección incluido en `ROOM_INVITATIONS_API.md`

2. **Configurar Variables de Entorno:**
   - Crea un entorno llamado "Room Invitations Dev"
   - Agrega estas variables:
     ```
     base_url = http://localhost:3000
     user_a_id = 1
     user_b_id = 2
     ```

### Flujo de Prueba Completo

#### Prerequisito: Asegurar que los usuarios son amigos

Antes de probar invitaciones, verifica que los usuarios 1 y 2 sean amigos:

```bash
# Verificar amistad del usuario 1
GET http://localhost:3000/api/friends/list
Headers: x-user-id: 1

# Si no son amigos, envía solicitud de amistad
POST http://localhost:3000/api/friends/request
Headers: 
  Content-Type: application/json
  x-user-id: 1
Body:
{
  "toUserId": 2
}

# Aceptar solicitud (como usuario 2)
POST http://localhost:3000/api/friends/request/accept
Headers:
  Content-Type: application/json
  x-user-id: 2
Body:
{
  "requestId": <id_de_la_solicitud>
}
```

#### Test 1: Enviar Invitación

```bash
# Paso 1: Usuario 1 crea una sala
POST http://localhost:3000/rooms
Headers: Content-Type: application/json
Body:
{
  "user_id": "1"
}

# Guardar room_id de la respuesta

# Paso 2: Usuario 1 envía invitación a Usuario 2
POST http://localhost:3000/api/room-invitations/send
Headers:
  Content-Type: application/json
  x-user-id: 1
Body:
{
  "toUserId": 2,
  "roomId": "<room_id_del_paso_anterior>"
}

# ✅ Esperado: Status 201, mensaje de éxito
```

#### Test 2: Ver Invitaciones Recibidas

```bash
GET http://localhost:3000/api/room-invitations/received
Headers: x-user-id: 2

# ✅ Esperado: Status 200, array con la invitación
```

#### Test 3: Ver Invitaciones Enviadas

```bash
GET http://localhost:3000/api/room-invitations/sent
Headers: x-user-id: 1

# ✅ Esperado: Status 200, array con la invitación enviada
```

#### Test 4: Aceptar Invitación

```bash
POST http://localhost:3000/api/room-invitations/accept
Headers:
  Content-Type: application/json
  x-user-id: 2
Body:
{
  "invitationId": <id_de_la_invitacion>
}

# ✅ Esperado: Status 200, roomCode en la respuesta
```

#### Test 5: Unirse a la Sala con el Código

```bash
POST http://localhost:3000/rooms/join-by-code
Headers: Content-Type: application/json
Body:
{
  "code": "<room_code_del_paso_anterior>",
  "user_id": "2"
}

# ✅ Esperado: Status 200, usuario unido a la sala
```

#### Test 6: Rechazar Invitación

```bash
# Enviar nueva invitación primero (repetir Test 1)

POST http://localhost:3000/api/room-invitations/reject
Headers:
  Content-Type: application/json
  x-user-id: 2
Body:
{
  "invitationId": <id_nueva_invitacion>
}

# ✅ Esperado: Status 200, invitación rechazada
```

#### Test 7: Cancelar Invitación

```bash
# Enviar nueva invitación primero (repetir Test 1)

DELETE http://localhost:3000/api/room-invitations/<invitation_id>
Headers: x-user-id: 1

# ✅ Esperado: Status 200, invitación cancelada
```

### Casos de Error a Verificar

#### Error 1: Enviar invitación a no-amigo
```bash
POST http://localhost:3000/api/room-invitations/send
Headers:
  Content-Type: application/json
  x-user-id: 1
Body:
{
  "toUserId": 999,  # Usuario que no es amigo
  "roomId": "<room_id>"
}

# ✅ Esperado: Status 400, "Solo puedes enviar invitaciones a tus amigos"
```

#### Error 2: Usuario que no es creador intenta invitar
```bash
# Usuario 2 intenta enviar invitación de sala creada por Usuario 1
POST http://localhost:3000/api/room-invitations/send
Headers:
  Content-Type: application/json
  x-user-id: 2
Body:
{
  "toUserId": 1,
  "roomId": "<room_id_creado_por_usuario_1>"
}

# ✅ Esperado: Status 400, "Solo el creador de la sala puede enviar invitaciones"
```

#### Error 3: Invitación duplicada
```bash
# Enviar la misma invitación dos veces
# ✅ Esperado: Status 400, "Ya existe una invitación pendiente..."
```

#### Error 4: Aceptar invitación de sala llena
```bash
# 1. Enviar invitación
# 2. Otro usuario se une a la sala directamente
# 3. Intentar aceptar la invitación original
# ✅ Esperado: Status 400, "La sala ya tiene un oponente"
```

## 📊 Verificación en la Base de Datos

Puedes verificar las invitaciones directamente en Supabase:

```sql
-- Ver todas las invitaciones
SELECT * FROM room_invitation;

-- Ver invitaciones pendientes para un usuario
SELECT * FROM room_invitation 
WHERE to_user = 2 AND status = 'pending';

-- Ver invitaciones con detalles
SELECT 
  ri.id,
  ri.status,
  u1.name as from_user_name,
  u2.name as to_user_name,
  gr.code as room_code,
  gr.status as room_status
FROM room_invitation ri
JOIN users u1 ON ri.from_user = u1.id
JOIN users u2 ON ri.to_user = u2.id
JOIN game_rooms gr ON ri.room_id = gr.id;
```

## 🔍 Debugging

Si encuentras problemas, verifica los logs del servidor:

```bash
# El servidor imprime logs detallados para debugging
# Busca líneas que comiencen con:
# 📤 DEBUG sendRoomInvitation
# 📥 DEBUG getReceivedInvitations
# ✅ DEBUG acceptInvitation
# ❌ Error en ...
```

## 📋 Checklist de Verificación

- [ ] Script SQL ejecutado en Supabase
- [ ] Tabla `room_invitation` creada correctamente
- [ ] Servidor backend corriendo sin errores
- [ ] Usuarios de prueba existen en la base de datos
- [ ] Usuarios de prueba son amigos entre sí
- [ ] Sala de prueba creada exitosamente
- [ ] Invitación enviada correctamente
- [ ] Invitación aparece en endpoint de recibidas
- [ ] Invitación puede ser aceptada
- [ ] Usuario puede unirse con el código recibido
- [ ] Invitaciones se marcan como expiradas automáticamente

## 🛠️ Estructura de la API

```
/api/room-invitations/
  ├── POST   /send              # Enviar invitación
  ├── GET    /received          # Ver invitaciones recibidas
  ├── GET    /sent              # Ver invitaciones enviadas
  ├── POST   /accept            # Aceptar invitación
  ├── POST   /reject            # Rechazar invitación
  └── DELETE /:invitationId     # Cancelar invitación
```

## 🎯 Características Implementadas

✅ Envío de invitaciones solo entre amigos
✅ Validación de permisos (solo creador puede invitar)
✅ Verificación de estado de sala (solo salas en espera)
✅ Prevención de invitaciones duplicadas
✅ Listado de invitaciones recibidas y enviadas
✅ Aceptación y rechazo de invitaciones
✅ Cancelación de invitaciones pendientes
✅ Expiración automática de invitaciones
✅ Telemetría completa de eventos
✅ Logging detallado para debugging
✅ Validación exhaustiva de errores
✅ Documentación completa en Postman

## 📖 Documentación Adicional

Para más detalles sobre cada endpoint, consulta:
- **`ROOM_INVITATIONS_API.md`** - Documentación completa de la API con ejemplos

## 🤝 Soporte

Si tienes problemas:
1. Verifica los logs del servidor
2. Confirma que la tabla está creada en Supabase
3. Verifica que los usuarios sean amigos
4. Asegúrate de usar los headers correctos
5. Revisa que la sala esté en estado "waiting"
