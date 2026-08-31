const mongoose = require('mongoose');

const affectedAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add area name'],
    trim: true,
  },
  disasterType: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Critical'],
    default: 'Moderate',
  },
  description: {
    type: String,
    required: true,
  },
  affectedPeople: {
    type: Number,
    default: 0,
  },
  activeSOS: {
    type: Number,
    default: 0,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Controlled', 'Recovering'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AffectedArea', affectedAreaSchema);
