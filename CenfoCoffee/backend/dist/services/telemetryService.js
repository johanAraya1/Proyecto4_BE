"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telemetryService = void 0;
// Singleton service for collecting and managing application telemetry data
class TelemetryService {
    constructor() {
        this.eventCounters = new Map();
        this.responseMetrics = new Map();
        this.errorMetrics = new Map();
        this.startTime = new Date();
        this.totalRequests = 0;
        this.totalErrors = 0;
        this.responseTimes = [];
    }
    // Returns the singleton instance of TelemetryService
    static getInstance() {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }
    // Increments the counter for a specific event type
    incrementEvent(eventType) {
        const current = this.eventCounters.get(eventType);
        if (current) {
            current.count++;
            current.lastUpdated = new Date();
        }
        else {
            this.eventCounters.set(eventType, {
                eventType,
                count: 1,
                lastUpdated: new Date()
            });
        }
        this.logEvent(eventType);
    }
    // Records response time metrics for API endpoints
    recordResponseTime(endpoint, method, responseTime) {
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
        }
        else {
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
    // Records error occurrences with status codes and messages
    recordError(statusCode, errorMessage) {
        this.totalErrors++;
        const current = this.errorMetrics.get(statusCode);
        if (current) {
            current.count++;
            current.lastError = errorMessage;
            current.lastUpdated = new Date();
        }
        else {
            this.errorMetrics.set(statusCode, {
                statusCode,
                count: 1,
                lastError: errorMessage,
                lastUpdated: new Date()
            });
        }
        this.logError(statusCode, errorMessage);
    }
    // Returns complete telemetry data including system metrics and counters
    getMetrics() {
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
    // Resets all telemetry data and counters
    reset() {
        this.eventCounters.clear();
        this.responseMetrics.clear();
        this.errorMetrics.clear();
        this.startTime = new Date();
        this.totalRequests = 0;
        this.totalErrors = 0;
        this.responseTimes = [];
    }
    // Logs event occurrences to console for monitoring
    logEvent(eventType) {
        // Telemetry logging disabled for cleaner output
        // console.log(JSON.stringify({
        //   type: 'EVENT',
        //   eventType,
        //   timestamp: new Date().toISOString(),
        //   count: this.eventCounters.get(eventType)?.count
        // }));
    }
    // Logs errors to console with details for debugging
    logError(statusCode, errorMessage) {
        // Telemetry logging disabled for cleaner output
        // console.error(JSON.stringify({
        //   type: 'ERROR',
        //   statusCode,
        //   message: errorMessage,
        //   timestamp: new Date().toISOString(),
        //   totalErrors: this.totalErrors
        // }));
    }
    // Returns current system health status based on error rates
    getHealthStatus() {
        const uptime = Date.now() - this.startTime.getTime();
        const errorRate = this.totalRequests > 0 ? (this.totalErrors / this.totalRequests) * 100 : 0;
        let status = 'healthy';
        if (errorRate > 10)
            status = 'critical';
        else if (errorRate > 5)
            status = 'warning';
        return { status, uptime, errorRate };
    }
}
exports.telemetryService = TelemetryService.getInstance();
