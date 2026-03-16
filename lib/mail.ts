// lib/mail.ts
import nodemailer from 'nodemailer';

/**
 * NODEMAILER EMAIL UTILITY
 * Premium email service for sending welcome credentials to newly onboarded users.
 * Uses Gmail SMTP with app-specific password from environment variables.
 */

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify transporter configuration on module load
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

/**
 * Send premium welcome email with login credentials
 * @param email - Recipient email address
 * @param password - Temporary password (plain text)
 * @param enrollmentNo - Student enrollment number (optional, for students only)
 * @param fullName - User's full name
 */
export async function sendWelcomeEmail({
    email,
    password,
    enrollmentNo,
    fullName,
}: {
    email: string;
    password: string;
    enrollmentNo?: string;
    fullName: string;
}) {
    try {
        // Premium HTML email template with dark theme matching the UI
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to POST_up</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0B1120 0%, #1a1f35 100%); min-height: 100vh;">
  
  <!-- Main Container -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0B1120 0%, #1a1f35 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(to right, #7c3aed, #6366f1); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to POST_up
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">
                Your account has been created successfully
              </p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px; color: #e5e7eb;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #f9fafb; font-weight: 500;">
                Hello ${fullName},
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                Your account has been created by the system administrator. Below are your login credentials. Please keep this information secure and change your password after your first login.
              </p>
              
              <!-- Credentials Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; margin: 0 0 30px 0; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    
                    <!-- Email -->
                    <div style="margin-bottom: 16px;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600;">
                        Email Address
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #f9fafb; font-weight: 500; font-family: 'Courier New', monospace;">
                        ${email}
                      </p>
                    </div>
                    
                    ${enrollmentNo ? `
                    <!-- Enrollment Number (Students Only) -->
                    <div style="margin-bottom: 16px;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600;">
                        Enrollment Number
                      </p>
                      <p style="margin: 0; font-size: 16px; color: #f9fafb; font-weight: 500; font-family: 'Courier New', monospace;">
                        ${enrollmentNo}
                      </p>
                    </div>
                    ` : ''}
                    
                    <!-- Temporary Password -->
                    <div>
                      <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 600;">
                        Temporary Password
                      </p>
                      <p style="margin: 0; font-size: 18px; color: #a78bfa; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                        ${password}
                      </p>
                    </div>
                    
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #fca5a5; font-weight: 600;">
                  🔒 Security Notice
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: #fecaca;">
                  This is a temporary password. For your security, please change it immediately after logging in. Never share your credentials with anyone.
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
                       style="display: inline-block; background: linear-gradient(to right, #7c3aed, #6366f1); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); transition: all 0.3s ease;">
                      Login to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Help Text -->
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center;">
                If you have any questions or need assistance, please contact your system administrator.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 30px; text-align: center; border-top: 1px solid rgba(99, 102, 241, 0.2);">
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #f9fafb; font-weight: 600;">
                POST_up Platform
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Project Showcase & Collaboration Hub
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} POST_up. All rights reserved.
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

        // Plain text fallback for email clients that don't support HTML
        const textContent = `
Welcome to POST_up, ${fullName}!

Your account has been created successfully. Below are your login credentials:

Email: ${email}
${enrollmentNo ? `Enrollment Number: ${enrollmentNo}\n` : ''}Temporary Password: ${password}

SECURITY NOTICE:
This is a temporary password. For your security, please change it immediately after logging in.
Never share your credentials with anyone.

Login here: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login

If you have any questions, please contact your system administrator.

---
POST_up Platform
Project Showcase & Collaboration Hub
© ${new Date().getFullYear()} POST_up. All rights reserved.
    `;

        // Send email
        const info = await transporter.sendMail({
            from: `"POST_up Platform" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🎉 Welcome to POST_up - Your Account is Ready',
            text: textContent,
            html: htmlContent,
        });

        console.log('✅ Welcome email sent successfully to:', email, '| Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send welcome email to:', email, '| Error:', error);
        throw error;
    }
}

/**
 * Send OTP email for password reset
 * @param email - Recipient email address
 * @param otp - One-time password reset code
 * @param fullName - User's full name (optional)
 */
export async function sendOtpEmail({
    email,
    otp,
    fullName,
}: {
    email: string;
    otp: string;
    fullName?: string;
}) {
    try {
        // Premium HTML email template with dark theme matching the UI
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - POST_up</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0B1120 0%, #1a1f35 100%); min-height: 100vh;">
  
  <!-- Main Container -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0B1120 0%, #1a1f35 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(to right, #7c3aed, #6366f1); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🔐 Password Reset
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">
                ${fullName ? `Hello ${fullName},` : 'Hello,'}
              </p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px; color: #e5e7eb;">
              
              <!-- OTP Code -->
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #f9fafb; font-weight: 500;">
                Your password reset code is:
              </p>
              
              <!-- OTP Display -->
              <div style="background: rgba(99, 102, 241, 0.1); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 36px; color: #ffffff; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 4px;">
                  ${otp}
                </p>
              </div>
              
              <!-- Instructions -->
              <p style="margin: 20px 0 0 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                This code will expire in <strong>10 minutes</strong>. Please use it to reset your password.
              </p>
              
              <!-- Security Notice -->
              <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0 0;">
                <p style="margin: 0; font-size: 14px; color: #fca5a5; font-weight: 600;">
                  🔒 Security Notice
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: #fecaca;">
                  If you didn't request this password reset, please ignore this email. For your security, never share this code with anyone.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Help Text -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 30px; text-align: center; border-top: 1px solid rgba(99, 102, 241, 0.2);">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                If you have any issues with the password reset process, please contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 30px; text-align: center; border-top: 1px solid rgba(99, 102, 241, 0.2);">
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #f9fafb; font-weight: 600;">
                POST_up Platform
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Secure Project Showcase & Collaboration Hub
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} POST_up. All rights reserved.
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

        // Plain text fallback for email clients that don't support HTML
        const textContent = `
Password Reset - POST_up

${fullName ? `Hello ${fullName},` : 'Hello,'}

Your password reset code is: ${otp}

This code will expire in 10 minutes. Please use it to reset your password.

If you didn't request this password reset, please ignore this email. For your security, never share this code with anyone.

If you have any issues with the password reset process, please contact our support team.

POST_up Platform
Secure Project Showcase & Collaboration Hub
© ${new Date().getFullYear()} POST_up. All rights reserved.
    `;

        // Send email
        const info = await transporter.sendMail({
            from: `"POST_up Platform" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Password Reset - POST_up',
            text: textContent,
            html: htmlContent,
        });

        console.log('✅ OTP email sent successfully to:', email, '| Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send OTP email to:', email, '| Error:', error);
        throw error;
    }
}

