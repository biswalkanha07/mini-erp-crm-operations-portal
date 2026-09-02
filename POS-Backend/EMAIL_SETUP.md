# Email Configuration Setup

## Environment Variables Required

Add these variables to your `.env` file:

```env
# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS` (not your regular Gmail password)

## Other Email Services

You can modify the email service in `utils/emailService.js` to use other providers:

### Outlook/Hotmail
```javascript
service: 'hotmail',
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}
```

### Custom SMTP
```javascript
host: 'smtp.your-provider.com',
port: 587,
secure: false,
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}
```

## Testing

You can test the email functionality by calling:
- `POST /auth/forgot-password` with `{ "email": "user@example.com" }`
- Check the email for the reset link
- Use the token to reset password via `POST /auth/reset-password`
