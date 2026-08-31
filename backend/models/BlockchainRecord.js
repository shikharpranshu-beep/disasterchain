const mongoose = require('mongoose');

const blockchainRecordSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  entityType: {
    type: String,
    enum: ['Donation', 'Distribution', 'ShelterAllocation', 'EmergencySupply'],
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  donorOrSource: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  resourceName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'units',
  },
  status: {
    type: String,
    required: true,
  },
  blockNumber: {
    type: Number,
    required: true,
  },
  blockHash: {
    type: String,
    required: true,
  },
  previousBlockHash: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  verificationNote: {
    type: String,
    default: 'Tamper-evident prototype blockchain verification record.',
  },
});

module.exports = mongoose.model('BlockchainRecord', blockchainRecordSchema);
