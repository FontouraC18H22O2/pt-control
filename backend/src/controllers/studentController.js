const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. Criar um novo aluno
const createStudent = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;

    if (!fullName || !phoneNumber) {
      return res.status(400).json({ error: 'O nome completo e o número de telemóvel são obrigatórios.' });
    }

    const newStudent = await prisma.student.create({
      data: { fullName, phoneNumber }
    });

    return res.status(201).json({ message: 'Aluno registado com sucesso!', student: newStudent });
  } catch (error) {
    console.error('❌ Erro ao criar aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao registar o aluno.' });
  }
};

// 2. Listar todos os alunos
const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(students);
  } catch (error) {
    console.error('❌ Erro ao listar alunos:', error);
    return res.status(500).json({ error: 'Erro interno ao procurar alunos.' });
  }
};

// 3. Atualizar dados de um aluno
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phoneNumber } = req.body;

    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { fullName, phoneNumber }
    });

    return res.status(200).json({ message: 'Dados do aluno atualizados!', student: updatedStudent });
  } catch (error) {
    console.error('❌ Erro ao atualizar aluno:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    return res.status(500).json({ error: 'Erro interno ao atualizar o aluno.' });
  }
};

// 4. Remover um aluno (O Prisma fará Cascade nos planos graças ao schema)
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    await prisma.student.delete({
      where: { id: studentId }
    });

    return res.status(200).json({ message: 'Aluno removido do sistema com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao remover aluno:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    return res.status(500).json({ error: 'Erro interno ao remover o aluno.' });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent
};