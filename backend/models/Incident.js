const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true,
    default: () => `INC-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  title: {
    type: String,
    required: [true, 'Please add incident title'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Please specify hazard/disaster type'],
    enum: [
      'Blocked emergency exit',
      'Fire hazard',
      'Flooding',
      'Damaged building',
      'Damaged electrical equipment',
      'Fallen tree',
      'Unsafe construction area',
      'Earthquake Damage',
      'Gas Leak',
      'Other',
    ],
  },
  description: {
    type: String,
    required: [true, 'Please provide detailed description of the incident'],
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  location: {
    type: String,
    required: [true, 'Please provide location of incident'],
  },
  latitude: {
    type: Number,
    default: 28.6139,
  },
  longitude: {
    type: Number,
    default: 77.2090,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reporterName: {
    type: String,
    default: 'Anonymous Student',
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Incident', incidentSchema);
