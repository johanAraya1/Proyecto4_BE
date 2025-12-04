import { Router } from 'express';
import { register, login } from '../controllers/authController';

// User authentication routes - registration and login endpoints
const router = Router();

router.post('/register', register);     // POST /auth/register
router.post('/login', login);           // POST /auth/login

export default router;
