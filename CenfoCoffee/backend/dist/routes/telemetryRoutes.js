"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telemetryController_1 = require("../controllers/telemetryController");
const router = (0, express_1.Router)();
// Obtener todas las métricas
router.get('/metrics', telemetryController_1.getMetrics);
// Obtener estado de salud del sistema
router.get('/health', telemetryController_1.getHealthStatus);
// Obtener métricas específicas por tipo
router.get('/metrics/:type', telemetryController_1.getSpecificMetrics);
// Reset de métricas (útil para testing o administración)
router.post('/reset', telemetryController_1.resetMetrics);
exports.default = router;
