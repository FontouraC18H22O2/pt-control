const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { protect } = require('../middlewares/authMiddleware');

// Rotas abertas para conectar ao Frontend
router.get('/student/:studentId', trainingController.getPlanByStudent);
router.post('/', trainingController.saveTrainingPlan);

module.exports = router;