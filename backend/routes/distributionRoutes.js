const express = require('express');
const router = express.Router();
const {
  getDistributions,
  createDistribution,
} = require('../controllers/distributionController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getDistributions)
  .post(protect, authorizeAdmin, createDistribution);

module.exports = router;
