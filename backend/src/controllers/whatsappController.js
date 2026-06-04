const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// Listar todos os logs de mensagens enviadas
const getWhatsappLogs = async (req, res) => {
  try {
    const logs = await prisma.whatsappLog.findMany({
      include: {
        student: { select: { fullName: true } } // Inclui o nome do aluno associado ao log
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(logs);
  } catch (error) {
    console.error('❌ Erro ao buscar logs do WhatsApp:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar o histórico de mensagens.' });
  }
};

module.exports = {
  getWhatsappLogs
};