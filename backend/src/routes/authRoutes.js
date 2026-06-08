const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para criar nova conta de Personal Trainer
router.post('/register', authController.register);

// Rota para login do Personal Trainer
router.post('/login', authController.login);

module.exports = router;