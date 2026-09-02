const express = require('express');
const router = express.Router();
const {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect, authorize, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getResources)
  .post(protect, authorize('admin', 'responder', 'ngo'), createResource);

router.route('/:id')
  .put(protect, authorize('admin', 'responder', 'ngo'), updateResource)
  .delete(protect, authorizeAdmin, deleteResource);

module.exports = router;
