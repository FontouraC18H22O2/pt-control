const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const protect = require('../middlewares/authMiddleware'); // 🔑 Uniformizado para 'protect'

// 🔒 Listar o histórico de mensagens filtrado pelo PT autenticado
router.get('/', protect, whatsappController.getWhatsappLogs);

module.exports = router;