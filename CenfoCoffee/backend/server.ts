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
import roomInvitationRoutes from './routes/roomInvitationRoutes';
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
app.use('/api', friendRoutes);
app.use('/api', roomInvitationRoutes);
app.use('/api', featureFlagRoutes);
app.use('/rooms', roomRoutes);

app.use(errorTelemetryMiddleware);

const PORT = process.env.PORT || 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('\n🔌 [WebSocket] Nueva conexión intentada');
  console.log('📍 URL completa:', req.url);
  console.log('🔑 Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    console.log('🔍 URL parseada - pathname:', url.pathname);
    console.log('🔍 URL parseada - search:', url.search);
    
    // Extraer roomCode de la URL: /game/:roomCode
    const pathParts = url.pathname.split('/');
    console.log('📋 Path parts:', pathParts);
    const roomCode = pathParts[2]; // /game/ABC123 -> ABC123
    
    // Extraer userId de los query params
    const userId = url.searchParams.get('userId');
    
    console.log('🎯 roomCode extraído:', roomCode);
    console.log('👤 userId extraído:', userId);

    if (!roomCode) {
      console.error('❌ roomCode faltante - cerrando conexión');
      ws.close(1008, 'roomCode es requerido');
      return;
    }

    if (!userId) {
      console.error('❌ userId faltante - cerrando conexión');
      ws.close(1008, 'userId es requerido');
      return;
    }

    console.log('✅ Validaciones pasadas, llamando a handleGameConnection');
    // Manejar la conexión con roomCode y userId
    handleGameConnection(ws, userId, roomCode);
  } catch (error) {
    console.error('💥 Error en WebSocket connection handler:', error);
    ws.close(1011, 'Error interno del servidor');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/game`);
  console.log(`📡 REST API running on http://localhost:${PORT}`);
});
