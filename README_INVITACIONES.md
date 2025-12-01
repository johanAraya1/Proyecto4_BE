# 🎮 Sistema de Invitaciones a Salas - Documentación Central

## 📚 Índice de Documentación

Este es el punto de entrada para toda la documentación del sistema de invitaciones a salas de juego.

---

## 🚀 Inicio Rápido

1. **Lee primero:** [`RESUMEN_IMPLEMENTACION.md`](./RESUMEN_IMPLEMENTACION.md)
2. **Ejecuta la base de datos:** Script SQL en [`CenfoCoffee/backend/database/create_room_invitation_table.sql`](./CenfoCoffee/backend/database/create_room_invitation_table.sql)
3. **Prueba con Postman:** [`POSTMAN_EXAMPLES.md`](./POSTMAN_EXAMPLES.md)

---

## 📖 Guías Disponibles

### 1. 📋 Resumen Ejecutivo
**Archivo:** [`RESUMEN_IMPLEMENTACION.md`](./RESUMEN_IMPLEMENTACION.md)

**Contenido:**
- Resumen completo de la implementación
- Lista de archivos creados/modificados
- Pasos para poner en funcionamiento
- Checklist de verificación
- Características destacadas

**Cuándo leer:** Primero, para entender qué se implementó

---

### 2. 🔧 Guía de Implementación Detallada
**Archivo:** [`IMPLEMENTACION_INVITACIONES.md`](./IMPLEMENTACION_INVITACIONES.md)

**Contenido:**
- Pasos detallados para implementar
- Configuración de Supabase
- Flujo de prueba completo
- Casos de error a verificar
- Debugging y verificación en base de datos
- Checklist exhaustivo

**Cuándo leer:** Cuando estés implementando el sistema

---

### 3. 📡 Documentación de API
**Archivo:** [`ROOM_INVITATIONS_API.md`](./ROOM_INVITATIONS_API.md)

**Contenido:**
- Descripción de todos los endpoints
- Formato de requests y responses
- Ejemplos de uso
- Errores comunes
- Flujo de trabajo completo
- Notas importantes

**Cuándo leer:** Para referencia de la API

---

### 4. 📮 Ejemplos para Postman
**Archivo:** [`POSTMAN_EXAMPLES.md`](./POSTMAN_EXAMPLES.md)

**Contenido:**
- Ejemplos copy-paste para cada endpoint
- Colección JSON completa para importar
- Scripts de test automáticos
- Variables de entorno
- Orden de ejecución recomendado

**Cuándo leer:** Cuando vayas a probar con Postman

---

### 5. 📊 Diagrama de Flujo Visual
**Archivo:** [`DIAGRAMA_FLUJO.md`](./DIAGRAMA_FLUJO.md)

**Contenido:**
- Flujo visual usuario a usuario
- Estados de la base de datos
- Casos de uso ilustrados
- Validaciones en acción
- Relaciones entre tablas
- Tips para frontend

**Cuándo leer:** Para entender visualmente el flujo

---

## 🗂️ Archivos de Código

### Backend

#### Modelos
- **`CenfoCoffee/backend/models/RoomInvitation.ts`**
  - Interfaces TypeScript
  - DTOs para requests/responses
  - Tipos de estados

#### Servicios
- **`CenfoCoffee/backend/services/roomInvitationService.ts`**
  - Lógica de negocio completa
  - Validaciones
  - Interacción con Supabase

#### Controladores
- **`CenfoCoffee/backend/controllers/roomInvitationController.ts`**
  - Handlers de HTTP requests
  - Validación de parámetros
  - Logging detallado

#### Rutas
- **`CenfoCoffee/backend/routes/roomInvitationRoutes.ts`**
  - Definición de endpoints
  - Registro de rutas

#### Base de Datos
- **`CenfoCoffee/backend/database/create_room_invitation_table.sql`**
  - Script SQL completo
  - Tabla, índices, triggers
  - Row Level Security
  - Expiración automática

---

## 🧪 Testing

### Script Automatizado
**Archivo:** [`test-room-invitations.js`](./test-room-invitations.js)

**Uso:**
```bash
node test-room-invitations.js
```

**Qué hace:**
- Verifica prerequisitos
- Crea sala de prueba
- Envía invitación
- Lista invitaciones
- Acepta invitación
- Une usuario a sala
- Valida errores

---

## 📋 Endpoints Rápidos

```
POST   /api/room-invitations/send        # Enviar invitación
GET    /api/room-invitations/received    # Ver invitaciones recibidas
GET    /api/room-invitations/sent        # Ver invitaciones enviadas
POST   /api/room-invitations/accept      # Aceptar invitación
POST   /api/room-invitations/reject      # Rechazar invitación
DELETE /api/room-invitations/:id         # Cancelar invitación
```

---

## 🎯 Flujo Básico

```
1. Usuario A crea sala
   ↓
2. Usuario A invita a Usuario B (su amigo)
   ↓
3. Usuario B ve la invitación en /received
   ↓
4. Usuario B acepta la invitación
   ↓
5. Usuario B recibe el código de sala
   ↓
6. Usuario B se une usando el código
   ↓
7. ¡Comienza el juego!
```

---

## ✅ Checklist Rápido

