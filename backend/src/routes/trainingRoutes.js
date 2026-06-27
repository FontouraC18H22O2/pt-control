const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const protect = require('../middlewares/authMiddleware');

// ── Biblioteca de exercícios / GIFs ──────────────────────────
router.get('/gifs', protect, trainingController.getAllGifs);

// ── Plano público (sem autenticação — link WhatsApp) ─────────
router.get('/public/:planId', trainingController.getPublicPlan);

// ── Planos de treino por aluno ───────────────────────────────
// Devolve TODOS os planos do aluno (Dia 1, Dia 2, ...)
router.get('/student/:studentId/plans', protect, trainingController.getPlansByStudent);

// Compatibilidade com código legado — devolve o plano mais recente
router.get('/student/:studentId', protect, trainingController.getPlanByStudent);

// Criar ou atualizar um plano (por dayNumber)
router.post('/', protect, trainingController.saveTrainingPlan);

// Apagar um plano específico
router.delete('/plan/:planId', protect, trainingController.deletePlan);

// ── Calendário / Agenda ──────────────────────────────────────
// Listar agendamentos (com filtro ?month=6&year=2026)
router.get('/schedule', protect, trainingController.getSchedule);

// Criar agendamento
router.post('/schedule', protect, trainingController.createSchedule);

// Apagar agendamento
router.delete('/schedule/:scheduleId', protect, trainingController.deleteSchedule);

module.exports = router;