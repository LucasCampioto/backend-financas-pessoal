const express = require('express');
const { body, validationResult } = require('express-validator');
const { getByUserId, upsertByUserId } = require('../adapters/mongodb/savings');
const { requireAuth } = require('../middleware/auth');
const { badRequest } = require('../lib/errors');

const router = express.Router();

const putValidation = [
  body('interestRate').isFloat({ min: 0 }).withMessage('interestRate deve ser um número >= 0'),
  body('entries').isArray().withMessage('entries deve ser um array'),
  body('entries.*.month').matches(/^\d{4}-\d{2}$/).withMessage('cada entry deve ter month no formato YYYY-MM'),
  body('entries.*.amount').isFloat({ min: 0 }).withMessage('cada entry deve ter amount >= 0'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return badRequest(res, msg);
  }
  next();
}

function computeProjection(entries, interestRate) {
  let balance = 0;
  const monthlyRate = (interestRate || 0) / 100 / 12;
  return (entries || []).map((entry) => {
    const interestEarned = balance * monthlyRate;
    balance += (entry.amount || 0) + interestEarned;
    return {
      month: entry.month,
      amount: entry.amount,
      interestRate,
      interestEarned: Math.round(interestEarned * 100) / 100,
      balanceAfter: Math.round(balance * 100) / 100,
    };
  });
}

router.get('/', requireAuth, async (req, res) => {
  const plan = await getByUserId(req.user._id);
  return res.status(200).json(plan);
});

router.put('/', requireAuth, putValidation, handleValidation, async (req, res) => {
  const userId = req.user._id;
  const { interestRate, entries } = req.body;
  const plan = await upsertByUserId(userId, {
    interestRate: Number(interestRate),
    entries: Array.isArray(entries) ? entries.map((e) => ({ month: e.month, amount: Number(e.amount) })) : [],
  });
  return res.status(200).json(plan);
});

router.get('/projection', requireAuth, async (req, res) => {
  const { interestRate, entries } = await getByUserId(req.user._id);
  const projection = computeProjection(entries, interestRate);
  return res.status(200).json({ interestRate, entries, projection });
});

module.exports = router;
