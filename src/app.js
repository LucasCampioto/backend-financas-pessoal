const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const financesRoutes = require('./routes/finances');
const revenuesRoutes = require('./routes/revenues');
const expensesRoutes = require('./routes/expenses');
const taxConfigRoutes = require('./routes/taxConfig');
const savingsRoutes = require('./routes/savings');
const dashboardRoutes = require('./routes/dashboard');
const { serverError } = require('./lib/errors');

const app = express();

// CORS: com credentials (cookie), a origem deve bater exatamente.
// Em desenvolvimento aceita localhost/127.0.0.1 em qualquer porta; em produção usa FRONTEND_ORIGIN.
function corsOrigin(origin, callback) {
  const allowed = process.env.FRONTEND_ORIGIN;
  const list = allowed ? allowed.split(',').map((s) => s.trim()) : [];

  // Sem origem (ex: Postman, mobile, server-to-server): sempre permite
  if (!origin) return callback(null, true);

  // Se FRONTEND_ORIGIN estiver definida, verifica se a origem está na lista
  if (list.length > 0) {
    if (list.includes(origin)) return callback(null, origin);
    return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  }

  // FRONTEND_ORIGIN não definida: em dev permite localhost; em prod permite tudo (temporário)
  if (process.env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
  }

  return callback(null, true);
}

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/finances', financesRoutes);
app.use('/api/revenues', revenuesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/tax-config', taxConfigRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  serverError(res, err.message || 'Erro interno do servidor');
});

module.exports = app;
