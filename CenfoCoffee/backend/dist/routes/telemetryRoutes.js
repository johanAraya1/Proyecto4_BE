"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telemetryController_1 = require("../controllers/telemetryController");
// Application monitoring and telemetry routes
const router = (0, express_1.Router)();
router.get('/metrics', telemetryController_1.getMetrics); // GET /api/telemetry/metrics - complete metrics
router.get('/health', telemetryController_1.getHealthStatus); // GET /api/telemetry/health - system health
router.get('/metrics/:type', telemetryController_1.getSpecificMetrics); // GET /api/telemetry/metrics/:type - filtered metrics
router.post('/reset', telemetryController_1.resetMetrics); // POST /api/telemetry/reset - clear all metrics
exports.default = router;
