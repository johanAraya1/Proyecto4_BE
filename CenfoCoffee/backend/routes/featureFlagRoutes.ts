import { Router } from 'express';
import {
  createFeatureFlagController,
  getAllFeatureFlagsController,
  getFeatureFlagByIdController,
  getFeatureFlagByNameController,
  updateFeatureFlagController,
  deleteFeatureFlagController,
  toggleFeatureFlagController
} from '../controllers/featureFlagController';

// Rutas de API REST para feature flags - operaciones CRUD completas
const router = Router();

router.post('/', createFeatureFlagController);                    // POST /api/feature-flags
router.get('/', getAllFeatureFlagsController);                    // GET /api/feature-flags
router.get('/:id', getFeatureFlagByIdController);                 // GET /api/feature-flags/:id
router.get('/name/:name', getFeatureFlagByNameController);        // GET /api/feature-flags/name/:name
router.put('/:id', updateFeatureFlagController);                  // PUT /api/feature-flags/:id
router.delete('/:id', deleteFeatureFlagController);               // DELETE /api/feature-flags/:id
router.patch('/:id/toggle', toggleFeatureFlagController);         // PATCH /api/feature-flags/:id/toggle

export default router;