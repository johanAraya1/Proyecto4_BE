"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecificMetrics = exports.resetMetrics = exports.getHealthStatus = exports.getMetrics = void 0;
const telemetryService_1 = require("../services/telemetryService");
// HTTP handler for GET /api/telemetry/metrics - returns complete telemetry data
const getMetrics = async (req, res) => {
    try {
        const metrics = telemetryService_1.telemetryService.getMetrics();
        res.status(200).json(metrics);
    }
    catch (error) {
        res.status(500).json({ error: 'Error retrieving metrics', message: error.message });
    }
};
exports.getMetrics = getMetrics;
// HTTP handler for GET /api/telemetry/health - returns system health status
const getHealthStatus = async (req, res) => {
    try {
        const health = telemetryService_1.telemetryService.getHealthStatus();
        res.status(200).json(health);
    }
    catch (error) {
        res.status(500).json({ error: 'Error retrieving health status', message: error.message });
    }
};
exports.getHealthStatus = getHealthStatus;
// HTTP handler for POST /api/telemetry/reset - clears all telemetry data
const resetMetrics = async (req, res) => {
    try {
        telemetryService_1.telemetryService.reset();
        res.status(200).json({ message: 'Metrics reset successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error resetting metrics', message: error.message });
    }
};
exports.resetMetrics = resetMetrics;
// HTTP handler for GET /api/telemetry/metrics/:type - returns specific metric categories
const getSpecificMetrics = async (req, res) => {
    try {
        const { type } = req.params; // 'events', 'responses', 'errors', 'system'
        const allMetrics = telemetryService_1.telemetryService.getMetrics();
        switch (type) {
            case 'events':
                res.status(200).json({ eventCounters: allMetrics.eventCounters });
                break;
            case 'responses':
                res.status(200).json({ responseMetrics: allMetrics.responseMetrics });
                break;
            case 'errors':
                res.status(200).json({ errorMetrics: allMetrics.errorMetrics });
                break;
            case 'system':
                res.status(200).json({ systemMetrics: allMetrics.systemMetrics });
                break;
            default:
                res.status(400).json({ error: 'Invalid metric type. Use: events, responses, errors, or system' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Error retrieving specific metrics', message: error.message });
    }
};
exports.getSpecificMetrics = getSpecificMetrics;
