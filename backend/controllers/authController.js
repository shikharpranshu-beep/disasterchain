const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to create JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'disasterchain_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (isDbConnected()) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const user = await User.create({ name, email, password, role: role || 'student' });
      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }

    // In-memory fallback
    const newUser = {
      _id: `user-${Date.now()}`,
      name,
      email,
      role: role || 'student',
    };
    memoryStore.users.push(newUser);
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully (In-Memory)',
      token,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// @desc    Login user & return JWT token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password' });
    }

    if (isDbConnected()) {
      const user = await User.findOne({ email }).select('+password');
      if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id, user.role);
        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
      }
    }

    // Check demo accounts or memoryStore
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
      _id: `user-${Date.now()}`,
      name: email.includes('admin') ? 'Chief Disaster Officer' : 'Shikhar (Student)',
      email,
      role: email.includes('admin') ? 'admin' : 'student',
    };

    const token = generateToken(user._id, user.role);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (isDbConnected() && req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        return res.json({ success: true, data: user });
      }
    }

    const user = memoryStore.users.find((u) => u._id === req.user?.id) || memoryStore.users[0];
    return res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};
