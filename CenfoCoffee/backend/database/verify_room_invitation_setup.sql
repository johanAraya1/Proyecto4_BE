-- Script de verificación para room_invitation
-- Ejecuta esto DESPUÉS de crear la tabla

-- 1. Verificar que la tabla existe
SELECT 
  'Tabla room_invitation existe' AS verificacion,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'room_invitation'
  ) THEN '✓ OK' ELSE '✗ FALTA' END AS estado;

-- 2. Verificar foreign keys
SELECT 
  'Foreign Keys' AS verificacion,
  constraint_name,
  '✓ OK' AS estado
FROM information_schema.table_constraints 
WHERE table_name = 'room_invitation' 
  AND constraint_type = 'FOREIGN KEY'
ORDER BY constraint_name;

-- 3. Verificar índices
SELECT 
  'Índices' AS verificacion,
  indexname AS nombre,
  '✓ OK' AS estado
FROM pg_indexes 
WHERE tablename = 'room_invitation'
ORDER BY indexname;

-- 4. Verificar triggers
SELECT 
  'Triggers' AS verificacion,
  trigger_name AS nombre,
  '✓ OK' AS estado
FROM information_schema.triggers 
WHERE event_object_table = 'room_invitation'
ORDER BY trigger_name;

-- 5. Verificar RLS está habilitado
SELECT 
  'RLS Habilitado' AS verificacion,
  CASE WHEN relrowsecurity THEN '✓ OK' ELSE '✗ DESHABILITADO' END AS estado
FROM pg_class 
WHERE relname = 'room_invitation';

-- 6. Verificar políticas RLS
SELECT 
  'Políticas RLS' AS verificacion,
  policyname AS nombre,
  cmd AS comando,
  '✓ OK' AS estado
FROM pg_policies 
WHERE tablename = 'room_invitation'
ORDER BY policyname;

-- 7. Verificar constraints
SELECT 
  'Constraints' AS verificacion,
  constraint_name AS nombre,
  constraint_type AS tipo,
  '✓ OK' AS estado
FROM information_schema.table_constraints 
WHERE table_name = 'room_invitation'
ORDER BY constraint_type, constraint_name;

-- 8. Verificar columnas
SELECT 
  'Columnas' AS verificacion,
  column_name AS nombre,
  data_type AS tipo,
  is_nullable AS nullable,
  column_default AS default_value,
  '✓ OK' AS estado
FROM information_schema.columns 
WHERE table_name = 'room_invitation'
ORDER BY ordinal_position;
