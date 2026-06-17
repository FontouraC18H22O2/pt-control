const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. Procurar o plano de treino ativo de um aluno (com os seus exercícios e GIFs)
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
      return res.status(200).json(null);
    }

    // 🎯 NOVO: Procurar os GIFs correspondentes na biblioteca global globalExercise
    const dbExercises = await prisma.globalExercise.findMany({
      where: {
        name: { in: trainingPlan.exercises.map(e => e.exerciseName) }
      },
      select: { name: true, gifUrl: true }
    });

    // Criar um mapa simples para agilizar a colagem do link
    const exerciseMap = {};
    dbExercises.forEach(ex => {
      exerciseMap[ex.name.toLowerCase().trim()] = ex.gifUrl;
    });

    // Injetar o gifUrl em cada exercício devolvido para a tabela do Frontend
    const exercisesWithGifs = trainingPlan.exercises.map(ex => ({
      ...ex,
      gifUrl: exerciseMap[ex.exerciseName.toLowerCase().trim()] || null
    }));

    return res.status(200).json({
      ...trainingPlan,
      exercises: exercisesWithGifs
    });

  } catch (error) {
    console.error('❌ Erro ao buscar plano por estudante:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar o plano de treino.' });
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

// 4. Buscar Plano Público (Acesso anónimo para o aluno via link do WhatsApp)
const getPublicPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const id = parseInt(planId);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do plano inválido.' });
    }

    // Procura o plano de treino no MySQL e inclui os dados do Atleta
    const trainingPlan = await prisma.trainingPlan.findUnique({
      where: { id },
      include: {
        exercises: true,
        student: {
          select: { fullName: true }
        }
      }
    });

    if (!trainingPlan) {
      return res.status(404).json({ error: 'Plano de treino não encontrado ou expirado.' });
    }

    // 🎯 CORREÇÃO AQUI: Mudado de global_exercise para globalExercise
    const dbExercises = await prisma.globalExercise.findMany({
      where: {
        name: { in: trainingPlan.exercises.map(e => e.exerciseName) }
      },
      select: { name: true, gifUrl: true }
    });

    const exerciseMap = {};
    dbExercises.forEach(ex => {
      exerciseMap[ex.name.toLowerCase().trim()] = ex.gifUrl;
    });

    const exercisesWithGifs = trainingPlan.exercises.map(ex => ({
      ...ex,
      gifUrl: exerciseMap[ex.exerciseName.toLowerCase().trim()] || null
    }));

    return res.status(200).json({
      id: trainingPlan.id,
      studentName: trainingPlan.student?.fullName || 'Atleta',
      notes: trainingPlan.notes,
      createdAt: trainingPlan.createdAt,
      exercises: exercisesWithGifs
    });
  } catch (error) {
    console.error('❌ Erro ao buscar plano público:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar o plano de treino.' });
  }
};
// Buscar todos os GIFs disponíveis na base de dados
const getAllGifs = async (req, res) => {
  try {
    const exercises = await prisma.globalExercise.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, gifUrl: true, category: true }
    });
    return res.status(200).json(exercises);
  } catch (error) {
    console.error('❌ Erro ao ir buscar GIFs:', error);
    return res.status(500).json({ error: 'Erro ao carregar a lista de exercícios.' });
  }
};

module.exports = {
  getPlanByStudent,
  saveTrainingPlan,
  getPublicPlan,
  getAllGifs
};