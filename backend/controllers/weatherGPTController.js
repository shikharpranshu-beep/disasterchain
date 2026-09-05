const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');
const { processWeatherGPTChat, SUPPORTED_LANGUAGES } = require('../services/weatherGPTService');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Helper to safely extract user and role from optional Bearer token
 */
async function resolveUserFromToken(req) {
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'disasterchain_secure_jwt_secret_2026'
        );

        if (isDbConnected()) {
          try {
            const user = await User.findById(decoded.id).select('-password');
            if (user) {
              return { userId: String(user._id), role: user.role || 'citizen' };
            }
          } catch (e) {}
        } else {
          const memUser = (memoryStore.users || []).find((u) => u._id === decoded.id || u.email === decoded.email);
          if (memUser) {
            return { userId: String(memUser._id), role: memUser.role || 'citizen' };
          }
        }

        if (decoded.id && (String(decoded.id).startsWith('demo-') || String(decoded.id).startsWith('507f'))) {
          return { userId: decoded.id, role: decoded.role || 'citizen' };
        }
      } catch (err) {
        // Token invalid or expired: gracefully treat as public citizen
        console.warn('[DIAGNOSTIC] authentication failure: Token verification failed:', err.message);
      }
    }
  }
  return { userId: null, role: 'citizen' };
}

/**
 * @desc    Process conversational weather intelligence query with WeatherGPT
 * @route   POST /api/weather-gpt/chat
 * @access  Public / Optional Auth (Role-aware RBAC)
 */
exports.handleWeatherGPTChat = async (req, res) => {
  try {
    const { message, latitude, longitude, location, language, conversationId, conversation } = req.body;

    // 1. Validate Message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.warn('[DIAGNOSTIC] validation failure: Message is required and cannot be empty');
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty.',
      });
    }

    if (message.length > 1000) {
      console.warn('[DIAGNOSTIC] validation failure: Message exceeds maximum length of 1000 characters');
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length of 1000 characters.',
      });
    }

    // 2. Validate Coordinates
    let validLat = null;
    let validLon = null;
    if (latitude != null && !isNaN(Number(latitude))) {
      const parsedLat = Number(latitude);
      if (parsedLat >= -90 && parsedLat <= 90) {
        validLat = parsedLat;
      }
    }
    if (longitude != null && !isNaN(Number(longitude))) {
      const parsedLon = Number(longitude);
      if (parsedLon >= -180 && parsedLon <= 180) {
        validLon = parsedLon;
      }
    }

    // 3. Resolve User Role (RBAC)
    const { userId, role } = await resolveUserFromToken(req);

    // 4. Validate Language
    let validLang = 'en';
    if (language && typeof language === 'string') {
      const code = language.trim().toLowerCase();
      if (SUPPORTED_LANGUAGES[code]) {
        validLang = code;
      }
    }

    // 5. Clean Conversation history if supplied
    let cleanHistory = [];
    if (Array.isArray(conversation)) {
      cleanHistory = conversation
        .filter((c) => c && typeof c === 'object' && c.role && c.content)
        .slice(-6);
    }

    // 6. Process Chat through WeatherGPT Service Engine
    const result = await processWeatherGPTChat({
      message: message.trim(),
      latitude: validLat,
      longitude: validLon,
      location: location && typeof location === 'string' ? location.trim() : null,
      language: validLang,
      conversationId: conversationId && typeof conversationId === 'string' ? conversationId.trim() : null,
      conversation: cleanHistory,
      userRole: role,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[DIAGNOSTIC] unexpected exception in WeatherGPT controller:', err.message, err.stack);
    return res.status(500).json({
      success: false,
      message: 'Weather data is temporarily unavailable. Please try again.',
    });
  }
};
