import { WebSocket } from 'ws';
import { telemetryService } from '../services/telemetryService';

// WebSocket connection handler for real-time game interactions
export const handleGameConnection = (ws: WebSocket, userId: string): void => {
  telemetryService.incrementEvent('websocket_connection');
  
  ws.on('message', (message: string) => {
    telemetryService.incrementEvent('game_action');
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
