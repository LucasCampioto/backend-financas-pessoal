const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  type: { type: String, required: true, enum: ['comprovado', 'nao_comprovado'] },
  recurring: { type: Boolean, default: false },
  recurrenceEndMonth: { type: String, default: null },
});

function toRevenueDoc(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(d._id),
    description: d.description,
    amount: d.amount,
    date: d.date,
    type: d.type,
    recurring: d.recurring ?? false,
    recurrenceEndMonth: d.recurrenceEndMonth ?? null,
  };
}

const Revenue = mongoose.models.Revenue || mongoose.model('Revenue', revenueSchema);

async function createRevenue(userId, data) {
  const rev = new Revenue({ userId, ...data });
  await rev.save();
  return toRevenueDoc(rev);
}

async function findAllByUserId(userId) {
  const list = await Revenue.find({ userId }).lean();
  return list.map((d) => ({
    id: String(d._id),
    description: d.description,
    amount: d.amount,
    date: d.date,
    type: d.type,
    recurring: d.recurring ?? false,
    recurrenceEndMonth: d.recurrenceEndMonth ?? null,
  }));
}

async function findByIdAndUserId(id, userId) {
  const doc = await Revenue.findOne({ _id: id, userId }).lean();
  return doc
    ? {
        id: String(doc._id),
        description: doc.description,
        amount: doc.amount,
        date: doc.date,
        type: doc.type,
        recurring: doc.recurring ?? false,
        recurrenceEndMonth: doc.recurrenceEndMonth ?? null,
      }
    : null;
}

async function deleteByIdAndUserId(id, userId) {
  const result = await Revenue.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}

async function updateByIdAndUserId(id, userId, data) {
  const doc = await Revenue.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true }
  ).lean();
  return doc
    ? {
        id: String(doc._id),
        description: doc.description,
        amount: doc.amount,
        date: doc.date,
        type: doc.type,
        recurring: doc.recurring ?? false,
        recurrenceEndMonth: doc.recurrenceEndMonth ?? null,
      }
    : null;
}

module.exports = {
  Revenue,
  createRevenue,
  findAllByUserId,
  findByIdAndUserId,
  deleteByIdAndUserId,
  updateByIdAndUserId,
};
