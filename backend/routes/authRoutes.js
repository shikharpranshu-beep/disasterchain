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
  updatePreferences,
  logout,
  getUsers,
  updateUserRole,
  adminVerifyUser,
  checkEmailStatus,
  getEmailConfigStatus,
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
router.get('/email-config', getEmailConfigStatus);
router.post('/logout', logout);

// Protected user endpoints
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/preferences', protect, updatePreferences);

// Admin endpoints (strictly protected by protect + authorizeAdmin)
router.get('/users', protect, authorizeAdmin, getUsers);
router.put('/users/:id/role', protect, authorizeAdmin, updateUserRole);
router.put('/users/:id/verify', protect, authorizeAdmin, adminVerifyUser);

// Development-only zero-cost verification endpoint (Strictly omitted in production)
if (process.env.NODE_ENV !== 'production') {
  const User = require('../models/User');
  router.post('/dev-verify', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email address required for dev verification.' });
      }
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { isVerified: true, verificationToken: undefined, verificationTokenExpires: undefined },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.json({
        success: true,
        mode: 'DEVELOPMENT EMAIL MODE',
        message: `User [${user.email}] verified successfully for zero-cost development testing.`,
        user: { email: user.email, role: user.role, isVerified: user.isVerified },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
}

module.exports = router;
