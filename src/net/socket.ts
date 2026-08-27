import { io, Socket } from 'socket.io-client';
import { SERVER_URL, IS_ONLINE } from '../config';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (!IS_ONLINE) return null;
  if (socket) return socket;

  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected to server:', SERVER_URL);
  });
  socket.on('disconnect', (reason) => {
    console.log('[Socket] ❌ Disconnected:', reason);
  });
  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
