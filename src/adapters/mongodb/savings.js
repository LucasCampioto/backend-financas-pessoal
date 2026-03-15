const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const savingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  interestRate: { type: Number, required: true, default: 0 },
  entries: { type: [entrySchema], default: [] },
});

const Savings = mongoose.models.Savings || mongoose.model('Savings', savingsSchema);

function sortEntries(entries) {
  return [...(entries || [])].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
}

async function getByUserId(userId) {
  const doc = await Savings.findOne({ userId }).lean();
  if (!doc) {
    return { interestRate: 0, entries: [] };
  }
  return {
    interestRate: doc.interestRate ?? 0,
    entries: sortEntries(doc.entries || []),
  };
}

async function upsertByUserId(userId, data) {
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const interestRate = typeof data.interestRate === 'number' ? data.interestRate : (Number(data.interestRate) || 0);
  const doc = await Savings.findOneAndUpdate(
    { userId },
    { interestRate, entries },
    { new: true, upsert: true }
  ).lean();
  return {
    interestRate: doc.interestRate ?? 0,
    entries: sortEntries(doc.entries || []),
  };
}

module.exports = {
  Savings,
  getByUserId,
  upsertByUserId,
};
