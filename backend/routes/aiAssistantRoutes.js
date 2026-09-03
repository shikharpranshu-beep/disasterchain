const express = require('express');
const router = express.Router();
const { handleAIChat } = require('../controllers/aiAssistantController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// POST /api/ai/chat - Process message through DisasterChain AI Assistant
router.post('/chat', protect, aiLimiter, handleAIChat);

module.exports = router;
