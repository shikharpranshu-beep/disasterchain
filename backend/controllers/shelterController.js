const mongoose = require('mongoose');
const Shelter = require('../models/Shelter');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all shelters
// @route   GET /api/shelters
// @access  Public
exports.getShelters = async (req, res) => {
  try {
    const { status } = req.query;
    if (isDbConnected()) {
      const query = {};
      if (status) query.status = status;
      const shelters = await Shelter.find(query).sort({ capacity: -1 });
      return res.json({
        success: true,
        count: shelters.length,
        data: shelters,
      });
    }

    let shelters = memoryStore.shelters;
    if (status) shelters = shelters.filter((s) => s.status === status);
    return res.json({
      success: true,
      count: shelters.length,
      data: shelters,
    });
  } catch (error) {
    return res.json({
      success: true,
      count: memoryStore.shelters.length,
      data: memoryStore.shelters,
    });
  }
};

// @desc    Create new shelter (Admin only)
// @route   POST /api/shelters
// @access  Private / Admin
exports.createShelter = async (req, res) => {
  try {
    const { name, address, latitude, longitude, capacity, occupancy, facilities, status, phone } = req.body;

    if (!name || !address || capacity === undefined || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide shelter name, address, capacity, and contact phone',
      });
    }

    const shelterData = {
      _id: `sh-${Date.now()}`,
      name,
      address,
      latitude: latitude || 28.6139,
      longitude: longitude || 77.2090,
      capacity: Number(capacity),
      occupancy: Number(occupancy) || 0,
      facilities: facilities || ['Food', 'Drinking Water', 'Medical Support'],
      status: status || 'Open',
      phone,
    };

    if (isDbConnected()) {
      const shelter = await Shelter.create(shelterData);
      return res.status(201).json({
        success: true,
        message: 'Shelter created successfully',
        data: shelter,
      });
    }

    memoryStore.shelters.unshift(shelterData);
    return res.status(201).json({
      success: true,
      message: 'Shelter created successfully (In-Memory)',
      data: shelterData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error creating shelter' });
  }
};

// @desc    Update shelter (Admin only)
// @route   PUT /api/shelters/:id
// @access  Private / Admin
exports.updateShelter = async (req, res) => {
  try {
    if (isDbConnected()) {
      const shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!shelter) {
        return res.status(404).json({ success: false, message: 'Shelter not found' });
      }

      return res.json({
        success: true,
        message: 'Shelter updated successfully',
        data: shelter,
      });
    }

    const idx = memoryStore.shelters.findIndex((s) => s._id === req.params.id);
    if (idx !== -1) {
      memoryStore.shelters[idx] = { ...memoryStore.shelters[idx], ...req.body };
      return res.json({
        success: true,
        message: 'Shelter updated successfully (In-Memory)',
        data: memoryStore.shelters[idx],
      });
    }

    res.status(404).json({ success: false, message: 'Shelter not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating shelter' });
  }
};

// @desc    Delete shelter (Admin only)
// @route   DELETE /api/shelters/:id
// @access  Private / Admin
exports.deleteShelter = async (req, res) => {
  try {
    if (isDbConnected()) {
      const shelter = await Shelter.findByIdAndDelete(req.params.id);
      if (!shelter) {
        return res.status(404).json({ success: false, message: 'Shelter not found' });
      }
      return res.json({ success: true, message: 'Shelter removed successfully' });
    }

    memoryStore.shelters = memoryStore.shelters.filter((s) => s._id !== req.params.id);
    res.json({ success: true, message: 'Shelter removed successfully (In-Memory)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting shelter' });
  }
};
