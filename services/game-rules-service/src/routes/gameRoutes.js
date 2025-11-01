const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/start', gameController.startGame);
router.post('/:gameId/move', gameController.makeMove);
router.get('/:gameId', gameController.getGame);

module.exports = router;