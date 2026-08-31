const express = require('express');
const router = express.Router();
const {
  getAllPreparedness,
  getPreparednessByType,
} = require('../controllers/preparednessController');

router.route('/')
  .get(getAllPreparedness);

router.route('/:type')
  .get(getPreparednessByType);

module.exports = router;
