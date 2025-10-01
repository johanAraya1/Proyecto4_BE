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
const telemetryMiddleware_1 = require("./middleware/telemetryMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Middleware de telemetría (debe ir antes de las rutas)
app.use(telemetryMiddleware_1.telemetryMiddleware);
app.use('/', baseRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/telemetry', telemetryRoutes_1.default);
// Middleware de manejo de errores (debe ir al final)
app.use(telemetryMiddleware_1.errorTelemetryMiddleware);
const http_1 = require("http");
const ws_1 = require("ws");
const gameController_1 = require("./controllers/gameController");
const PORT = process.env.PORT || 3000;
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server, path: '/game' });
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
    (0, gameController_1.handleGameConnection)(ws, 'demo-user-id');
});
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}/game`);
});
