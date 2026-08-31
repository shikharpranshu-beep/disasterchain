const mongoose = require('mongoose');
const SosRequest = require('../models/SosRequest');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all SOS requests
// @route   GET /api/sos
// @access  Public
exports.getSosRequests = async (req, res) => {
  try {
    const { status, severity } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (status) query.status = status;
      if (severity) query.severity = severity;
      const sosRequests = await SosRequest.find(query).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: sosRequests.length,
        data: sosRequests,
      });
    }

    let sosRequests = memoryStore.sosRequests;
    if (status) sosRequests = sosRequests.filter((s) => s.status === status);
    if (severity) sosRequests = sosRequests.filter((s) => s.severity === severity);

    return res.json({
      success: true,
      count: sosRequests.length,
      data: sosRequests,
    });
  } catch (error) {
    return res.json({
      success: true,
      count: memoryStore.sosRequests.length,
      data: memoryStore.sosRequests,
    });
  }
};

// @desc    Get single SOS request by ID
// @route   GET /api/sos/:id
// @access  Public
exports.getSosRequestById = async (req, res) => {
  try {
    if (isDbConnected()) {
      const sos = await SosRequest.findOne({
        $or: [{ requestId: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }],
      });
      if (sos) return res.json({ success: true, data: sos });
    }

    const sos = memoryStore.sosRequests.find(
      (s) => s.requestId === req.params.id || s._id === req.params.id
    );

    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS request not found' });
    }

    return res.json({ success: true, data: sos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching SOS request' });
  }
};

// @desc    Create new SOS request
// @route   POST /api/sos
// @access  Public
exports.createSosRequest = async (req, res) => {
  try {
    const { name, emergencyType, description, location, latitude, longitude, peopleAffected, severity, contact } = req.body;

    if (!name || !emergencyType || !description || !location || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, emergency type, description, location, and contact number',
      });
    }

    if (isDbConnected()) {
      const sos = await SosRequest.create({
        name,
        emergencyType,
        description,
        location,
        latitude: latitude || 28.6139,
        longitude: longitude || 77.2090,
        peopleAffected: Number(peopleAffected) || 1,
        severity: severity || 'High',
        contact,
        status: 'Pending',
      });

      return res.status(201).json({
        success: true,
        message: 'Emergency SOS request dispatched and saved to MongoDB Atlas',
        data: sos,
      });
    }

    // In-memory fallback
    const requestId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    const sosData = {
      _id: `sos-${Date.now()}`,
      requestId,
      name,
      emergencyType,
      description,
      location,
      latitude: latitude || 28.6139,
      longitude: longitude || 77.2090,
      peopleAffected: Number(peopleAffected) || 1,
      severity: severity || 'High',
      contact,
      status: 'Pending',
      createdAt: new Date(),
    };

    memoryStore.sosRequests.unshift(sosData);
    return res.status(201).json({
      success: true,
      message: 'Emergency SOS request dispatched successfully (In-Memory)',
      data: sosData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error creating SOS request' });
  }
};

// @desc    Update SOS request status (Admin only)
// @route   PUT /api/sos/:id/status
// @access  Private / Admin
exports.updateSosStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (isDbConnected()) {
      const sos = await SosRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!sos) {
        return res.status(404).json({ success: false, message: 'SOS request not found' });
      }
      return res.json({ success: true, message: `Status updated to ${status}`, data: sos });
    }

    const idx = memoryStore.sosRequests.findIndex((s) => s._id === req.params.id);
    if (idx !== -1) {
      memoryStore.sosRequests[idx].status = status;
      return res.json({
        success: true,
        message: `Status updated to ${status} (In-Memory)`,
        data: memoryStore.sosRequests[idx],
      });
    }

    res.status(404).json({ success: false, message: 'SOS request not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating SOS status' });
  }
};
