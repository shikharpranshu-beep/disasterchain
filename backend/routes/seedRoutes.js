const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seedController');

router.post('/', seedDatabase);
router.get('/', seedDatabase); // Allow quick browser/GET trigger as well

module.exports = router;
