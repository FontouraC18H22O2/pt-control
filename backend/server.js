require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 1. Importar todos os módulos de rotas criados (Sem Duplicações)
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const trainingRoutes = require('./src/routes/trainingRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const weightRoutes = require('./src/routes/weightRoutes');
const exerciseRoutes = require('./src/routes/exerciseRoutes');
const diagnosticsRoutes = require('./src/routes/diagnosticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Diz ao Express para confiar no proxy do Railway para o rate-limit ler o IP real do utilizador
app.set('trust proxy', 1);

// 2. Middlewares Globais de Segurança e Performance
app.use(helmet({crossOriginResourcePolicy: { policy: "cross-origin" }}));

// Configuração Dinâmica e Segura do CORS
const allowedOrigins = [
  'https://pt-control.vercel.app',            // Domínio padrão da Vercel
  'https://pt-control.fit',                   //  Domínio próprio de produção
  'https://www.pt-control.fit',                //  Variante com www, por segurança
  'http://localhost:5173',                    // Ambiente de desenvolvimento local do Vite
  process.env.FRONTEND_URL                    // Fallback para qualquer variável definida no Railway
].filter(Boolean); // Remove valores nulos ou indefinidos

app.use(cors({
  origin: function (origin, callback) {
    // Permite pedidos sem origem (ex: Postman, ferramentas de monitorização ou chamadas internas)
    if (!origin) return callback(null, true);
    
    // Verifica se a origem está na lista de permitidos OU se termina em .vercel.app
    if (allowedOrigins.indexOf(origin) !== -1 || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Bloqueado pela política CORS do PT Control'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de pedidos por IP
  message: {
    error: 'Bloqueio por excesso de tráfego',
    message: 'Demasiados pedidos vindos deste IP. Por favor, tente novamente após 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. Permitir que o Express interprete corpos de mensagem em JSON (Obrigatório)
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- 4. REGISTO OFICIAL DAS ROTAS DA API ---
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

// Rota de Teste de Diagnóstico
app.get('/api/status', (req, res) => {
    res.json({
        status: "online",
        message: "O servidor do PT está a funcionar corretamente e totalmente protegido!"
    });
});

// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend a correr na porta http://localhost:${PORT}`);
});