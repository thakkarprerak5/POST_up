// lib/mail.ts
import nodemailer from 'nodemailer';

// Email configuration from environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

/**
 * Send OTP email to user for password reset
 * @param to - Recipient email address
 * @param otp - 6-digit OTP code
 * @returns Promise that resolves when email is sent
 */
export async function sendOtpEmail(
  to: string,
  otp: string
): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      'Missing email credentials. Please add EMAIL_USER and EMAIL_PASSWORD to your .env.local file.'
    );
  }

  const emailFrom = process.env.EMAIL_FROM || 'Post-Up <noreply@postup.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Password Reset Code</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          padding: 48px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header .icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .content {
          padding: 48px 40px;
          text-align: center;
        }
        .content p {
          color: #374151;
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }
        .otp-container {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 32px;
          margin: 32px 0;
        }
        .otp-label {
          color: #1e40af;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .otp-code {
          font-size: 48px;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin: 0;
        }
        .expiry-notice {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px 20px;
          margin: 32px 0;
          border-radius: 8px;
          text-align: left;
        }
        .expiry-notice p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
          font-weight: 500;
        }
        .security-notice {
          background-color: #f9fafb;
          padding: 24px;
          margin: 32px 0;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .security-notice p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
        }
        .footer {
          background-color: #f9fafb;
          padding: 32px 40px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🔐</div>
          <h1>Password Reset Code</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px; color: #111827; font-weight: 500;">Hello there!</p>
          <p>We received a request to reset your Post-Up account password. Use the verification code below to proceed:</p>
          
          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <p class="otp-code">${otp}</p>
          </div>
          
          <div class="expiry-notice">
            <p>⏰ <strong>This code expires in 15 minutes</strong> for your security. Please use it promptly.</p>
          </div>
          
          <div class="security-notice">
            <p><strong>Didn't request this?</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.</p>
          </div>
        </div>
        <div class="footer">
          <p><strong>Post-Up Security Team</strong></p>
          <p style="margin-top: 8px;">© ${new Date().getFullYear()} Post-Up. All rights reserved.</p>
          <p style="margin-top: 8px;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Code - Post-Up

Hello,

We received a request to reset your Post-Up account password.

Your verification code is: ${otp}

This code expires in 15 minutes for your security.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Post-Up. All rights reserved.
This is an automated message, please do not reply.
  `;

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject: 'Your Password Reset Code - Post-Up',
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ OTP email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * Send password change confirmation email
 * @param to - Recipient email address
 */
export async function sendPasswordChangedEmail(to: string): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️ Missing email credentials. Skipping password changed email.');
    return;
  }

  const emailFrom = process.env.EMAIL_FROM || 'Post-Up <noreply@postup.com>';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f3f4f6;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content p {
          color: #374151;
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }
        .warning-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .warning-box p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 25px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>This email confirms that your Post-Up account password was successfully changed.</p>
          
          <div class="warning-box">
            <p><strong>⚠️ If you didn't make this change,</strong> please contact our support team immediately and secure your account.</p>
          </div>
          
          <p>For your security, we recommend:</p>
          <ul style="color: #374151; line-height: 1.8;">
            <li>Using a strong, unique password</li>
            <li>Not sharing your password with anyone</li>
            <li>Enabling two-factor authentication if available</li>
          </ul>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Post-Up. All rights reserved.</p>
          <p style="margin-top: 8px;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Changed

Hello,

This email confirms that your Post-Up account password was successfully changed.

If you didn't make this change, please contact our support team immediately and secure your account.

For your security, we recommend:
- Using a strong, unique password
- Not sharing your password with anyone
- Enabling two-factor authentication if available

© ${new Date().getFullYear()} Post-Up. All rights reserved.
This is an automated message, please do not reply.
  `;

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject: 'Your Password Has Been Changed - Post-Up',
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ Password changed confirmation email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending password changed email:', error);
    // Don't throw error for confirmation emails - it's not critical
  }
}
