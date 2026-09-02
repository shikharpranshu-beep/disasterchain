const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} = require('../controllers/alertController');
const { protect, authorize, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getAlerts)
  .post(protect, authorize('admin', 'responder'), createAlert);

router.route('/:id')
  .put(protect, authorize('admin', 'responder'), updateAlert)
  .delete(protect, authorizeAdmin, deleteAlert);

module.exports = router;
