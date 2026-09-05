const express = require('express');
const router = express.Router();
const { handleWeatherGPTChat } = require('../controllers/weatherGPTController');
const { aiLimiter } = require('../middleware/rateLimiter');

// POST /api/weather-gpt/chat - Process natural-language query with WeatherGPT
router.post('/chat', aiLimiter, handleWeatherGPTChat);

module.exports = router;
