const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });
const emailService = require('../services/emailService');

//NOVO SISTEMA: 1. SOLICITAÇÃO DE ACESSO (Público)
const requestAccess = async (req, res) => {
  try {
    const { nome, email, mensagem } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ 
        error: 'Por favor, preencha o seu nome e email.' 
      });
    }

    const userExiste = await prisma.userAdmin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (userExiste) {
      return res.status(400).json({ 
        error: 'Este email já se encontra registado e ativo no sistema.' 
      });
    }

    const novoPedido = await prisma.accessRequest.create({
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        mensagem: mensagem ? mensagem.trim() : null,
        status: 'Pendente'
      }
    });

    console.log(`💾 Pedido de acesso guardado na BD com ID: ${novoPedido.id}`);

    const adminHtml = `
      <div style="font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #262626; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444; margin-top: 0;">⚠️ Nova Solicitação de Acesso</h2>
        <p style="color: #a3a3a3; font-size: 14px;">Um novo utilizador solicitou credenciais para entrar na plataforma fitness.</p>
        <hr style="border: 0; border-top: 1px solid #262626; margin: 20px 0;">
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> <a href="mailto:${email}" style="color: #ef4444; text-decoration: none;">${email}</a></p>
        <p><strong>Mensagem/Objetivo:</strong></p>
        <div style="background-color: #171717; padding: 15px; border-radius: 8px; border: 1px solid #262626; color: #e5e5e5; font-style: italic;">
          "${mensagem || 'Nenhuma mensagem preenchida.'}"
        </div>
        <hr style="border: 0; border-top: 1px solid #262626; margin: 20px 0;">
        <p style="font-size: 12px; color: #737373; text-align: center; margin-bottom: 0;">
          Gestão Automatizada de Pedidos de Acesso • PT-Control
        </p>
      </div>
    `;

    const userHtml = `
      <div style="font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #262626; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444; margin-top: 0;">Olá ${nome}, recebemos o teu pedido!</h2>
        <p style="color: #e5e5e5; line-height: 1.6;">
          A tua solicitação de acesso para a nossa plataforma de gestão de treinos foi registada com sucesso e encontra-se atualmente <strong>em análise</strong> pela nossa equipa de administração.
        </p>
        <p style="color: #a3a3a3; line-height: 1.6;">
          Assim que o teu perfil for validado, receberás um e-mail com um link exclusivo para definires a tua conta com uma nova palavra-passe e começares a utilizar a aplicação.
        </p>
        <div style="margin-top: 25px; padding: 15px; background-color: #171717; border-radius: 8px; border: 1px solid #262626; text-align: center;">
          <span style="color: #f59e0b; font-weight: bold; font-size: 14px;">Estado do Pedido: ⏳ EM ANÁLISE</span>
        </div>
        <hr style="border: 0; border-top: 1px solid #262626; margin: 25px 0;">
        <p style="font-size: 12px; color: #737373; text-align: center; margin-bottom: 0;">
          Por favor, não respondas diretamente a este e-mail automático.
        </p>
      </div>
    `;

    // 🔒 PROTEÇÃO DE EMAIL: Impede o servidor de crashar caso o serviço SMTP falhe
    try {
      // Corrigido para process.env.EMAIL_USER que é o que está mapeado no emailService
      await emailService.sendEmail({
        to: process.env.EMAIL_USER || 'admin@gym.com', 
        subject: `[⚠️ NOVO PEDIDO] ${nome} solicita acesso à plataforma`,
        html: adminHtml
      });

      await emailService.sendEmail({
        to: email, 
        subject: 'Ficamos com o teu pedido! Plataforma Fitness em Análise',
        html: userHtml
      });
      console.log('📧 E-mails de notificação e feedback enviados com sucesso.');
    } catch (emailError) {
      console.warn('⚠️ O pedido de acesso foi guardado, mas o envio de e-mails falhou:', emailError.message);
    }

    // Retorna SEMPRE status 200/201 para o frontend não quebrar
    return res.status(200).json({ 
      message: 'Solicitação registada com sucesso. Aguarda a aprovação do administrador!' 
    });

  } catch (error) {
    console.error('❌ Erro crítico ao processar solicitação de acesso:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Não foi possível processar o pedido. Tenta novamente mais tarde.' 
    });
  }
};

