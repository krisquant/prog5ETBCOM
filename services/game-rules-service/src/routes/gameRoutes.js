const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');


router.post('/start', GameController.startGame);
router.post('/:gameId/move', GameController.makeMove);
router.get('/:gameId', GameController.getGame);
router.get('/', GameController.getAllGames);
router.delete('/:gameId', GameController.deleteGame);

module.exports = router;
