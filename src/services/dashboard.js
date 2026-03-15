const revenueAdapter = require('../adapters/mongodb/revenue');
const expenseAdapter = require('../adapters/mongodb/expense');
const taxConfigAdapter = require('../adapters/mongodb/taxConfig');

const CREDIT_CARD_BANKS = ['Cartão de Crédito', 'Importado'];

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  const idx = m - 1;
  return `${MONTH_LABELS[idx] || month} ${y}`;
}

function appliesToMonth(item, month) {
  const firstMonth = item.date ? item.date.slice(0, 7) : null;
  if (!firstMonth || firstMonth.length !== 7) return false;
  if (!item.recurring) return firstMonth === month;
  if (month < firstMonth) return false;
  if (!item.recurrenceEndMonth) return true;
  return month <= item.recurrenceEndMonth;
}

async function getDashboardData(userId, month) {
  const [revenues, expenses, taxConfig] = await Promise.all([
    revenueAdapter.findAllByUserId(userId),
    expenseAdapter.findAllByUserId(userId),
    taxConfigAdapter.getByUserId(userId),
  ]);

  const revenuesInMonth = revenues.filter((r) => appliesToMonth(r, month));
  const expensesInMonth = expenses.filter((e) => appliesToMonth(e, month));

  const totalRevenue = revenuesInMonth.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expensesInMonth.reduce((s, e) => s + e.amount, 0);
  const totalCreditCard = expensesInMonth
    .filter((e) => CREDIT_CARD_BANKS.includes(e.bank))
    .reduce((s, e) => s + e.amount, 0);
  const totalRevenueComprovado = revenuesInMonth
    .filter((r) => r.type === 'comprovado')
    .reduce((s, r) => s + r.amount, 0);

  const percentual = taxConfig.percentual ?? 0;
  const fixedSum = (taxConfig.fixedTaxes || []).reduce((s, ft) => s + (ft.amount || 0), 0);
  const totalTax = (totalRevenueComprovado * percentual) / 100 + fixedSum;

  const netProfit = totalRevenue - totalExpenses - totalTax;

  return {
    month,
    label: monthLabel(month),
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalCreditCard: Math.round(totalCreditCard * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
  };
}

module.exports = { getDashboardData };
