class Room {
  constructor(creatorId) {
    this.roomId = require('crypto').randomUUID();
    this.players = [creatorId];
    this.status = 'waiting';
    this.gameId = null;
    this.createdAt = new Date();
  }

  addPlayer(playerId) {
    if (this.players.length >= 2) {
      throw new Error('Room is full');
    }
    if (this.players.includes(playerId)) {
      throw new Error('Player already in room');
    }
    this.players.push(playerId);
    if (this.players.length === 2) {
      this.status = 'ready';
    }
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p !== playerId);
    if (this.players.length < 2) {
      this.status = 'waiting';
    }
  }

  startGame(gameId) {
    this.gameId = gameId;
    this.status = 'playing';
  }
}

module.exports = Room;