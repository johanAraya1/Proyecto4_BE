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

// Feature flags routes - following the same pattern as authRoutes
const router = Router();

// Basic CRUD operations for feature flags
router.post('/feature-flags', createFeatureFlagController);                    
router.get('/feature-flags', getAllFeatureFlagsController);                    
router.get('/feature-flags/:id', getFeatureFlagByIdController);                 
router.get('/feature-flags/name/:name', getFeatureFlagByNameController);        
router.put('/feature-flags/:id', updateFeatureFlagController);                  
router.delete('/feature-flags/:id', deleteFeatureFlagController);               
router.patch('/feature-flags/:id/toggle', toggleFeatureFlagController);         

export default router;