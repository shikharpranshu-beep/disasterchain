const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donationId: {
    type: String,
    required: true,
    unique: true,
    default: () => `DON-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  donor: {
    type: String,
    required: [true, 'Please add donor name or organization'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Food',
      'Water',
      'Medical Supplies',
      'Blankets',
      'Clothes',
      'Emergency Kits',
      'Money',
      'Other',
    ],
  },
  resourceName: {
    type: String,
    required: [true, 'Please specify resource details (e.g., 500 First Aid Kits)'],
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    default: 'units',
  },
  destination: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'Registered',
      'Verified',
      'Received',
      'Partially Distributed',
      'Fully Distributed',
    ],
    default: 'Registered',
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

module.exports = mongoose.model('Donation', donationSchema);
