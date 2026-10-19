import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from './config';

export interface ArenaPlayer {
  socketId: string;
  uid: string | null;
  username: string;
  photoURL: string;
  rating: number;
  isReady: boolean;
  progress: {
    passed: number;
    total: number;
  };
}

export interface ArenaState {
  roomId: string;
  status: 'waiting' | 'countdown' | 'in-progress' | 'ended';
  players: ArenaPlayer[];
  questionSlug: string | null;
  winner: {
    socketId: string;
    username: string;
    uid?: string | null;
  } | null;
  startTime: number | null;
}

// Singleton socket instance
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
