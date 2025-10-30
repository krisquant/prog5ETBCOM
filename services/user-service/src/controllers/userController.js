const User = require('../models/User');
const jwt = require('jsonwebtoken');

const users = new Map();
const JWT_SECRET = 'your-secret-key-change-in-production';

const register = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    const existingUser = Array.from(users.values()).find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = new User(username);
    users.set(user.userId, user);

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      userId: user.userId,
      username: user.username,
      token,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { username } = req.body;

    const user = Array.from(users.values()).find(u => u.username === username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      userId: user.userId,
      username: user.username,
      token,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.userId,
      username: user.username,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { won } = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.gamesPlayed += 1;
    if (won) {
      user.gamesWon += 1;
    }

    res.json({
      userId: user.userId,
      username: user.username,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getUser,
  updateUserStats
};