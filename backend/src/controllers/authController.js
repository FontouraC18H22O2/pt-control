const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. REGISTAR NOVA CONTA DE PERSONAL TRAINER
const register = async (req, res) => {
  try {
    const { email, password, nome } = req.body;

    if (!email || !password || !nome) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    // Verificar se o email já existe no MariaDB
    const userExiste = await prisma.userAdmin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (userExiste) {
      return res.status(400).json({ error: 'Este email já se encontra registado no sistema.' });
    }

    // Encriptar a password com bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o utilizador
    await prisma.userAdmin.create({
      data: {
        email: email.toLowerCase().trim(),
        nome: nome.trim(),
        passwordHash: hashedPassword,
        isActive: true
      }
    });

    return res.status(201).json({ message: 'Conta de Personal Trainer criada com sucesso!' });
  } catch (error) {
    console.error('❌ Erro no processo de registo:', error);
    return res.status(500).json({ error: 'Erro interno ao criar a conta.' });
  }
};

// 2. EFETUAR LOGIN E GERAR TOKEN JWT
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    // Procurar o utilizador pelo email (conforme o novo schema.prisma)
    const user = await prisma.userAdmin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Verificar a password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Gerar o Token JWT contendo o ID e o Nome do PT
    const token = jwt.sign(
      { userId: user.id, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Atualizar último login
    await prisma.userAdmin.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), failedAttempts: 0 }
    });

    return res.status(200).json({
      message: 'Login efetuado com sucesso!',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Erro no processo de login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

module.exports = {
  register,
  login
};