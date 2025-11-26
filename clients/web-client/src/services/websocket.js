import { io } from 'socket.io-client';

const WEBSOCKET_URL = 'http://localhost:3002';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (!this.socket) {
      this.socket = io(WEBSOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
      this.socket.onAny((event, data) => {
        if (this.listeners[event]) {
          this.listeners[event].forEach(callback => callback(data));
        }
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners = {};
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
  connectToRoom(roomId, userId, token) {
    this.emit('connect_room', { roomId, userId, token });
  }

  makeMove(gameId, userId, stonesToTake) {
    this.emit('make_move', { gameId, userId, stonesToTake });
  }

  leaveRoom(roomId, userId) {
    this.emit('leave_room', { roomId, userId });
  }
}

export default new WebSocketService();
