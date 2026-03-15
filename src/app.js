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
  if (process.env.NODE_ENV === 'production') {
    const list = allowed ? allowed.split(',').map((s) => s.trim()) : [];
    if (origin && list.includes(origin)) return callback(null, origin);
    if (!origin) return callback(null, list[0] || true);
    return callback(null, false);
  }
  // Desenvolvimento: permite localhost e 127.0.0.1 em qualquer porta
  if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
  if (allowed) {
    const list = allowed.split(',').map((s) => s.trim());
    if (list.includes(origin)) return callback(null, true);
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
