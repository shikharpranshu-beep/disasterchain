const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all incident reports
// @route   GET /api/incidents
// @access  Public
exports.getIncidents = async (req, res) => {
  try {
    const { status, type } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (status) query.status = status;
      if (type) query.type = type;
      const incidents = await Incident.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: incidents.length, data: incidents });
    }

    let incidents = memoryStore.incidents;
    if (status) incidents = incidents.filter((i) => i.status === status);
    if (type) incidents = incidents.filter((i) => i.type === type);

    return res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    return res.json({ success: true, count: memoryStore.incidents.length, data: memoryStore.incidents });
  }
};

// @desc    Get single incident by ID
exports.getIncidentById = async (req, res) => {
  try {
    if (isDbConnected()) {
      const incident = await Incident.findOne({
        $or: [{ incidentId: req.params.id }, { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }],
      });
      if (incident) return res.json({ success: true, data: incident });
    }
    const incident = memoryStore.incidents.find(
      (i) => i.incidentId === req.params.id || i._id === req.params.id
    );
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    return res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

// @desc    Create incident report
// @route   POST /api/incidents
// @access  Public
exports.createIncident = async (req, res) => {
  try {
    const { title, type, description, location, latitude, longitude, severity } = req.body;

    if (!title || !type || !description || !location) {
      return res.status(400).json({ success: false, message: 'Please provide title, hazard type, description, and location' });
    }

    const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

    const incidentData = {
      _id: `inc-${Date.now()}`,
      incidentId,
      title,
      type,
      description,
      location,
      latitude: latitude || 28.6139,
      longitude: longitude || 77.2090,
      severity: severity || 'Medium',
      reporterName: req.user ? req.user.name : 'Student Reporter',
      status: 'Pending',
      createdAt: new Date(),
    };

    if (isDbConnected()) {
      const incident = await Incident.create(incidentData);
      return res.status(201).json({ success: true, message: 'Hazard incident reported', data: incident });
    }

    memoryStore.incidents.unshift(incidentData);
    return res.status(201).json({ success: true, message: 'Hazard incident reported (In-Memory)', data: incidentData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error reporting incident' });
  }
};

// @desc    Update incident report status (Admin only)
// @route   PUT /api/incidents/:id/status
// @access  Private / Admin
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (isDbConnected()) {
      const incident = await Incident.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }
      return res.json({ success: true, message: `Status updated to ${status}`, data: incident });
    }

    const idx = memoryStore.incidents.findIndex((i) => i._id === req.params.id);
    if (idx !== -1) {
      memoryStore.incidents[idx].status = status;
      return res.json({ success: true, message: `Status updated to ${status} (In-Memory)`, data: memoryStore.incidents[idx] });
    }

    res.status(404).json({ success: false, message: 'Incident not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating incident status' });
  }
};

// @desc    Delete incident (Admin only)
exports.deleteIncident = async (req, res) => {
  try {
    if (isDbConnected()) {
      await Incident.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Incident deleted' });
    }
    memoryStore.incidents = memoryStore.incidents.filter((i) => i._id !== req.params.id);
    res.json({ success: true, message: 'Incident deleted (In-Memory)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};
