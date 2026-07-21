const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const protect = require('../middlewares/authMiddleware');

router.get('/', protect, templateController.getTemplates);
router.post('/', protect, templateController.createTemplate);
router.put('/:templateId', protect, templateController.updateTemplate);
router.delete('/:templateId', protect, templateController.deleteTemplate);

module.exports = router;