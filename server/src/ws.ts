import { FastifyInstance } from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | undefined;

export function setupWebsocket(app: FastifyInstance) {
   wss = new WebSocketServer({ server: app.server });
   wss.on('connection', (socket: WebSocket) => {
      app.log.info('WebSocket client connected');
   });
}

export function broadcast(message: unknown) {
   if (!wss) return;
   const data = JSON.stringify(message);
   wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
         client.send(data);
      }
   });
}
