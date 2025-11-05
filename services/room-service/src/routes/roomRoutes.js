const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/create', roomController.createRoom);
router.post('/:roomId/join', roomController.joinRoom);
router.get('/:roomId', roomController.getRoom);
router.get('/available/list', roomController.getAvailableRooms);

module.exports = router;