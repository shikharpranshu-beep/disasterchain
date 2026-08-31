const mongoose = require('mongoose');
const BlockchainRecord = require('../models/BlockchainRecord');
const blockchainService = require('../services/blockchainService');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all blockchain transaction records
// @route   GET /api/blockchain/transactions
// @access  Public
exports.getBlockchainTransactions = async (req, res) => {
  try {
    const { entityType, search } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (entityType) query.entityType = entityType;
      if (search) {
        query.$or = [
          { transactionId: { $regex: search, $options: 'i' } },
          { blockHash: { $regex: search, $options: 'i' } },
          { resourceName: { $regex: search, $options: 'i' } },
          { donorOrSource: { $regex: search, $options: 'i' } },
          { destination: { $regex: search, $options: 'i' } },
        ];
      }

      const records = await BlockchainRecord.find(query).sort({ blockNumber: -1 });
      return res.json({
        success: true,
        count: records.length,
        data: records,
      });
    }

    let records = memoryStore.blockchainRecords;
    if (entityType) records = records.filter((r) => r.entityType === entityType);
    if (search) {
      const s = search.toLowerCase();
      records = records.filter(
        (r) =>
          r.transactionId?.toLowerCase().includes(s) ||
          r.blockHash?.toLowerCase().includes(s) ||
          r.resourceName?.toLowerCase().includes(s)
      );
    }

    return res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.json({
      success: true,
      count: memoryStore.blockchainRecords.length,
      data: memoryStore.blockchainRecords,
    });
  }
};

// @desc    Get single blockchain transaction by transactionId
// @route   GET /api/blockchain/transactions/:id
// @access  Public
exports.getBlockchainTransactionById = async (req, res) => {
  try {
    const query = {
      $or: [{ transactionId: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }],
    };

    if (isDbConnected()) {
      const record = await BlockchainRecord.findOne(query);
      if (record) {
        return res.json({ success: true, data: record });
      }
    }

    const record = memoryStore.blockchainRecords.find(
      (r) => r.transactionId === req.params.id || r._id === req.params.id
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Blockchain transaction record not found' });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching blockchain record' });
  }
};

// @desc    Record manual transaction to blockchain
// @route   POST /api/blockchain/record
// @access  Private / Admin
exports.recordManualTransaction = async (req, res) => {
  try {
    const block = await blockchainService.recordTransaction(req.body);
    if (!isDbConnected()) {
      memoryStore.blockchainRecords.unshift(block);
    }
    return res.status(201).json({ success: true, message: 'Block minted on blockchain ledger', data: block });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error recording block' });
  }
};
