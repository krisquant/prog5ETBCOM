const RoomModel = require('../models/Room');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

class RoomController {
  static async createRoom(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      try {
        await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
      } catch (error) {
        console.error('[ROOM-SERVICE] User verification failed:', error.message);
        return res.status(404).json({ error: 'User not found' });
      }

      const room = RoomModel.create(userId);

      console.log(`[ROOM-SERVICE] Room created: ${room.id} by user ${userId}`);

      res.status(201).json({
        roomId: room.id,
        hostId: room.hostId,
        players: room.players,
        status: room.status,
        createdAt: room.createdAt
      });
    } catch (error) {
      console.error('[ROOM-SERVICE] Create room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      try {
        await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
      } catch (error) {
        console.error('[ROOM-SERVICE] User verification failed:', error.message);
        return res.status(404).json({ error: 'User not found' });
      }

      const result = RoomModel.addPlayer(roomId, userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      console.log(`[ROOM-SERVICE] User ${userId} joined room ${roomId}`);
      console.log(`[ROOM-SERVICE] Room status: ${result.room.status}`);

      res.json({
        roomId: result.room.id,
        players: result.room.players,
        status: result.room.status
      });
    } catch (error) {
      console.error('[ROOM-SERVICE] Join room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static getRoom(req, res) {
    try {
      const { roomId } = req.params;
      const room = RoomModel.findById(roomId);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      console.log(`[ROOM-SERVICE] Room info requested: ${roomId}`);

      res.json({
        roomId: room.id,
        hostId: room.hostId,
        players: room.players,
        status: room.status,
        gameId: room.gameId,
        createdAt: room.createdAt
      });
    } catch (error) {
      console.error('[ROOM-SERVICE] Get room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static getAllRooms(req, res) {
    try {
      const rooms = RoomModel.getAll();
      res.json({ rooms });
    } catch (error) {
      console.error('[ROOM-SERVICE] Get all rooms error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static getAvailableRooms(req, res) {
    try {
      const rooms = RoomModel.getAvailableRooms();
      console.log(`[ROOM-SERVICE] Available rooms: ${rooms.length}`);
      res.json({ rooms });
    } catch (error) {
      console.error('[ROOM-SERVICE] Get available rooms error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  static leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const result = RoomModel.removePlayer(roomId, userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      console.log(`[ROOM-SERVICE] User ${userId} left room ${roomId}`);
      
      if (result.deleted) {
        console.log(`[ROOM-SERVICE] Room ${roomId} was deleted (empty)`);
        res.json({ message: 'Left room successfully', roomDeleted: true });
      } else {
        res.json({ 
          message: 'Left room successfully', 
          roomDeleted: false,
          room: result.room 
        });
      }
    } catch (error) {
      console.error('[ROOM-SERVICE] Leave room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = RoomController;
