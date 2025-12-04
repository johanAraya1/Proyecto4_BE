-- Script para corregir la tabla room_invitation
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Eliminar la tabla si existe (CUIDADO: esto borrará todos los datos)
DROP TABLE IF EXISTS room_invitation CASCADE;

-- 2. Crear la tabla nuevamente
CREATE TABLE room_invitation (
  id BIGSERIAL PRIMARY KEY,
  from_user BIGINT NOT NULL,
  to_user BIGINT NOT NULL,
  room_id UUID NOT NULL,
  room_code VARCHAR(6) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Agregar foreign keys con nombres específicos
ALTER TABLE room_invitation
ADD CONSTRAINT room_invitation_from_user_fkey 
FOREIGN KEY (from_user) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE room_invitation
ADD CONSTRAINT room_invitation_to_user_fkey 
FOREIGN KEY (to_user) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE room_invitation
ADD CONSTRAINT room_invitation_room_id_fkey 
FOREIGN KEY (room_id) 
REFERENCES game_rooms(id) 
ON DELETE CASCADE;

-- 4. Agregar constraints
ALTER TABLE room_invitation
ADD CONSTRAINT check_different_users 
CHECK (from_user != to_user);

ALTER TABLE room_invitation
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));

-- 5. Crear índices
CREATE INDEX idx_room_invitation_from_user ON room_invitation(from_user);
CREATE INDEX idx_room_invitation_to_user ON room_invitation(to_user);
CREATE INDEX idx_room_invitation_room_id ON room_invitation(room_id);
CREATE INDEX idx_room_invitation_status ON room_invitation(status);
CREATE INDEX idx_room_invitation_to_user_status ON room_invitation(to_user, status);
CREATE INDEX idx_room_invitation_pending ON room_invitation(to_user, status) WHERE status = 'pending';

-- 6. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_room_invitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger
DROP TRIGGER IF EXISTS trigger_update_room_invitation_updated_at ON room_invitation;
CREATE TRIGGER trigger_update_room_invitation_updated_at
  BEFORE UPDATE ON room_invitation
  FOR EACH ROW
  EXECUTE FUNCTION update_room_invitation_updated_at();

-- 8. Agregar comentarios
COMMENT ON TABLE room_invitation IS 'Almacena las invitaciones a salas de juego entre usuarios';
COMMENT ON COLUMN room_invitation.id IS 'Identificador único de la invitación';
COMMENT ON COLUMN room_invitation.from_user IS 'ID del usuario que envía la invitación (creador de la sala)';
COMMENT ON COLUMN room_invitation.to_user IS 'ID del usuario que recibe la invitación';
COMMENT ON COLUMN room_invitation.room_id IS 'UUID de la sala a la que se invita';
COMMENT ON COLUMN room_invitation.room_code IS 'Código de 6 caracteres de la sala';
COMMENT ON COLUMN room_invitation.status IS 'Estado de la invitación: pending, accepted, rejected, expired';

-- 9. Habilitar RLS
ALTER TABLE room_invitation ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas RLS permisivas (para desarrollo)
CREATE POLICY "Allow read access to authenticated users"
  ON room_invitation FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Allow read access to anon users"
  ON room_invitation FOR SELECT
  TO anon USING (true);

CREATE POLICY "Allow insert for all users"
  ON room_invitation FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow update for all users"
  ON room_invitation FOR UPDATE
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow delete for all users"
  ON room_invitation FOR DELETE
  TO authenticated, anon
  USING (true);

-- 11. Crear función para expirar invitaciones cuando la sala cambia
CREATE OR REPLACE FUNCTION expire_room_invitations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'waiting' AND OLD.status = 'waiting' THEN
    UPDATE room_invitation
    SET status = 'expired'
    WHERE room_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Crear trigger para expiración automática
DROP TRIGGER IF EXISTS trigger_expire_invitations_on_room_status_change ON game_rooms;
CREATE TRIGGER trigger_expire_invitations_on_room_status_change
  AFTER UPDATE ON game_rooms
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION expire_room_invitations();

-- Verificar que todo se creó correctamente
SELECT 'Tabla creada correctamente' AS status;
