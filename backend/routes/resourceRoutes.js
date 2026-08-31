const express = require('express');
const router = express.Router();
const {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect, authorizeAdmin } = require('../middleware/auth');

router.route('/')
  .get(getResources)
  .post(protect, authorizeAdmin, createResource);

router.route('/:id')
  .put(protect, authorizeAdmin, updateResource)
  .delete(protect, authorizeAdmin, deleteResource);

module.exports = router;
