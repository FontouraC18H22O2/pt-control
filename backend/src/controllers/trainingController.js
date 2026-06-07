const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. Procurar o plano de treino ativo de um aluno (com os seus exercícios)
const getPlanByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const id = parseInt(studentId);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
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

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    // Usamos uma Transação do Prisma para garantir integridade (ou grava tudo ou falha tudo)
    const result = await prisma.$transaction(async (tx) => {
      // Opcional: Apaga o plano anterior se quiseres que o aluno só tenha um plano ativo de cada vez
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