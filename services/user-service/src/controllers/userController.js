const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';

class UserController {
  static register(req, res) {
    try {
      const { username } = req.body;

      if (!username || username.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Username is required' 
        });
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ 
          error: 'Username must be between 3 and 20 characters' 
        });
      }

      if (UserModel.exists(username)) {
        return res.status(409).json({ 
          error: 'Username already taken' 
        });
      }

      const user = UserModel.create(username.trim());
      
      console.log(`[USER-SERVICE] User registered: ${user.username} (${user.id})`);

      res.status(201).json({
        userId: user.id,
        username: user.username,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('[USER-SERVICE] Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static login(req, res) {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const user = UserModel.findByUsername(username);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`[USER-SERVICE] User logged in: ${user.username} (${user.id})`);

      res.json({
        userId: user.id,
        username: user.username,
        token,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      });
    } catch (error) {
      console.error('[USER-SERVICE] Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static getUser(req, res) {
    try {
      const { userId } = req.params;
      const user = UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`[USER-SERVICE] User info requested: ${user.username}`);

      res.json({
        userId: user.id,
        username: user.username,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('[USER-SERVICE] Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static updateStats(req, res) {
    try {
      const { userId } = req.params;
      const { won } = req.body;

      const user = UserModel.updateStats(userId, won);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`[USER-SERVICE] Stats updated for ${user.username}: ${user.gamesWon}/${user.gamesPlayed}`);

      res.json({
        userId: user.id,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      });
    } catch (error) {
      console.error('[USER-SERVICE] Update stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static getAllUsers(req, res) {
    try {
      const users = UserModel.getAll();
      res.json({ users });
    } catch (error) {
      console.error('[USER-SERVICE] Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
