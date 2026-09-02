const mongoose = require('mongoose');

const sosRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    default: () => `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  name: {
    type: String,
    required: [true, 'Please provide name of person needing assistance'],
    trim: true,
  },
  emergencyType: {
    type: String,
    required: true,
    enum: [
      'Medical Emergency',
      'Fire',
      'Flood',
      'Building Damage',
      'Trapped Person',
      'Missing Person',
      'Accident',
      'Other',
    ],
  },
  description: {
    type: String,
    required: [true, 'Please describe the emergency situation'],
  },
  location: {
    type: String,
    required: [true, 'Please specify location or coordinates'],
  },
  latitude: {
    type: Number,
    default: 28.6139,
  },
  longitude: {
    type: Number,
    default: 77.2090,
  },
  peopleAffected: {
    type: Number,
    default: 1,
    min: 1,
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High',
  },
  contact: {
    type: String,
    required: [true, 'Please provide a contact phone number or radio freq'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Cancelled'],
    default: 'Pending',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

module.exports = mongoose.model('SosRequest', sosRequestSchema);
