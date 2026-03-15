const express = require('express');
const { body, validationResult } = require('express-validator');
const { createRevenue, findByIdAndUserId, deleteByIdAndUserId, updateByIdAndUserId } = require('../adapters/mongodb/revenue');
const { requireAuth } = require('../middleware/auth');
const { badRequest, notFound } = require('../lib/errors');

const router = express.Router();

const postValidation = [
  body('description').trim().notEmpty().withMessage('description é obrigatório'),
  body('amount').isFloat({ min: 0 }).withMessage('amount deve ser um número >= 0'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date deve ser YYYY-MM-DD'),
  body('type').isIn(['comprovado', 'nao_comprovado']).withMessage('type deve ser comprovado ou nao_comprovado'),
  body('recurring').optional().isBoolean(),
  body('recurrenceEndMonth').optional().matches(/^\d{4}-\d{2}$/).withMessage('recurrenceEndMonth deve ser YYYY-MM'),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return badRequest(res, msg);
  }
  next();
}

router.post('/', requireAuth, postValidation, handleValidation, async (req, res) => {
  const userId = req.user._id;
  const { description, amount, date, type, recurring, recurrenceEndMonth } = req.body;
  const revenue = await createRevenue(userId, {
    description: description.trim(),
    amount: Number(amount),
    date,
    type,
    recurring: Boolean(recurring),
    recurrenceEndMonth: recurrenceEndMonth || null,
  });
  return res.status(201).json(revenue);
});

router.put('/:id', requireAuth, postValidation, handleValidation, async (req, res) => {
  const userId = req.user._id;
  const { description, amount, date, type, recurring, recurrenceEndMonth } = req.body;
  const revenue = await updateByIdAndUserId(req.params.id, userId, {
    description: description.trim(),
    amount: Number(amount),
    date,
    type,
    recurring: Boolean(recurring),
    recurrenceEndMonth: recurrenceEndMonth || null,
  });
  if (!revenue) return notFound(res, 'Receita não encontrada');
  return res.status(200).json(revenue);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const deleted = await deleteByIdAndUserId(req.params.id, req.user._id);
  if (!deleted) {
    return notFound(res, 'Receita não encontrada');
  }
  return res.status(204).send();
});

module.exports = router;
