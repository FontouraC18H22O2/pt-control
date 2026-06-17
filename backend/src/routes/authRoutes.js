const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); 

// 📢 Rota pública para Solicitação de Acesso
router.post('/request-access', authController.requestAccess);

// 🔐 Rota pública para Login do Utilizador
router.post('/login', authController.login);

// 👑 Rota Administrativa Protegida: Apenas quem tem o Token e a Role 'ADMIN' pode criar um PT
router.post(
  '/admin/create-trainer', 
  authMiddleware, // 1º Valida se o token é real e extrai o role
  authMiddleware.checkRole(['ADMIN']), // 2º Bloqueia se não for administrador global
  authController.createTrainerAccount
);

// 👑 Rota Administrativa Protegida: Apenas quem tem o Token e a Role 'ADMIN' pode listar os PTs
router.get(
  '/admin/trainers',
  authMiddleware,
  authMiddleware.checkRole(['ADMIN']),
  authController.getTrainers
);

router.patch(
  '/admin/deactivate-trainer/:id', 
  authMiddleware, 
  authMiddleware.checkRole(['ADMIN']), 
  authController.deactivateTrainer
);

router.get(
  '/trainer/metrics', 
  authMiddleware, 
  authMiddleware.checkRole(['PT', 'ADMIN']), 
  authController.getTrainerMetrics
);
// Rota Administrativa Protegida: Listar Pedidos de Acesso Pendentes
router.get(
  '/admin/access-requests',
  authMiddleware, // 1º Valida se o token é real e extrai o utilizador
  authMiddleware.checkRole(['ADMIN']), // 2º Garante que apenas Administradores entram[cite: 1]
  authController.getPendingAccessRequests // Executa a listagem[cite: 1]
);

// Rota Administrativa Protegida: Atualizar o estado de um pedido (Aprovar/Recusar)
router.patch(
  '/admin/access-requests/:id/status',
  authMiddleware,
  authMiddleware.checkRole(['ADMIN']),
  authController.updateAccessRequestStatus
);

router.post(
  '/perfil/solicitar-codigo', 
  authMiddleware, 
  authController.solicitarCodigoPerfil
);

// 2. Atualizar os dados do perfil (Valida o código se mudar Email ou Password)
router.put(
  '/perfil/atualizar', 
  authMiddleware, 
  authController.atualizarPerfil
);
module.exports = router;