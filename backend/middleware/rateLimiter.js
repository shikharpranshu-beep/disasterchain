const rateLimit = require('express-rate-limit');

// Strict rate limiter for sensitive authentication endpoints (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

// Dedicated AI Assistant rate limiter (prevents automated flooding / DoS)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many assistant requests. Please wait a moment before sending another message.',
  },
});

module.exports = { authLimiter, generalLimiter, aiLimiter };
