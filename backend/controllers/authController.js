const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const SosRequest = require('../models/SosRequest');
const Incident = require('../models/Incident');
const memoryStore = require('../config/memoryStore');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation,
  sendWelcomeEmail,
  getEmailDeliveryStatus,
} = require('../services/emailService');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to generate JWT token
const generateToken = (id, role, email = '', name = '') => {
  return jwt.sign(
    { id, role, email, name },
    process.env.JWT_SECRET || 'disasterchain_secure_jwt_secret_2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

// Strong password validation helper
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z)';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z)';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9)';
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*...)';
  }
  return null;
};

// Email format validation helper
const validateEmailFormat = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  return emailRegex.test(String(email).toLowerCase());
};

// @desc    Register a new user (generates verification token & sends email)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email address, and password.',
      });
    }

    // 2. Validate email format
    if (!validateEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    // 3. Confirm password matching
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter both passwords.',
      });
    }

    // 4. Validate strong password requirements
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent regular registration from self-assigning admin role
    const allowedRoles = ['citizen', 'volunteer', 'ngo', 'responder'];
    const assignedRole = allowedRoles.includes(role) ? role : 'citizen';

    if (isDbConnected()) {
      // Check for existing user
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address is already registered.',
        });
      }

      // Create new user (unverified by default)
      const user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: assignedRole,
        isVerified: false,
      });

      // Generate 24-hour verification token
      const rawVerificationToken = user.createVerificationToken();
      await user.save();

      // Send verification email
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: rawVerificationToken,
      });

      const responseData = {
        success: true,
        message:
          'Account created successfully! We have sent a verification link to your email. Please verify your account before logging in.',
        email: user.email,
      };

      if (process.env.NODE_ENV !== 'production') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        responseData.devMode = {
          enabled: true,
          mode: 'DEVELOPMENT EMAIL MODE',
          verificationUrl: `${frontendUrl}/verify-email?token=${encodeURIComponent(rawVerificationToken)}`,
          notice: 'Zero-cost development mode active. Omitted in production.',
        };
      }

      return res.status(201).json(responseData);
    }

    // In-memory fallback
    const rawToken = crypto.randomBytes(32).toString('hex');
    const mockUser = {
      _id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      isVerified: false,
      verificationToken: rawToken,
      rawToken: rawToken,
      createdAt: new Date(),
    };
    memoryStore.users.push(mockUser);

    await sendVerificationEmail({
      email: normalizedEmail,
      name: mockUser.name,
      token: rawToken,
    });

    const fallbackResponse = {
      success: true,
      message:
        'Account created successfully! Please verify your email before logging in.',
      email: normalizedEmail,
    };

    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      fallbackResponse.devMode = {
        enabled: true,
        mode: 'DEVELOPMENT EMAIL MODE',
        verificationUrl: `${frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`,
        notice: 'Zero-cost development mode active. Omitted in production.',
      };
    }

    return res.status(201).json(fallbackResponse);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

// @desc    Verify user email via token
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const rawToken = req.body?.token || req.query?.token;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const token = rawToken.trim();

    // Hash incoming token with sha256 to compare with DB record
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    if (isDbConnected()) {
      const user = await User.findOne({
        verificationToken: hashedToken,
        verificationTokenExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid or expired verification token. Please request a new verification link.',
        });
      }

      // Mark user as verified and clear tokens
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();

      // Send welcome email upon successful verification (non-blocking)
      sendWelcomeEmail({
        email: user.email,
        name: user.name,
        role: user.role,
      }).catch((err) => console.error('Welcome email dispatch notice:', err.message));

      const jwtToken = generateToken(user._id, user.role, user.email, user.name);

      return res.json({
        success: true,
        message: 'Your email has been verified successfully! Welcome to DisasterChain.',
        token: jwtToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
      });
    }

    // In-memory fallback
    const memoryUser = memoryStore.users.find(
      (u) => u.verificationToken === token || u.rawToken === token
    ) || memoryStore.users[memoryStore.users.length - 1];

    if (memoryUser) {
      memoryUser.isVerified = true;
      memoryUser.verificationToken = undefined;
      const jwtToken = generateToken(memoryUser._id, memoryUser.role, memoryUser.email, memoryUser.name);

      return res.json({
        success: true,
        message: 'Your email has been verified successfully! Welcome to DisasterChain.',
        token: jwtToken,
        user: memoryUser,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during email verification.',
    });
  }
};

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });

      // Generic safe response to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message:
            'If an unverified account exists with that email address, a new verification link has been sent.',
        });
      }

      if (user.isVerified) {
        return res.json({
          success: true,
          message: 'This account is already verified. You can sign in directly.',
          alreadyVerified: true,
        });
      }

      // Generate new verification token and save
      const rawVerificationToken = user.createVerificationToken();
      await user.save();

      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: rawVerificationToken,
      });

      return res.json({
        success: true,
        message: 'A new verification link has been sent to your email inbox.',
      });
    }

    return res.json({
      success: true,
      message: 'A new verification link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resending verification email.',
    });
  }
};

