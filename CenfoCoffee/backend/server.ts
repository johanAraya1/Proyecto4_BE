import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import baseRoutes from './routes/baseRoutes';
import telemetryRoutes from './routes/telemetryRoutes';
import rankingRoutes from './routes/rankingRoutes';
import roomRoutes from './routes/roomRoutes';
import featureFlagRoutes from './routes/featureFlagRoutes';
import friendRoutes from './routes/friendRoutes';
import { telemetryMiddleware, errorTelemetryMiddleware } from './middleware/telemetryMiddleware';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleGameConnection } from './controllers/gameController';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(telemetryMiddleware);

app.use('/', baseRoutes);
app.use('/auth', authRoutes);
app.use('/telemetry', telemetryRoutes);
app.use('/api', rankingRoutes);
app.use('/api', friendRoutes);     // Para rutas /api/friends/*
app.use('/api', featureFlagRoutes); // Para rutas /api/feature-flags
app.use('/rooms', roomRoutes);

app.use(errorTelemetryMiddleware);

const PORT = process.env.PORT || 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/game' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token || token !== 'mock-token') {
    ws.close(1008, 'Unauthorized');
    return;
  }
  handleGameConnection(ws, 'demo-user-id');
});

// Export app and server for testing. When run directly, start listening.
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/game`);
  });
}

export { app, server };
