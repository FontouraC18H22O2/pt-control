const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const protect = require('../middlewares/authMiddleware'); // 🔑 Importação direta correta

// 🔒 Aplicar o middleware 'protect' antes de cada controlador
router.post('/', protect, studentController.createStudent);
router.get('/', protect, studentController.getAllStudents);
router.put('/:id', protect, studentController.updateStudent);
router.delete('/:id', protect, studentController.deleteStudent);

module.exports = router;