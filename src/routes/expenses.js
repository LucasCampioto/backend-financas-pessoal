const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  createExpense,
  insertManyForUser,
  deleteByIdAndUserId,
  deleteByMonthAndUserId,
  deleteCreditCardByMonthAndUserId,
  findAllByUserId,
  updateByIdAndUserId,
} = require('../adapters/mongodb/expense');
const { getByUserId } = require('../adapters/mongodb/taxConfig');
const { findAllByUserId: findAllRevenuesByUserId } = require('../adapters/mongodb/revenue');
const { requireAuth } = require('../middleware/auth');
const { badRequest, notFound } = require('../lib/errors');

const router = express.Router();

const expenseItemValidation = [
  body('description').trim().notEmpty().withMessage('description é obrigatório'),
  body('amount').isFloat({ min: 0 }).withMessage('amount deve ser um número >= 0'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date deve ser YYYY-MM-DD'),
  body('category').isString(),
  body('bank').isString(),
  body('recurring').optional().isBoolean(),
  body('recurrenceEndMonth').optional().matches(/^\d{4}-\d{2}$/).withMessage('recurrenceEndMonth deve ser YYYY-MM'),
];

const bulkBodyValidation = [
  body().isArray().withMessage('Body deve ser um array de despesas'),
  body('*.description').trim().notEmpty().withMessage('description é obrigatório'),
  body('*.amount').isFloat({ min: 0 }).withMessage('amount deve ser um número >= 0'),
  body('*.date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date deve ser YYYY-MM-DD'),
  body('*.category').isString(),
  body('*.bank').isString(),
  body('*.recurring').optional().isBoolean(),
  body('*.recurrenceEndMonth').optional().matches(/^\d{4}-\d{2}$/).withMessage('recurrenceEndMonth deve ser YYYY-MM'),
];

const replaceCreditCardValidation = [
  body('expenses').isArray().withMessage('expenses deve ser um array'),
  body('expenses.*.description').trim().notEmpty().withMessage('description é obrigatório'),
  body('expenses.*.amount').isFloat({ min: 0 }).withMessage('amount deve ser um número >= 0'),
  body('expenses.*.date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date deve ser YYYY-MM-DD'),
  body('expenses.*.category').isString(),
  body('expenses.*.bank').isString(),
  body('expenses.*.recurring').optional().isBoolean(),
  body('expenses.*.recurrenceEndMonth').optional().matches(/^\d{4}-\d{2}$/).withMessage('recurrenceEndMonth deve ser YYYY-MM'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return badRequest(res, msg);
  }
  next();
}

router.post('/', requireAuth, expenseItemValidation, handleValidation, async (req, res) => {
  const userId = req.user._id;
  const { description, amount, date, category, bank, recurring, recurrenceEndMonth } = req.body;
  const expense = await createExpense(userId, {
    description: description.trim(),
    amount: Number(amount),
    date,
    category: category ?? '',
    bank: bank ?? '',
    recurring: Boolean(recurring),
    recurrenceEndMonth: recurrenceEndMonth || null,
  });
  return res.status(201).json(expense);
});

router.post('/bulk', requireAuth, bulkBodyValidation, handleValidation, async (req, res) => {
  const userId = req.user._id;
  const items = req.body.map((item) => ({
    description: item.description?.trim() ?? '',
    amount: Number(item.amount),
    date: item.date,
    category: item.category ?? '',
    bank: item.bank ?? '',
    recurring: Boolean(item.recurring),
    recurrenceEndMonth: item.recurrenceEndMonth || null,
  }));
  const created = await insertManyForUser(userId, items);
  return res.status(201).json(created);
});

router.put('/:id', requireAuth, expenseItemValidation, handleValidation, async (req, res) => {
  const userId = req.user._id;
  const { description, amount, date, category, bank, recurring, recurrenceEndMonth } = req.body;
  const expense = await updateByIdAndUserId(req.params.id, userId, {
    description: description.trim(),
    amount: Number(amount),
    date,
    category: category ?? '',
    bank: bank ?? '',
    recurring: Boolean(recurring),
    recurrenceEndMonth: recurrenceEndMonth || null,
  });
  if (!expense) return notFound(res, 'Despesa não encontrada');
  return res.status(200).json(expense);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const deleted = await deleteByIdAndUserId(req.params.id, req.user._id);
  if (!deleted) {
    return notFound(res, 'Despesa não encontrada');
  }
  return res.status(204).send();
});

router.delete('/by-month/:month', requireAuth, async (req, res) => {
  const month = req.params.month;
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return badRequest(res, 'month deve ser YYYY-MM');
  }
  await deleteByMonthAndUserId(month, req.user._id);
  return res.status(204).send();
});

router.put('/replace-credit-card/:month', requireAuth, replaceCreditCardValidation, handleValidation, async (req, res) => {
  const month = req.params.month;
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return badRequest(res, 'month deve ser YYYY-MM');
  }
  const userId = req.user._id;
  await deleteCreditCardByMonthAndUserId(month, userId);
  const items = (req.body.expenses || []).map((item) => ({
    description: item.description?.trim() ?? '',
    amount: Number(item.amount),
    date: item.date,
    category: item.category ?? '',
    bank: item.bank ?? '',
    recurring: Boolean(item.recurring),
    recurrenceEndMonth: item.recurrenceEndMonth || null,
  }));
  await (items.length ? insertManyForUser(userId, items) : Promise.resolve());
  const [revenues, expenses, taxConfig] = await Promise.all([
    findAllRevenuesByUserId(userId),
    findAllByUserId(userId),
    getByUserId(userId),
  ]);
  return res.status(200).json({ revenues, expenses, taxConfig });
});

module.exports = router;
