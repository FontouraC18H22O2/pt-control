const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 🔍 1. GET - Listar exercícios (Globais + os do PT autenticado)
exports.getAllExercises = async (req, res) => {
  try {
    // req.userId vem do teu authMiddleware se a rota estiver protegida
    const userId = req.userId || null; 

    const exercises = await prisma.globalExercise.findMany({
      where: {
        OR: [
          { userAdminId: null }, // Exercícios do Administrador (Globais)
          userId ? { userAdminId: userId } : {} // Exercícios privados deste PT
        ]
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json(exercises);
  } catch (error) {
    console.error('Erro ao procurar exercícios:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível carregar a galeria de exercícios.'
    });
  }
};

// ➕ 2. POST - Criar exercício isolado para o PT
exports.createExercise = async (req, res) => {
  try {
    const { name, category } = req.body;
    const userId = req.userId; // Captura quem está a criar

    if (!name || !category) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
    }

    // Validar se o nome já existe no escopo visível deste PT
    const existe = await prisma.globalExercise.findFirst({
      where: {
        name: name.trim(),
        OR: [
          { userAdminId: null },
          { userAdminId: userId }
        ]
      }
    });

    if (existe) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Já existe um exercício com este nome.' });
    }

    let gifUrl = null;
    if (req.file) {
      gifUrl = `/uploads/exercicios/${req.file.filename}`;
    }

    const newExercise = await prisma.globalExercise.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        gifUrl: gifUrl,
        userAdminId: userId // Vincula ao PT autenticado
      }
    });

    return res.status(201).json({
      message: 'Exercício criado com sucesso!',
      exercise: newExercise
    });
  } catch (error) {
    console.error('Erro ao criar exercício:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// 📝 3. PUT - Editar Exercício (Apenas se for dono ou Admin)
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const userId = req.userId;
    const userRole = req.userRole; // Captura o papel (ADMIN ou PT)

    const exercise = await prisma.globalExercise.findUnique({
      where: { id: parseInt(id) }
    });

    if (!exercise) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Exercício não encontrado.' });
    }

    // Proteção de segurança: Se não for ADMIN e não for o dono do exercício, bloqueia!
    if (userRole !== 'ADMIN' && exercise.userAdminId !== userId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Não tens permissão para editar este exercício.' });
    }

    let gifUrl = exercise.gifUrl;
    if (req.file) {
      if (exercise.gifUrl) {
        const oldPath = path.join(__dirname, '../../public', exercise.gifUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      gifUrl = `/uploads/exercicios/${req.file.filename}`;
    }

    const updated = await prisma.globalExercise.update({
      where: { id: parseInt(id) },
      data: {
        name: name ? name.trim() : exercise.name,
        category: category ? category.trim() : exercise.category,
        gifUrl: gifUrl
      }
    });

    return res.status(200).json({
      message: 'Exercício atualizado com sucesso!',
      exercise: updated
    });
  } catch (error) {
    console.error('Erro ao atualizar exercício:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// 🗑️ 4. DELETE - Apagar Exercício (Apenas se for dono ou Admin)
exports.deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const exercise = await prisma.globalExercise.findUnique({
      where: { id: parseInt(id) }
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Exercício não encontrado.' });
    }

    // Proteção de segurança
    if (userRole !== 'ADMIN' && exercise.userAdminId !== userId) {
      return res.status(403).json({ error: 'Não tens permissão para eliminar este exercício.' });
    }

    if (exercise.gifUrl) {
      const filePath = path.join(__dirname, '../../public', exercise.gifUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.globalExercise.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: 'Exercício eliminado com sucesso!' });
  } catch (error) {
    console.error('Erro ao eliminar exercício:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};