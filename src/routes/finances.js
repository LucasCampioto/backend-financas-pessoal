const express = require('express');
const { getFinanceData } = require('../services/finances');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const data = await getFinanceData(req.user._id);
  return res.status(200).json(data);
});

module.exports = router;
