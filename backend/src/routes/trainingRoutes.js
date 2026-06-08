const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const protect = require('../middlewares/authMiddleware'); // 🔑 Importação direta correta

// 🔒 Todas as rotas de treino passam a exigir validação de token JWT do PT logado
router.get('/student/:studentId', protect, trainingController.getPlanByStudent);
router.post('/', protect, trainingController.saveTrainingPlan);

module.exports = router;