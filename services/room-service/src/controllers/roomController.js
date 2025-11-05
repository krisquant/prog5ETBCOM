const Room = require('../models/Room');
const axios = require('axios');

const rooms = new Map();
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const createRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    try {
      await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    } catch (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    const room = new Room(userId);
    rooms.set(room.roomId, room);

    res.status(201).json({
      roomId: room.roomId,
      players: room.players,
      status: room.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    try {
      await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    } catch (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    room.addPlayer(userId);

    res.json({
      roomId: room.roomId,
      players: room.players,
      status: room.status
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      roomId: room.roomId,
      players: room.players,
      status: room.status,
      gameId: room.gameId
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAvailableRooms = async (req, res) => {
  try {
    const availableRooms = Array.from(rooms.values())
      .filter(room => room.status === 'waiting')
      .map(room => ({
        id: room.roomId,
        players: room.players,
        status: room.status
      }));

    res.json({ rooms: availableRooms });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  rooms,
  createRoom,
  joinRoom,
  getRoom,
  getAvailableRooms
};