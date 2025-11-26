const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/:userId', UserController.getUser);
router.put('/:userId/stats', UserController.updateStats);
router.get('/', UserController.getAllUsers);

module.exports = router;