//NOVO SISTEMA: 3. CRIAÇÃO DE CONTA DE PT PELO ADMIN (Ação de Backend Interna)
const createTrainerAccount = async (req, res) => {
  try {
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios para emitir um novo acesso.' });
    }

    // Verificar duplicação defensiva na base de dados
    const userExiste = await prisma.userAdmin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (userExiste) {
      return res.status(400).json({ error: 'Este e-mail já possui uma conta ativa registada no sistema.' });
    }

    // Definição da password simples padrão provisória
    const passwordProvisoria = 'Mudar123!';
    const hashedPassword = await bcrypt.hash(passwordProvisoria, 10);

    // Inserção física no MariaDB via Prisma Client
    const novoPT = await prisma.userAdmin.create({
      data: {
        email: email.toLowerCase().trim(),
        nome: nome.trim(),
        passwordHash: hashedPassword,
        isActive: true,
        role: 'PT',
        mustChangePassword: true
      }
    });

    //Email Oficial com Credenciais Provisórias enviado para o Personal Trainer aprovado
    const credentialsHtml = `
      <div style="font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #262626; max-width: 550px; margin: 0 auto;">
        <div style="text-align: center; font-size: 32px; margin-bottom: 10px;">🎉</div>
        <h2 style="color: #ffffff; margin: 0 0 15px 0; text-align: center; font-weight: 800;">A tua Conta na Plataforma PT-Control está Pronta!</h2>
        <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Olá, <strong>${nome.trim()}</strong>. A tua solicitação de acesso profissional foi revista e aprovada pela nossa administração. O teu espaço de trabalho digital já se encontra disponível.
        </p>
        
        <div style="background-color: #171717; border: 1px solid #262626; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <p style="margin: 0 0 10px 0; color: #ef4444; font-size: 12px; font-weight: bold; uppercase; tracking-wider;">Credenciais de Acesso Oficial:</p>
          <p style="margin: 6px 0; color: #e5e5e5; font-size: 14px;"><strong style="color: #737373;">E-mail:</strong> ${email.toLowerCase().trim()}</p>
          <p style="margin: 6px 0; color: #e5e5e5; font-size: 14px;"><strong style="color: #737373;">Password Temporária:</strong> <span style="font-family: monospace; background-color: #262626; padding: 2px 6px; border-radius: 4px; color: #ffffff;">${passwordProvisoria}</span></p>
        </div>

        <div style="background-color: #ef4444; padding: 12px; border-radius: 10px; text-align: center; color: #0a0a0a; font-size: 13px; font-weight: bold; margin-bottom: 20px;">
          ⚠️ Por motivos estritos de segurança, terás de alterar esta password no teu primeiro acesso!
        </div>

        <hr style="border: 0; border-top: 1px solid #262626; margin: 25px 0;">
        <p style="font-size: 11px; text-align: center; color: #525252; margin: 0;">Plataforma Corporativa Fitness Gym &copy; 2026</p>
      </div>
    `;

    await emailService.sendEmail({
      to: email.toLowerCase().trim(),
      subject: 'Credenciais de Acesso: Conta de Personal Trainer Ativada',
      html: credentialsHtml
    });

    return res.status(201).json({
      message: 'Conta de Personal Trainer criada e e-mail com credenciais enviado!',
      userId: novoPT.id
    });

  } catch (error) {
    console.error('Erro ao criar conta de PT pelo Admin:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Falha do sistema ao gerar nova conta profissional de PT.' 
    });
  }
};

