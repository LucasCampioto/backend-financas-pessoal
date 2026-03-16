const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // formato YYYY-MM
    paid: { type: Boolean, default: false },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  category: { type: String, default: '' },
  bank: { type: String, default: '' },
  recurring: { type: Boolean, default: false },
  recurrenceEndMonth: { type: String, default: null },
  payments: { type: [paymentSchema], default: [] },
});

function toExpenseDoc(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(d._id),
    description: d.description,
    amount: d.amount,
    date: d.date,
    category: d.category,
    bank: d.bank,
    recurring: d.recurring ?? false,
    recurrenceEndMonth: d.recurrenceEndMonth ?? null,
    payments: (d.payments ?? []).map((p) => ({ month: p.month, paid: p.paid })),
  };
}

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

async function createExpense(userId, data) {
  const exp = new Expense({ userId, ...data });
  await exp.save();
  return toExpenseDoc(exp);
}

async function createMany(userId, items) {
  const docs = items.map((item) => ({ userId, ...item }));
  const created = await Expense.insertMany(docs);
  return created.map(toExpenseDoc);
}

async function findAllByUserId(userId) {
  const list = await Expense.find({ userId }).lean();
  return list.map(toExpenseDoc);
}

async function findByIdAndUserId(id, userId) {
  const doc = await Expense.findOne({ _id: id, userId }).lean();
  return doc ? toExpenseDoc(doc) : null;
}

async function deleteByIdAndUserId(id, userId) {
  const result = await Expense.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}

async function deleteByMonthAndUserId(month, userId) {
  const start = `${month}-01`;
  const end = `${month}-31`;
  await Expense.deleteMany({
    userId,
    date: { $gte: start, $lte: end },
  });
}

const CREDIT_CARD_BANKS = ['Cartão de Crédito', 'Importado'];

async function deleteCreditCardByMonthAndUserId(month, userId) {
  const start = `${month}-01`;
  const end = `${month}-31`;
  await Expense.deleteMany({
    userId,
    bank: { $in: CREDIT_CARD_BANKS },
    date: { $gte: start, $lte: end },
  });
}

async function insertManyForUser(userId, items) {
  const docs = items.map((item) => ({ userId, ...item }));
  const created = await Expense.insertMany(docs);
  return created.map(toExpenseDoc);
}

async function updateByIdAndUserId(id, userId, data) {
  const doc = await Expense.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true }
  ).lean();
  return doc ? toExpenseDoc(doc) : null;
}

// Gera o array completo de payments do mês inicial até recurrenceEndMonth,
// mesclando com os registros já salvos no banco.
function buildPayments(startDate, recurrenceEndMonth, savedPayments) {
  const paymentMap = new Map((savedPayments ?? []).map((p) => [p.month, p.paid]));
  const result = [];

  let [year, month] = startDate.slice(0, 7).split('-').map(Number);
  const [endYear, endMonth] = recurrenceEndMonth.split('-').map(Number);

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    result.push({ month: key, paid: paymentMap.get(key) ?? false });
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }

  return result;
}

async function findRecurringByUserId(userId) {
  const list = await Expense.find({ userId, recurrenceEndMonth: { $ne: null } }).lean();
  return list.map((d) => ({
    ...toExpenseDoc(d),
    payments: buildPayments(d.date, d.recurrenceEndMonth, d.payments),
  }));
}

// Marca ou desmarca um mês como pago. Se a entrada do mês não existir, cria com paid=true.
async function togglePayment(id, userId, month, paid) {
  const expense = await Expense.findOne({ _id: id, userId });
  if (!expense) return null;

  const existing = expense.payments.find((p) => p.month === month);
  if (existing) {
    existing.paid = paid;
  } else {
    expense.payments.push({ month, paid });
  }

  await expense.save();
  return toExpenseDoc(expense);
}

module.exports = {
  Expense,
  createExpense,
  createMany,
  findAllByUserId,
  findByIdAndUserId,
  deleteByIdAndUserId,
  deleteByMonthAndUserId,
  deleteCreditCardByMonthAndUserId,
  insertManyForUser,
  updateByIdAndUserId,
  togglePayment,
  findRecurringByUserId,
};
