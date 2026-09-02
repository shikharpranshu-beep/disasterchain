const mongoose = require('mongoose');
const Distribution = require('../models/Distribution');
const blockchainService = require('../services/blockchainService');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all distributions
// @route   GET /api/distributions
// @access  Public
exports.getDistributions = async (req, res) => {
  try {
    if (isDbConnected()) {
      const distributions = await Distribution.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: distributions.length, data: distributions });
    }
    return res.json({ success: true, count: memoryStore.distributions.length, data: memoryStore.distributions });
  } catch (error) {
    return res.json({ success: true, count: memoryStore.distributions.length, data: memoryStore.distributions });
  }
};

// @desc    Create new distribution & record on blockchain ledger
// @route   POST /api/distributions
// @access  Private / Admin
exports.createDistribution = async (req, res) => {
  try {
    const { resourceName, quantity, unit, source, destination, responsibleOrganization } = req.body;

    if (!resourceName || !quantity || !source || !destination) {
      return res.status(400).json({ success: false, message: 'Please provide resource name, quantity, source, and destination' });
    }

    const distributionId = `DIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const blockchainTransactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const distData = {
      distributionId,
      resourceName,
      quantity: Number(quantity),
      unit: unit || 'units',
      source,
      destination,
      responsibleOrganization: responsibleOrganization || 'Relief Team',
      status: 'In Transit',
      blockchainTransactionId,
      createdAt: new Date(),
    };

    const block = await blockchainService.recordTransaction({
      transactionId: blockchainTransactionId,
      entityType: 'Distribution',
      entityId: distributionId,
      donorOrSource: source,
      destination,
      resourceName,
      quantity: Number(quantity),
      unit: unit || 'units',
      status: 'In Transit',
    });

    if (isDbConnected()) {
      const dist = await Distribution.create(distData);
      return res.status(201).json({ success: true, message: 'Distribution logged & blockchain block minted', data: dist, blockchain: block });
    }

    const memoryDist = { _id: `dis-${Date.now()}`, ...distData };
    memoryStore.distributions.unshift(memoryDist);
    memoryStore.blockchainRecords.unshift(block);

    return res.status(201).json({ success: true, message: 'Distribution logged & blockchain block minted (In-Memory)', data: memoryDist, blockchain: block });
  } catch (error) {
    console.error('Create distribution error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error logging distribution' });
  }
};
