const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
  distributionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `DIS-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  resourceName: {
    type: String,
    required: [true, 'Please add distributed resource name'],
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    default: 'kits',
  },
  source: {
    type: String,
    required: [true, 'Please specify resource origin / warehouse'],
  },
  destination: {
    type: String,
    required: [true, 'Please specify destination relief center or shelter'],
  },
  responsibleOrganization: {
    type: String,
    required: [true, 'Please specify responsible volunteer or NGO agency'],
  },
  status: {
    type: String,
    enum: ['Planned', 'In Transit', 'Delivered', 'Distributed'],
    default: 'In Transit',
  },
  blockchainTransactionId: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Distribution', distributionSchema);
