// Estado global de manutenção (em memória — reinicia com o servidor)
let maintenanceMode = false;

// 🔧 Funções para ligar/desligar e consultar o estado
const setMaintenance = (value) => { maintenanceMode = value; };
const getMaintenance = () => maintenanceMode;

// 🛡️ Middleware — bloqueia todos os pedidos exceto ADMIN durante manutenção
const maintenanceMiddleware = (req, res, next) => {
  if (!maintenanceMode) return next();

  // Rotas sempre permitidas mesmo em manutenção:
  // req.path aqui é relativo a /api, então /maintenance em vez de /api/maintenance
  const rotasPermitidas = [
    '/maintenance',      // GET /api/maintenance (verifica estado)
    '/maintenance/',
    '/maintenance/enable',
    '/maintenance/disable',
    '/auth/login',       // Login do Admin
    '/status'            // Diagnóstico básico
  ];

  const rotaPermitida = rotasPermitidas.some(r => req.path === r || req.path.startsWith(r));
  if (rotaPermitida) return next();

  // Verifica se é ADMIN pelo token JWT (sem depender de outro middleware)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'ADMIN') return next();
    } catch (err) {
      // Token inválido — bloqueia
    }
  }

  return res.status(503).json({
    maintenance: true,
    error: 'Plataforma em manutenção',
    message: 'O PT Control está temporariamente em manutenção. Voltamos em breve!'
  });
};

module.exports = { maintenanceMiddleware, getMaintenance, setMaintenance };