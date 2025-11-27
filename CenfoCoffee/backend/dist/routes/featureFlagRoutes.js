"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const featureFlagController_1 = require("../controllers/featureFlagController");
// Feature flags routes - following the same pattern as authRoutes
const router = (0, express_1.Router)();
// Basic CRUD operations for feature flags (routes are relative to the mount path)
router.post('/', featureFlagController_1.createFeatureFlagController);
router.get('/', featureFlagController_1.getAllFeatureFlagsController);
router.get('/:id', featureFlagController_1.getFeatureFlagByIdController);
router.get('/name/:name', featureFlagController_1.getFeatureFlagByNameController);
router.put('/:id', featureFlagController_1.updateFeatureFlagController);
router.delete('/:id', featureFlagController_1.deleteFeatureFlagController);
router.patch('/:id/toggle', featureFlagController_1.toggleFeatureFlagController);
exports.default = router;
