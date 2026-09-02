const express = require('express');
const router = express.Router();
const {
  getDistributions,
  createDistribution,
} = require('../controllers/distributionController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getDistributions)
  .post(protect, authorize('admin', 'ngo', 'responder', 'volunteer'), createDistribution);

module.exports = router;
