"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGameConnection = void 0;
const telemetryService_1 = require("../services/telemetryService");
// WebSocket connection handler for real-time game interactions
const handleGameConnection = (ws, userId) => {
    telemetryService_1.telemetryService.incrementEvent('websocket_connection');
    ws.on('message', (message) => {
        telemetryService_1.telemetryService.incrementEvent('game_action');
        ws.send(`Echo from server: ${message}`);
    });
    ws.on('close', () => {
        console.log(JSON.stringify({
            type: 'WEBSOCKET_DISCONNECT',
            userId,
            timestamp: new Date().toISOString()
        }));
    });
    ws.send('Welcome to the game!');
};
exports.handleGameConnection = handleGameConnection;
