const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  category: { type: String, default: '' },
  bank: { type: String, default: '' },
  recurring: { type: Boolean, default: false },
  recurrenceEndMonth: { type: String, default: null },
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
  return list.map((d) => ({
    id: String(d._id),
    description: d.description,
    amount: d.amount,
    date: d.date,
    category: d.category,
    bank: d.bank,
    recurring: d.recurring ?? false,
    recurrenceEndMonth: d.recurrenceEndMonth ?? null,
  }));
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
};
