import { Router } from 'express';
import { 
  getMetrics, 
  getHealthStatus, 
  resetMetrics, 
  getSpecificMetrics 
} from '../controllers/telemetryController';

// Application monitoring and telemetry routes
const router = Router();

router.get('/metrics', getMetrics);             // GET /api/telemetry/metrics - complete metrics
router.get('/health', getHealthStatus);         // GET /api/telemetry/health - system health
router.get('/metrics/:type', getSpecificMetrics); // GET /api/telemetry/metrics/:type - filtered metrics
router.post('/reset', resetMetrics);            // POST /api/telemetry/reset - clear all metrics

export default router;