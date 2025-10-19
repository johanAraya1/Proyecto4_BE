"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const featureFlagController_1 = require("../controllers/featureFlagController");
// Rutas de API REST para feature flags - operaciones CRUD completas
const router = (0, express_1.Router)();
router.post('/', featureFlagController_1.createFeatureFlagController); // POST /api/feature-flags
router.get('/', featureFlagController_1.getAllFeatureFlagsController); // GET /api/feature-flags
router.get('/:id', featureFlagController_1.getFeatureFlagByIdController); // GET /api/feature-flags/:id
router.get('/name/:name', featureFlagController_1.getFeatureFlagByNameController); // GET /api/feature-flags/name/:name
router.put('/:id', featureFlagController_1.updateFeatureFlagController); // PUT /api/feature-flags/:id
router.delete('/:id', featureFlagController_1.deleteFeatureFlagController); // DELETE /api/feature-flags/:id
router.patch('/:id/toggle', featureFlagController_1.toggleFeatureFlagController); // PATCH /api/feature-flags/:id/toggle
exports.default = router;
