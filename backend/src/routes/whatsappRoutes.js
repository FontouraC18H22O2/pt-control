const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, whatsappController.getWhatsappLogs);

module.exports = router;