const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const membrosRoutes = require('./routes/membros');
const aniversariosRoutes = require('./routes/aniversarios');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP a cada 15 minutos
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static('public'));
app.use(express.static('.'));

// Rotas da API
app.use('/api/membros', membrosRoutes);
app.use('/api/aniversarios', aniversariosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Rotas do frontend - SPA (Single Page Application)
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/cadastrar-membro', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/membros', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/relatorios', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/aniversarios', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor CEPPEMBU rodando na porta ${PORT}`);
  console.log(`📊 Sistema de Gestão de Membros ativo`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});

module.exports = app;
