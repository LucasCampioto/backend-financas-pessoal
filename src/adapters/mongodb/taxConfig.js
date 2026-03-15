const mongoose = require('mongoose');

const fixedTaxSchema = new mongoose.Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const taxConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  percentual: { type: Number, required: true, default: 0 },
  fixedTaxes: { type: [fixedTaxSchema], default: [] },
});

function toTaxConfigDoc(doc) {
  if (!doc) return { percentual: 0, fixedTaxes: [] };
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    percentual: d.percentual ?? 0,
    fixedTaxes: (d.fixedTaxes || []).map((ft) => ({
      id: ft.id,
      description: ft.description,
      amount: ft.amount,
    })),
  };
}

const TaxConfig = mongoose.models.TaxConfig || mongoose.model('TaxConfig', taxConfigSchema);

async function getByUserId(userId) {
  const doc = await TaxConfig.findOne({ userId }).lean();
  return toTaxConfigDoc(doc);
}

async function upsertByUserId(userId, data) {
  const doc = await TaxConfig.findOneAndUpdate(
    { userId },
    { percentual: data.percentual, fixedTaxes: data.fixedTaxes || [] },
    { new: true, upsert: true }
  ).lean();
  return toTaxConfigDoc(doc);
}

module.exports = {
  TaxConfig,
  getByUserId,
  upsertByUserId,
};
