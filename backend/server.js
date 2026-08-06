require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 1. Importar todos os módulos de rotas
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const trainingRoutes = require('./src/routes/trainingRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const weightRoutes = require('./src/routes/weightRoutes');
const exerciseRoutes = require('./src/routes/exerciseRoutes');
const diagnosticsRoutes = require('./src/routes/diagnosticsRoutes');
const assessmentRoutes = require('./src/routes/assessmentRoutes');
const templateRoutes = require('./src/routes/templateRoutes');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes');

//  Middleware de manutenção
const { maintenanceMiddleware } = require('./src/middlewares/maintenanceMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = [
  'https://pt-control.vercel.app',
  'https://pt-control.fit',
  'https://www.pt-control.fit',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Bloqueio por excesso de tráfego', message: 'Demasiados pedidos. Tente novamente após 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

//  Middleware de manutenção — aplicado ANTES de todas as rotas da API
app.use('/api', maintenanceMiddleware);

// 4. Rotas da API
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/templates', templateRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: "online", message: "O servidor do PT está a funcionar corretamente!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend a correr na porta http://localhost:${PORT}`);
});