const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} = require('../controllers/alertController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getAlerts)
  .post(protect, authorizeAdmin, createAlert);

router.route('/:id')
  .put(protect, authorizeAdmin, updateAlert)
  .delete(protect, authorizeAdmin, deleteAlert);

module.exports = router;
