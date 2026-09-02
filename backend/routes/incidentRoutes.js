const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  deleteIncident,
} = require('../controllers/incidentController');
const { protect, authorize, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getIncidents)
  .post(createIncident);

router.route('/:id')
  .get(getIncidentById)
  .delete(protect, authorizeAdmin, deleteIncident);

router.route('/:id/status')
  .put(protect, authorize('admin', 'responder'), updateIncidentStatus);

module.exports = router;
