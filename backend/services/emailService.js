const { Resend } = require('resend');

// ==========================================
// CONFIGURATION & PROVIDER CLIENT
// ==========================================

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

const getFrontendUrl = () => {
  // Production URL default must always match canonical deployment
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL || 'https://disasterchain.vercel.app';
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

const getFromEmail = () => {
  return (
    process.env.EMAIL_FROM ||
    'DisasterChain Emergency <onboarding@resend.dev>'
  );
};

const isDevMode = () => process.env.NODE_ENV !== 'production';

// Safe email masking helper for audit logging (never logs full emails or sensitive data)
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return 'unknown';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

const safeLog = (type, email, status, details = '') => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [EMAIL_${type.toUpperCase()}] Recipient: ${maskEmail(email)} | Status: ${status} ${details ? `| ${details}` : ''}`);
};

// ==========================================
// REUSABLE BRANDED HTML EMAIL TEMPLATE
// ==========================================

const renderEmailTemplate = ({
  title,
  badge = 'DISASTERCHAIN INTEL',
  badgeColor = '#00f0ff',
  bodyHtml,
  actionUrl,
  actionText,
  warningNote = '',
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
      background-color: #070b13;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070b13;
      padding: 36px 12px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0b111e;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .top-bar {
      height: 4px;
      background: linear-gradient(90deg, #00f0ff 0%, #818cf8 50%, #ff2e4d 100%);
    }
    .header {
      padding: 24px 28px 16px;
      border-bottom: 1px solid #1e293b;
      background-color: #0c1424;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: ${badgeColor};
      background: rgba(0, 240, 255, 0.08);
      border: 1px solid ${badgeColor}40;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .brand-tag {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .content {
      padding: 28px;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.65;
    }
    .content-heading {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 16px 0;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: #00f0ff;
      color: #05080e !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 13px 28px;
      border-radius: 6px;
      box-shadow: 0 4px 14px rgba(0, 240, 255, 0.25);
    }
    .link-box {
      background: #080d17;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 11px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 18px;
    }
    .warning-box {
      background: rgba(245, 158, 11, 0.08);
      border-left: 3px solid #f59e0b;
      padding: 10px 14px;
      font-size: 12px;
      color: #fcd34d;
      margin: 20px 0;
      border-radius: 0 4px 4px 0;
    }
    .footer {
      padding: 20px 28px;
      background-color: #070b13;
      border-top: 1px solid #1e293b;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }
    .footer a {
      color: #00f0ff;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="top-bar"></div>
      
      <div class="header">
        <div class="badge">${badge}</div>
        <div class="brand-title">DISASTERCHAIN</div>
        <div class="brand-tag">Decentralized Emergency Operations Network</div>
      </div>

      <div class="content">
        <div class="content-heading">${title}</div>
        ${bodyHtml}

        ${
          actionUrl && actionText
            ? `
          <div class="btn-container">
            <a href="${actionUrl}" target="_blank" class="btn">${actionText}</a>
          </div>
          <div class="link-box">
            If button is inactive, navigate to:<br>
            <a href="${actionUrl}" style="color: #00f0ff; text-decoration: underline;">${actionUrl}</a>
          </div>
        `
            : ''
        }

        ${warningNote ? `<div class="warning-box">⚠️ ${warningNote}</div>` : ''}
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} DisasterChain Global Network. All rights reserved.<br>
        This is an automated operational security dispatch. Never share verification or authentication links.
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// ==========================================
// PROVIDER DISPATCH ENGINE
// ==========================================

const sendEmail = async ({ to, subject, html, emailType, testUrl = '' }) => {
  const resend = getResendClient();
  const fromEmail = getFromEmail();

  // 1. In Development Mode, output clear zero-cost testing box to server console
  if (isDevMode()) {
    console.log('\n================================================================================');
    console.log(`🛠️  [DEVELOPMENT EMAIL MODE] TYPE: ${emailType.toUpperCase()}`);
    console.log(`👤 Recipient: ${maskEmail(to)}`);
    console.log(`📋 Subject: ${subject}`);
    if (testUrl) {
      console.log(`🔗 Action URL: ${testUrl}`);
      console.log('💡 Zero-cost testing active. Open URL in browser to test instantly without custom domain.');
    }
    console.log('================================================================================\n');
  }

  // 2. Dispatch via Resend if client is configured
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        safeLog(emailType, to, 'FAILED_PROVIDER_REJECTED', error.message);
        if (!isDevMode()) {
          // In production, record failure
          return { success: false, mode: 'resend', status: 'failed', error: error.message };
        }
      } else {
        safeLog(emailType, to, 'ACCEPTED_QUEUED', `Resend ID: ${data?.id}`);
        return { success: true, mode: 'resend', status: 'accepted', id: data?.id };
      }
    } catch (err) {
      safeLog(emailType, to, 'FAILED_EXCEPTION', err.message);
      if (!isDevMode()) {
        return { success: false, mode: 'resend', status: 'failed', error: err.message };
      }
    }
  } else {
    safeLog(emailType, to, isDevMode() ? 'DEV_SIMULATED' : 'SKIPPED_NO_API_KEY');
  }

  // Fallback for development / unconfigured environments
  return {
    success: true,
    mode: isDevMode() ? 'console' : 'none',
    status: isDevMode() ? 'sent' : 'unconfigured',
    testUrl,
  };
};

// ==========================================
// 1. REGISTRATION VERIFICATION EMAIL
// ==========================================
exports.sendVerificationEmail = async ({ email, name, token }) => {
  const frontendUrl = getFrontendUrl();
  const safeToken = encodeURIComponent(String(token).trim());
  const verificationUrl = `${frontendUrl}/verify-email?token=${safeToken}`;
  const subject = 'Verify your DisasterChain account';

  const html = renderEmailTemplate({
    title: 'Confirm Operator Identity',
    badge: 'IDENTITY VERIFICATION',
    badgeColor: '#00f0ff',
    bodyHtml: `
      Hello <strong>${name || 'Citizen'}</strong>,<br><br>
      Thank you for registering on the DisasterChain Emergency Network. To activate your account and access real-time SOS broadcasting, facility tracking, and crisis intelligence, please authenticate your email address.<br><br>
      This verification link is valid for <strong>24 hours</strong>.
    `,
    actionUrl: verificationUrl,
    actionText: '✅ Authenticate Email',
    warningNote: 'If you did not register for DisasterChain, please disregard this transmission.',
  });

  return await sendEmail({
    to: email,
    subject,
    html,
    emailType: 'verification',
    testUrl: verificationUrl,
  });
};

// ==========================================
// 2. FORGOT PASSWORD EMAIL
// ==========================================
exports.sendPasswordResetEmail = async ({ email, name, token }) => {
  const frontendUrl = getFrontendUrl();
  const safeToken = encodeURIComponent(String(token).trim());
  const resetUrl = `${frontendUrl}/reset-password?token=${safeToken}`;
  const subject = 'Reset your DisasterChain password';

  const html = renderEmailTemplate({
    title: 'Password Reset Request',
    badge: 'CREDENTIAL SECURITY',
    badgeColor: '#f59e0b',
    bodyHtml: `
      Hello <strong>${name || 'Citizen'}</strong>,<br><br>
      We received a request to reset the password for your DisasterChain account associated with <strong>${maskEmail(email)}</strong>.<br><br>
      Click the button below to establish a new password. For your security, this reset link expires in <strong>15 minutes</strong>.
    `,
    actionUrl: resetUrl,
    actionText: '🔑 Reset Operator Password',
    warningNote: 'DisasterChain operators will never ask for your password. If you did not initiate this request, verify your account security immediately.',
  });

  return await sendEmail({
    to: email,
    subject,
    html,
    emailType: 'password_reset',
    testUrl: resetUrl,
  });
};

// ==========================================
// 3. PASSWORD CHANGED CONFIRMATION EMAIL
// ==========================================
exports.sendPasswordChangedEmail = async ({ email, name }) => {
  const subject = 'Security Alert: Your DisasterChain password was changed';
  const loginUrl = `${getFrontendUrl()}/login`;

  const html = renderEmailTemplate({
    title: 'Password Successfully Updated',
    badge: 'SECURITY NOTIFICATION',
    badgeColor: '#10b981',
    bodyHtml: `
      Hello <strong>${name || 'Citizen'}</strong>,<br><br>
      This notification confirms that the password for your DisasterChain account was successfully updated on <strong>${new Date().toUTCString()}</strong>.<br><br>
      If you authorized this change, no further action is required. If you did not initiate this update, your credentials may be compromised.
    `,
    actionUrl: loginUrl,
    actionText: 'Sign In to Secure Account',
    warningNote: 'If this was unauthorized, contact your command center administrator or use forgot password to re-secure your access.',
  });

  return await sendEmail({
    to: email,
    subject,
    html,
    emailType: 'password_changed',
  });
};

// ==========================================
// 4. WELCOME EMAIL (POST-VERIFICATION)
// ==========================================
exports.sendWelcomeEmail = async ({ email, name, role = 'citizen' }) => {
  const subject = 'Welcome to DisasterChain — Account Verified';
  const dashboardUrl = `${getFrontendUrl()}/dashboard`;

  const roleDisplay = {
    citizen: 'Citizen / Campus Resident',
    volunteer: 'Volunteer Responder',
    ngo: 'NGO Relief Coordinator',
    responder: 'Frontline First Responder',
    admin: 'Command Administrator',
  }[role] || 'Operator';

  const html = renderEmailTemplate({
    title: `Welcome, ${name || 'Operator'}`,
    badge: 'ONBOARDING COMPLETE',
    badgeColor: '#10b981',
    bodyHtml: `
      Your DisasterChain account has been successfully verified with role clearance: <strong>${roleDisplay}</strong>.<br><br>
      <strong>Operational Guidelines:</strong>
      <ul>
        <li><strong>Emergency SOS:</strong> Use the 6-stage distress beacon only for genuine life-safety emergencies.</li>
        <li><strong>Shelter & Resource Radar:</strong> Check live capacity and distribution channels before dispatching relief.</li>
        <li><strong>Transparency Ledger:</strong> All resource distributions and donations are cryptographically logged on-chain.</li>
      </ul>
    `,
    actionUrl: dashboardUrl,
    actionText: 'Launch Mission Control',
  });

  return await sendEmail({
    to: email,
    subject,
    html,
    emailType: 'welcome',
  });
};

// ==========================================
// 5. EMERGENCY ALERT NOTIFICATION EMAIL
// ==========================================
exports.sendAlertEmail = async ({ recipient, alert, user }) => {
  // Check user preference for critical alerts
  if (user?.notificationPreferences && user.notificationPreferences.criticalAlerts === false) {
    safeLog('alert', recipient, 'SUPPRESSED_USER_PREFERENCE');
    return { success: true, status: 'suppressed_preference' };
  }

  const severityColor = alert.severity === 'Critical' ? '#ff2e4d' : '#f59e0b';
  const subject = `[${alert.severity?.toUpperCase() || 'URGENT'}] Emergency Broadcast: ${alert.title}`;
  const alertUrl = `${getFrontendUrl()}/alerts`;

  const html = renderEmailTemplate({
    title: alert.title,
    badge: `${alert.severity?.toUpperCase() || 'EMERGENCY'} BROADCAST`,
    badgeColor: severityColor,
    bodyHtml: `
      A priority emergency alert has been broadcasted by disaster operations command:<br><br>
      <strong>Category:</strong> ${alert.category || 'Disaster Alert'}<br>
      <strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: 800;">${alert.severity}</span><br>
      <strong>Affected Area:</strong> ${alert.affectedArea || 'Regional'}<br><br>
      <strong>Directives:</strong><br>
      ${alert.description || alert.message || 'Follow local authority safety directives immediately.'}
    `,
    actionUrl: alertUrl,
    actionText: 'View Emergency Broadcast',
  });

  return await sendEmail({
    to: recipient,
    subject,
    html,
    emailType: 'emergency_alert',
  });
};

// ==========================================
// 6. SOS EMERGENCY NOTIFICATION EMAIL (ROLE-RESTRICTED)
// ==========================================
exports.sendSosNotificationEmail = async ({ recipient, sosRequest, user }) => {
  // SOS emails are restricted to responders and admins
  const allowedRoles = ['responder', 'admin'];
  if (user && !allowedRoles.includes(user.role)) {
    safeLog('sos_alert', recipient, 'BLOCKED_ROLE_UNAUTHORIZED');
    return { success: false, status: 'unauthorized_role' };
  }

  const subject = `🚨 CRITICAL SOS DISPATCH: ${sosRequest.requestId || 'EMERGENCY'} (${sosRequest.emergencyType})`;
  const sosUrl = `${getFrontendUrl()}/sos`;

  const html = renderEmailTemplate({
    title: `Emergency Distress Call: ${sosRequest.requestId}`,
    badge: 'PRIORITY 1 DISPATCH',
    badgeColor: '#ff2e4d',
    bodyHtml: `
      An emergency SOS distress beacon has been registered and requires triage:<br><br>
      <strong>Distress Type:</strong> ${sosRequest.emergencyType}<br>
      <strong>Severity:</strong> <span style="color: #ff2e4d; font-weight: 800;">${sosRequest.severity}</span><br>
      <strong>Contact:</strong> ${sosRequest.contactNumber || 'Reported on-scene'}<br>
      <strong>Location Coordinates:</strong> ${sosRequest.latitude || 'GPS'}, ${sosRequest.longitude || 'GPS'}<br><br>
      <strong>Field Description:</strong><br>
      <em>"${sosRequest.description || 'Immediate responder assistance requested.'}"</em>
    `,
    actionUrl: sosUrl,
    actionText: 'Access SOS Dispatch Queue',
  });

  return await sendEmail({
    to: recipient,
    subject,
    html,
    emailType: 'sos_dispatch',
  });
};

// ==========================================
// 7. RESOURCE NOTIFICATION EMAIL
// ==========================================
exports.sendResourceNotificationEmail = async ({ recipient, resource, user }) => {
  if (user?.notificationPreferences && user.notificationPreferences.resourceUpdates === false) {
    safeLog('resource', recipient, 'SUPPRESSED_USER_PREFERENCE');
    return { success: true, status: 'suppressed_preference' };
  }

  const subject = `Resource Status Update: ${resource.name} (${resource.status})`;
  const resourceUrl = `${getFrontendUrl()}/resources`;

  const html = renderEmailTemplate({
    title: `Resource Inventory Update`,
    badge: 'RELIEF SUPPLY CHAIN',
    badgeColor: '#818cf8',
    bodyHtml: `
      A relief supply resource update was logged:<br><br>
      <strong>Resource:</strong> ${resource.name} (${resource.type || 'Supplies'})<br>
      <strong>Status:</strong> ${resource.status || 'Available'}<br>
      <strong>Quantity:</strong> ${resource.quantity || 0} ${resource.unit || 'units'}<br>
      <strong>Location:</strong> ${resource.location || 'Central Depot'}
    `,
    actionUrl: resourceUrl,
    actionText: 'View Resource Directory',
  });

  return await sendEmail({
    to: recipient,
    subject,
    html,
    emailType: 'resource_update',
  });
};

// ==========================================
// 8. DISTRIBUTION NOTIFICATION EMAIL
// ==========================================
exports.sendDistributionNotificationEmail = async ({ recipient, distribution, user }) => {
  if (user?.notificationPreferences && user.notificationPreferences.distributionUpdates === false) {
    safeLog('distribution', recipient, 'SUPPRESSED_USER_PREFERENCE');
    return { success: true, status: 'suppressed_preference' };
  }

  const subject = `Relief Distribution Update: ${distribution.distributionId || 'AID'} (${distribution.status})`;
  const trackingUrl = `${getFrontendUrl()}/resource-tracking`;

  const html = renderEmailTemplate({
    title: `Relief Distribution Status: ${distribution.status}`,
    badge: 'AID DISPATCH',
    badgeColor: '#10b981',
    bodyHtml: `
      Relief aid movement has progressed along the tracking pipeline:<br><br>
      <strong>Manifest ID:</strong> ${distribution.distributionId || 'N/A'}<br>
      <strong>Current Stage:</strong> <span style="color: #10b981; font-weight: 800;">${distribution.status}</span><br>
      <strong>Destination:</strong> ${distribution.targetLocation || 'Assigned Zone'}<br>
      <strong>Beneficiaries:</strong> ~${distribution.beneficiaryCount || 0} people assisted
    `,
    actionUrl: trackingUrl,
    actionText: 'Track Supply Chain Pipeline',
  });

  return await sendEmail({
    to: recipient,
    subject,
    html,
    emailType: 'distribution_update',
  });
};

// ==========================================
// 9. RESEND DELIVERY STATUS INSPECTION
// ==========================================
exports.getEmailDeliveryStatus = async (emailId) => {
  const resend = getResendClient();
  if (!resend) {
    return { available: false, reason: 'RESEND_API_KEY is not configured on this instance' };
  }
  try {
    const res = await resend.emails.get(emailId);
    if (res.error) {
      return { available: false, error: res.error };
    }
    return {
      available: true,
      id: res.data?.id,
      to: res.data?.to?.map(maskEmail),
      from: res.data?.from,
      subject: res.data?.subject,
      lastEvent: res.data?.last_event || 'sent',
      createdAt: res.data?.created_at,
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
};

// Backward compatibility alias
exports.sendPasswordChangedConfirmation = exports.sendPasswordChangedEmail;