// 👑 ROTA ADMINISTRATIVA: Listar todas as solicitações de acesso pendentes
const getPendingAccessRequests = async (req, res) => {
  try {
    // Procura na BD todos os pedidos cujo status seja 'Pendente'
    // Ordena pelos mais recentes primeiro
    const pedidos = await prisma.accessRequest.findMany({
      where: {
        status: 'Pendente'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(pedidos);
  } catch (error) {
    console.error('❌ Erro ao listar pedidos de acesso pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Não foi possível carregar a lista de solicitações.' 
    });
  }
};


// 2. AUTENTICAR UTILIZADOR (LOGIN)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    const user = await prisma.userAdmin.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // 1. Verificar primeiro se o utilizador existe na Base de Dados
    if (!user) {
      return res.status(401).json({ error: 'Credenciais incorretas.' });
    }

    // 🔥 2. SEPARADO: Se o utilizador existe mas está SUSPENSO (isActive === false)
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Acesso Suspenso',
        message: 'A tua conta de acesso encontra-se desativada temporariamente. Por favor, contacta o administrador global para restabelecer o teu acesso.'
      });
    }

    // 3. Validar a palavra-passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais incorretas.' });
    }

    // 4. Gerar o token JWT de acesso
    const token = jwt.sign(
      { userId: user.id, nome: user.nome, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 5. Atualizar os metadados de auditoria de login
    await prisma.userAdmin.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), failedAttempts: 0 }
    });

    return res.status(200).json({
      message: 'Login efetuado com sucesso.',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao processar a autenticação.' });
  }
};
//  NOVO SISTEMA: LISTAR TODOS OS PERSONAL TRAINERS (Ação do Admin)
const getTrainers = async (req, res) => {
  try {
    // Consulta a tabela userAdmin filtrando apenas por utilizadores com a Role 'PT'
    const trainers = await prisma.userAdmin.findMany({
      where: {
        role: 'PT'
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true // Útil se quiseres ver quando o PT entrou no sistema pela última vez
      },
      orderBy: {
        nome: 'asc' // Organiza a lista por ordem alfabética do nome
      }
    });

    return res.status(200).json(trainers);
  } catch (error) {
    console.error('Erro ao listar Personal Trainers:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Não foi possível carregar a lista de treinadores neste momento.' 
    });
  }
};

//  NOVO SISTEMA: DESATIVAR / ELIMINAR CONTA DE PT (Ação do Admin)
const deactivateTrainer = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o utilizador existe e se é efetivamente um PT
    const trainer = await prisma.userAdmin.findUnique({
      where: { id: parseInt(id) }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Personal Trainer não encontrado.' });
    }

    if (trainer.role !== 'PT') {
      return res.status(400).json({ error: 'Ação revogada. Apenas contas com a função PT podem ser geridas aqui.' });
    }

    // Executa a desativação lógica (ou podes alterar para prisma.userAdmin.delete se preferires o apagão total)
    await prisma.userAdmin.update({
      where: { id: parseInt(id) },
      data: { 
        isActive: false 
      }
    });

    return res.status(200).json({ 
      message: `Acesso do Personal Trainer ${trainer.nome} revogado com sucesso.` 
    });
  } catch (error) {
    console.error('Erro ao desativar Personal Trainer:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Não foi possível revogar o acesso do treinador neste momento.' 
    });
  }
};

// 💪 MÉTRICAS COMPLETAS DO PT
const getTrainerMetrics = async (req, res) => {
  try {
    const ptId = parseInt(req.userId); 

    if (isNaN(ptId)) {
      return res.status(400).json({ error: 'ID do utilizador inválido no token.' });
    }

    // 1. Alunos ativos deste PT
    const totalAlunosAtivos = await prisma.student.count({
      where: { userAdminId: ptId, status: 'Ativo' }
    });

    // 2. Alunos inativos deste PT
    const totalAlunosInativos = await prisma.student.count({
      where: { userAdminId: ptId, status: 'Inativo' }
    });

    // 3. Planos criados este mês (dos alunos deste PT)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const planosMes = await prisma.trainingPlan.count({
      where: {
        student: { userAdminId: ptId },
        createdAt: { gte: inicioMes }
      }
    });

    // 4. Total de planos deste PT
    const totalPlanos = await prisma.trainingPlan.count({
      where: { student: { userAdminId: ptId } }
    });

    // 5. Exercícios na galeria deste PT
    const totalExercicios = await prisma.globalExercise.count({
      where: { userAdminId: ptId }
    });

    // 6. Últimos 5 alunos adicionados por este PT
    const ultimosAlunos = await prisma.student.findMany({
      where: { userAdminId: ptId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, status: true, createdAt: true }
    });

    return res.status(200).json({
      totalAlunos: totalAlunosAtivos,
      totalAlunosAtivos,
      totalAlunosInativos,
      totalPlanos,
      planosMes,
      totalExercicios,
      ultimosAlunos
    });
  } catch (error) {
    console.error('❌ Erro crítico ao calcular métricas do PT:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Não foi possível carregar as estatísticas.' 
    });
  }
};

const updateAccessRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Aprovado', 'Recusado'].includes(status)) {
      return res.status(400).json({ error: 'Estado de atualização inválido.' });
    }

    const pedidoId = parseInt(id);
    if (isNaN(pedidoId)) {
      return res.status(400).json({ error: 'ID do pedido inválido.' });
    }

    const pedidoExiste = await prisma.accessRequest.findUnique({
      where: { id: pedidoId }
    });

    if (!pedidoExiste) {
      return res.status(404).json({ error: 'Solicitação de acesso não encontrada.' });
    }

    if (pedidoExiste.status !== 'Pendente') {
      return res.status(400).json({ error: 'Esta solicitação já foi processada anteriormente.' });
    }

    let passwordTemporaria = null;

    if (status === 'Aprovado') {
      const userExiste = await prisma.userAdmin.findUnique({
        where: { email: pedidoExiste.email.toLowerCase() }
      });

      if (userExiste) {
        return res.status(400).json({ error: 'Este e-mail já se encontra registado como utilizador ativo.' });
      }

      passwordTemporaria = 'PT-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(passwordTemporaria, saltRounds);

      await prisma.$transaction([
        prisma.accessRequest.update({
          where: { id: pedidoId },
          data: { status: 'Aprovado' }
        }),
        prisma.userAdmin.create({
          data: {
            email: pedidoExiste.email.toLowerCase(),
            nome: pedidoExiste.nome,
            passwordHash: hashedPassword,
            role: 'PT',
            isActive: true,
            mustChangePassword: true 
          }
        })
      ]);

      console.log(`Conta de PT criada com sucesso para ${pedidoExiste.email}`);

      const emailHtml = `
        <div style="font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #262626; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444; margin-top: 0;">🎉 O teu acesso foi Aprovado!</h2>
          <p style="color: #e5e5e5; line-height: 1.6;">
            Olá <strong>${pedidoExiste.nome}</strong>, temos o prazer de informar que a tua solicitação de acesso à nossa plataforma foi validada com sucesso pelo administrador.
          </p>
          <p style="color: #a3a3a3; line-height: 1.6;">
            A tua conta de Personal Trainer já se encontra ativa. Utiliza as seguintes credenciais para fazeres o teu primeiro login:
          </p>
          
          <div style="background-color: #171717; padding: 20px; border-radius: 12px; border: 1px solid #262626; margin: 20px 0; font-family: monospace;">
            <p style="margin: 0 0 10px 0; color: #e5e5e5;"><strong>E-mail:</strong> ${pedidoExiste.email}</p>
            <p style="margin: 0; color: #f59e0b;"><strong>Password Temporária:</strong> <span style="font-size: 16px; letter-spacing: 1px;">${passwordTemporaria}</span></p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="https://pt-control.vercel.app/" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
              Aceder à Plataforma
            </a>
          </div>

          <p style="color: #ed3c3c; font-size: 12px; font-style: italic; background-color: #dc2626/10; padding: 10px; border-radius: 6px; text-align: center;">
            ⚠️ Por motivos de segurança, deves alterar esta password assim que entrares no teu painel de controlo.
          </p>

          <hr style="border: 0; border-top: 1px solid #262626; margin: 25px 0;">
          <p style="font-size: 12px; color: #737373; text-align: center; margin-bottom: 0;">
            Bons treinos! • PT-Control
          </p>
        </div>
      `;

      // 🔒 PROTEÇÃO DE EMAIL
      try {
        await emailService.sendEmail({
          to: pedidoExiste.email,
          subject: 'Conta Aprovada! Bem-vindo(a) à plataforma PT-Control',
          html: emailHtml
        });
      } catch (emailError) {
        console.warn('⚠️ Conta ativada no banco de dados, mas e-mail de aprovação falhou:', emailError.message);
      }

    } else {
      await prisma.accessRequest.update({
        where: { id: pedidoId },
        data: { status: 'Recusado' }
      });

      const recusaHtml = `
        <div style="font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #262626; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #737373; margin-top: 0;">Atualização sobre o seu pedido</h2>
          <p style="color: #e5e5e5; line-height: 1.6;">Olá ${pedidoExiste.nome},</p>
          <p style="color: #a3a3a3; line-height: 1.6;">
            Agradecemos o teu interesse na nossa plataforma. Após análise da tua solicitação de acesso, lamentamos informar que o teu pedido não pôde ser aprovado de momento.
          </p>
          <hr style="border: 0; border-top: 1px solid #262626; margin: 25px 0;">
          <p style="font-size: 12px; color: #737373; text-align: center; margin-bottom: 0;">
            PT-Control
          </p>
        </div>
      `;

      // 🔒 PROTEÇÃO DE EMAIL
      try {
        await emailService.sendEmail({
          to: pedidoExiste.email,
          subject: 'Atualização sobre o seu pedido de acesso - PT-Control',
          html: recusaHtml
        });
      } catch (emailError) {
        console.warn('⚠️ Pedido recusado na BD, mas e-mail de recusa falhou:', emailError.message);
      }
    }

    return res.status(200).json({
      message: `Solicitação marcada como ${status} e processada com sucesso.`,
    });

  } catch (error) {
    console.error('❌ Erro ao processar atualização do pedido de acesso:', error);
    return res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Não foi possível atualizar o estado do pedido.' 
    });
  }
};


