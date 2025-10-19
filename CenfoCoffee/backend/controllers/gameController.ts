import { WebSocket } from 'ws';
import { telemetryService } from '../services/telemetryService';

export const handleGameConnection = (ws: WebSocket, userId: string): void => {
  // Registrar conexión WebSocket
  telemetryService.incrementEvent('websocket_connection');
  
  ws.on('message', (message: string) => {
    // Registrar acción de juego
    telemetryService.incrementEvent('game_action');
    
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
