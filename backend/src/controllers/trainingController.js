const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. Procurar o plano de treino ativo de um aluno (com os seus exercícios)
const getPlanByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const id = parseInt(studentId);
    const ptId = req.userId; // 🔑 Injetado pelo authMiddleware

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    // 🔒 CIBERSEGURANÇA: Validar se este aluno pertence estritamente ao PT autenticado
    const aluno = await prisma.student.findUnique({
      where: { id }
    });

    if (!aluno || aluno.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado. Este atleta não está associado à sua conta.' });
    }

    // Procura o plano mais recente do aluno e inclui os respetivos exercícios
    const trainingPlan = await prisma.trainingPlan.findFirst({
      where: { studentId: id },
      include: {
        exercises: true // Traz a lista de exercícios associada automaticamente
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!trainingPlan) {
      return res.status(200).json(null); // Retorna null se o aluno ainda não tiver plano
    }

    return res.status(200).json(trainingPlan);
  } catch (error) {
    console.error('❌ Erro ao procurar plano de treino:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar plano de treino.' });
  }
};

// 2. Criar ou Substituir o Plano de Treino de um Aluno
const saveTrainingPlan = async (req, res) => {
  try {
    const { studentId, notes, exercises } = req.body;
    const id = parseInt(studentId);
    const ptId = req.userId; // 🔑 Injetado pelo authMiddleware

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'A lista de exercícios é obrigatória.' });
    }

    // 🔒 CIBERSEGURANÇA: Impedir que um PT guarde treinos no perfil de um aluno de outro PT
    const aluno = await prisma.student.findUnique({
      where: { id }
    });

    if (!aluno || aluno.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado. Não tem permissão para alterar o plano deste atleta.' });
    }

    // Usamos uma Transação do Prisma para garantir integridade (ou grava tudo ou falha tudo)
    const result = await prisma.$transaction(async (tx) => {
      // Apaga o plano anterior do aluno para manter apenas o plano ativo atual
      await tx.trainingPlan.deleteMany({
        where: { studentId: id }
      });

      // Cria o novo plano já injetando os exercícios mapeados de uma só vez
      const newPlan = await tx.trainingPlan.create({
        data: {
          studentId: id,
          notes: notes || '',
          exercises: {
            create: exercises.map(ex => ({
              exerciseName: ex.exerciseName,
              sets: parseInt(ex.sets) || 4,
              reps: parseInt(ex.reps) || 10,
              restTime: ex.restTime || '60s',
              notes: ex.notes || ''
            }))
          }
        },
        include: { exercises: true }
      });

      return newPlan;
    });

    return res.status(201).json({ message: 'Plano de treino guardado com sucesso!', plan: result });
  } catch (error) {
    console.error('❌ Erro ao guardar plano de treino:', error);
    return res.status(500).json({ error: 'Erro interno ao processar plano de treino.' });
  }
};

module.exports = {
  getPlanByStudent,
  saveTrainingPlan
};