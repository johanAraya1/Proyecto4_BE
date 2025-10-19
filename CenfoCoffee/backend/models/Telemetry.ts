export interface EventCounter {
  eventType: string;
  count: number;
  lastUpdated: Date;
}

export interface ResponseTimeMetric {
  endpoint: string;
  method: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  requestCount: number;
  lastUpdated: Date;
}

export interface ErrorMetric {
  statusCode: number;
  count: number;
  lastError?: string;
  lastUpdated: Date;
}

export interface SystemMetrics {
  uptime: number;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  timestamp: Date;
}

export interface TelemetryData {
  systemMetrics: SystemMetrics;
  eventCounters: EventCounter[];
  responseMetrics: ResponseTimeMetric[];
  errorMetrics: ErrorMetric[];
}

export type EventType = 
  | 'user_login_success'
  | 'user_login_failed'
  | 'user_register_success' 
  | 'user_register_failed'
  | 'websocket_connection'
  | 'game_action'
  | 'api_request'
  | 'server_error';