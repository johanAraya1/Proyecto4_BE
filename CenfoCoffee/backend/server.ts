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
import gameRoutes from './routes/gameRoutes';
import roomInvitationRoutes from './routes/roomInvitationRoutes';
import { telemetryMiddleware, errorTelemetryMiddleware } from './middleware/telemetryMiddleware';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleGameConnection } from './controllers/gameController';

dotenv.config();

const app = express();

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================\n');
  next();
});

// Configuración de CORS más permisiva para desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true
}));

app.use(express.json());
app.use(telemetryMiddleware);

app.use('/', baseRoutes);
app.use('/auth', authRoutes);
app.use('/telemetry', telemetryRoutes);
app.use('/', rankingRoutes);
app.use('/api', friendRoutes);
app.use('/api', rankingRoutes);
app.use('/api', friendRoutes);     // Para rutas /api/friends/*
app.use('/api', roomInvitationRoutes); // Para rutas /api/room-invitations/*
app.use('/api', featureFlagRoutes); // Para rutas /api/feature-flags
app.use('/rooms', roomRoutes);
app.use('/feature-flags', featureFlagRoutes);
app.use('/api/game', gameRoutes);

app.use(errorTelemetryMiddleware);

const PORT = process.env.PORT || 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server }); // Sin restricción de path temporalmente

wss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    
    // Extraer roomCode de la URL: /game/:roomCode
    const pathParts = url.pathname.split('/');
    const roomCode = pathParts[2]; // /game/ABC123 -> ABC123
    
    // Extraer userId de los query params
    const userId = url.searchParams.get('userId');

    if (!roomCode) {
      ws.close(1008, 'roomCode es requerido');
      return;
    }

    if (!userId) {
      ws.close(1008, 'userId es requerido');
      return;
    }

    // Manejar la conexión con roomCode y userId
    handleGameConnection(ws, userId, roomCode);
  } catch (error) {
    ws.close(1011, 'Error interno del servidor');
  }
});

server.listen(PORT, () => {});
