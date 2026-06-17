const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/authMiddleware');
const upload = require('../config/multer'); 

router.get('/', authMiddleware, exerciseController.getAllExercises);

router.post(
  '/', 
  authMiddleware, 
  checkRole(['ADMIN', 'PT']), 
  upload.single('gif'), 
  exerciseController.createExercise
);

router.put(
  '/:id',
  authMiddleware,
  checkRole(['ADMIN', 'PT']),
  upload.single('gif'),
  exerciseController.updateExercise
);

router.delete(
  '/:id',
  authMiddleware,
  checkRole(['ADMIN', 'PT']),
  exerciseController.deleteExercise
);

module.exports = router;