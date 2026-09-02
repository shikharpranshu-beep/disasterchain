const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all active alerts
// @route   GET /api/alerts
// @access  Public
exports.getAlerts = async (req, res) => {
  try {
    const { activeOnly, severity } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (activeOnly !== 'false') query.active = true;
      if (severity) query.severity = severity;
      const alerts = await Alert.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: alerts.length, data: alerts });
    }

    let alerts = memoryStore.alerts;
    if (activeOnly !== 'false') alerts = alerts.filter((a) => a.active);
    if (severity) alerts = alerts.filter((a) => a.severity === severity);

    return res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    return res.json({ success: true, count: memoryStore.alerts.length, data: memoryStore.alerts });
  }
};

// @desc    Broadcast new alert (Admin only)
// @route   POST /api/alerts
// @access  Private / Admin
exports.createAlert = async (req, res) => {
  try {
    const { title, message, type, severity, location } = req.body;

    if (!title || !message || !location) {
      return res.status(400).json({ success: false, message: 'Please provide title, message, and location' });
    }

    const alertData = {
      title,
      message,
      type: type || 'General',
      severity: severity || 'Warning',
      location,
      active: true,
      createdAt: new Date(),
    };

    if (isDbConnected()) {
      const alert = await Alert.create(alertData);
      return res.status(201).json({ success: true, message: 'Emergency alert broadcasted', data: alert });
    }

    const memoryAlert = { _id: `alt-${Date.now()}`, ...alertData };
    memoryStore.alerts.unshift(memoryAlert);
    return res.status(201).json({ success: true, message: 'Emergency alert broadcasted (In-Memory)', data: memoryAlert });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating alert' });
  }
};

// @desc    Update alert (Admin only)
// @route   PUT /api/alerts/:id
// @access  Private / Admin
exports.updateAlert = async (req, res) => {
  try {
    if (isDbConnected()) {
      const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
      return res.json({ success: true, message: 'Updated', data: alert });
    }
    const idx = memoryStore.alerts.findIndex((a) => a._id === req.params.id);
    if (idx !== -1) {
      memoryStore.alerts[idx] = { ...memoryStore.alerts[idx], ...req.body };
      return res.json({ success: true, message: 'Updated (In-Memory)', data: memoryStore.alerts[idx] });
    }
    res.status(404).json({ success: false, message: 'Not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

// @desc    Delete alert (Admin only)
// @route   DELETE /api/alerts/:id
// @access  Private / Admin
exports.deleteAlert = async (req, res) => {
  try {
    if (isDbConnected()) {
      const alert = await Alert.findByIdAndDelete(req.params.id);
      if (!alert) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, message: 'Deleted' });
    }
    memoryStore.alerts = memoryStore.alerts.filter((a) => a._id !== req.params.id);
    res.json({ success: true, message: 'Deleted (In-Memory)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};
