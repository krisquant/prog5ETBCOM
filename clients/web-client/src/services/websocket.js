import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(url = 'http://localhost:3002') {
    console.log('Connecting to WebSocket...');
    this.socket = io(url);

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    });

    return this.socket;
  }

  connectRoom(roomId, userId, token) {
    console.log('Connecting to room:', roomId);
    this.socket.emit('connect_room', { roomId, userId, token });
  }

  makeMove(gameId, userId, stonesToTake) {
    console.log('Making move:', stonesToTake);
    this.socket.emit('make_move', { gameId, userId, stonesToTake });
  }

  leaveRoom() {
    if (this.socket) {
      this.socket.emit('leave_room');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const wsService = new WebSocketService();