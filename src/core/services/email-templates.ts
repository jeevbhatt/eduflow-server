/**
 * Email Templates for EduFlow
 * Using Resend for email delivery
 */

const BRAND_COLOR = '#6366f1'; // Indigo
const BRAND_NAME = 'EduFlow';
const BASE_URL = process.env.CLIENT_URL || 'https://eduflow.jeevanbhatt.com.np';

/**
 * Base email layout wrapper
 */
const emailLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">${BRAND_NAME}</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">Modern Education Management Platform</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #fafafa; border-top: 1px solid #e4e4e7; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;">
                This email was sent by ${BRAND_NAME}. If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
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
 * Button component for emails
 */
const emailButton = (text: string, url: string) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

/**
 * Email Verification - Welcome Email
 */
export const verificationEmail = (firstName: string, token: string) => {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b;">
      Welcome to ${BRAND_NAME}, ${firstName}! 🎉
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
      Thank you for creating an account. To get started, please verify your email address by clicking the button below.
    </p>
    ${emailButton('Verify Email Address', verifyUrl)}
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #71717a;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; font-size: 13px; color: ${BRAND_COLOR}; word-break: break-all;">
      ${verifyUrl}
    </p>
    <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        ⚠️ This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
  `;

  return {
    subject: `Verify your ${BRAND_NAME} account`,
    html: emailLayout(content),
  };
};

/**
 * Resend Verification Email
 */
export const resendVerificationEmail = (firstName: string, token: string) => {
  const verifyUrl = `${BASE_URL}/verify-email?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b;">
      Verify Your Email Address
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
      Hi ${firstName}, you requested a new verification link. Click the button below to verify your email address.
    </p>
    ${emailButton('Verify Email Address', verifyUrl)}
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #71717a;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0; font-size: 13px; color: ${BRAND_COLOR}; word-break: break-all;">
      ${verifyUrl}
    </p>
  `;

  return {
    subject: `Verify your ${BRAND_NAME} email`,
    html: emailLayout(content),
  };
};

/**
 * Email Verified Successfully
 */
export const emailVerifiedSuccessEmail = (firstName: string) => {
  const loginUrl = `${BASE_URL}/login`;

  const content = `
    <div style="text-align: center; padding: 24px 0;">
      <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
    </div>
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
      Email Verified Successfully!
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46; text-align: center;">
      Hi ${firstName}, your email has been verified. You can now access all features of ${BRAND_NAME}.
    </p>
    ${emailButton('Login to Your Account', loginUrl)}
  `;

  return {
    subject: `Your ${BRAND_NAME} email is verified!`,
    html: emailLayout(content),
  };
};

/**
 * Password Reset Email
 */
export const passwordResetEmail = (firstName: string, token: string) => {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b;">
      Reset Your Password
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
      Hi ${firstName}, we received a request to reset your password. Click the button below to create a new password.
    </p>
    ${emailButton('Reset Password', resetUrl)}
    <div style="padding: 16px; background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        ⚠️ If you didn't request a password reset, please ignore this email or contact support if you're concerned.
      </p>
    </div>
  `;

  return {
    subject: `Reset your ${BRAND_NAME} password`,
    html: emailLayout(content),
  };
};

/**
 * Security Alert Email - Notify Admins
 */
export const securityAlertEmail = (data: {
  trigger: string;
  ip: string;
  userAgent?: string;
  details?: string;
  timestamp?: string;
}) => {
  const content = `
    <div style="padding: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 24px;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #991b1b;">
        🚨 Security Alert Detected
      </h2>
    </div>

    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">
      Suspicious activity has been detected and blocked by the EduFlow Security System.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="background-color: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
      <tr>
        <td style="font-weight: 600; color: #71717a; width: 120px;">Trigger:</td>
        <td style="color: #18181b; font-family: monospace;">${data.trigger}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; color: #71717a;">IP Address:</td>
        <td style="color: #18181b; font-family: monospace;">${data.ip}</td>
      </tr>
      <tr>
        <td style="font-weight: 600; color: #71717a;">Time:</td>
        <td style="color: #18181b;">${data.timestamp || new Date().toLocaleString()}</td>
      </tr>
      ${data.userAgent ? `
      <tr>
        <td style="font-weight: 600; color: #71717a;">User Agent:</td>
        <td style="color: #18181b; font-size: 12px; word-break: break-all;">${data.userAgent}</td>
      </tr>
      ` : ''}
    </table>

    ${data.details ? `
    <div style="margin-top: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #71717a;">Additional Details:</h3>
      <div style="padding: 12px; background-color: #f4f4f5; border-radius: 4px; font-family: monospace; font-size: 13px; color: #18181b; white-space: pre-wrap;">${data.details}</div>
    </div>
    ` : ''}

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
      This IP has been temporarily restricted. If this activity persists, consider adding it to the permanent blocklist in the cloud firewall.
    </p>
  `;

  return {
    subject: `[SECURITY ALERT] ${data.trigger} detected on ${BRAND_NAME}`,
    html: emailLayout(content),
  };
};

export default {
  verificationEmail,
  resendVerificationEmail,
  emailVerifiedSuccessEmail,
  passwordResetEmail,
  securityAlertEmail,
};
