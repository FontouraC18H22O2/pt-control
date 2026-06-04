const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. Criar um Plano de Treino com múltiplos Exercícios
const createTrainingPlan = async (req, res) => {
  try {
    const { studentId, notes, exercises } = req.body;

    // Validação básica
    if (!studentId || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'O ID do aluno e pelo menos um exercício são obrigatórios.' });
    }

    // Criar o plano e os exercícios numa única operação relacionada
    const newPlan = await prisma.trainingPlan.create({
      data: {
        studentId: parseInt(studentId),
        notes,
        exercises: {
          create: exercises.map(ex => ({
            exerciseName: ex.exerciseName,
            sets: parseInt(ex.sets),
            reps: parseInt(ex.reps),
            restTime: ex.restTime,
            notes: ex.notes
          }))
        }
      },
      include: {
        exercises: true // Inclui os exercícios criados na resposta para o frontend
      }
    });

    return res.status(201).json({ message: 'Plano de treino criado com sucesso!', plan: newPlan });
  } catch (error) {
    console.error('❌ Erro ao criar plano de treino:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o plano de treino.' });
  }
};

// 2. Procurar os planos de treino de um aluno específico
const getStudentPlans = async (req, res) => {
  try {
    const { studentId } = req.params;

    const plans = await prisma.trainingPlan.findMany({
      where: { studentId: parseInt(studentId) },
      include: {
        exercises: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error('❌ Erro ao buscar planos do aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar planos de treino.' });
  }
};

module.exports = {
  createTrainingPlan,
  getStudentPlans
};