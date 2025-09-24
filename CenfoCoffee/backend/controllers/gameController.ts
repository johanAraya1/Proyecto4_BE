import { WebSocket } from 'ws';

export const handleGameConnection = (ws: WebSocket, userId: string): void => {
  ws.on('message', (message: string) => {
    // Handle incoming game messages here
    ws.send(`Echo from server: ${message}`);
  });

  ws.send('Welcome to the game!');
};
