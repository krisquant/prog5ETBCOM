class Game {
  constructor(player1Id, player2Id) {
    this.gameId = require('crypto').randomUUID();
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.currentPlayerId = player1Id;
    this.stonesRemaining = 21;
    this.moves = [];
    this.status = 'active';
    this.winnerId = null;
    this.loserId = null;
    this.createdAt = new Date();
  }

  makeMove(playerId, stonesToTake) {
    if (this.status !== 'active') {
      throw new Error('Game is not active');
    }

    if (playerId !== this.currentPlayerId) {
      throw new Error('Not your turn');
    }

    if (![1, 2, 3].includes(stonesToTake)) {
      throw new Error('Can only take 1, 2, or 3 stones');
    }

    if (stonesToTake > this.stonesRemaining) {
      throw new Error('Not enough stones remaining');
    }

    this.stonesRemaining -= stonesToTake;
    this.moves.push({
      playerId,
      stonesToTake,
      stonesRemaining: this.stonesRemaining,
      timestamp: new Date()
    });

    if (this.stonesRemaining === 0) {
      this.status = 'finished';
      this.loserId = playerId;
      this.winnerId = playerId === this.player1Id ? this.player2Id : this.player1Id;
    } else {
      this.currentPlayerId = playerId === this.player1Id ? this.player2Id : this.player1Id;
    }
  }
}

module.exports = Game;