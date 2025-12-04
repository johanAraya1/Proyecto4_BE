"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const featureFlagController_1 = require("../controllers/featureFlagController");
// Feature flags routes - following the same pattern as authRoutes
const router = (0, express_1.Router)();
// Basic CRUD operations for feature flags
router.post('/feature-flags', featureFlagController_1.createFeatureFlagController);
router.get('/feature-flags', featureFlagController_1.getAllFeatureFlagsController);
router.get('/feature-flags/:id', featureFlagController_1.getFeatureFlagByIdController);
router.get('/feature-flags/name/:name', featureFlagController_1.getFeatureFlagByNameController);
router.put('/feature-flags/:id', featureFlagController_1.updateFeatureFlagController);
router.delete('/feature-flags/:id', featureFlagController_1.deleteFeatureFlagController);
router.patch('/feature-flags/:id/toggle', featureFlagController_1.toggleFeatureFlagController);
exports.default = router;
