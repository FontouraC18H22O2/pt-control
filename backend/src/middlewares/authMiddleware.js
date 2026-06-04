const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Verificar se o token foi enviado no cabeçalho HTTP correto
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // O cabeçalho vem no formato: "Bearer eyJhbGciOi..." -> Isolamos apenas a string do token
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Se não houver token, barra o acesso imediatamente
    if (!token) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    // 3. Validar a assinatura do token usando a nossa JWT_SECRET guardada no .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Injetar os dados do utilizador descodificados dentro do objeto 'req'
    // Isto permite que as rotas seguintes saibam exatamente quem fez o pedido
    req.user = decoded;

    // 5. Autorizar o pedido a seguir para o controlador da rota
    next();

  } catch (error) {
    console.error('❌ Erro na validação do token:', error.message);
    
    // Distinguir se o token expirou ou se é simplesmente inválido/falsificado
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'A sessão expirou. Por favor, faça login novamente.' });
    }
    
    return res.status(401).json({ error: 'Token inválido ou corrompido.' });
  }
};

module.exports = {
  protect
};