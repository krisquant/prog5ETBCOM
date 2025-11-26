const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/roomController');
router.post('/create', RoomController.createRoom);
router.post('/:roomId/join', RoomController.joinRoom);
router.get('/:roomId', RoomController.getRoom);
router.get('/', RoomController.getAllRooms);
router.get('/available/list', RoomController.getAvailableRooms);
router.post('/:roomId/leave', RoomController.leaveRoom);

module.exports = router;
