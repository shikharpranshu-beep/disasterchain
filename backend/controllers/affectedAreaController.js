const mongoose = require('mongoose');
const AffectedArea = require('../models/AffectedArea');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all affected areas
// @route   GET /api/affected-areas
// @access  Public
exports.getAffectedAreas = async (req, res) => {
  try {
    const { severity } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (severity) query.severity = severity;
      const areas = await AffectedArea.find(query).sort({ severity: 1 });
      return res.json({
        success: true,
        count: areas.length,
        data: areas,
      });
    }

    let areas = memoryStore.affectedAreas;
    if (severity) areas = areas.filter((a) => a.severity === severity);

    return res.json({
      success: true,
      count: areas.length,
      data: areas,
    });
  } catch (error) {
    return res.json({
      success: true,
      count: memoryStore.affectedAreas.length,
      data: memoryStore.affectedAreas,
    });
  }
};

// @desc    Create new affected area (Admin only)
// @route   POST /api/affected-areas
// @access  Private / Admin
exports.createAffectedArea = async (req, res) => {
  try {
    const { name, disasterType, severity, description, affectedPeople, activeSOS, latitude, longitude, status } = req.body;

    if (!name || !disasterType || !severity) {
      return res.status(400).json({ success: false, message: 'Please provide name, disaster type, and severity' });
    }

    const areaData = {
      name,
      disasterType,
      severity,
      description: description || '',
      affectedPeople: Number(affectedPeople) || 0,
      activeSOS: Number(activeSOS) || 0,
      latitude: Number(latitude) || 28.6139,
      longitude: Number(longitude) || 77.2090,
      status: status || 'Active',
    };

    if (isDbConnected()) {
      const area = await AffectedArea.create(areaData);
      return res.status(201).json({ success: true, message: 'Affected area created', data: area });
    }

    const memoryArea = { _id: `area-${Date.now()}`, ...areaData };
    memoryStore.affectedAreas.unshift(memoryArea);
    return res.status(201).json({ success: true, message: 'Affected area created (In-Memory)', data: memoryArea });
  } catch (error) {
    console.error('Create affected area error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating affected area' });
  }
};

// @desc    Update affected area (Admin only)
// @route   PUT /api/affected-areas/:id
// @access  Private / Admin
exports.updateAffectedArea = async (req, res) => {
  try {
    if (isDbConnected()) {
      const area = await AffectedArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!area) return res.status(404).json({ success: false, message: 'Affected area not found' });
      return res.json({ success: true, message: 'Updated', data: area });
    }
    const idx = memoryStore.affectedAreas.findIndex((a) => a._id === req.params.id);
    if (idx !== -1) {
      memoryStore.affectedAreas[idx] = { ...memoryStore.affectedAreas[idx], ...req.body };
      return res.json({ success: true, message: 'Updated (In-Memory)', data: memoryStore.affectedAreas[idx] });
    }
    res.status(404).json({ success: false, message: 'Not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

// @desc    Delete affected area (Admin only)
// @route   DELETE /api/affected-areas/:id
// @access  Private / Admin
exports.deleteAffectedArea = async (req, res) => {
  try {
    if (isDbConnected()) {
      const area = await AffectedArea.findByIdAndDelete(req.params.id);
      if (!area) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, message: 'Deleted' });
    }
    memoryStore.affectedAreas = memoryStore.affectedAreas.filter((a) => a._id !== req.params.id);
    res.json({ success: true, message: 'Deleted (In-Memory)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};
