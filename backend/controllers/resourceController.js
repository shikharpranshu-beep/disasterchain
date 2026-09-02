const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all emergency resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    const { type } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (type) query.type = type;
      const resources = await Resource.find(query).sort({ type: 1 });
      return res.json({ success: true, count: resources.length, data: resources });
    }

    let resources = memoryStore.resources;
    if (type) resources = resources.filter((r) => r.type === type);

    return res.json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    return res.json({ success: true, count: memoryStore.resources.length, data: memoryStore.resources });
  }
};

// @desc    Create resource
exports.createResource = async (req, res) => {
  try {
    const resourceData = {
      ...req.body,
      status: req.body.status || 'Operational',
      latitude: Number(req.body.latitude) || 28.6139,
      longitude: Number(req.body.longitude) || 77.2090,
    };
    if (isDbConnected()) {
      const resource = await Resource.create(resourceData);
      return res.status(201).json({ success: true, data: resource });
    }
    const memoryRes = { _id: `res-${Date.now()}`, ...resourceData };
    memoryStore.resources.unshift(memoryRes);
    return res.status(201).json({ success: true, data: memoryRes });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error' });
  }
};

// @desc    Update resource
exports.updateResource = async (req, res) => {
  try {
    if (isDbConnected()) {
      const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.json({ success: true, data: resource });
    }
    const idx = memoryStore.resources.findIndex((r) => r._id === req.params.id);
    if (idx !== -1) {
      memoryStore.resources[idx] = { ...memoryStore.resources[idx], ...req.body };
      return res.json({ success: true, data: memoryStore.resources[idx] });
    }
    res.status(404).json({ success: false, message: 'Not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

// @desc    Delete resource
exports.deleteResource = async (req, res) => {
  try {
    if (isDbConnected()) {
      await Resource.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Deleted' });
    }
    memoryStore.resources = memoryStore.resources.filter((r) => r._id !== req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};
