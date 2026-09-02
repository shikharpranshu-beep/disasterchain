const express = require('express');
const router = express.Router();
const {
  getShelters,
  createShelter,
  updateShelter,
  deleteShelter,
} = require('../controllers/shelterController');
const { protect, authorize, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getShelters)
  .post(protect, authorize('admin', 'responder'), createShelter);

router.route('/:id')
  .put(protect, authorize('admin', 'responder'), updateShelter)
  .delete(protect, authorizeAdmin, deleteShelter);

module.exports = router;
