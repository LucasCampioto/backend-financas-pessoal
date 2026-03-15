const express = require('express');
const { body, validationResult } = require('express-validator');
const { getByUserId, upsertByUserId } = require('../adapters/mongodb/taxConfig');
const { requireAuth } = require('../middleware/auth');
const { badRequest } = require('../lib/errors');

const router = express.Router();

const putValidation = [
  body('percentual').isFloat({ min: 0 }).withMessage('percentual deve ser um número >= 0'),
  body('fixedTaxes').isArray().withMessage('fixedTaxes deve ser um array'),
  body('fixedTaxes.*.id').optional().isString(),
  body('fixedTaxes.*.description').optional().isString(),
  body('fixedTaxes.*.amount').optional().isFloat({ min: 0 }),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return badRequest(res, msg);
  }
  next();
}

router.get('/', requireAuth, async (req, res) => {
  const taxConfig = await getByUserId(req.user._id);
  return res.status(200).json(taxConfig);
});

router.put('/', requireAuth, putValidation, handleValidation, async (req, res) => {
  const { percentual, fixedTaxes } = req.body;
  const taxConfig = await upsertByUserId(req.user._id, {
    percentual: Number(percentual),
    fixedTaxes: Array.isArray(fixedTaxes) ? fixedTaxes : [],
  });
  return res.status(200).json(taxConfig);
});

module.exports = router;
