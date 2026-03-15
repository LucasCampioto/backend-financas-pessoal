const express = require('express');
const { getDashboardData } = require('../services/dashboard');
const { requireAuth } = require('../middleware/auth');
const { badRequest } = require('../lib/errors');

const router = express.Router();

function getMonthFromRequest(req) {
  const month = req.query.month;
  if (month) return month;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

router.get('/', requireAuth, async (req, res) => {
  const month = getMonthFromRequest(req);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return badRequest(res, 'month deve ser YYYY-MM');
  }
  const data = await getDashboardData(req.user._id, month);
  return res.status(200).json(data);
});

module.exports = router;
