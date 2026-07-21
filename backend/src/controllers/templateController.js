const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
// 1. LISTAR TEMPLATES DO PT
// ─────────────────────────────────────────────
const getTemplates = async (req, res) => {
  try {
    const ptId = req.userId;
    const templates = await prisma.workoutTemplate.findMany({
      where: { userAdminId: ptId },
      include: { exercises: { orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }] } },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(templates);
  } catch (error) {
    console.error('❌ Erro ao listar templates:', error.message);
    return res.status(500).json({ error: 'Erro interno ao carregar templates.' });
  }
};

// ─────────────────────────────────────────────
// 2. CRIAR TEMPLATE
// ─────────────────────────────────────────────
const createTemplate = async (req, res) => {
  try {
    const ptId = req.userId;
    const { name, description, exercises } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'O nome do template é obrigatório.' });

    const template = await prisma.workoutTemplate.create({
      data: {
        userAdminId: ptId,
        name: name.trim(),
        description: description?.trim() || null,
        exercises: {
          create: (exercises || []).map((ex, idx) => ({
            exerciseName: ex.exerciseName,
            sets: parseInt(ex.sets) || 4,
            reps: parseInt(ex.reps) || 10,
            restTime: ex.restTime || '60s',
            notes: ex.notes || null,
            dayNumber: parseInt(ex.dayNumber) || 1,
            orderIndex: ex.orderIndex ?? idx
          }))
        }
      },
      include: { exercises: { orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }] } }
    });

    return res.status(201).json({ message: 'Template criado com sucesso!', template });
  } catch (error) {
    console.error('❌ Erro ao criar template:', error.message);
    return res.status(500).json({ error: 'Erro interno ao criar template.' });
  }
};

// ─────────────────────────────────────────────
// 3. ATUALIZAR TEMPLATE
// ─────────────────────────────────────────────
const updateTemplate = async (req, res) => {
  try {
    const ptId = req.userId;
    const { templateId } = req.params;
    const { name, description, exercises } = req.body;
    const id = parseInt(templateId);

    const template = await prisma.workoutTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Template não encontrado.' });
    if (template.userAdminId !== ptId) return res.status(403).json({ error: 'Acesso negado.' });

    await prisma.workoutTemplateExercise.deleteMany({ where: { templateId: id } });

    const updated = await prisma.workoutTemplate.update({
      where: { id },
      data: {
        name: name?.trim() || template.name,
        description: description?.trim() || null,
        exercises: {
          create: (exercises || []).map((ex, idx) => ({
            exerciseName: ex.exerciseName,
            sets: parseInt(ex.sets) || 4,
            reps: parseInt(ex.reps) || 10,
            restTime: ex.restTime || '60s',
            notes: ex.notes || null,
            dayNumber: parseInt(ex.dayNumber) || 1,
            orderIndex: ex.orderIndex ?? idx
          }))
        }
      },
      include: { exercises: { orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }] } }
    });

    return res.status(200).json({ message: 'Template atualizado!', template: updated });
  } catch (error) {
    console.error('❌ Erro ao atualizar template:', error.message);
    return res.status(500).json({ error: 'Erro interno ao atualizar template.' });
  }
};

// ─────────────────────────────────────────────
// 4. APAGAR TEMPLATE
// ─────────────────────────────────────────────
const deleteTemplate = async (req, res) => {
  try {
    const ptId = req.userId;
    const { templateId } = req.params;
    const id = parseInt(templateId);

    const template = await prisma.workoutTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Template não encontrado.' });
    if (template.userAdminId !== ptId) return res.status(403).json({ error: 'Acesso negado.' });

    await prisma.workoutTemplate.delete({ where: { id } });
    return res.status(200).json({ message: 'Template eliminado com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao apagar template:', error.message);
    return res.status(500).json({ error: 'Erro interno ao apagar template.' });
  }
};

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate };