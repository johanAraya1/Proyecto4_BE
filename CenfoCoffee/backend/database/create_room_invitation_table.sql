-- Script SQL para crear la tabla room_invitation en Supabase
-- Esta tabla maneja las invitaciones a salas de juego entre usuarios

-- Crear la tabla room_invitation
CREATE TABLE IF NOT EXISTS room_invitation (
  id BIGSERIAL PRIMARY KEY,
  from_user BIGINT NOT NULL,
  to_user BIGINT NOT NULL,
  room_id UUID NOT NULL,
  room_code VARCHAR(6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar foreign keys DESPUÉS de crear la tabla
DO $$ 
BEGIN
  -- Foreign key para from_user
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'room_invitation_from_user_fkey' 
    AND table_name = 'room_invitation'
  ) THEN
    ALTER TABLE room_invitation
    ADD CONSTRAINT room_invitation_from_user_fkey 
    FOREIGN KEY (from_user) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
  END IF;

  -- Foreign key para to_user
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'room_invitation_to_user_fkey' 
    AND table_name = 'room_invitation'
  ) THEN
    ALTER TABLE room_invitation
    ADD CONSTRAINT room_invitation_to_user_fkey 
    FOREIGN KEY (to_user) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
  END IF;

  -- Foreign key para room_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'room_invitation_room_id_fkey' 
    AND table_name = 'room_invitation'
  ) THEN
    ALTER TABLE room_invitation
    ADD CONSTRAINT room_invitation_room_id_fkey 
    FOREIGN KEY (room_id) 
    REFERENCES game_rooms(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Constraints adicionales
DO $$
BEGIN
  -- Check constraint para usuarios diferentes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_different_users' 
    AND table_name = 'room_invitation'
  ) THEN
    ALTER TABLE room_invitation
    ADD CONSTRAINT check_different_users 
    CHECK (from_user != to_user);
  END IF;

  -- Check constraint para status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_status' 
    AND table_name = 'room_invitation'
  ) THEN
    ALTER TABLE room_invitation
    ADD CONSTRAINT check_status 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_room_invitation_from_user ON room_invitation(from_user);
CREATE INDEX IF NOT EXISTS idx_room_invitation_to_user ON room_invitation(to_user);
CREATE INDEX IF NOT EXISTS idx_room_invitation_room_id ON room_invitation(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invitation_status ON room_invitation(status);
CREATE INDEX IF NOT EXISTS idx_room_invitation_to_user_status ON room_invitation(to_user, status);

-- Crear índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_room_invitation_pending 
  ON room_invitation(to_user, status) 
  WHERE status = 'pending';

-- Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_room_invitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_invitation_updated_at
  BEFORE UPDATE ON room_invitation
  FOR EACH ROW
  EXECUTE FUNCTION update_room_invitation_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE room_invitation IS 'Almacena las invitaciones a salas de juego entre usuarios';
COMMENT ON COLUMN room_invitation.id IS 'Identificador único de la invitación';
COMMENT ON COLUMN room_invitation.from_user IS 'ID del usuario que envía la invitación (creador de la sala)';
COMMENT ON COLUMN room_invitation.to_user IS 'ID del usuario que recibe la invitación';
COMMENT ON COLUMN room_invitation.room_id IS 'UUID de la sala a la que se invita';
COMMENT ON COLUMN room_invitation.room_code IS 'Código de 6 caracteres de la sala';
COMMENT ON COLUMN room_invitation.status IS 'Estado de la invitación: pending, accepted, rejected, expired';
COMMENT ON COLUMN room_invitation.created_at IS 'Fecha y hora de creación de la invitación';
COMMENT ON COLUMN room_invitation.updated_at IS 'Fecha y hora de última actualización';

-- Habilitar Row Level Security (RLS)
ALTER TABLE room_invitation ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Permitir acceso completo para desarrollo
-- IMPORTANTE: En producción, estas políticas deberían ser más restrictivas
-- y usar autenticación real de Supabase Auth

-- Política: Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Allow read access to authenticated users"
  ON room_invitation
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Permitir lectura a usuarios anónimos (para desarrollo)
CREATE POLICY "Allow read access to anon users"
  ON room_invitation
  FOR SELECT
  TO anon
  USING (true);

-- Política: Permitir inserción a todos
CREATE POLICY "Allow insert for all users"
  ON room_invitation
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Política: Permitir actualización a todos
CREATE POLICY "Allow update for all users"
  ON room_invitation
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Política: Permitir eliminación a todos
CREATE POLICY "Allow delete for all users"
  ON room_invitation
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Opcional: Función para marcar invitaciones como expiradas automáticamente
-- cuando la sala cambia de estado o se elimina
CREATE OR REPLACE FUNCTION expire_room_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la sala ya no está en 'waiting', expirar todas las invitaciones pendientes
  IF NEW.status != 'waiting' AND OLD.status = 'waiting' THEN
    UPDATE room_invitation
    SET status = 'expired'
    WHERE room_id = NEW.id 
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_invitations_on_room_status_change
  AFTER UPDATE ON game_rooms
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION expire_room_invitations();
