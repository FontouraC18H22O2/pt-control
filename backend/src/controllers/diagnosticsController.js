const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// Guarda a hora em que o processo do servidor arrancou (para calcular o uptime)
const SERVER_START_TIME = Date.now();

// 🔧 Função auxiliar: mede quanto tempo demora uma operação assíncrona
const medirTempo = async (fn) => {
  const inicio = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - inicio };
  } catch (error) {
    return { ok: false, ms: Date.now() - inicio, erro: error.message };
  }
};

// 🩺 Endpoint principal de diagnóstico — testa todos os serviços ligados
exports.getSystemStatus = async (req, res) => {
  const resultado = {};

  // 1️⃣ Backend (Railway) — está a responder, há quanto tempo está de pé
  const uptimeMs = Date.now() - SERVER_START_TIME;
  const uptimeMin = Math.floor(uptimeMs / 60000);
  const horas = Math.floor(uptimeMin / 60);
  const minutos = uptimeMin % 60;
  resultado.backend = {
    nome: 'Backend (Railway)',
    status: 'online',
    uptime: horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`,
    ambiente: process.env.NODE_ENV || 'production',
  };

  // 2️⃣ Base de Dados (MariaDB no Railway) — testa uma query simples
  const testeDb = await medirTempo(() => prisma.$queryRaw`SELECT 1`);
  resultado.database = {
    nome: 'Base de Dados (MariaDB)',
    status: testeDb.ok ? 'online' : 'erro',
    tempoResposta: `${testeDb.ms}ms`,
    erro: testeDb.ok ? null : testeDb.erro,
  };

  // 3️⃣ Resend (Email) — confirma se a chave está configurada e válida (sem enviar email real)
  let resendStatus = { nome: 'Resend (Email)', status: 'não configurado', tempoResposta: null, erro: null };
  if (process.env.RESEND_API_KEY) {
    const testeResend = await medirTempo(async () => {
      const resp = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    });
    resendStatus.status = testeResend.ok ? 'online' : 'erro';
    resendStatus.tempoResposta = `${testeResend.ms}ms`;
    resendStatus.erro = testeResend.ok ? null : testeResend.erro;
  }
  resultado.email = resendStatus;

  // 4️⃣ Cloudinary (Armazenamento de Imagens) — confirma se as credenciais estão configuradas
  const cloudinaryConfigurado = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  let cloudinaryStatus = { nome: 'Cloudinary (GIFs/Imagens)', status: 'não configurado', tempoResposta: null, erro: null };
  if (cloudinaryConfigurado) {
    const testeCloudinary = await medirTempo(async () => {
      const auth = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64');
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/usage`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    });
    cloudinaryStatus.status = testeCloudinary.ok ? 'online' : 'erro';
    cloudinaryStatus.tempoResposta = `${testeCloudinary.ms}ms`;
    cloudinaryStatus.erro = testeCloudinary.ok ? null : testeCloudinary.erro;
  }
  resultado.storage = cloudinaryStatus;

  // 5️⃣ Frontend (Vercel) — mostra a configuração de CORS (não dá para "testar" a partir daqui)
  resultado.frontend = {
    nome: 'Frontend (Vercel)',
    status: 'informativo',
    dominiosPermitidos: [
      'https://pt-control.fit',
      'https://pt-control.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
  };

  // Resumo geral: se algum serviço crítico estiver com erro, assinala
  const servicosComErro = [resultado.database, resultado.email, resultado.storage].filter(
    s => s.status === 'erro'
  );
  resultado.resumo = {
    tudoOk: servicosComErro.length === 0,
    totalErros: servicosComErro.length,
    verificadoEm: new Date().toISOString(),
  };

  return res.status(200).json(resultado);
};