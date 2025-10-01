import { Request, Response } from 'express';
import { telemetryService } from '../services/telemetryService';

export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = telemetryService.getMetrics();
    res.status(200).json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: 'Error retrieving metrics', message: error.message });
  }
};

export const getHealthStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = telemetryService.getHealthStatus();
    res.status(200).json(health);
  } catch (error: any) {
    res.status(500).json({ error: 'Error retrieving health status', message: error.message });
  }
};

export const resetMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    telemetryService.reset();
    res.status(200).json({ message: 'Metrics reset successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error resetting metrics', message: error.message });
  }
};

// Endpoint para obtener métricas específicas (útil para dashboards)
export const getSpecificMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params; // 'events', 'responses', 'errors', 'system'
    const allMetrics = telemetryService.getMetrics();

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
  } catch (error: any) {
    res.status(500).json({ error: 'Error retrieving specific metrics', message: error.message });
  }
};