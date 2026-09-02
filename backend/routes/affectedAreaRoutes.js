const express = require('express');
const router = express.Router();
const {
  getAffectedAreas,
  createAffectedArea,
  updateAffectedArea,
  deleteAffectedArea,
} = require('../controllers/affectedAreaController');
const { protect, authorize, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getAffectedAreas)
  .post(protect, authorize('admin', 'responder'), createAffectedArea);

router.route('/:id')
  .put(protect, authorize('admin', 'responder'), updateAffectedArea)
  .delete(protect, authorizeAdmin, deleteAffectedArea);

module.exports = router;
