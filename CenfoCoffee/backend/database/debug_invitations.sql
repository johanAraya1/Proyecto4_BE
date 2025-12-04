-- Script de debugging para invitaciones
-- Ejecuta esto en Supabase SQL Editor

-- 1. Ver TODAS las invitaciones en la tabla
SELECT 
  'Total invitaciones' AS info,
  COUNT(*) AS cantidad
FROM room_invitation;

-- 2. Ver detalle de invitaciones
SELECT 
  id,
  from_user,
  to_user,
  room_id,
  room_code,
  status,
  created_at
FROM room_invitation
ORDER BY created_at DESC;

-- 3. Ver usuarios que existen
SELECT 
  'Usuarios disponibles' AS info,
  id,
  username
FROM users
ORDER BY id;

-- 4. Ver salas disponibles
SELECT 
  'Salas disponibles' AS info,
  id,
  code,
  creator_id,
  status,
  opponent_id
FROM game_rooms
WHERE status = 'waiting'
ORDER BY created_at DESC;

-- 5. Ver relación completa (si hay invitaciones)
SELECT 
  ri.id AS invitation_id,
  ri.status AS invitation_status,
  u1.username AS from_username,
  u2.username AS to_username,
  gr.code AS room_code,
  gr.status AS room_status,
  ri.created_at
FROM room_invitation ri
LEFT JOIN users u1 ON ri.from_user = u1.id
LEFT JOIN users u2 ON ri.to_user = u2.id
LEFT JOIN game_rooms gr ON ri.room_id = gr.id
ORDER BY ri.created_at DESC;

-- 6. Ver relaciones de amistad
SELECT 
  'Amistades' AS info,
  user_id,
  friend_id,
  status
FROM friends
WHERE status = 'accepted';
