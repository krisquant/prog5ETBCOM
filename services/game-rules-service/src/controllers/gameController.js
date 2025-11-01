const Game = require('../models/Game');
const axios = require('axios');

const games = new Map();
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const startGame = async (req, res) => {
  try {
    const { player1Id, player2Id } = req.body;

    if (!player1Id || !player2Id) {
      return res.status(400).json({ error: 'Both player IDs required' });
    }

    try {
      await axios.get(`${USER_SERVICE_URL}/api/users/${player1Id}`);
      await axios.get(`${USER_SERVICE_URL}/api/users/${player2Id}`);
    } catch (error) {
      return res.status(404).json({ error: 'One or both players not found' });
    }

    const game = new Game(player1Id, player2Id);
    games.set(game.gameId, game);

    res.status(201).json({
      gameId: game.gameId,
      player1Id: game.player1Id,
      player2Id: game.player2Id,
      currentPlayerId: game.currentPlayerId,
      stonesRemaining: game.stonesRemaining,
      status: game.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, stonesToTake } = req.body;

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    game.makeMove(playerId, stonesToTake);

    if (game.status === 'finished') {
      try {
        await axios.put(`${USER_SERVICE_URL}/api/users/${game.winnerId}/stats`, { won: true });
        await axios.put(`${USER_SERVICE_URL}/api/users/${game.loserId}/stats`, { won: false });
      } catch (error) {
        console.error('Failed to update user stats:', error);
      }
    }

    res.json({
      gameId: game.gameId,
      currentPlayerId: game.currentPlayerId,
      stonesRemaining: game.stonesRemaining,
      status: game.status,
      winnerId: game.winnerId,
      loserId: game.loserId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = games.get(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      gameId: game.gameId,
      player1Id: game.player1Id,
      player2Id: game.player2Id,
      currentPlayerId: game.currentPlayerId,
      stonesRemaining: game.stonesRemaining,
      moves: game.moves,
      status: game.status,
      winnerId: game.winnerId,
      loserId: game.loserId
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  startGame,
  makeMove,
  getGame
};