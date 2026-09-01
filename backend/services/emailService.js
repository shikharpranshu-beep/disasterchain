const { Resend } = require('resend');

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

const getFromEmail = () => {
  return (
    process.env.EMAIL_FROM ||
    'DisasterChain Security <onboarding@resend.dev>'
  );
};

/**
 * HTML Email Template
 */
const renderEmailTemplate = ({
  title,
  bodyHtml,
  actionUrl,
  actionText,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #090d16;
      font-family: Arial, sans-serif;
      color: #f8fafc;
    }

    .container {
      max-width: 580px;
      margin: 0 auto;
      padding: 32px 20px;
    }

    .card {
      background-color: #0f172a;
      border-radius: 16px;
      padding: 32px 24px;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
    }

    .brand-tag {
      font-size: 12px;
      color: #94a3b8;
    }

    .content-title {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      margin: 16px 0 12px;
    }

    .content-body {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }

    .btn-container {
      text-align: center;
      margin: 28px 0;
    }

    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 8px;
    }

    .link-fallback {
      font-size: 11px;
      color: #64748b;
      word-break: break-all;
      margin-top: 16px;
    }

    .note {
      margin-top: 24px;
      padding: 12px 16px;
      font-size: 12px;
      color: #94a3b8;
    }

    .footer {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 32px;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="card">

      <div class="header">
        <h1 class="brand-title">⛓️ DisasterChain</h1>
        <div class="brand-tag">
          Transparent Emergency Response & Relief
        </div>
      </div>

      <div class="content-title">
        ${title}
      </div>

      <div class="content-body">
        ${bodyHtml}
      </div>

      ${actionUrl && actionText
      ? `
        <div class="btn-container">
          <a
            href="${actionUrl}"
            target="_blank"
            class="btn"
          >
            ${actionText}
          </a>
        </div>

        <div class="link-fallback">
          If the button does not work, copy this URL:<br>
          <a href="${actionUrl}">
            ${actionUrl}
          </a>
        </div>
      `
      : ''
    }

      <div class="note">
        🔒 DisasterChain will never ask for your password via email.
      </div>

    </div>

    <div class="footer">
      © ${new Date().getFullYear()} DisasterChain
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
      Thank you for registering with <strong>DisasterChain</strong>.<br><br>
      Please verify your email address to activate your account.<br><br>
      This link is valid for <strong>24 hours</strong>.
    `,
    actionUrl: verificationUrl,
    actionText: '✅ Verify Email Address',
  });

  const resend = getResendClient();

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: getFromEmail(),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend verification error:', error);
        throw new Error(error.message || 'Failed to send verification email');
      }

      console.log('✅ Verification email sent via Resend:', data?.id);
      return { success: true, mode: 'resend', id: data?.id };
    } catch (err) {
      console.error('❌ Resend verification email error:', err.message);
      // Fall through to console fallback if key has issues in test
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
      We received a request to reset the password for your DisasterChain account associated with <strong>${email}</strong>.<br><br>
      Click the button below to set a new password. This reset link expires in <strong>15 minutes</strong>.<br><br>
      If you did not request a password reset, please ignore this email.
    `,
    actionUrl: resetUrl,
    actionText: '🔑 Reset My Password',
  });

  const resend = getResendClient();

  if (resend) {
    try {
      console.log('📧 Sending password reset email via Resend to:', email);
      const { data, error } = await resend.emails.send({
        from: getFromEmail(),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend password reset error:', error);
        throw new Error(error.message || 'Failed to send password reset email');
      }

      console.log('✅ Password reset email sent via Resend:', data?.id);
      return { success: true, mode: 'resend', id: data?.id };
    } catch (err) {
      console.error('❌ Password reset email error:', err.message);
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
      The password for your DisasterChain account <strong>${email}</strong> was successfully updated.<br><br>
      If you did not make this change, please reset your password immediately.
    `,
    actionUrl: `${getFrontendUrl()}/login`,
    actionText: 'Sign In to Account',
  });

  const resend = getResendClient();

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: getFromEmail(),
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend password-change error:', error);
      } else {
        console.log('✅ Password-change email sent via Resend:', data?.id);
        return { success: true, mode: 'resend', id: data?.id };
      }
    } catch (err) {
      console.error('❌ Password-change email error:', err.message);
    }
  }

  console.log('\n======================================================');
  console.log('📧 [DEV EMAIL SERVICE] PASSWORD CHANGED CONFIRMATION');
  console.log(`To: ${email}`);
  console.log('======================================================\n');

  return { success: true, mode: 'console' };
};