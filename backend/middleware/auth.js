const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verifies JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'disasterchain_secret_key_2026'
      );

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // Fallback for demo mode
        req.user = {
          _id: decoded.id,
          role: decoded.role || 'student',
          name: decoded.name || 'Demo User',
          email: decoded.email || 'demo@disasterchain.org',
        };
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource. Invalid token.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.',
    });
  }
};

// Grant access to specific roles (e.g. admin)
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required for this action.',
    });
  }
};

module.exports = { protect, authorizeAdmin };
