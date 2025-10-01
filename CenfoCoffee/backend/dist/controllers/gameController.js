"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGameConnection = void 0;
const telemetryService_1 = require("../services/telemetryService");
const handleGameConnection = (ws, userId) => {
    // Registrar conexión WebSocket
    telemetryService_1.telemetryService.incrementEvent('websocket_connection');
    ws.on('message', (message) => {
        // Registrar acción de juego
        telemetryService_1.telemetryService.incrementEvent('game_action');
        // Handle incoming game messages here
        ws.send(`Echo from server: ${message}`);
    });
    ws.on('close', () => {
        // Log de desconexión
        console.log(JSON.stringify({
            type: 'WEBSOCKET_DISCONNECT',
            userId,
            timestamp: new Date().toISOString()
        }));
    });
    ws.send('Welcome to the game!');
};
exports.handleGameConnection = handleGameConnection;
