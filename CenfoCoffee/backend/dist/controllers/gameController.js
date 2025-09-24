"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGameConnection = void 0;
const handleGameConnection = (ws, userId) => {
    ws.on('message', (message) => {
        // Handle incoming game messages here
        ws.send(`Echo from server: ${message}`);
    });
    ws.send('Welcome to the game!');
};
exports.handleGameConnection = handleGameConnection;