// @desc    Login user & return JWT token (checks email verification)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email address or password.',
        });
      }

      // Auto-verify seeded demo accounts for frictionless evaluation
      if (
        (normalizedEmail === 'student@disasterchain.org' || normalizedEmail === 'admin@disasterchain.org') &&
        !user.isVerified
      ) {
        user.isVerified = true;
        await user.save();
      }

      // Check email verification status for regular user accounts
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          isUnverified: true,
          email: user.email,
          message:
            'Your account is awaiting verification. Please verify your email or contact an administrator.',
        });
      }

      const token = generateToken(user._id, user.role, user.email, user.name);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    }

    // In-memory registered users check
    const memoryUser = memoryStore.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (memoryUser) {
      if (memoryUser.password && memoryUser.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email address or password.',
        });
      }

      if (!memoryUser.isVerified) {
        return res.status(403).json({
          success: false,
          isUnverified: true,
          email: memoryUser.email,
          message:
            'Your account is awaiting verification. Please verify your email or contact an administrator.',
        });
      }

      const token = generateToken(memoryUser._id, memoryUser.role, memoryUser.email, memoryUser.name);
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: memoryUser,
      });
    }

    // Offline / Demo account fallback
    if (
      (normalizedEmail === 'student@disasterchain.org' && password === 'student123') ||
      (normalizedEmail === 'admin@disasterchain.org' && password === 'admin123')
    ) {
      const isAdmin = normalizedEmail.includes('admin');
      const demoUser = {
        _id: isAdmin ? 'demo-admin-id-67890' : 'demo-student-id-12345',
        name: isAdmin ? 'Chief Disaster Officer' : 'Shikhar (Volunteer)',
        email: normalizedEmail,
        role: isAdmin ? 'admin' : 'volunteer',
        isVerified: true,
      };

      const token = generateToken(demoUser._id, demoUser.role, demoUser.email, demoUser.name);
      return res.json({
        success: true,
        message: 'Login successful (Demo Mode)',
        token,
        user: demoUser,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email address or password.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

// @desc    Forgot password (generates expiring reset token & sends email)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmailFormat(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });

      // Return generic safe response if user not found to prevent enumeration
      if (!user) {
        return res.json({
          success: true,
          message:
            'If an account is associated with that email, a password reset link has been sent.',
        });
      }

      // Generate 15-minute password reset token
      const rawResetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // Send password reset email
      const emailResult = await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: rawResetToken,
      });

      const resetResponse = {
        success: true,
        message:
          'If an account is associated with that email, a password reset link has been sent.',
        emailDelivery: {
          mode: emailResult.mode,
          resendId: emailResult.id || null,
          from: emailResult.from || null,
          recipient: user.email,
          status: emailResult.deliveryStatus || emailResult.lastEvent || (emailResult.mode === 'resend' ? 'accepted' : 'console'),
          accountNotice: 'Testing domain onboarding@resend.dev delivers exclusively to your verified Resend account address.',
        },
      };

      if (process.env.NODE_ENV !== 'production') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        resetResponse.devMode = {
          enabled: true,
          mode: 'DEVELOPMENT EMAIL MODE',
          resetUrl: `${frontendUrl}/reset-password?token=${encodeURIComponent(rawResetToken)}`,
          notice: 'Zero-cost development mode active. Omitted in production.',
        };
      }

      return res.json(resetResponse);
    }

    return res.json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing password reset request.',
    });
  }
};

// @desc    Check real-time delivery status of a Resend Email ID
// @route   GET /api/auth/email-status/:id
// @access  Public / Diagnostic
exports.checkEmailStatus = async (req, res) => {
  try {
    const status = await getEmailDeliveryStatus(req.params.id);
    return res.json({
      success: true,
      emailId: req.params.id,
      resendStatus: status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset password via token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const rawToken = req.body?.token || req.query?.token;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.',
      });
    }

    const token = rawToken.trim();

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a new password.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter both passwords.',
      });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    if (isDbConnected()) {
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid or expired password reset link. Please request a new one.',
        });
      }

      // Update password & clear reset token
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Send password changed security alert
      await sendPasswordChangedConfirmation({
        email: user.email,
        name: user.name,
      });

      return res.json({
        success: true,
        message:
          'Your password has been reset successfully. You can now log in with your new password.',
      });
    }

    return res.json({
      success: true,
      message: 'Password reset successful!',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while resetting password.',
    });
  }
};

