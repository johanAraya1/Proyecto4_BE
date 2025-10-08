import { Request, Response, NextFunction } from 'express';
import { telemetryService } from '../services/telemetryService';

export interface RequestWithStartTime extends Request {
  startTime?: number;
}

// Middleware para rastreo automático de solicitudes y monitoreo de rendimiento
export const telemetryMiddleware = (req: RequestWithStartTime, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  req.startTime = startTime;

  telemetryService.incrementEvent('api_request');

  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    
    telemetryService.recordResponseTime(req.path, req.method, responseTime);
    
    if (res.statusCode >= 400) {
      telemetryService.recordError(res.statusCode, `${req.method} ${req.path}`);
      
      if (res.statusCode >= 500) {
        telemetryService.incrementEvent('server_error');
      }
    }

    console.log(JSON.stringify({
      type: 'REQUEST',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'unknown',
      ip: req.ip || req.connection.remoteAddress
    }));

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware global de manejo de errores con integración de telemetría
export const errorTelemetryMiddleware = (error: any, req: Request, res: Response, next: NextFunction): void => {
  telemetryService.recordError(500, error.message);
  telemetryService.incrementEvent('server_error');
  
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