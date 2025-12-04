-- Script para actualizar la base de datos con los nuevos tipos de eventos
-- PLAYER_SURRENDER y PLAYER_SURRENDERED

-- Opción 1: Si el constraint es un ENUM, necesitamos alterarlo
-- Primero, eliminar el constraint existente
ALTER TABLE game_events DROP CONSTRAINT IF EXISTS game_events_type_check;

-- Crear el nuevo constraint con los tipos adicionales
ALTER TABLE game_events ADD CONSTRAINT game_events_type_check 
CHECK (type IN (
  'GRID_INITIALIZED',
  'MOVE',
  'TRADE',
  'END_TURN',
  'TURN_CHANGED',
  'GAME_STATE_UPDATE',
  'GAME_STARTED',
  'GAME_ENDED',
  'PLAYER_SURRENDER',
  'PLAYER_SURRENDERED'
));

-- Verificar que el constraint se aplicó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'game_events'::regclass 
AND conname = 'game_events_type_check';

-- Opcional: Agregar columna 'surrender' a la tabla game_rooms para estadísticas
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS surrender BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN game_rooms.surrender IS 'Indica si el juego terminó por rendición de un jugador';
