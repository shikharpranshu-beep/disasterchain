const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add alert title'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Please add alert message'],
  },
  type: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['Information', 'Warning', 'Danger', 'Critical'],
    default: 'Warning',
  },
  location: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', alertSchema);
