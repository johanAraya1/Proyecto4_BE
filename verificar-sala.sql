-- Script para verificar si la sala existe en Supabase
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar si la sala existe
SELECT 
  id,
  code,
  creator_id,
  opponent_id,
  status,
  created_at
FROM game_rooms
WHERE id = '2060cc34-d348-4be5-90ee-f3786b193de3';

-- 2. Ver todas las salas activas
SELECT 
  id,
  code,
  creator_id,
  status,
  created_at
FROM game_rooms
WHERE status = 'waiting'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar el tipo de dato de la columna id
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'game_rooms'
  AND column_name IN ('id', 'creator_id', 'code');
