/**
 * Premium Email Templates for EduFlow
 * Designed for maximum readability and a professional, high-end feel.
 */

const BRAND_COLOR = '#6366f1'; // Premium Indigo
const BRAND_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
const BRAND_NAME = 'EduFlow';
const BASE_URL = process.env.CLIENT_URL || 'https://eduflow.jeevanbhatt.com.np';

/**
 * Base email layout wrapper with premium aesthetics
 */
const emailLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content { padding: 30px 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #09090b !important; }
      .main-card { background-color: #18181b !important; color: #f4f4f5 !important; border: 1px solid #27272a !important; }
      .header-text { color: #f4f4f5 !important; }
      .sub-text { color: #a1a1aa !important; }
      .footer { background-color: #111113 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" style="width: 600px; margin: 0 auto;">
          <tr>
            <td>
              <div class="main-card" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #f1f5f9; overflow: hidden;">

                <!-- Logo/Header -->
                <div style="background: ${BRAND_GRADIENT}; padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; text-transform: lowercase;">${BRAND_NAME}<span style="color: rgba(255,255,255,0.7);">.</span></h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;">Elevating Modern Education</p>
                </div>

                <!-- Body content -->
                <div class="content" style="padding: 48px 40px;">
                  ${content}
                </div>

                <!-- Footer area -->
                <div class="footer" style="padding: 32px 40px; text-align: center; background-color: #fcfcfd; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                    This communication was sent by <strong>${BRAND_NAME}</strong> Security. If this wasn't intended for you, please disregard this email.
                  </p>
                  <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 16px;">
                    <a href="${BASE_URL}" style="text-decoration: none; color: ${BRAND_COLOR}; font-size: 12px; font-weight: 600;">Dashboard</a>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <a href="${BASE_URL}/support" style="text-decoration: none; color: #64748b; font-size: 12px;">Support</a>
                  </div>
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                    &copy; ${new Date().getFullYear()} EDUFLOW TECHNOLOGIES. ALL RIGHTS RESERVED.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Premium CTA button component
 */
const emailButton = (text: string, url: string) => `
  <div style="text-align: center; padding: 32px 0;">
    <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 36px; background: ${BRAND_GRADIENT}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
      ${text}
    </a>
  </div>
`;

/**
 * 1. Email Verification
 */
export const verificationEmail = (firstName: string, token: string) => {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
      Welcome to the future of learning, ${firstName}! 👋
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #475569;">
      We're thrilled to have you at <strong>${BRAND_NAME}</strong>. To unlock your workspace and start exploring, please verify your email address.
    </p>
    ${emailButton('Verify My Account', verifyUrl)}
    <div style="margin-top: 32px; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase;">Direct Link</p>
      <p style="margin: 0; font-size: 13px; color: ${BRAND_COLOR}; word-break: break-all; opacity: 0.8;">${verifyUrl}</p>
    </div>
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8; font-style: italic;">
      Note: This secure link expires in 24 hours.
    </p>
  `;

  return {
    subject: `Verify your ${BRAND_NAME} identity`,
    html: emailLayout(content),
  };
};

/**
 * 2. Password Reset
 */
export const passwordResetEmail = (firstName: string, token: string) => {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
      Reset your password 🔐
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #475569;">
      Hello ${firstName}, we received a request to recalibrate your account security. Use the button below to establish a new password.
    </p>
    ${emailButton('Establish New Password', resetUrl)}
    <div style="margin-top: 32px; padding: 20px; background-color: #fef2f2; border-radius: 12px; border: 1px solid #fee2e2;">
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #991b1b;">
        <strong>Safety First:</strong> If you did not initiate this request, your account may be secure but we recommend updating your password just in case.
      </p>
    </div>
  `;

  return {
    subject: `Reset your ${BRAND_NAME} password`,
    html: emailLayout(content),
  };
};

/**
 * 3. Security Alert
 */
export const securityAlertEmail = (data: {
  trigger: string;
  ip: string;
  userAgent?: string;
  details?: string;
  timestamp?: string;
}) => {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">🛡️</span>
      <h2 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 800; color: #ef4444;">Enhanced Security Notification</h2>
    </div>

    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #475569;">
      Our intelligent monitoring system has flagged an unusual activity pattern on your ${BRAND_NAME} infrastructure.
    </p>

    <div style="background-color: #0f172a; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="8">
        <tr>
            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase;">Event Type</td>
            <td style="color: #ffffff; font-family: 'Courier New', monospace; font-weight: 600;">${data.trigger}</td>
        </tr>
        <tr>
            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase;">Origin IP</td>
            <td style="color: #6366f1; font-family: 'Courier New', monospace; font-weight: 600;">${data.ip}</td>
        </tr>
        <tr>
            <td style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase;">Timestamp</td>
            <td style="color: #ffffff; font-size: 14px;">${data.timestamp || new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>

    ${data.details ? `
      <div style="margin-top: 16px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;">Technical Details</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #334155; border: 1px solid #e2e8f0;">${data.details}</div>
      </div>
    ` : ''}

    <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #64748b;">
      No further action is required from your side at this moment. The source has been automatically restricted.
    </p>
  `;

  return {
    subject: `[ALERT] Security event detected on ${BRAND_NAME}`,
    html: emailLayout(content),
  };
};

/**
 * 4. Success Notification (Email Verified)
 */
export const emailVerifiedSuccessEmail = (firstName: string) => {
    const loginUrl = `${BASE_URL}/login`;

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto;">
           <span style="font-size: 40px; line-height: 80px;">✨</span>
        </div>
        <h2 style="margin: 24px 0 12px 0; font-size: 26px; font-weight: 800; color: #059669; letter-spacing: -0.025em;">
          Authentication Successful!
        </h2>
      </div>
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: #475569; text-align: center;">
        Bravo, ${firstName}! Your account is now fully verified and secured. You're all set to experience the full power of <strong>${BRAND_NAME}</strong>.
      </p>
      ${emailButton('Access My Dashboard', loginUrl)}
      <p style="margin: 0; font-size: 14px; text-align: center; color: #94a3b8;">
        Need help getting started? Check out our <a href="${BASE_URL}/docs" style="color: ${BRAND_COLOR}; text-decoration: none;">documentation</a>.
      </p>
    `;

    return {
      subject: `Your ${BRAND_NAME} identity is verified!`,
      html: emailLayout(content),
    };
  };

export default {
  verificationEmail,
  emailVerifiedSuccessEmail,
  passwordResetEmail,
  securityAlertEmail,
};
