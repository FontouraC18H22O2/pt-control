const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// 1. CRIAR UM NOVO ALUNO (POST) - Vinculado ao PT logado
const createStudent = async (req, res) => {
  try {
    const { nome, whatsapp, status } = req.body; 
    const ptId = req.userId; // 🔑 Injetado pelo authMiddleware do token JWT

    // 🚨 BARREIRA DE SEGURANÇA: Bloqueia antes de chamar o Prisma se o ID estiver em falta
    if (!ptId) {
      return res.status(401).json({ 
        error: 'Sessão inválida ou expirada. Por favor, faça login novamente para registar alunos.' 
      });
    }

    if (!nome || !whatsapp) {
      return res.status(400).json({ error: 'O nome completo e o número de telemóvel são obrigatórios.' });
    }

    // Grava no MariaDB garantindo que este aluno pertence estritamente a este PT
    const newStudent = await prisma.student.create({
      data: { 
        fullName: nome.trim(), 
        phoneNumber: whatsapp.trim(),
        status: status || 'Ativo',
        userAdminId: ptId // 🔒 Vinculação forçada do dono do registo
      }
    });

    return res.status(201).json({ 
      id: newStudent.id,
      nome: newStudent.fullName,
      whatsapp: newStudent.phoneNumber,
      plano: 'Plano Personalizado',
      status: newStudent.status
    });
  } catch (error) {
    console.error('❌ Erro no terminal ao criar aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao registar o aluno.' });
  }
};

// 2. LISTAR APENAS OS ALUNOS DO PT LOGADO (GET) - Isolamento de Dados
const getAllStudents = async (req, res) => {
  try {
    const ptId = req.userId; // 🔑 ID do PT vindo do token

    // O findMany procura estritamente apenas os alunos deste PT
    const students = await prisma.student.findMany({
      where: {
        userAdminId: ptId
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatados = students.map(s => ({
      id: s.id,
      nome: s.fullName,
      whatsapp: s.phoneNumber,
      plano: 'Plano Personalizado', 
      status: s.status
    }));

    return res.status(200).json(formatados);
  } catch (error) {
    console.error('❌ Erro no terminal ao listar alunos:', error);
    return res.status(500).json({ error: 'Erro interno ao procurar alunos.' });
  }
};

// 3. ATUALIZAR DADOS DE UM ALUNO (PUT) - Valida a posse do aluno
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, whatsapp, status } = req.body; 
    const ptId = req.userId; // 🔑 ID do PT logado

    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    // Cibersegurança: Garantir que o aluno pertence ao PT antes de atualizar
    const alunoOriginal = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!alunoOriginal || alunoOriginal.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado. Não tem permissão para alterar este atleta.' });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { 
        fullName: nome.trim(), 
        phoneNumber: whatsapp.trim(),
        status: status
      }
    });

    return res.status(200).json({ 
      id: updatedStudent.id,
      nome: updatedStudent.fullName,
      whatsapp: updatedStudent.phoneNumber,
      plano: 'Plano Personalizado',
      status: updatedStudent.status
    });
  } catch (error) {
    console.error('❌ Erro no terminal ao atualizar aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar o aluno.' });
  }
};

// 4. REMOVER UM ALUNO (DELETE) - Valida a posse do aluno
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const ptId = req.userId; // 🔑 ID do PT logado

    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'ID do aluno inválido.' });
    }

    // Cibersegurança: Garantir que o aluno pertence ao PT antes de eliminar
    const alunoOriginal = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!alunoOriginal || alunoOriginal.userAdminId !== ptId) {
      return res.status(403).json({ error: 'Acesso negado. Não tem permissão para remover este atleta.' });
    }

    await prisma.student.delete({
      where: { id: studentId }
    });

    return res.status(200).json({ message: 'Aluno removido do sistema com sucesso.' });
  } catch (error) {
    console.error('❌ Erro no terminal ao remover aluno:', error);
    return res.status(500).json({ error: 'Erro interno ao remover o aluno.' });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent
};