# Password Reset System - Environment Configuration

This document explains the environment variables required for the password reset system to function properly.

## Required Environment Variables

Add the following variables to your `.env.local` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=Post-Up <noreply@postup.com>

# NextAuth Configuration (should already exist)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# MongoDB Configuration (should already exist)
MONGODB_URI=your-mongodb-connection-string
```

## Email Provider Setup

### Using Gmail

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "Post-Up"
   - Click "Generate"
   - Copy the 16-character password

3. **Update .env.local**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASSWORD=the-16-character-app-password
   EMAIL_FROM=Post-Up <noreply@postup.com>
   ```

### Using Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASSWORD=your-mailgun-smtp-password
```

## Testing Email Configuration

After setting up your environment variables, restart your development server:

```bash
npm run dev
```

The email configuration will be verified on startup. Look for this message in your console:

```
✅ Email server is ready to send messages
```

If you see an error, double-check your credentials and SMTP settings.

## Security Notes

- **Never commit `.env.local` to version control** - it's already in `.gitignore`
- Use app-specific passwords instead of your main email password
- For production, consider using a dedicated email service like SendGrid or Mailgun
- The `EMAIL_FROM` address doesn't need to match your `EMAIL_USER` for most providers

## Troubleshooting

### "Invalid login" error
- Verify your email and password are correct
- For Gmail, ensure you're using an app password, not your regular password
- Check if 2FA is enabled (required for Gmail app passwords)

### "Connection timeout" error
- Check your firewall settings
- Verify the SMTP host and port are correct
- Some networks block port 587; try port 465 with `secure: true`

### Emails not being received
- Check spam/junk folder
- Verify the recipient email address is correct
- Check your email provider's sending limits
- Review server logs for any error messages
