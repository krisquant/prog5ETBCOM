const rooms = new Map();

class RoomModel {
  static create(hostId) {
    const room = {
      id: require('crypto').randomUUID(),
      hostId,
      players: [hostId],
      status: 'waiting', // 'waiting', 'ready', 'in_progress', 'finished'
      gameId: null,
      createdAt: new Date().toISOString()
    };
    
    rooms.set(room.id, room);
    return room;
  }

  static findById(roomId) {
    return rooms.get(roomId);
  }

  static addPlayer(roomId, playerId) {
    const room = rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.players.includes(playerId)) {
      return { success: false, error: 'Player already in room' };
    }

    if (room.players.length >= 2) {
      return { success: false, error: 'Room is full' };
    }

    room.players.push(playerId);
    
    if (room.players.length === 2) {
      room.status = 'ready';
    }

    return { success: true, room };
  }

  static removePlayer(roomId, playerId) {
    const room = rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    room.players = room.players.filter(id => id !== playerId);
    
    if (room.players.length === 0) {
      rooms.delete(roomId);
      return { success: true, room: null, deleted: true };
    }

    if (room.players.length === 1) {
      room.status = 'waiting';
      if (room.hostId === playerId) {
        room.hostId = room.players[0];
      }
    }

    return { success: true, room, deleted: false };
  }

  static updateStatus(roomId, status) {
    const room = rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    room.status = status;
    return room;
  }

  static setGameId(roomId, gameId) {
    const room = rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    room.gameId = gameId;
    room.status = 'in_progress';
    return room;
  }

  static getAll() {
    return Array.from(rooms.values());
  }

  static getAvailableRooms() {
    return Array.from(rooms.values()).filter(room => 
      room.status === 'waiting' && room.players.length < 2
    );
  }

  static delete(roomId) {
    return rooms.delete(roomId);
  }
}

module.exports = RoomModel;
