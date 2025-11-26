// Contador de eventos para rastrear ocurrencias
export interface EventCounter {
  eventType: string;
  count: number;
  lastUpdated: Date;
}

// Métricas de tiempo de respuesta para endpoints de API
export interface ResponseTimeMetric {
  endpoint: string;
  method: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  requestCount: number;
  lastUpdated: Date;
}

// Rastreo de errores por código de estado HTTP
export interface ErrorMetric {
  statusCode: number;
  count: number;
  lastError?: string;
  lastUpdated: Date;
}

// Resumen de métricas del sistema
export interface SystemMetrics {
  uptime: number; // Milisegundos desde el inicio
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number; // En milisegundos
  timestamp: Date;
}

// Estructura completa de datos de telemetría
export interface TelemetryData {
  systemMetrics: SystemMetrics;
  eventCounters: EventCounter[];
  responseMetrics: ResponseTimeMetric[];
  errorMetrics: ErrorMetric[];
}

// Tipos de eventos rastreables para telemetría
export type EventType = 
  | 'user_login_success'
  | 'user_login_failed'
  | 'user_register_success' 
  | 'user_register_failed'
  | 'websocket_connection'
  | 'game_action'
  | 'api_request'
  | 'server_error'
  | 'room_create_success'
  | 'room_create_failed'
  | 'room_create_validation_failed'
  | 'room_get_success'
  | 'room_get_failed'
  | 'room_get_not_found'
  | 'rooms_list_success'
  | 'rooms_list_failed'
  | 'user_rooms_get_success'
  | 'user_rooms_get_failed'
  | 'room_join_success'
  | 'room_join_failed'
  | 'room_user_already_in_room'
  | 'feature_flag_create_success'
  | 'feature_flag_create_failed'
  | 'feature_flag_create_validation_failed'
  | 'feature_flag_get_success'
  | 'feature_flag_get_failed'
  | 'feature_flag_get_not_found'
  | 'feature_flags_list_success'
  | 'feature_flags_list_failed'
  | 'feature_flag_update_success'
  | 'feature_flag_update_failed'
  | 'feature_flag_delete_success'
  | 'feature_flag_delete_failed'
  | 'feature_flag_delete_not_found'
  | 'feature_flag_toggle_success'
  | 'feature_flag_toggle_failed'
  | 'friends_search_success'
  | 'friends_search_failed'
  | 'friend_request_sent'
  | 'friend_request_send_failed'
  | 'friend_requests_retrieved'
  | 'friend_requests_retrieval_failed'
  | 'friend_request_accepted'
  | 'friend_request_accept_failed'
  | 'friend_request_rejected'
  | 'friend_request_reject_failed'
  | 'friends_list_retrieved'
  | 'friends_list_retrieval_failed'
  | 'friend_removed'
  | 'friend_removal_failed';