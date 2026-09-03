const mongoose = require('mongoose');
const SosRequest = require('../models/SosRequest');
const Incident = require('../models/Incident');
const Shelter = require('../models/Shelter');
const Resource = require('../models/Resource');
const AffectedArea = require('../models/AffectedArea');
const Alert = require('../models/Alert');
const memoryStore = require('../config/memoryStore');
const {
  evaluateEmergencyPriority,
  sanitizeIntelligenceForRole,
} = require('../services/crisisIntelligenceService');
const {
  recommendBestShelter,
  sanitizeShelterForRole,
} = require('../services/shelterRecommendationService');
const {
  buildRiskHeatmap,
  sanitizeRiskZoneForRole,
} = require('../services/riskHeatmapService');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * @desc    Get active crisis intelligence and prioritized emergency triage feed
 * @route   GET /api/intelligence/active
 * @access  Private (JWT Required, RBAC role tailored)
 */
exports.getActiveCrisisIntelligence = async (req, res) => {
  try {
    const { type = 'all', priorityLevel, minScore, limit = 50 } = req.query;
    const userRole = (req.user && req.user.role) || 'citizen';

    let activeSosList = [];
    let activeIncidents = [];
    let shelters = [];
    let resources = [];
    let alerts = [];

    if (isDbConnected()) {
      // Fetch environmental context concurrently from live MongoDB
      const [dbShelters, dbResources, dbAreas, dbAlerts] = await Promise.all([
        Shelter.find({}).lean(),
        Resource.find({}).lean(),
        AffectedArea.find({}).lean(),
        Alert.find({ status: { $ne: 'Expired' } }).lean(),
      ]);

      shelters = dbShelters;
      resources = dbResources;
      affectedAreas = dbAreas;
      alerts = dbAlerts;

      // Fetch active SOS requests (excluding Resolved and Cancelled)
      if (type === 'all' || type === 'sos') {
        activeSosList = await SosRequest.find({
          status: { $nin: ['Resolved', 'Cancelled'] },
        })
          .sort({ createdAt: -1 })
          .lean();
      }

      // Fetch active incidents (excluding Resolved and Rejected)
      if (type === 'all' || type === 'incident') {
        activeIncidents = await Incident.find({
          status: { $nin: ['Resolved', 'Rejected'] },
        })
          .sort({ createdAt: -1 })
          .lean();
      }
    } else {
      // Graceful fallback for in-memory / testing offline mode
      shelters = memoryStore.shelters || [];
      resources = memoryStore.resources || [];
      affectedAreas = memoryStore.affectedAreas || [];
      alerts = memoryStore.alerts || [];

      if (type === 'all' || type === 'sos') {
        activeSosList = (memoryStore.sosRequests || []).filter(
          (s) => !['Resolved', 'Cancelled'].includes(s.status)
        );
      }

      if (type === 'all' || type === 'incident') {
        activeIncidents = (memoryStore.incidents || []).filter(
          (i) => !['Resolved', 'Rejected'].includes(i.status)
        );
      }
    }

    // Build risk heatmap zones in-memory for contextual linkage (zero duplicate DB queries)
    const riskZones = buildRiskHeatmap({
      sosRequests: activeSosList,
      incidents: activeIncidents,
      affectedAreas,
      alerts,
      shelters,
    });

    const context = { shelters, resources, affectedAreas, alerts, riskZones };
    const prioritizedFeed = [];

    // Evaluate SOS Requests
    for (const sos of activeSosList) {
      const evaluation = evaluateEmergencyPriority(sos, 'sos', context);
      const sanitized = sanitizeIntelligenceForRole(sos, 'sos', evaluation, userRole);
      prioritizedFeed.push(sanitized);
    }

    // Evaluate Incidents
    for (const incident of activeIncidents) {
      const evaluation = evaluateEmergencyPriority(incident, 'incident', context);
      const sanitized = sanitizeIntelligenceForRole(incident, 'incident', evaluation, userRole);
      prioritizedFeed.push(sanitized);
    }

    // Filter by priorityLevel if specified
    let filteredFeed = prioritizedFeed;
    if (priorityLevel) {
      const targetLevel = priorityLevel.toUpperCase();
      filteredFeed = filteredFeed.filter((item) => item.priorityLevel === targetLevel);
    }

    // Filter by minScore if specified
    if (minScore != null && !isNaN(Number(minScore))) {
      const threshold = Number(minScore);
      filteredFeed = filteredFeed.filter((item) => item.priorityScore >= threshold);
    }

    // Sort descending by priorityScore (highest urgency first), then by creation date
    filteredFeed.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // Apply limit
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const resultData = filteredFeed.slice(0, parsedLimit);

    // Summary statistics
    const summary = {
      totalActive: filteredFeed.length,
      critical: filteredFeed.filter((i) => i.priorityLevel === 'CRITICAL').length,
      high: filteredFeed.filter((i) => i.priorityLevel === 'HIGH').length,
      medium: filteredFeed.filter((i) => i.priorityLevel === 'MEDIUM').length,
      low: filteredFeed.filter((i) => i.priorityLevel === 'LOW').length,
    };

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      userRole,
      count: resultData.length,
      summary,
      data: resultData,
    });
  } catch (error) {
    console.error('Crisis Intelligence Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate crisis intelligence priority feed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Find best available shelter recommendation for emergency coordinates
 * @route   GET /api/intelligence/recommended-shelter
 * @access  Private (JWT Required)
 */
exports.getRecommendedShelter = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both latitude and longitude query parameters',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude coordinates',
      });
    }

    const userRole = (req.user && req.user.role) || 'citizen';

    let shelters = [];
    if (isDbConnected()) {
      shelters = await Shelter.find({ status: { $ne: 'Temporarily Closed' } }).lean();
    } else {
      shelters = memoryStore.shelters || [];
    }

    const recommendation = recommendBestShelter(lat, lon, shelters);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'NO SUITABLE SHELTER FOUND',
        data: null,
      });
    }

    const sanitized = sanitizeShelterForRole(recommendation, userRole);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      userRole,
      data: sanitized,
    });
  } catch (error) {
    console.error('Recommended Shelter Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate shelter recommendation.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get live AI-assisted crisis risk heatmap zones (clustered & explainable)
 * @route   GET /api/intelligence/risk-heatmap
 * @access  Private (JWT Required, RBAC tailored)
 */
exports.getRiskHeatmap = async (req, res) => {
  try {
    const {
      limit = 100,
      minScore,
      riskLevel,
      latitude,
      longitude,
      radiusKm,
    } = req.query;

    const userRole = (req.user && req.user.role) || 'citizen';

    let sosRequests = [];
    let incidents = [];
    let affectedAreas = [];
    let alerts = [];
    let shelters = [];

    if (isDbConnected()) {
      [sosRequests, incidents, affectedAreas, alerts, shelters] = await Promise.all([
        SosRequest.find({ status: { $nin: ['Resolved', 'Cancelled'] } }).lean(),
        Incident.find({ status: { $nin: ['Resolved', 'Rejected'] } }).lean(),
        AffectedArea.find().lean(),
        Alert.find({ status: { $ne: 'Expired' } }).lean(),
        Shelter.find().lean(),
      ]);
    } else {
      sosRequests = memoryStore.sosRequests || [];
      incidents = memoryStore.incidents || [];
      affectedAreas = memoryStore.affectedAreas || [];
      alerts = memoryStore.alerts || [];
      shelters = memoryStore.shelters || [];
    }

    const zones = buildRiskHeatmap(
      { sosRequests, incidents, affectedAreas, alerts, shelters },
      { limit, minScore, riskLevel, latitude, longitude, radiusKm }
    );

    const sanitizedZones = zones.map((z) => sanitizeRiskZoneForRole(z, userRole));

    // Summary statistics
    const summary = {
      totalZones: sanitizedZones.length,
      criticalZones: sanitizedZones.filter((z) => z.riskLevel === 'CRITICAL').length,
      highZones: sanitizedZones.filter((z) => z.riskLevel === 'HIGH').length,
      mediumZones: sanitizedZones.filter((z) => z.riskLevel === 'MEDIUM').length,
      lowZones: sanitizedZones.filter((z) => z.riskLevel === 'LOW').length,
      highestRiskScore: sanitizedZones.length > 0 ? Math.max(...sanitizedZones.map((z) => z.riskScore)) : 0,
    };

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      userRole,
      count: sanitizedZones.length,
      summary,
      data: {
        zones: sanitizedZones,
      },
    });
  } catch (error) {
    console.error('Risk Heatmap Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute live crisis risk heatmap',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
