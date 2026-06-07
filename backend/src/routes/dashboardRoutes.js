const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Rota aberta para o ecrã inicial do Frontend
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;