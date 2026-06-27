const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 🔧 Função auxiliar: injeta gifUrl nos exercícios a partir da biblioteca do PT
// Só acede a exercícios globais (userAdminId = null) OU do próprio PT (userAdminId = ptId)
const injetarGifs = async (exercises, ptId = null) => {
  const nomes = exercises.map(e => e.exerciseName);

  const orClause = [{ userAdminId: null }];
  if (ptId) orClause.push({ userAdminId: ptId });

  const dbExercises = await prisma.globalExercise.findMany({
    where: { name: { in: nomes }, OR: orClause },
    select: { name: true, gifUrl: true }
  });

  const exerciseMap = {};
  dbExercises.forEach(ex => {
    exerciseMap[ex.name.toLowerCase().trim()] = ex.gifUrl;
  });

  return exercises.map(ex => ({
    ...ex,
    gifUrl: ex.gifUrl || exerciseMap[ex.exerciseName.toLowerCase().trim()] || null
  }));
};

// ─────────────────────────────────────────────
// 1. LISTAR TODOS OS PLANOS DE UM ALUNO (Dia 1, Dia 2, ...)
// ─────────────────────────────────────────────
const getPlansByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const id = parseInt(studentId);
    const ptId = req.userId;

    if (isNaN(id)) return res.status(400).json({ error: 'ID do aluno inválido.' });

    const aluno = await prisma.student.findUnique({ where: { id } });
    if (!aluno || aluno.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado. Este atleta não está associado à sua conta.' });
    }

    const planos = await prisma.trainingPlan.findMany({
      where: { studentId: id },
      include: { exercises: true },
      orderBy: { dayNumber: 'asc' }
    });

    // Injeta GIFs em cada plano
    const planosComGifs = await Promise.all(
      planos.map(async (plano) => ({
        ...plano,
        exercises: await injetarGifs(plano.exercises, ptId)
      }))
    );

    return res.status(200).json(planosComGifs);
  } catch (error) {
    console.error('❌ Erro ao buscar planos por estudante:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar os planos de treino.' });
  }
};

// 🔁 Mantido por compatibilidade — devolve o plano mais recente (usado em código legado)
const getPlanByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const id = parseInt(studentId);
    const ptId = req.userId;

    if (isNaN(id)) return res.status(400).json({ error: 'ID do aluno inválido.' });

    const aluno = await prisma.student.findUnique({ where: { id } });
    if (!aluno || aluno.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const trainingPlan = await prisma.trainingPlan.findFirst({
      where: { studentId: id },
      include: { exercises: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!trainingPlan) return res.status(200).json(null);

    const exercisesWithGifs = await injetarGifs(trainingPlan.exercises, ptId);
    return res.status(200).json({ ...trainingPlan, exercises: exercisesWithGifs });
  } catch (error) {
    console.error('❌ Erro ao buscar plano por estudante:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar o plano de treino.' });
  }
};

