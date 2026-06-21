const express = require('express');
const router = express.Router();
const diagnosticsController = require('../controllers/diagnosticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/authMiddleware');

// Apenas ADMIN pode ver o estado interno dos serviços ligados
router.get('/status', authMiddleware, checkRole(['ADMIN']), diagnosticsController.getSystemStatus);

module.exports = router;