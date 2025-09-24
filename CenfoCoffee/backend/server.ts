import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import baseRoutes from './routes/baseRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', baseRoutes);
app.use('/auth', authRoutes);


import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleGameConnection } from './controllers/gameController';

const PORT = process.env.PORT || 3000;
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/game' });

wss.on('connection', (ws, req) => {
  // Simple token check from query string (for demo purposes)
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  // In production, validate token properly
  if (!token || token !== 'mock-token') {
    ws.close(1008, 'Unauthorized');
    return;
  }
  // For demo, userId is not extracted from token
  handleGameConnection(ws, 'demo-user-id');
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/game`);
});
