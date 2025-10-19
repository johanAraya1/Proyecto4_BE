import { Router } from 'express';
import { 
  getMetrics, 
  getHealthStatus, 
  resetMetrics, 
  getSpecificMetrics 
} from '../controllers/telemetryController';

const router = Router();

// Obtener todas las métricas
router.get('/metrics', getMetrics);

// Obtener estado de salud del sistema
router.get('/health', getHealthStatus);

// Obtener métricas específicas por tipo
router.get('/metrics/:type', getSpecificMetrics);

// Reset de métricas (útil para testing o administración)
router.post('/reset', resetMetrics);

export default router;