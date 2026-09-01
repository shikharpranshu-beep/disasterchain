const nodemailer = require('nodemailer');

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

const getFromEmail = () => {
  return process.env.EMAIL_FROM || 'DisasterChain Security <no-reply@disasterchain.org>';
};

/**
 * Creates nodemailer transporter based on environment variables
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback / Development mode
  return null;
};

/**
 * HTML Email wrapper template with DisasterChain stitch styling
 */
const renderEmailTemplate = ({ title, preheader, bodyHtml, actionUrl, actionText }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; padding: 32px 20px; }
    .card { background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .brand-icon { display: inline-block; width: 44px; height: 44px; line-height: 44px; font-size: 22px; border-radius: 12px; background: linear-gradient(135deg, #ef4444, #6366f1); text-align: center; margin-bottom: 12px; }
    .brand-title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.02em; }
    .brand-tag { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .content-title { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 16px 0 12px; }
    .content-body { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
    .note { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px; }
    .link-fallback { font-size: 11px; color: #64748b; word-break: break-all; margin-top: 16px; }
    .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 32px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand-icon">⛓️</div>
        <h1 class="brand-title">DisasterChain</h1>
        <div class="brand-tag">Transparent Emergency Response & Relief</div>
      </div>
      <div class="content-title">${title}</div>
      <div class="content-body">${bodyHtml}</div>
      ${actionUrl && actionText ? `
      <div class="btn-container">
        <a href="${actionUrl}" target="_blank" class="btn">${actionText}</a>
      </div>
      <div class="link-fallback">
        If the button above does not work, copy and paste this URL into your browser:<br>
        <a href="${actionUrl}" style="color: #818cf8;">${actionUrl}</a>
      </div>
      ` : ''}
      <div class="note">
        🔒 <strong>Security Notice:</strong> DisasterChain will never ask for your password via email. If you did not initiate this request, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} DisasterChain &bull; Decentralized Emergency Network<br>
      This is an automated transactional security message.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send Account Verification Email
 */
exports.sendVerificationEmail = async ({ email, name, token }) => {
  const frontendUrl = getFrontendUrl();
  const safeToken = encodeURIComponent(String(token).trim());
  const verificationUrl = `${frontendUrl}/verify-email?token=${safeToken}`;

  const subject = 'Verify your DisasterChain account';
  const html = renderEmailTemplate({
    title: 'Confirm Your Email Address',
    bodyHtml: `
      Hello <strong>${name || 'Citizen'}</strong>,<br><br>
      Thank you for registering with <strong>DisasterChain</strong>. To activate your account and gain full access to emergency alerts, SOS broadcasting, and community assistance tools, please verify your email address.
      <br><br>
      This link is valid for <strong>24 hours</strong>.
    `,
    actionUrl: verificationUrl,
    actionText: '✅ Verify Email Address',
  });

  const transporter = createTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: getFromEmail(),
        to: email,
        subject,
        html,
      });
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('⚠️ SMTP email sending error:', err.message);
      // Fall through to console log for testing
    }
  }

  // Development / fallback console log
  console.log('\n======================================================');
  console.log('📧 [DEV EMAIL SERVICE] ACCOUNT VERIFICATION EMAIL');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log('======================================================\n');

  return { success: true, mode: 'console', verificationUrl };
};

/**
 * Send Password Reset Email
 */
exports.sendPasswordResetEmail = async ({ email, name, token }) => {
  const frontendUrl = getFrontendUrl();
  const safeToken = encodeURIComponent(String(token).trim());
  const resetUrl = `${frontendUrl}/reset-password?token=${safeToken}`;

  const subject = 'Reset your DisasterChain password';
  const html = renderEmailTemplate({
    title: 'Password Reset Request',
    bodyHtml: `
      Hello <strong>${name || 'Citizen'}</strong>,<br><br>
      We received a request to reset the password for your DisasterChain account associated with <strong>${email}</strong>.
      <br><br>
      Click the button below to set a new password. This reset link expires in <strong>15 minutes</strong> for your protection.
      <br><br>
      If you did not request a password reset, please ignore this email and ensure your account credentials remain secure.
    `,
    actionUrl: resetUrl,
    actionText: '🔑 Reset My Password',
  });

  const transporter = createTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: getFromEmail(),
        to: email,
        subject,
        html,
      });
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('⚠️ SMTP email sending error:', err.message);
      // Fall through to console log
    }
  }

  console.log('\n======================================================');
  console.log('📧 [DEV EMAIL SERVICE] PASSWORD RESET EMAIL');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Password Reset URL: ${resetUrl}`);
  console.log('======================================================\n');

  return { success: true, mode: 'console', resetUrl };
};

/**
 * Send Password Changed Confirmation
 */
exports.sendPasswordChangedConfirmation = async ({ email, name }) => {
  const subject = 'Your DisasterChain password was changed';
  const html = renderEmailTemplate({
    title: 'Password Changed Successfully',
    bodyHtml: `
      Hello <strong>${name || 'Citizen'}</strong>,<br><br>
      This is a confirmation that the password for your DisasterChain account <strong>${email}</strong> was successfully updated.
      <br><br>
      If you made this change, no further action is required. If you did <strong>not</strong> make this change, please reset your password immediately and notify disaster response security.
    `,
    actionUrl: `${getFrontendUrl()}/login`,
    actionText: 'Sign In to Account',
  });

  const transporter = createTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: getFromEmail(),
        to: email,
        subject,
        html,
      });
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('⚠️ SMTP email sending error:', err.message);
    }
  }

  console.log('\n======================================================');
  console.log('📧 [DEV EMAIL SERVICE] PASSWORD CHANGED CONFIRMATION');
  console.log(`To: ${email}`);
  console.log('======================================================\n');

  return { success: true, mode: 'console' };
};
