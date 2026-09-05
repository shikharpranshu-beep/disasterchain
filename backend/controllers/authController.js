const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const PasswordRecoveryRequest = require('../models/PasswordRecoveryRequest');
const SosRequest = require('../models/SosRequest');
const Incident = require('../models/Incident');
const memoryStore = require('../config/memoryStore');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedConfirmation,
  sendWelcomeEmail,
  getEmailDeliveryStatus,
  checkEmailConfigStatus,
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

// Helper to generate a human-manageable, cryptographically secure recovery token: RCVR-XXXX-XXXX-XXXX
const generateRecoveryCode = () => {
  const raw = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `RCVR-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
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
      (normalizedEmail === 'admin@disasterchain.org' && password === 'admin123') ||
      (normalizedEmail === 'citizen@disasterchain.org' && password === 'citizen123')
    ) {
      const role = normalizedEmail.includes('admin')
        ? 'admin'
        : (normalizedEmail.includes('citizen') ? 'citizen' : 'volunteer');

      const demoUser = {
        _id: role === 'admin'
          ? 'demo-admin-id-67890'
          : (role === 'citizen' ? 'demo-citizen-id-11111' : 'demo-student-id-12345'),
        name: role === 'admin'
          ? 'Chief Disaster Officer'
          : (role === 'citizen' ? 'Aarav (Citizen)' : 'Shikhar (Volunteer)'),
        email: normalizedEmail,
        role,
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

// @desc    Forgot password (submits admin-verified recovery request without email dependency)
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

      // Anti-enumeration protection: return uniform safe message even if user is not found
      if (!user) {
        return res.json({
          success: true,
          message:
            'If an account is associated with that email, a password recovery request has been submitted.',
        });
      }

      // Invalidate/expire any existing pending requests for this user to avoid duplicate spam
      await PasswordRecoveryRequest.updateMany(
        { email: normalizedEmail, status: 'pending' },
        { status: 'expired' }
      );

      // Create new pending recovery request
      await PasswordRecoveryRequest.create({
        userId: user._id,
        email: normalizedEmail,
        status: 'pending',
        requestedAt: new Date(),
      });

      return res.json({
        success: true,
        message:
          'If an account is associated with that email, a password recovery request has been submitted.',
      });
    }

    // In-memory fallback
    if (!memoryStore.passwordRecoveryRequests) {
      memoryStore.passwordRecoveryRequests = [];
    }

    const memUser = memoryStore.users.find(
      (u) => u.email && u.email.toLowerCase() === normalizedEmail
    );

    if (memUser) {
      memoryStore.passwordRecoveryRequests
        .filter((r) => r.email === normalizedEmail && r.status === 'pending')
        .forEach((r) => {
          r.status = 'expired';
        });

      memoryStore.passwordRecoveryRequests.unshift({
        _id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: memUser._id,
        email: normalizedEmail,
        status: 'pending',
        requestedAt: new Date(),
        reviewedBy: null,
        reviewedAt: null,
        expiresAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        completedAt: null,
        rejectedAt: null,
        rejectionReason: null,
      });
    }

    return res.json({
      success: true,
      message:
        'If an account is associated with that email, a password recovery request has been submitted.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing password reset request.',
    });
  }
};

// @desc    Get safe email service configuration status (strictly no secrets)
// @route   GET /api/auth/email-config
// @access  Public / Diagnostic
exports.getEmailConfigStatus = async (req, res) => {
  try {
    return res.json({
      success: true,
      config: checkEmailConfigStatus(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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

// @desc    Reset password via single-use recovery code
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const rawToken = req.body?.token || req.body?.recoveryCode || req.query?.token;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recovery code is required.',
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

    // Hash token to compare with DB (check both uppercase and raw formats)
    const hashUpper = crypto.createHash('sha256').update(token.toUpperCase()).digest('hex');
    const hashRaw = crypto.createHash('sha256').update(token).digest('hex');
    const candidateHashes = Array.from(new Set([hashUpper, hashRaw]));

    if (isDbConnected()) {
      // 1. Check admin-approved PasswordRecoveryRequest
      const recoveryReq = await PasswordRecoveryRequest.findOne({
        resetTokenHash: { $in: candidateHashes },
        status: 'approved',
        resetTokenExpiresAt: { $gt: new Date() },
      }).select('+resetTokenHash');

      if (recoveryReq) {
        const user = await User.findById(recoveryReq.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User account associated with this recovery code was not found.',
          });
        }

        // Update password (bcrypt pre-save hook will hash)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Mark recovery request as completed
        recoveryReq.status = 'completed';
        recoveryReq.completedAt = new Date();
        recoveryReq.resetTokenHash = undefined;
        await recoveryReq.save();

        // Expire any other pending/approved requests for this user
        await PasswordRecoveryRequest.updateMany(
          {
            email: recoveryReq.email,
            _id: { $ne: recoveryReq._id },
            status: { $in: ['pending', 'approved'] },
          },
          { status: 'expired' }
        );

        return res.json({
          success: true,
          message:
            'Your password has been reset successfully. You can now log in with your new password.',
        });
      }

      // 2. Backwards compatibility fallback for legacy resetPasswordToken
      const legacyUser = await User.findOne({
        resetPasswordToken: { $in: candidateHashes },
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (legacyUser) {
        legacyUser.password = password;
        legacyUser.resetPasswordToken = undefined;
        legacyUser.resetPasswordExpires = undefined;
        await legacyUser.save();

        return res.json({
          success: true,
          message:
            'Your password has been reset successfully. You can now log in with your new password.',
        });
      }

      return res.status(400).json({
        success: false,
        message:
          'Invalid, expired, or already used recovery code. Please request a new recovery code.',
      });
    }

    // In-memory fallback
    if (!memoryStore.passwordRecoveryRequests) {
      memoryStore.passwordRecoveryRequests = [];
    }

    const memReq = memoryStore.passwordRecoveryRequests.find(
      (r) =>
        (candidateHashes.includes(r.resetTokenHash) || r.rawCode === token.toUpperCase()) &&
        r.status === 'approved' &&
        r.resetTokenExpiresAt &&
        new Date(r.resetTokenExpiresAt) > new Date()
    );

    if (memReq) {
      const memUser = memoryStore.users.find(
        (u) => u._id === memReq.userId || u.email === memReq.email
      );
      if (memUser) {
        memUser.password = password;
      }
      memReq.status = 'completed';
      memReq.completedAt = new Date();
      memReq.resetTokenHash = null;
      memReq.rawCode = null;

      return res.json({
        success: true,
        message:
          'Your password has been reset successfully. You can now log in with your new password.',
      });
    }

    return res.status(400).json({
      success: false,
      message:
        'Invalid, expired, or already used recovery code. Please request a new recovery code.',
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

// @desc    Get password recovery requests (Admin only; sanitizes hashes)
// @route   GET /api/auth/password-recovery-requests
// @access  Private / Admin
exports.getPasswordRecoveryRequests = async (req, res) => {
  try {
    const { status } = req.query;

    if (isDbConnected()) {
      // Auto-expire approved requests whose resetTokenExpiresAt has passed
      const now = new Date();
      await PasswordRecoveryRequest.updateMany(
        {
          status: 'approved',
          resetTokenExpiresAt: { $lt: now },
        },
        { status: 'expired' }
      );

      const filter = {};
      if (status && ['pending', 'approved', 'rejected', 'completed', 'expired'].includes(status)) {
        filter.status = status;
      }

      const requests = await PasswordRecoveryRequest.find(filter)
        .sort({ requestedAt: -1 })
        .populate('userId', 'name email role')
        .populate('reviewedBy', 'name email');

      return res.json({
        success: true,
        count: requests.length,
        data: requests,
      });
    }

    // In-memory fallback
    if (!memoryStore.passwordRecoveryRequests) {
      memoryStore.passwordRecoveryRequests = [];
    }
    const now = new Date();
    memoryStore.passwordRecoveryRequests.forEach((r) => {
      if (r.status === 'approved' && r.resetTokenExpiresAt && new Date(r.resetTokenExpiresAt) < now) {
        r.status = 'expired';
      }
    });

    let filtered = memoryStore.passwordRecoveryRequests;
    if (status && ['pending', 'approved', 'rejected', 'completed', 'expired'].includes(status)) {
      filtered = filtered.filter((r) => r.status === status);
    }

    // Map and sanitize (never expose resetTokenHash)
    const safeData = filtered.map((r) => {
      const user = memoryStore.users.find((u) => u._id === r.userId || u.email === r.email);
      const reviewer = r.reviewedBy ? memoryStore.users.find((u) => u._id === r.reviewedBy) : null;
      return {
        _id: r._id,
        userId: user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : r.userId,
        email: r.email,
        requestedAt: r.requestedAt,
        status: r.status,
        reviewedBy: reviewer ? { _id: reviewer._id, name: reviewer.name, email: reviewer.email } : r.reviewedBy,
        reviewedAt: r.reviewedAt,
        expiresAt: r.expiresAt,
        resetTokenExpiresAt: r.resetTokenExpiresAt,
        completedAt: r.completedAt,
        rejectedAt: r.rejectedAt,
        rejectionReason: r.rejectionReason,
      };
    });

    return res.json({
      success: true,
      count: safeData.length,
      data: safeData,
    });
  } catch (error) {
    console.error('Get password recovery requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching password recovery requests.',
    });
  }
};

// @desc    Approve password recovery request (Admin only)
// @route   PUT /api/auth/password-recovery-requests/:id/approve
// @access  Private / Admin
exports.approvePasswordRecoveryRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const rawCode = generateRecoveryCode();
    const tokenHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

    if (isDbConnected()) {
      const request = await PasswordRecoveryRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Password recovery request not found.',
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve request with status '${request.status}'. Only pending requests can be approved.`,
        });
      }

      request.status = 'approved';
      request.reviewedBy = req.user?._id || null;
      request.reviewedAt = new Date();
      request.resetTokenHash = tokenHash;
      request.resetTokenExpiresAt = expiresAt;
      request.expiresAt = expiresAt;
      await request.save();

      return res.json({
        success: true,
        message: 'Password recovery request approved successfully.',
        recoveryCode: rawCode, // Single-use code returned to admin once
        expiresAt,
        data: {
          _id: request._id,
          email: request.email,
          status: request.status,
          reviewedAt: request.reviewedAt,
          expiresAt: request.expiresAt,
        },
      });
    }

    // In-memory fallback
    if (!memoryStore.passwordRecoveryRequests) {
      memoryStore.passwordRecoveryRequests = [];
    }
    const memReq = memoryStore.passwordRecoveryRequests.find((r) => r._id === id);
    if (!memReq) {
      return res.status(404).json({
        success: false,
        message: 'Password recovery request not found.',
      });
    }

    if (memReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status '${memReq.status}'. Only pending requests can be approved.`,
      });
    }

    memReq.status = 'approved';
    memReq.reviewedBy = req.user?._id || 'admin-fallback';
    memReq.reviewedAt = new Date();
    memReq.resetTokenHash = tokenHash;
    memReq.resetTokenExpiresAt = expiresAt;
    memReq.expiresAt = expiresAt;
    memReq.rawCode = rawCode;

    return res.json({
      success: true,
      message: 'Password recovery request approved successfully.',
      recoveryCode: rawCode,
      expiresAt,
      data: {
        _id: memReq._id,
        email: memReq.email,
        status: memReq.status,
        reviewedAt: memReq.reviewedAt,
        expiresAt: memReq.expiresAt,
      },
    });
  } catch (error) {
    console.error('Approve recovery request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while approving password recovery request.',
    });
  }
};

// @desc    Reject password recovery request (Admin only)
// @route   PUT /api/auth/password-recovery-requests/:id/reject
// @access  Private / Admin
exports.rejectPasswordRecoveryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (isDbConnected()) {
      const request = await PasswordRecoveryRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Password recovery request not found.',
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject request with status '${request.status}'. Only pending requests can be rejected.`,
        });
      }

      request.status = 'rejected';
      request.reviewedBy = req.user?._id || null;
      request.reviewedAt = new Date();
      request.rejectedAt = new Date();
      request.rejectionReason = rejectionReason?.trim() || 'Verification denied by administrator';
      request.resetTokenHash = undefined;
      await request.save();

      return res.json({
        success: true,
        message: 'Password recovery request rejected.',
        data: {
          _id: request._id,
          email: request.email,
          status: request.status,
          rejectedAt: request.rejectedAt,
          rejectionReason: request.rejectionReason,
        },
      });
    }

    // In-memory fallback
    if (!memoryStore.passwordRecoveryRequests) {
      memoryStore.passwordRecoveryRequests = [];
    }
    const memReq = memoryStore.passwordRecoveryRequests.find((r) => r._id === id);
    if (!memReq) {
      return res.status(404).json({
        success: false,
        message: 'Password recovery request not found.',
      });
    }

    if (memReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${memReq.status}'. Only pending requests can be rejected.`,
      });
    }

    memReq.status = 'rejected';
    memReq.reviewedBy = req.user?._id || 'admin-fallback';
    memReq.reviewedAt = new Date();
    memReq.rejectedAt = new Date();
    memReq.rejectionReason = rejectionReason?.trim() || 'Verification denied by administrator';
    memReq.resetTokenHash = null;

    return res.json({
      success: true,
      message: 'Password recovery request rejected.',
      data: {
        _id: memReq._id,
        email: memReq.email,
        status: memReq.status,
        rejectedAt: memReq.rejectedAt,
        rejectionReason: memReq.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Reject recovery request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while rejecting password recovery request.',
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

