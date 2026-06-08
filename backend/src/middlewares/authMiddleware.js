const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  // O cabeçalho vem no formato: "Bearer O_TEU_TOKEN_JWT"
  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Erro no formato do token de autenticação.' });
  }

  const token = partes[1];

  try {
    // Validar a assinatura do token
    const verificado = jwt.verify(token, JWT_SECRET);
    
    // Injetar o userId dentro do objeto req para que os controladores seguintes saibam quem fez o pedido!
    req.userId = verificado.userId;
    
    return next(); // Avança para o controlador real
  } catch (err) {
    return res.status(401).json({ error: 'Sessão expirada ou Token inválido.' });
  }
};