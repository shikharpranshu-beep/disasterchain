const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add shelter name'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Please add shelter address'],
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify total capacity'],
  },
  occupancy: {
    type: Number,
    default: 0,
  },
  facilities: {
    type: [String],
    default: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Toilets'],
  },
  status: {
    type: String,
    enum: ['Open', 'Full', 'Temporarily Closed'],
    default: 'Open',
  },
  phone: {
    type: String,
    required: [true, 'Please add shelter contact number'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field for available capacity
shelterSchema.virtual('availableCapacity').get(function () {
  return Math.max(0, this.capacity - this.occupancy);
});

shelterSchema.set('toJSON', { virtuals: true });
shelterSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shelter', shelterSchema);