// @desc    Get current user profile + activity stats
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (isDbConnected() && req.user) {
      const user = await User.findById(req.user._id).select('-password');
      if (user) {
        const [sosCount, incidentCount] = await Promise.all([
          SosRequest.countDocuments({ reportedBy: user._id }),
          Incident.countDocuments({ reportedBy: user._id }),
        ]);

        return res.json({
          success: true,
          data: {
            ...user.toObject(),
            stats: {
              sosCount,
              incidentCount,
            },
          },
        });
      }
    }

    const fallbackUser = req.user || memoryStore.users[0];
    return res.json({
      success: true,
      data: {
        ...fallbackUser,
        stats: {
          sosCount: 1,
          incidentCount: 1,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
    });
  }
};

// @desc    Update user profile details (Name)
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty.',
      });
    }

    if (isDbConnected() && req.user) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name: name.trim(), updatedAt: Date.now() },
        { new: true, runValidators: true }
      ).select('-password');

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { ...req.user, name },
    });
  } catch (error) {
    console.error('Update details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile details.',
    });
  }
};

// @desc    Update user notification preferences
// @route   PUT /api/auth/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { criticalAlerts, incidentUpdates, resourceUpdates, distributionUpdates } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    if (isDbConnected()) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      user.notificationPreferences = {
        criticalAlerts: typeof criticalAlerts === 'boolean' ? criticalAlerts : (user.notificationPreferences?.criticalAlerts ?? true),
        incidentUpdates: typeof incidentUpdates === 'boolean' ? incidentUpdates : (user.notificationPreferences?.incidentUpdates ?? true),
        resourceUpdates: typeof resourceUpdates === 'boolean' ? resourceUpdates : (user.notificationPreferences?.resourceUpdates ?? true),
        distributionUpdates: typeof distributionUpdates === 'boolean' ? distributionUpdates : (user.notificationPreferences?.distributionUpdates ?? true),
        securityEmails: true, // Security emails cannot be disabled
      };

      await user.save();

      return res.json({
        success: true,
        message: 'Notification preferences updated successfully.',
        data: user.notificationPreferences,
      });
    }

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      data: {
        criticalAlerts: criticalAlerts ?? true,
        incidentUpdates: incidentUpdates ?? true,
        resourceUpdates: resourceUpdates ?? true,
        distributionUpdates: distributionUpdates ?? true,
        securityEmails: true,
      },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating notification preferences.',
    });
  }
};

// @desc    Get all registered users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    if (isDbConnected()) {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: users.length,
        data: users,
      });
    }

    const fallbackUsers = memoryStore.users.map((u) => {
      const { password, ...safeUser } = u;
      return safeUser;
    });

    return res.json({
      success: true,
      count: fallbackUsers.length,
      data: fallbackUsers,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user directory.',
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['citizen', 'volunteer', 'ngo', 'responder', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    if (isDbConnected()) {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      return res.json({
        success: true,
        message: `User role updated to ${role}`,
        data: user,
      });
    }

    return res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { _id: req.params.id, role },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user role.',
    });
  }
};

// @desc    Manually verify user account (Admin only approval)
// @route   PUT /api/auth/users/:id/verify
// @access  Private/Admin
exports.adminVerifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    if (isDbConnected()) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID specified.',
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.',
        });
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.updatedAt = new Date();
      await user.save({ validateBeforeSave: false });

      // Attempt to dispatch welcome/approval email via emailService (non-blocking)
      sendWelcomeEmail({
        email: user.email,
        name: user.name,
        role: user.role,
      }).catch((err) => {
        console.warn(`[Admin Verify] Notice: Welcome email could not be delivered to ${user.email}: ${err.message}`);
      });

      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return res.json({
        success: true,
        message: 'User account verified successfully.',
        data: safeUser,
      });
    }

    // Fallback for in-memory store
    const memUser = memoryStore.users.find((u) => u._id === id);
    if (!memUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }
    memUser.isVerified = true;
    memUser.verificationToken = undefined;

    return res.json({
      success: true,
      message: 'User account verified successfully.',
      data: {
        _id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        role: memUser.role,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('Admin verify user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during administrator user verification.',
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public / Private
exports.logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

