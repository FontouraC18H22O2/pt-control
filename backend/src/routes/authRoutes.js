const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota POST para o login do Personal Trainer
router.post('/login', authController.login);

module.exports = router;