- [ ] **Base de Datos:** Ejecutar [`create_room_invitation_table.sql`](./CenfoCoffee/backend/database/create_room_invitation_table.sql)
- [ ] **Backend:** Código ya integrado en server.ts
- [ ] **Servidor:** Correr `npm run dev` en `CenfoCoffee/backend`
- [ ] **Prerequisitos:** Usuarios 1 y 2 deben ser amigos
- [ ] **Testing:** Ejecutar [`test-room-invitations.js`](./test-room-invitations.js) o usar Postman
- [ ] **Verificar:** Ver invitaciones en base de datos

---

## 🔍 Troubleshooting

### Problema: Error al enviar invitación

**Soluciones:**
1. Verifica que los usuarios sean amigos
2. Confirma que la sala está en estado "waiting"
3. Verifica que eres el creador de la sala
4. Revisa logs del servidor

**Referencia:** [`IMPLEMENTACION_INVITACIONES.md`](./IMPLEMENTACION_INVITACIONES.md) sección "Debugging"

---

### Problema: No aparecen invitaciones

**Soluciones:**
1. Verifica el header `x-user-id`
2. Confirma que la tabla existe en Supabase
3. Revisa las políticas RLS
4. Verifica en la base de datos directamente

**Referencia:** [`IMPLEMENTACION_INVITACIONES.md`](./IMPLEMENTACION_INVITACIONES.md) sección "Verificación en la Base de Datos"

---

### Problema: Error "Solo amigos"

**Solución:**
Los usuarios deben ser amigos primero. Usa:
```bash
POST /api/friends/request
POST /api/friends/request/accept
```

**Referencia:** [`IMPLEMENTACION_INVITACIONES.md`](./IMPLEMENTACION_INVITACIONES.md) sección "Prerequisito: Asegurar que los usuarios son amigos"

---

## 📊 Arquitectura

```
Cliente
  │
  ├─ POST /api/room-invitations/send
  │   └─→ roomInvitationController
  │       └─→ roomInvitationService
  │           └─→ Supabase (room_invitation table)
  │
  ├─ GET /api/room-invitations/received
  │   └─→ roomInvitationController
  │       └─→ roomInvitationService
  │           └─→ Supabase (room_invitation + users + game_rooms)
  │
  └─ POST /api/room-invitations/accept
      └─→ roomInvitationController
          └─→ roomInvitationService
              └─→ Supabase (room_invitation update)
```

---

## 🎓 Para Aprender

### Si eres nuevo:
1. Lee [`RESUMEN_IMPLEMENTACION.md`](./RESUMEN_IMPLEMENTACION.md)
2. Revisa [`DIAGRAMA_FLUJO.md`](./DIAGRAMA_FLUJO.md) para entender visualmente
3. Prueba con [`POSTMAN_EXAMPLES.md`](./POSTMAN_EXAMPLES.md)

### Si vas a implementar:
1. Empieza con [`IMPLEMENTACION_INVITACIONES.md`](./IMPLEMENTACION_INVITACIONES.md)
2. Ejecuta el script SQL de base de datos
3. Verifica que funciona con [`test-room-invitations.js`](./test-room-invitations.js)

### Si necesitas referencia:
1. Consulta [`ROOM_INVITATIONS_API.md`](./ROOM_INVITATIONS_API.md) para endpoints
2. Revisa el código en `CenfoCoffee/backend/services/roomInvitationService.ts`

---

## 📞 Soporte

Si tienes problemas:

1. **Logs del servidor:** Revisa la consola donde corre el backend
2. **Base de datos:** Verifica con SQL directo en Supabase
3. **Postman:** Usa la consola de Postman para ver requests/responses
4. **Documentación:** Busca en los archivos .md correspondientes

---

## 🎉 Features Implementadas

✅ Sistema completo de invitaciones  
✅ Validación de amistad  
✅ Validación de permisos (solo creador)  
✅ Prevención de duplicados  
✅ Expiración automática  
✅ Telemetría integrada  
✅ Logging detallado  
✅ Documentación completa  
✅ Tests automatizados  
✅ Ejemplos de Postman  
✅ Diagramas visuales  

---

## 🗺️ Mapa de la Documentación

```
.
├── README_INVITACIONES.md (este archivo)
│   └── Punto de entrada, índice general
│
├── RESUMEN_IMPLEMENTACION.md
│   └── Resumen ejecutivo, quick start
│
├── IMPLEMENTACION_INVITACIONES.md
│   └── Guía detallada de implementación
│
├── ROOM_INVITATIONS_API.md
│   └── Documentación completa de API
│
├── POSTMAN_EXAMPLES.md
│   └── Ejemplos copy-paste para Postman
│
├── DIAGRAMA_FLUJO.md
│   └── Visualización del flujo
│
├── test-room-invitations.js
│   └── Script de pruebas automatizadas
│
└── CenfoCoffee/backend/
    ├── models/RoomInvitation.ts
    ├── services/roomInvitationService.ts
    ├── controllers/roomInvitationController.ts
    ├── routes/roomInvitationRoutes.ts
    ├── database/create_room_invitation_table.sql
    └── server.ts (modificado)
```

---

## 🚀 Siguiente Paso

**¿Primera vez?** → Lee [`RESUMEN_IMPLEMENTACION.md`](./RESUMEN_IMPLEMENTACION.md)

**¿Listo para implementar?** → Sigue [`IMPLEMENTACION_INVITACIONES.md`](./IMPLEMENTACION_INVITACIONES.md)

**¿Quieres probar?** → Usa [`POSTMAN_EXAMPLES.md`](./POSTMAN_EXAMPLES.md)

---

**📧 ¿Preguntas?** Consulta la documentación correspondiente o revisa los logs del servidor.

**✅ Sistema listo para producción!**
