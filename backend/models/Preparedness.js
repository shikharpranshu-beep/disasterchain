const mongoose = require('mongoose');

const preparednessSchema = new mongoose.Schema({
  disasterType: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'Earthquake',
      'Flood',
      'Fire',
      'Cyclone',
      'Landslide',
      'Thunderstorm',
      'Heatwave',
      'Building Emergency',
      'Other',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '⚠️',
  },
  before: {
    type: [String],
    default: [],
  },
  during: {
    type: [String],
    default: [],
  },
  after: {
    type: [String],
    default: [],
  },
  dos: {
    type: [String],
    default: [],
  },
  donts: {
    type: [String],
    default: [],
  },
  emergencyKit: [
    {
      item: { type: String, required: true },
      description: { type: String, default: '' },
      essential: { type: Boolean, default: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Preparedness', preparednessSchema);
