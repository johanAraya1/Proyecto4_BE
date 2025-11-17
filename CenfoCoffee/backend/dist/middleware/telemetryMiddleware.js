"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorTelemetryMiddleware = exports.telemetryMiddleware = void 0;
const telemetryService_1 = require("../services/telemetryService");
// Middleware para rastreo automático de solicitudes y monitoreo de rendimiento
const telemetryMiddleware = (req, res, next) => {
    const startTime = Date.now();
    req.startTime = startTime;
    telemetryService_1.telemetryService.incrementEvent('api_request');
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const responseTime = Date.now() - startTime;
        telemetryService_1.telemetryService.recordResponseTime(req.path, req.method, responseTime);
        if (res.statusCode >= 400) {
            telemetryService_1.telemetryService.recordError(res.statusCode, `${req.method} ${req.path}`);
            if (res.statusCode >= 500) {
                telemetryService_1.telemetryService.incrementEvent('server_error');
            }
        }
        // Telemetry logging disabled for cleaner output
        // console.log(JSON.stringify({
        //   type: 'REQUEST',
        //   method: req.method,
        //   path: req.path,
        //   statusCode: res.statusCode,
        //   responseTime,
        //   timestamp: new Date().toISOString(),
        //   userAgent: req.get('User-Agent') || 'unknown',
        //   ip: req.ip || req.socket.remoteAddress
        // }));
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.telemetryMiddleware = telemetryMiddleware;
// Middleware global de manejo de errores con integración de telemetría
const errorTelemetryMiddleware = (error, req, res, next) => {
    telemetryService_1.telemetryService.recordError(500, error.message);
    telemetryService_1.telemetryService.incrementEvent('server_error');
    console.error(JSON.stringify({
        type: 'UNHANDLED_ERROR',
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    }));
    if (!res.headersSent) {
        res.status(500).json({
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
};
exports.errorTelemetryMiddleware = errorTelemetryMiddleware;
