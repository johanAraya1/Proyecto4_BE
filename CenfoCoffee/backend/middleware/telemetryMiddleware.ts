import { Request, Response, NextFunction } from 'express';
import { telemetryService } from '../services/telemetryService';

export interface RequestWithStartTime extends Request {
  startTime?: number;
}

export const telemetryMiddleware = (req: RequestWithStartTime, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  req.startTime = startTime;

  // Incrementar contador de requests API
  telemetryService.incrementEvent('api_request');

  // Override del método res.end para capturar cuando termina la respuesta
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    
    // Registrar tiempo de respuesta
    telemetryService.recordResponseTime(req.path, req.method, responseTime);
    
    // Registrar errores si el status code es >= 400
    if (res.statusCode >= 400) {
      telemetryService.recordError(res.statusCode, `${req.method} ${req.path}`);
      
      // Registrar error de servidor si es 5xx
      if (res.statusCode >= 500) {
        telemetryService.incrementEvent('server_error');
      }
    }

    // Log estructurado de la request
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

    // Llamar al método original
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware específico para manejo de errores
export const errorTelemetryMiddleware = (error: any, req: Request, res: Response, next: NextFunction): void => {
  // Registrar el error
  telemetryService.recordError(500, error.message);
  telemetryService.incrementEvent('server_error');
  
  // Log estructurado del error
  console.error(JSON.stringify({
    type: 'UNHANDLED_ERROR',
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  }));

  // Responder con error 500
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};