require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 1. Importar todos os módulos de rotas criados
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const trainingRoutes = require('./src/routes/trainingRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middlewares Globais de Segurança e Performance
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173', // Porta padrão do React Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

// --- 4. REGISTO OFICIAL DAS ROTAS DA API ---
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/whatsapp', whatsappRoutes);

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