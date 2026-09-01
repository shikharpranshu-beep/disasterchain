const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Protect routes - verifies JWT and user validity
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'disasterchain_secure_jwt_secret_2026'
      );

      if (isDbConnected()) {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User belonging to this token no longer exists.',
          });
        }
        req.user = user;
      } else {
        // Fallback for memory store
        const memoryUser = memoryStore.users.find(
          (u) => u._id === decoded.id || (decoded.email && u.email === decoded.email)
        ) || {
          _id: decoded.id,
          role: decoded.role || 'user',
          name: decoded.name || 'Demo User',
          email: decoded.email || 'student@disasterchain.org',
          isVerified: true,
        };
        req.user = memoryUser;
      }

      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please sign in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource. Invalid token.',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized. Please provide a valid authentication token.',
  });
};

// Grant access to specific roles (e.g. 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s).`,
      });
    }
    next();
  };
};

const authorizeAdmin = authorize('admin');

module.exports = { protect, authorize, authorizeAdmin };
