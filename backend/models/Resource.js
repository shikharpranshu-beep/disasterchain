const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add resource name'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Hospital',
      'Fire Station',
      'Police Station',
      'Emergency Shelter',
      'Disaster Management Office',
      'Relief Center',
      'Food Distribution Center',
      'Medical Center',
      'Other',
    ],
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
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
    enum: ['Available', 'Limited', 'Full', 'Operational', 'Standby'],
    default: 'Operational',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Resource', resourceSchema);