// 🔥 NOVO: 1. SOLICITAR CÓDIGO DE VERIFICAÇÃO (2FA / Alteração de Dados)
const solicitarCodigoPerfil = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado. Sessão inválida.' });
    }

    const user = await prisma.userAdmin.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const codigoGerado = Math.floor(100000 + Math.random() * 900000).toString();
    const tempoExpiracao = new Date(Date.now() + 15 * 60 * 1000);

    // 🔥 NOTA: Se der erro aqui de novo, verifica no teu schema.prisma como deste o nome à tabela de códigos (ex: verificationCode, ou codigoVerificacao)
    await prisma.verificationCode.create({
      data: {
        email: user.email,
        code: codigoGerado,
        expiresAt: tempoExpiracao
      }
    });

    const emailHtml = `
      <div style="background-color: #0a0a0a; color: #ffffff; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #262626;">
        <h2 style="color: #dc2626; margin-top: 0; font-weight: 900; text-transform: uppercase;">PT Control</h2>
        <h3 style="color: #e5e5e5; font-size: 18px;">Código de Verificação de Segurança</h3>
        <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
          Utiliza o código abaixo para confirmar a tua identidade no teu perfil.
        </p>
        <div style="background-color: #171717; border: 1px solid #262626; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">${codigoGerado}</span>
        </div>
        <p style="color: #737373; font-size: 12px;">⚠️ Válido por 15 minutos.</p>
      </div>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: 'Código de Segurança - PT Control',
      html: emailHtml
    });

    return res.status(200).json({ message: 'Código enviado com sucesso para o teu e-mail.' });

  } catch (error) {
    console.error('❌ Erro ao solicitar código de perfil:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar o código de validação.' });
  }
};
// 🔥 NOVO: 2. ATUALIZAR DADOS DO PERFIL (Valida o Código se mudar Email/Password)
const atualizarPerfil = async (req, res) => {
  try {
    const userId = req.userId;
    const { nome, email, password, codigo } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const user = await prisma.userAdmin.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const alterouEmail = email && email.toLowerCase().trim() !== user.email;
    const alterouPassword = !!password;

    if (alterouEmail || alterouPassword) {
      if (!codigo) {
        return res.status(400).json({ error: 'Código de verificação em falta para alterações de segurança.' });
      }

      const tokenValido = await prisma.verificationCode.findFirst({
        where: {
          email: user.email,
          code: codigo,
          expiresAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!tokenValido) {
        return res.status(400).json({ error: 'Código de verificação inválido ou expirado.' });
      }

      await prisma.verificationCode.deleteMany({ where: { email: user.email } });
    }

    // Montar objeto de atualização dinâmico
    const dadosAtualizacao = {};
    if (nome) dadosAtualizacao.nome = nome.trim();
    if (alterouEmail) dadosAtualizacao.email = email.toLowerCase().trim();
    
    if (alterouPassword) {
      const salt = await bcrypt.genSalt(10);
      dadosAtualizacao.passwordHash = await bcrypt.hash(password, salt);
    }

    // 🔥 CORREÇÃO CIRÚRGICA: De acordo com o teu schema, vamos tentar atualizar a propriedade.
    // Como o Prisma mapeia must_change_password da BD para camelCase no JS, usamos mustChangePassword.
    // Se o teu schema gerou uma propriedade diferente, o Prisma aceita o mapeamento direto:
    dadosAtualizacao.mustChangePassword = false; 

    // Atualizar na base de dados
    const utilizadorAtualizado = await prisma.userAdmin.update({
      where: { id: userId },
      data: dadosAtualizacao
    });

    return res.status(200).json({
      message: 'Perfil updated com sucesso!',
      user: {
        id: utilizadorAtualizado.id,
        nome: utilizadorAtualizado.nome,
        email: utilizadorAtualizado.email,
        role: utilizadorAtualizado.role,
        mustChangePassword: false // Garante que o React limpa o estado imediatamente
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    
    // Fallback de segurança: Se o Prisma reclamar do 'mustChangePassword', 
    // significa que no teu schema.prisma escreveste exatamente 'must_change_password' (com underscore).
    // Vamos intercetar e tentar salvar com a outra grafia automaticamente para nunca quebrar!
    if (error.message.includes('Unknown argument') || error.message.includes('mustChangePassword')) {
      try {
        const dadosFallback = { nome: nome?.trim(), email: email?.toLowerCase().trim() };
        if (password) {
          const salt = await bcrypt.genSalt(10);
          dadosFallback.passwordHash = await bcrypt.hash(password, salt);
        }
        
        // Tenta com underscore caso o teu mapeamento do schema tenha preservado o nome do banco
        dadosFallback.must_change_password = false;

        const utilizadorAtualizado = await prisma.userAdmin.update({
          where: { id: userId },
          data: dadosFallback
        });

        return res.status(200).json({
          message: 'Perfil atualizado com sucesso!',
          user: {
            id: utilizadorAtualizado.id,
            nome: utilizadorAtualizado.nome,
            email: utilizadorAtualizado.email,
            role: utilizadorAtualizado.role,
            mustChangePassword: false
          }
        });
      } catch (errInner) {
        console.error('❌ Falha total no fallback de salvamento:', errInner);
      }
    }

    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este endereço de e-mail já está a ser utilizado por outra conta.' });
    }
    return res.status(500).json({ error: 'Erro interno ao atualizar os dados de perfil.' });
  }
};

const activateTrainer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.userAdmin.update({
      where: { id: parseInt(id) },
      data: { isActive: true } 
    });

    return res.status(200).json({ message: 'Acesso do Personal Trainer reativado com sucesso!' });
  } catch (error) {
    console.error('Erro ao reativar PT:', error);
    return res.status(500).json({ error: 'Erro interno ao reativar o utilizador.' });
  }
};

const permanentlyDeleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const ptId = parseInt(id);

    // Impedir o Admin de apagar um PT que ainda tenha alunos vinculados
    const temAlunos = await prisma.student.findFirst({
      where: { userAdminId: ptId }
    });

    if (temAlunos) {
      return res.status(400).json({ 
        error: 'Não é possível eliminar este PT.', 
        message: 'Este treinador ainda possui alunos associados na base de dados. Suspenda a conta ou transfira os alunos antes de a remover.' 
      });
    }

    await prisma.userAdmin.delete({
      where: { id: ptId }
    });

    return res.status(200).json({ message: 'Conta do Personal Trainer removida permanentemente do sistema.' });
  } catch (error) {
    console.error('Erro ao eliminar PT:', error);
    return res.status(500).json({ error: 'Erro ao expurgar o utilizador do servidor.' });
  }
};

// Certifica-te de que no final do ficheiro estás a exportar juntamente com as outras:
module.exports = {
  requestAccess,
  login,
  createTrainerAccount,
  getTrainers,
  deactivateTrainer,
  getTrainerMetrics,
  getPendingAccessRequests,
  updateAccessRequestStatus,
  activateTrainer,
  permanentlyDeleteTrainer,
  solicitarCodigoPerfil,
  atualizarPerfil
};