const { processChat } = require('../services/aiAssistantService');

/**
 * @desc    Process a user message with the DisasterChain AI Emergency Assistant
 * @route   POST /api/ai/chat
 * @access  Private (JWT Required)
 */
exports.handleAIChat = async (req, res) => {
  try {
    const { message, conversation, latitude, longitude } = req.body;

    // 1. Input Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required and cannot be empty.',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds the maximum permitted length of 1000 characters.',
      });
    }

    // 2. Validate user identity and role from verified JWT (never trust client-supplied role)
    const userRole = (req.user && req.user.role) || 'citizen';
    const userId = req.user && req.user._id ? String(req.user._id) : null;

    // 3. Coordinate validation
    let validLat = null;
    let validLon = null;
    if (latitude != null && !isNaN(Number(latitude))) {
      validLat = Number(latitude);
    }
    if (longitude != null && !isNaN(Number(longitude))) {
      validLon = Number(longitude);
    }

    // 4. Sanitize conversation history if provided
    let cleanConversation = [];
    if (Array.isArray(conversation)) {
      cleanConversation = conversation
        .filter((c) => c && typeof c === 'object' && c.role && c.content)
        .slice(-6); // Max 6 recent messages
    }

    // 5. Validate language against supported allowlist (fallback to English)
    const SUPPORTED_LANG_CODES = [
      'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
      'or', 'as', 'ur', 'sa', 'ne', 'kok', 'ks', 'mai', 'sd', 'mni'
    ];
    let selectedLanguage = 'en';
    if (req.body.language && typeof req.body.language === 'string') {
      const normalizedLang = req.body.language.trim().toLowerCase();
      if (SUPPORTED_LANG_CODES.includes(normalizedLang)) {
        selectedLanguage = normalizedLang;
      }
    }

    // 6. Process through AI Assistant Service
    const result = await processChat({
      message: message.trim(),
      conversation: cleanConversation,
      latitude: validLat,
      longitude: validLon,
      userRole,
      userId,
      language: selectedLanguage,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('DisasterChain AI Assistant Error:', error);
    return res.status(500).json({
      success: false,
      message: 'The AI Emergency Assistant is temporarily unavailable. DisasterChain live safety services remain online.',
      fallbackActions: [
        { type: 'NAVIGATE', label: 'OPEN ALERTS', route: '/alerts' },
        { type: 'NAVIGATE', label: 'FIND SHELTER', route: '/shelters' },
        { type: 'NAVIGATE', label: 'OPEN MAP', route: '/dashboard' },
        { type: 'TRIGGER_SOS', label: 'EMERGENCY SOS' },
      ],
    });
  }
};
