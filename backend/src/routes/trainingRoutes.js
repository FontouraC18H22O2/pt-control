const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { protect } = require('../middlewares/authMiddleware');

// Ambas as rotas exigem autenticação via JWT
router.post('/', protect, trainingController.createTrainingPlan);
router.get('/student/:studentId', protect, trainingController.getStudentPlans);

module.exports = router;