const express = require('express');
const router = express.Router();
const {
  getAffectedAreas,
  createAffectedArea,
  updateAffectedArea,
  deleteAffectedArea,
} = require('../controllers/affectedAreaController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getAffectedAreas)
  .post(protect, authorizeAdmin, createAffectedArea);

router.route('/:id')
  .put(protect, authorizeAdmin, updateAffectedArea)
  .delete(protect, authorizeAdmin, deleteAffectedArea);

module.exports = router;
