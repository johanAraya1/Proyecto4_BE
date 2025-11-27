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

// Basic CRUD operations for feature flags (routes are relative to the mount path)
router.post('/', createFeatureFlagController);                    
router.get('/', getAllFeatureFlagsController);                    
router.get('/:id', getFeatureFlagByIdController);                 
router.get('/name/:name', getFeatureFlagByNameController);        
router.put('/:id', updateFeatureFlagController);                  
router.delete('/:id', deleteFeatureFlagController);               
router.patch('/:id/toggle', toggleFeatureFlagController);         

export default router;