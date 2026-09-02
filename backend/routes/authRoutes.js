const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateDetails,
  logout,
  getUsers,
  updateUserRole,
  checkEmailStatus,
} = require('../controllers/authController');
const { protect, authorizeAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public endpoints (rate limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/email-status/:id', checkEmailStatus);
router.post('/logout', logout);

// Protected user endpoints
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);

// Admin endpoints
router.get('/users', protect, authorizeAdmin, getUsers);
router.put('/users/:id/role', protect, authorizeAdmin, updateUserRole);

module.exports = router;