/**
 * Send password changed confirmation email
 * @param email - Recipient email address
 * @param fullName - User's full name (optional)
 */
export async function sendPasswordChangedEmail({
    email,
    fullName,
}: {
    email: string;
    fullName?: string;
}) {
    try {
        // Premium HTML email template with dark theme matching the UI
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - POST_up</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0B1120 0%, #1a1f35 100%); min-height: 100vh;">
  
  <!-- Main Container -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0B1120 0%, #1a1f35 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(to right, #10b981, #059669); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🔐 Password Changed Successfully
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">
                ${fullName ? `Hello ${fullName},` : 'Hello,'}
              </p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px; color: #e5e7eb;">
              
              <!-- Success Message -->
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 12px; padding: 24px; margin: 0 0 30px 0;">
                <p style="margin: 0; font-size: 18px; color: #10b981; font-weight: 600; text-align: center;">
                  ✅ Your password has been successfully changed
                </p>
              </div>
              
              <!-- Security Notice -->
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                This is a security notification to confirm that your password for POST_up was recently changed. If you made this change, no further action is required.
              </p>
              
              <!-- Important Security Warning -->
              <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 20px 0 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #fca5a5; font-weight: 600;">
                  🔒 Important Security Notice
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: #fecaca;">
                  If you did not change your password, please contact our support team immediately and secure your account.
                </p>
              </div>
              
              <!-- Action Items -->
              <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; margin: 0 0 30px 0;">
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb; font-weight: 600;">
                  📋 Recommended Actions:
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Review your account settings for any unauthorized changes</li>
                  <li style="margin-bottom: 8px;">Enable two-factor authentication if available</li>
                  <li style="margin-bottom: 0;">Log out from all devices and log back in with your new password</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" 
                       style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s ease;">
                      Login to Your Account
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Help Text -->
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9ca3af; text-align: center;">
                If you have any questions or concerns about your account security, please contact our support team.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.3); padding: 24px 30px; text-align: center; border-top: 1px solid rgba(99, 102, 241, 0.2);">
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #f9fafb; font-weight: 600;">
                POST_up Platform
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Secure Project Showcase & Collaboration Hub
              </p>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} POST_up. All rights reserved.
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

        // Plain text fallback for email clients that don't support HTML
        const textContent = `
Password Changed Successfully - POST_up

${fullName ? `Hello ${fullName},` : 'Hello,'}

This is a security notification to confirm that your password for POST_up was recently changed. If you made this change, no further action is required.

IMPORTANT SECURITY NOTICE:
If you did not change your password, please contact our support team immediately and secure your account.

RECOMMENDED ACTIONS:
- Review your account settings for any unauthorized changes
- Enable two-factor authentication if available
- Log out from all devices and log back in with your new password

Login here: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login

If you have any questions or concerns about your account security, please contact our support team.

POST_up Platform
Secure Project Showcase & Collaboration Hub
© ${new Date().getFullYear()} POST_up. All rights reserved.
    `;

        // Send email
        const info = await transporter.sendMail({
            from: `"POST_up Platform" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Password Changed Successfully - POST_up',
            text: textContent,
            html: htmlContent,
        });

        console.log('✅ Password changed email sent successfully to:', email, '| Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send password changed email to:', email, '| Error:', error);
        throw error;
    }
}
