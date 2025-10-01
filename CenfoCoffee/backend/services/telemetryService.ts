import { 
  EventCounter, 
  ResponseTimeMetric, 
  ErrorMetric, 
  SystemMetrics, 
  TelemetryData, 
  EventType 
} from '../models/Telemetry';

class TelemetryService {
  private static instance: TelemetryService;
  private eventCounters: Map<string, EventCounter> = new Map();
  private responseMetrics: Map<string, ResponseTimeMetric> = new Map();
  private errorMetrics: Map<number, ErrorMetric> = new Map();
  private startTime: Date = new Date();
  private totalRequests: number = 0;
  private totalErrors: number = 0;
  private responseTimes: number[] = [];

  private constructor() {}

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  // Incrementar contador de eventos
  public incrementEvent(eventType: EventType): void {
    const current = this.eventCounters.get(eventType);
    if (current) {
      current.count++;
      current.lastUpdated = new Date();
    } else {
      this.eventCounters.set(eventType, {
        eventType,
        count: 1,
        lastUpdated: new Date()
      });
    }
    
    // Log estructurado
    this.logEvent(eventType);
  }

  // Registrar tiempo de respuesta
  public recordResponseTime(endpoint: string, method: string, responseTime: number): void {
    const key = `${method}:${endpoint}`;
    const current = this.responseMetrics.get(key);
    
    this.totalRequests++;
    this.responseTimes.push(responseTime);
    
    if (current) {
      current.requestCount++;
      current.averageTime = (current.averageTime * (current.requestCount - 1) + responseTime) / current.requestCount;
      current.minTime = Math.min(current.minTime, responseTime);
      current.maxTime = Math.max(current.maxTime, responseTime);
      current.lastUpdated = new Date();
    } else {
      this.responseMetrics.set(key, {
        endpoint,
        method,
        averageTime: responseTime,
        minTime: responseTime,
        maxTime: responseTime,
        requestCount: 1,
        lastUpdated: new Date()
      });
    }
  }

  // Registrar errores
  public recordError(statusCode: number, errorMessage?: string): void {
    this.totalErrors++;
    const current = this.errorMetrics.get(statusCode);
    
    if (current) {
      current.count++;
      current.lastError = errorMessage;
      current.lastUpdated = new Date();
    } else {
      this.errorMetrics.set(statusCode, {
        statusCode,
        count: 1,
        lastError: errorMessage,
        lastUpdated: new Date()
      });
    }

    // Log estructurado para errores
    this.logError(statusCode, errorMessage);
  }

  // Obtener todas las métricas
  public getMetrics(): TelemetryData {
    const uptime = Date.now() - this.startTime.getTime();
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    return {
      systemMetrics: {
        uptime,
        totalRequests: this.totalRequests,
        totalErrors: this.totalErrors,
        averageResponseTime,
        timestamp: new Date()
      },
      eventCounters: Array.from(this.eventCounters.values()),
      responseMetrics: Array.from(this.responseMetrics.values()),
      errorMetrics: Array.from(this.errorMetrics.values())
    };
  }

  // Reset métricas (útil para testing o reset manual)
  public reset(): void {
    this.eventCounters.clear();
    this.responseMetrics.clear();
    this.errorMetrics.clear();
    this.startTime = new Date();
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.responseTimes = [];
  }

  // Logging estructurado
  private logEvent(eventType: EventType): void {
    console.log(JSON.stringify({
      type: 'EVENT',
      eventType,
      timestamp: new Date().toISOString(),
      count: this.eventCounters.get(eventType)?.count
    }));
  }

  private logError(statusCode: number, errorMessage?: string): void {
    console.error(JSON.stringify({
      type: 'ERROR',
      statusCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      totalErrors: this.totalErrors
    }));
  }

  // Métricas específicas para monitoreo
  public getHealthStatus(): { status: string; uptime: number; errorRate: number } {
    const uptime = Date.now() - this.startTime.getTime();
    const errorRate = this.totalRequests > 0 ? (this.totalErrors / this.totalRequests) * 100 : 0;
    
    let status = 'healthy';
    if (errorRate > 10) status = 'critical';
    else if (errorRate > 5) status = 'warning';

    return { status, uptime, errorRate };
  }
}

export const telemetryService = TelemetryService.getInstance();