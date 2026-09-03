const express = require('express');
const router = express.Router();
const {
  getActiveCrisisIntelligence,
  getRecommendedShelter,
  getRiskHeatmap,
} = require('../controllers/crisisIntelligenceController');
const { protect } = require('../middleware/auth');

// All crisis intelligence routes require authenticated session
router.use(protect);

// @route   GET /api/intelligence/active
// @desc    Get prioritized triage intelligence feed (role-tailored)
// @access  Private (Authenticated users: citizen, volunteer, ngo, responder, admin)
router.get('/active', getActiveCrisisIntelligence);

// @route   GET /api/intelligence/recommended-shelter
// @desc    Find best available shelter recommendation for coordinates
// @access  Private (Authenticated users: citizen, volunteer, ngo, responder, admin)
router.get('/recommended-shelter', getRecommendedShelter);

// @route   GET /api/intelligence/risk-heatmap
// @desc    Get live AI-assisted crisis risk heatmap zones (clustered & explainable)
// @access  Private (Authenticated users: citizen, volunteer, ngo, responder, admin)
router.get('/risk-heatmap', getRiskHeatmap);

module.exports = router;
