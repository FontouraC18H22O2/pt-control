const express = require('express');
const router = express.Router();
const { getMaintenance, setMaintenance } = require('../middlewares/maintenanceMiddleware');
const protect = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/authMiddleware');

// GET /api/maintenance — consulta o estado atual (público — o frontend verifica isto)
router.get('/', (req, res) => {
  return res.status(200).json({ maintenance: getMaintenance() });
});

// POST /api/maintenance/enable — liga a manutenção (só ADMIN)
router.post('/enable', protect, checkRole(['ADMIN']), (req, res) => {
  setMaintenance(true);
  console.log('🔧 Modo de manutenção ATIVADO pelo Admin');
  return res.status(200).json({ maintenance: true, message: 'Modo de manutenção ativado.' });
});

// POST /api/maintenance/disable — desliga a manutenção (só ADMIN)
router.post('/disable', protect, checkRole(['ADMIN']), (req, res) => {
  setMaintenance(false);
  console.log('✅ Modo de manutenção DESATIVADO pelo Admin');
  return res.status(200).json({ maintenance: false, message: 'Plataforma de volta ao normal.' });
});

module.exports = router;