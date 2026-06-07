const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const getDashboardStats = async (req, res) => {
  try {
    // 1. Contagem total de alunos
    const totalStudents = await prisma.student.count();

    // 2. Contagem de alunos ativos
    const activeStudents = await prisma.student.count({
      where: { status: 'Ativo' }
    });

    // 3. Contagem de alunos inativos
    const inactiveStudents = await prisma.student.count({
      where: { status: 'Inativo' }
    });

    // 4. Quantidade de Planos de Treino criados no sistema
    const totalPlans = await prisma.trainingPlan.count();

    // Devolve o agregado de métricas para o Frontend
    return res.status(200).json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalPlans
    });
  } catch (error) {
    console.error('❌ Erro ao recolher métricas do dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar dados do Dashboard.' });
  }
};

module.exports = {
  getDashboardStats
};