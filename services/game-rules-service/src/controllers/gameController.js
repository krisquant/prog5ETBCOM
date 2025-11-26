const GameModel = require('../models/Game');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

class GameController {
  // Start a new game
  static async startGame(req, res) {
    try {
      const { roomId, player1Id, player2Id } = req.body;

      if (!roomId || !player1Id || !player2Id) {
        return res.status(400).json({ 
          error: 'roomId, player1Id, and player2Id are required' 
        });
      }

  
      try {
        await axios.get(`${USER_SERVICE_URL}/api/users/${player1Id}`);
        await axios.get(`${USER_SERVICE_URL}/api/users/${player2Id}`);
      } catch (error) {
        console.error('[GAME-RULES] Player verification failed:', error.message);
        return res.status(404).json({ error: 'One or both players not found' });
      }

      const game = GameModel.create(roomId, player1Id, player2Id);

      console.log(`[GAME-RULES] Game started: ${game.id} in room ${roomId}`);
      console.log(`[GAME-RULES] Players: ${player1Id} vs ${player2Id}`);
      console.log(`[GAME-RULES] Starting player: ${player1Id}`);

      res.status(201).json({
        gameId: game.id,
        roomId: game.roomId,
        currentPlayerId: game.currentPlayerId,
        stonesRemaining: game.stonesRemaining,
        status: game.status,
        createdAt: game.createdAt
      });
    } catch (error) {
      console.error('[GAME-RULES] Start game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Make a move
  static makeMove(req, res) {
    try {
      const { gameId } = req.params;
      const { playerId, stonesToTake } = req.body;

      if (!playerId || !stonesToTake) {
        return res.status(400).json({ 
          error: 'playerId and stonesToTake are required' 
        });
      }

      const result = GameModel.makeMove(gameId, playerId, stonesToTake);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      const game = result.game;

      console.log(`[GAME-RULES] Move made in game ${gameId}`);
      console.log(`[GAME-RULES] Player ${playerId} took ${stonesToTake} stones`);
      console.log(`[GAME-RULES] Stones remaining: ${game.stonesRemaining}`);
      
      if (game.status === 'finished') {
        console.log(`[GAME-RULES] Game ${gameId} finished!`);
        console.log(`[GAME-RULES] Winner: ${game.winnerId}`);
        console.log(`[GAME-RULES] Loser: ${game.loserId}`);
      }

      res.json({
        gameId: game.id,
        stonesRemaining: game.stonesRemaining,
        currentPlayerId: game.currentPlayerId,
        status: game.status,
        winnerId: game.winnerId,
        loserId: game.loserId,
        lastMove: {
          playerId,
          stonesToTake,
          stonesRemainingAfter: game.stonesRemaining
        }
      });
    } catch (error) {
      console.error('[GAME-RULES] Make move error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static getGame(req, res) {
    try {
      const { gameId } = req.params;
      const game = GameModel.findById(gameId);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      console.log(`[GAME-RULES] Game state requested: ${gameId}`);

      res.json({
        gameId: game.id,
        roomId: game.roomId,
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        currentPlayerId: game.currentPlayerId,
        stonesRemaining: game.stonesRemaining,
        status: game.status,
        moves: game.moves,
        winnerId: game.winnerId,
        loserId: game.loserId,
        createdAt: game.createdAt,
        finishedAt: game.finishedAt
      });
    } catch (error) {
      console.error('[GAME-RULES] Get game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

 
  static getAllGames(req, res) {
    try {
      const games = GameModel.getAll();
      res.json({ games });
    } catch (error) {
      console.error('[GAME-RULES] Get all games error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete game
  static deleteGame(req, res) {
    try {
      const { gameId } = req.params;
      const deleted = GameModel.delete(gameId);

      if (!deleted) {
        return res.status(404).json({ error: 'Game not found' });
      }

      console.log(`[GAME-RULES] Game deleted: ${gameId}`);
      res.json({ message: 'Game deleted successfully' });
    } catch (error) {
      console.error('[GAME-RULES] Delete game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = GameController;
