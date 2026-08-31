const express = require('express');
const router = express.Router();
const {
  getBlockchainTransactions,
  getBlockchainTransactionById,
  recordManualTransaction,
} = require('../controllers/blockchainController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/transactions')
  .get(getBlockchainTransactions);

router.route('/transactions/:id')
  .get(getBlockchainTransactionById);

router.route('/record')
  .post(protect, authorizeAdmin, recordManualTransaction);

module.exports = router;
