const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  deleteIncident,
} = require('../controllers/incidentController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getIncidents)
  .post(createIncident);

router.route('/:id')
  .get(getIncidentById)
  .delete(protect, authorizeAdmin, deleteIncident);

router.route('/:id/status')
  .put(protect, authorizeAdmin, updateIncidentStatus);

module.exports = router;