// ─────────────────────────────────────────────
// 2. GUARDAR UM PLANO ESPECÍFICO (Criar ou Atualizar por dayNumber)
// ─────────────────────────────────────────────
const saveTrainingPlan = async (req, res) => {
  try {
    const { studentId, name, dayNumber, notes, exercises } = req.body;
    const id = parseInt(studentId);
    const ptId = req.userId;

    if (isNaN(id)) return res.status(400).json({ error: 'ID do aluno inválido.' });
    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({ error: 'A lista de exercícios é obrigatória.' });
    }

    const aluno = await prisma.student.findUnique({ where: { id } });
    if (!aluno || aluno.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Se tem dayNumber, procura se já existe um plano para este dia
      let planoExistente = null;
      if (dayNumber) {
        planoExistente = await tx.trainingPlan.findFirst({
          where: { studentId: id, dayNumber: parseInt(dayNumber) }
        });
      }

      if (planoExistente) {
        // Atualiza o plano existente — apaga exercícios antigos e cria novos
        await tx.trainingExercise.deleteMany({
          where: { trainingPlanId: planoExistente.id }
        });

        const updated = await tx.trainingPlan.update({
          where: { id: planoExistente.id },
          data: {
            name: name || planoExistente.name,
            notes: notes !== undefined ? notes : planoExistente.notes,
            exercises: {
              create: exercises.map(ex => ({
                exerciseName: ex.exerciseName,
                gifUrl: ex.gifUrl || null,
                sets: parseInt(ex.sets) || 4,
                reps: parseInt(ex.reps) || 10,
                restTime: ex.restTime || '60s',
                notes: ex.notes || ''
              }))
            }
          },
          include: { exercises: true }
        });
        return updated;
      } else {
        // Cria novo plano
        const newPlan = await tx.trainingPlan.create({
          data: {
            studentId: id,
            name: name || `Dia ${dayNumber || 1}`,
            dayNumber: dayNumber ? parseInt(dayNumber) : null,
            notes: notes || '',
            exercises: {
              create: exercises.map(ex => ({
                exerciseName: ex.exerciseName,
                gifUrl: ex.gifUrl || null,
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
      }
    });

    return res.status(201).json({ message: 'Plano de treino guardado com sucesso!', plan: result });
  } catch (error) {
    console.error('❌ Erro ao guardar plano de treino:', error);
    return res.status(500).json({ error: 'Erro interno ao processar plano de treino.' });
  }
};

// ─────────────────────────────────────────────
// 3. APAGAR UM PLANO ESPECÍFICO
// ─────────────────────────────────────────────
const deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const id = parseInt(planId);
    const ptId = req.userId;

    const plano = await prisma.trainingPlan.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!plano) return res.status(404).json({ error: 'Plano não encontrado.' });
    if (plano.student.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    await prisma.trainingPlan.delete({ where: { id } });
    return res.status(200).json({ message: 'Plano eliminado com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao eliminar plano:', error);
    return res.status(500).json({ error: 'Erro interno ao eliminar o plano.' });
  }
};

// ─────────────────────────────────────────────
// 4. CALENDÁRIO — Listar agendamentos do PT (com filtro de mês/ano)
// ─────────────────────────────────────────────
const getSchedule = async (req, res) => {
  try {
    const ptId = req.userId;
    const { month, year } = req.query;

    let whereClause = { userAdminId: ptId };

    if (month && year) {
      const inicio = new Date(parseInt(year), parseInt(month) - 1, 1);
      const fim = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      whereClause.scheduledDate = { gte: inicio, lte: fim };
    }

    const agendamentos = await prisma.trainingSchedule.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, fullName: true } },
        trainingPlan: { select: { id: true, name: true, dayNumber: true } }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    return res.status(200).json(agendamentos);
  } catch (error) {
    console.error('❌ Erro ao carregar agenda:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar a agenda.' });
  }
};

// ─────────────────────────────────────────────
// 5. CALENDÁRIO — Criar agendamento
// ─────────────────────────────────────────────
const createSchedule = async (req, res) => {
  try {
    const ptId = req.userId;
    const { studentId, trainingPlanId, scheduledDate, notes } = req.body;

    if (!studentId || !trainingPlanId || !scheduledDate) {
      return res.status(400).json({ error: 'Aluno, plano e data são obrigatórios.' });
    }

    // Verifica se já existe agendamento para este aluno neste dia
    const dataAgendada = new Date(scheduledDate);
    const jaExiste = await prisma.trainingSchedule.findFirst({
      where: {
        studentId: parseInt(studentId),
        scheduledDate: dataAgendada,
        userAdminId: ptId
      }
    });

    if (jaExiste) {
      // Atualiza em vez de criar duplicado
      const updated = await prisma.trainingSchedule.update({
        where: { id: jaExiste.id },
        data: {
          trainingPlanId: parseInt(trainingPlanId),
          notes: notes || null
        },
        include: {
          student: { select: { id: true, fullName: true } },
          trainingPlan: { select: { id: true, name: true, dayNumber: true } }
        }
      });
      return res.status(200).json({ message: 'Agendamento atualizado!', schedule: updated });
    }

    const novoAgendamento = await prisma.trainingSchedule.create({
      data: {
        studentId: parseInt(studentId),
        trainingPlanId: parseInt(trainingPlanId),
        userAdminId: ptId,
        scheduledDate: dataAgendada,
        notes: notes || null
      },
      include: {
        student: { select: { id: true, fullName: true } },
        trainingPlan: { select: { id: true, name: true, dayNumber: true } }
      }
    });

    return res.status(201).json({ message: 'Treino agendado com sucesso!', schedule: novoAgendamento });
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    return res.status(500).json({ error: 'Erro interno ao criar agendamento.' });
  }
};

// ─────────────────────────────────────────────
// 6. CALENDÁRIO — Apagar agendamento
// ─────────────────────────────────────────────
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const ptId = req.userId;

    const agendamento = await prisma.trainingSchedule.findUnique({
      where: { id: parseInt(scheduleId) }
    });

    if (!agendamento) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    if (agendamento.userAdminId !== ptId) return res.status(403).json({ error: 'Acesso negado.' });

    await prisma.trainingSchedule.delete({ where: { id: parseInt(scheduleId) } });
    return res.status(200).json({ message: 'Agendamento removido com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao apagar agendamento:', error);
    return res.status(500).json({ error: 'Erro interno ao apagar agendamento.' });
  }
};

// ─────────────────────────────────────────────
// 7. PLANO PÚBLICO (link WhatsApp — sem autenticação)
// ─────────────────────────────────────────────
const getPublicPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const id = parseInt(planId);

    if (isNaN(id)) return res.status(400).json({ error: 'ID do plano inválido.' });

    const trainingPlan = await prisma.trainingPlan.findUnique({
      where: { id },
      include: {
        exercises: true,
        student: { select: { fullName: true } }
      }
    });

    if (!trainingPlan) return res.status(404).json({ error: 'Plano de treino não encontrado.' });

    const exercisesWithGifs = await injetarGifs(trainingPlan.exercises, ptId);

    return res.status(200).json({
      id: trainingPlan.id,
      name: trainingPlan.name,
      dayNumber: trainingPlan.dayNumber,
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

// ─────────────────────────────────────────────
// 8. TODOS OS GIFs DA BIBLIOTECA
// ─────────────────────────────────────────────
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
  getPlansByStudent,
  saveTrainingPlan,
  deletePlan,
  getPublicPlan,
  getAllGifs,
  getSchedule,
  createSchedule,
  deleteSchedule
};