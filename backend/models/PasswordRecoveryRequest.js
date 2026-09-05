const mongoose = require('mongoose');

const passwordRecoveryRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'expired'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  resetTokenHash: {
    type: String,
    default: null,
    select: false, // Ensure token hash is never returned in ordinary queries
  },
  resetTokenExpiresAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
    trim: true,
    maxlength: 300,
  },
});

// Compound indexes for rapid lookup
passwordRecoveryRequestSchema.index({ email: 1, status: 1 });
passwordRecoveryRequestSchema.index({ resetTokenHash: 1 });
passwordRecoveryRequestSchema.index({ requestedAt: -1 });

module.exports =
  mongoose.models.PasswordRecoveryRequest ||
  mongoose.model('PasswordRecoveryRequest', passwordRecoveryRequestSchema);
