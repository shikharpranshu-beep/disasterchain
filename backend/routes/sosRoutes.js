const express = require('express');
const router = express.Router();
const {
  getSosRequests,
  getSosRequestById,
  createSosRequest,
  updateSosStatus,
} = require('../controllers/sosController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getSosRequests)
  .post(createSosRequest);

router.route('/:id')
  .get(getSosRequestById);

router.route('/:id/status')
  .put(protect, authorizeAdmin, updateSosStatus);

module.exports = router;
