const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const blockchainService = require('../services/blockchainService');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all donations
// @route   GET /api/donations
// @access  Public
exports.getDonations = async (req, res) => {
  try {
    if (isDbConnected()) {
      const donations = await Donation.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: donations.length, data: donations });
    }
    return res.json({ success: true, count: memoryStore.donations.length, data: memoryStore.donations });
  } catch (error) {
    return res.json({ success: true, count: memoryStore.donations.length, data: memoryStore.donations });
  }
};

// @desc    Get donation by ID
exports.getDonationById = async (req, res) => {
  try {
    if (isDbConnected()) {
      const donation = await Donation.findOne({
        $or: [{ donationId: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }],
      });
      if (donation) return res.json({ success: true, data: donation });
    }
    const donation = memoryStore.donations.find(
      (d) => d.donationId === req.params.id || d._id === req.params.id
    );
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    return res.json({ success: true, data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

// @desc    Create new donation & record on blockchain ledger
// @route   POST /api/donations
// @access  Private / Admin
exports.createDonation = async (req, res) => {
  try {
    const { donor, type, resourceName, quantity, unit, destination } = req.body;

    if (!donor || !resourceName || !quantity || !destination) {
      return res.status(400).json({ success: false, message: 'Please provide donor, resource name, quantity, and destination' });
    }

    const donationId = `DON-${Math.floor(1000 + Math.random() * 9000)}`;
    const blockchainTransactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const donationData = {
      donationId,
      donor,
      type: type || 'Medical Supplies',
      resourceName,
      quantity: Number(quantity),
      unit: unit || 'units',
      destination,
      status: 'Verified',
      blockchainTransactionId,
      createdAt: new Date(),
    };

    const block = await blockchainService.recordTransaction({
      transactionId: blockchainTransactionId,
      entityType: 'Donation',
      entityId: donationId,
      donorOrSource: donor,
      destination,
      resourceName,
      quantity: Number(quantity),
      unit: unit || 'units',
      status: 'Verified',
    });

    if (isDbConnected()) {
      const donation = await Donation.create(donationData);
      return res.status(201).json({ success: true, message: 'Donation logged & blockchain block minted', data: donation, blockchain: block });
    }

    const memoryDonation = { _id: `don-${Date.now()}`, ...donationData };
    memoryStore.donations.unshift(memoryDonation);
    memoryStore.blockchainRecords.unshift(block);

    return res.status(201).json({ success: true, message: 'Donation logged & blockchain block minted (In-Memory)', data: memoryDonation, blockchain: block });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating donation' });
  }
};
