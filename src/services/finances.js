const revenueAdapter = require('../adapters/mongodb/revenue');
const expenseAdapter = require('../adapters/mongodb/expense');
const taxConfigAdapter = require('../adapters/mongodb/taxConfig');

/**
 * Retorna o agregado FinanceData (revenues, expenses, taxConfig) do usuário.
 */
async function getFinanceData(userId) {
  const [revenues, expenses, taxConfig] = await Promise.all([
    revenueAdapter.findAllByUserId(userId),
    expenseAdapter.findAllByUserId(userId),
    taxConfigAdapter.getByUserId(userId),
  ]);
  return { revenues, expenses, taxConfig };
}

module.exports = { getFinanceData };
