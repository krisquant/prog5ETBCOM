
const games = new Map();

class GameModel {
  static create(roomId, player1Id, player2Id) {
    const game = {
      id: require('crypto').randomUUID(),
      roomId,
      player1Id,
      player2Id,
      currentPlayerId: player1Id, 
      stonesRemaining: 21,
      status: 'in_progress', 
      moves: [],
      winnerId: null,
      loserId: null,
      createdAt: new Date().toISOString(),
      finishedAt: null
    };
    
    games.set(game.id, game);
    return game;
  }

  static findById(gameId) {
    return games.get(gameId);
  }

  static findByRoomId(roomId) {
    return Array.from(games.values()).find(game => game.roomId === roomId);
  }

  static makeMove(gameId, playerId, stonesToTake) {
    const game = games.get(gameId);
    
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

  
    if (game.currentPlayerId !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    // Validate  status
    if (game.status !== 'in_progress') {
      return { success: false, error: 'Game is not in progress' };
    }

    // Validate move
    if (![1, 2, 3].includes(stonesToTake)) {
      return { success: false, error: 'You can only take 1, 2, or 3 stones' };
    }

    if (stonesToTake > game.stonesRemaining) {
      return { success: false, error: `Only ${game.stonesRemaining} stones remaining` };
    }

  
    game.stonesRemaining -= stonesToTake;
    game.moves.push({
      playerId,
      stonesToTake,
      stonesRemainingAfter: game.stonesRemaining,
      timestamp: new Date().toISOString()
    });

  
    if (game.stonesRemaining === 0) {
    
      game.status = 'finished';
      game.loserId = playerId;
      game.winnerId = playerId === game.player1Id ? game.player2Id : game.player1Id;
      game.finishedAt = new Date().toISOString();
    } else {
    
      game.currentPlayerId = playerId === game.player1Id ? game.player2Id : game.player1Id;
    }

    return { success: true, game };
  }

  static getAll() {
    return Array.from(games.values());
  }

  static delete(gameId) {
    return games.delete(gameId);
  }
}

module.exports = GameModel;