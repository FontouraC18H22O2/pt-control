const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuração do Prisma Client com o Driver Adapter do MariaDB/MySQL
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validação básica de entrada
    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    // 2. Procurar o utilizador na base de dados
    const user = await prisma.userAdmin.findUnique({
      where: { username }
    });

    // 3. Cibersegurança: Se não existir ou estiver inativo, usamos uma mensagem genérica
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 4. Verificar se a password coincide com o Hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Aqui poderíamos incrementar os failedAttempts num cenário mais avançado
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 5. Gerar o Token JWT assinado com a nossa chave secreta
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    // 6. Atualizar o último login na base de dados (opcional, mas profissional)
    await prisma.userAdmin.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), failedAttempts: 0 }
    });

    // 7. Retornar o token e os dados públicos do utilizador para o frontend
    return res.status(200).json({
      message: 'Login efetuado com sucesso!',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('❌ Erro no processo de login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

module.exports = {
  login
};