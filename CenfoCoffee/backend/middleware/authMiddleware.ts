import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabaseClient';

// Interface para extender Request con información del usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    elo?: number;
  };
}

// Middleware para autenticar requests usando el token en el header Authorization
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autorización requerido' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Por ahora validamos que el token sea 'mock-token' y obtenemos el usuario del header o query
    if (token !== 'mock-token') {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    // Para desarrollo, esperamos que el userId venga en el header x-user-id
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      res.status(401).json({ error: 'ID de usuario requerido en header x-user-id' });
      return;
    }

    // Convertir userId a número para compatibilidad con la base de datos
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber)) {
      res.status(401).json({ error: 'ID de usuario debe ser un número válido' });
      return;
    }

    // Obtener información del usuario desde Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, elo')
      .eq('id', userIdNumber)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      elo: user.elo
    };

    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Error de autenticación: ' + error.message });
  }
};