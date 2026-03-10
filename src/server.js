const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const userRoutes = require('./domains/user/routes/user.routes');
const authRoutes = require('./domains/auth/routes/auth.routes');
const auditRoutes = require('./domains/audit/routes/audit.routes');
const departmentEventRoutes = require('./domains/media/routes/department-event.routes');
const v1Routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const sequelize = require('./config/database');
const { syncUserModel, ensureDefaultUsers } = require('./domains/user/models/user.model');
const { syncDepartmentEventModel } = require('./domains/media/models/department-event.model');
const { syncAuditLogModel } = require('./middleware/audit');
const { syncModels } = require('./models');
const {
  strictLimiter,
  sanitizeInputs,
  attachRequestId,
  enforceCsrfForStateChange,
  setCsrfCookie,
} = require('./middleware/security');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(attachRequestId);
app.use(helmet({
  frameguard: { action: 'deny' },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(setCsrfCookie);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // limite de 300 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});
app.use('/api/', limiter);
app.use('/api/', strictLimiter);

// Middlewares de parsing
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));
app.use(sanitizeInputs);
app.use(enforceCsrfForStateChange);
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Rotas de exemplo
app.get('/', (req, res) => {
  res.json({
    message: 'API Assembleia de Deus Lagoa Nova',
    version: '1.0.0',
    status: 'online',
  });
});

// Rotas da API (a serem implementadas)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', departmentEventRoutes);
app.use('/api/v1', v1Routes);
// app.use('/api/auth', authRoutes);
// app.use('/api/departamentos', departamentosRoutes);
// app.use('/api/pedidos-oracao', pedidosOracaoRoutes);
// app.use('/api/aniversariantes', aniversariantesRoutes);
// app.use('/api/eventos', eventosRoutes);
// app.use('/api/galeria', galeriaRoutes);

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Middleware de erro 404
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1')) {
    return next();
  }

  return res.status(404).json({
    error: 'Rota não encontrada',
    requestId: req.requestId,
  });
});

app.use(notFound);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  if (req.path.startsWith('/api/v1')) {
    return next(err);
  }

  console.error('Erro:', req.requestId, err.message);
  
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await syncUserModel();
    await syncDepartmentEventModel();
    await syncAuditLogModel();
    await syncModels();
    await ensureDefaultUsers();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Falha ao inicializar o backend:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
