const express = require('express');
const router = express.Router();
const {
  getShelters,
  createShelter,
  updateShelter,
  deleteShelter,
} = require('../controllers/shelterController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getShelters)
  .post(protect, authorizeAdmin, createShelter);

router.route('/:id')
  .put(protect, authorizeAdmin, updateShelter)
  .delete(protect, authorizeAdmin, deleteShelter);

module.exports = router;
