import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';
import { telemetryService } from '../services/telemetryService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const user = await registerUser(email, password, name);
    
    // Registrar evento de registro exitoso
    telemetryService.incrementEvent('user_register_success');
    
    res.status(201).json({ user });
  } catch (error: any) {
    // Registrar evento de registro fallido
    telemetryService.incrementEvent('user_register_failed');
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginUser(email, password);
    
    // Registrar evento de login exitoso
    telemetryService.incrementEvent('user_login_success');
    
    res.status(200).json({ 
      token,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      elo: user.elo
    });
  } catch (error: any) {
    // Registrar evento de login fallido
    telemetryService.incrementEvent('user_login_failed');
    res.status(401).json({ error: error.message });
  }
};
