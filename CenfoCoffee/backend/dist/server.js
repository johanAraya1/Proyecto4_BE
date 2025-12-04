"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const baseRoutes_1 = __importDefault(require("./routes/baseRoutes"));
const telemetryRoutes_1 = __importDefault(require("./routes/telemetryRoutes"));
const rankingRoutes_1 = __importDefault(require("./routes/rankingRoutes"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
const featureFlagRoutes_1 = __importDefault(require("./routes/featureFlagRoutes"));
const friendRoutes_1 = __importDefault(require("./routes/friendRoutes"));
const roomInvitationRoutes_1 = __importDefault(require("./routes/roomInvitationRoutes"));
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const telemetryMiddleware_1 = require("./middleware/telemetryMiddleware");
const http_1 = require("http");
const ws_1 = require("ws");
const gameController_1 = require("./controllers/gameController");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(telemetryMiddleware_1.telemetryMiddleware);
app.use('/', baseRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/telemetry', telemetryRoutes_1.default);
app.use('/api', rankingRoutes_1.default);
app.use('/api', friendRoutes_1.default);
app.use('/api', roomInvitationRoutes_1.default);
app.use('/api', featureFlagRoutes_1.default);
app.use('/rooms', roomRoutes_1.default);
app.use('/api/game', gameRoutes_1.default);
app.use(telemetryMiddleware_1.errorTelemetryMiddleware);
const PORT = process.env.PORT || 3000;
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
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
        (0, gameController_1.handleGameConnection)(ws, userId, roomCode);
    }
    catch (error) {
        console.error('💥 Error en WebSocket connection handler:', error);
        ws.close(1011, 'Error interno del servidor');
    }
});
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/game`);
    console.log(`📡 REST API running on http://localhost:${PORT}`);
});
