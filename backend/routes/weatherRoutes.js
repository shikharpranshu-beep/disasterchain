const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Weather & Atmospheric Intelligence Routes
router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecast);
router.get('/air-quality', weatherController.getAirQuality);
router.get('/complete', weatherController.getCompleteWeather);
router.get('/cyclones', weatherController.getCyclones);
router.get('/cyclones/:id', weatherController.getCycloneById);
router.get('/disasters', weatherController.getDisasterEvents);
router.get('/location', weatherController.searchLocation);
router.get('/reverse-geocode', weatherController.reverseGeocode);

module.exports = router;
