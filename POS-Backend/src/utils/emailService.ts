/**
 * Email Service Utility
 * Phase 3 - Mini ERP + CRM Operations Portal
 *
 * Handles store signup notifications and password reset emails using Nodemailer.
 */

import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email configuration
export const createTransporter = (): Transporter<SentMessageInfo> => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'hgeshwar1@gmail.com',
      pass: process.env.EMAIL_PASS || 'vlmf xncj xgre mneq'
    }
  });
};

// Professional email template for store signup
export const createStoreSignupEmail = (
  storeId: string,
  storeName: string,
  contactPersonName: string,
  signupLink: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Suguna Chicken POS System</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #e74c3c;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #e74c3c;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background-color: #e74c3c;
                color: #ffffff;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #c0392b;
            }
            .store-info {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #e74c3c;
            }
            .footer {
                border-top: 1px solid #eee;
                padding-top: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🐔 Suguna Chicken</div>
                <p>Point of Sale Management System</p>
            </div>
            
            <div class="content">
                <h2>Welcome to Suguna Chicken POS System!</h2>
                <p>Hello ${contactPersonName},</p>
                
                <p>Congratulations! Your store has been successfully registered in our POS system. Please complete your account setup by clicking the button below to set your password and start using the system.</p>
                
                <div class="store-info">
                    <h3>Store Information</h3>
                    <p><strong>Store ID:</strong> ${storeId}</p>
                    <p><strong>Store Name:</strong> ${storeName}</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${signupLink}" class="button">Complete Store Setup</a>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Click the button above to complete your account setup</li>
                    <li>Set a secure password for your store account</li>
                    <li>Log in to access your store dashboard</li>
                    <li>Start managing your inventory and sales</li>
                </ul>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${signupLink}
                </p>
                
                <p><strong>Important:</strong> This link is unique to your store and should not be shared with others.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent from Suguna Chicken POS System. Please do not reply to this email.</p>
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; 2024 Suguna Chicken. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Professional email template for password reset
export const createPasswordResetEmail = (userName: string, resetLink: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: #ffffff;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #0056b3;
            }
            .footer {
                border-top: 1px solid #eee;
                padding-top: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">POS System</div>
                <p>Point of Sale Management</p>
            </div>
            
            <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello ${userName},</p>
                
                <p>We received a request to reset your password for your POS System account. If you made this request, please click the button below to set a new password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset My Password</a>
                </div>
                
                <p><strong>Important Security Information:</strong></p>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                </ul>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${resetLink}
                </p>
            </div>
            
            <div class="footer">
                <p>This email was sent from POS System. Please do not reply to this email.</p>
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; 2024 POS System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send store signup email
export const sendStoreSignupEmail = async (
  email: string,
  storeId: string,
  storeName: string,
  contactPersonName: string,
  signupLink: string
): Promise<EmailResult> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: `Welcome to Suguna Chicken POS - Store ${storeId} Setup`,
      html: createStoreSignupEmail(storeId, storeName, contactPersonName, signupLink)
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Error sending store signup email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  userName: string,
  resetLink: string
): Promise<EmailResult> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request - POS System',
      html: createPasswordResetEmail(userName, resetLink)
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendPasswordResetEmail,
  sendStoreSignupEmail,
  createTransporter
};
