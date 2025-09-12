import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class PasswordResetMail extends BaseMail {
  from = env.get('SMTP_USERNAME', 'noreply@datflix.com')
  subject = 'Reset Your DATFLIX Password'

  constructor(
    private email: string,
    private resetUrl: string,
    private userName: string
  ) {
    super()
  }

  /**
   * The prepare method is invoked automatically when
   * the email is sent
   */
  prepare() {
    this.message.to(this.email)
    this.message.html(this.getHtmlContent())
    this.message.text(this.getTextContent())
  }

  private getHtmlContent() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Your DATFLIX Password</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              a {
                  color: inherit;
                  text-decoration: none;
              }
              a:link, a:visited, a:hover, a:active {
                  color: inherit;
                  text-decoration: none;
              }
              body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  background-color: #000000;
                  color: #ffffff;
                  line-height: 1.5;
              }
              .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #000000;
              }
              .header {
                  background: #E50914;
                  padding: 40px 30px;
                  text-align: center;
                  position: relative;
              }
              .logo {
                  font-size: 48px;
                  font-weight: 900;
                  letter-spacing: 4px;
                  margin-bottom: 15px;
                  color: #ffffff;
                  font-family: 'Arial Black', Arial, sans-serif;
                  text-transform: uppercase;
                  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              }
              .tagline {
                  font-size: 16px;
                  color: #ffffff;
                  font-weight: 400;
                  opacity: 0.9;
              }
              .content {
                  background-color: #141414;
                  padding: 40px 30px;
                  border-left: 1px solid #333333;
                  border-right: 1px solid #333333;
              }
              .greeting {
                  font-size: 24px;
                  margin-bottom: 25px;
                  color: #ffffff;
                  font-weight: 600;
              }
              .message {
                  font-size: 16px;
                  margin-bottom: 20px;
                  color: #ffffff;
                  line-height: 1.6;
              }
              .cta-container {
                  text-align: center;
                  margin: 35px 0;
              }
              .reset-button {
                  display: inline-block;
                  background-color: #E50914 !important;
                  color: #ffffff !important;
                  padding: 18px 40px;
                  text-decoration: none !important;
                  border-radius: 4px;
                  font-weight: 700;
                  font-size: 16px;
                  letter-spacing: 0.5px;
                  text-transform: uppercase;
                  border: none;
                  transition: background-color 0.2s ease;
              }
              .reset-button:hover {
                  background-color: #f40612 !important;
                  color: #ffffff !important;
              }
              .reset-button:link, .reset-button:visited, .reset-button:active {
                  background-color: #E50914 !important;
                  color: #ffffff !important;
                  text-decoration: none !important;
              }
              .url-fallback {
                  background-color: #222222;
                  border: 1px solid #444444;
                  border-radius: 4px;
                  padding: 15px;
                  margin: 20px 0;
                  word-break: break-all;
                  font-family: 'Courier New', monospace;
                  font-size: 14px;
                  color: #ffffff;
              }
              .security-notice {
                  background-color: #222222;
                  border-left: 3px solid #E50914;
                  padding: 20px;
                  margin: 25px 0;
                  border-radius: 0 4px 4px 0;
              }
              .security-notice strong {
                  color: #E50914;
                  display: block;
                  margin-bottom: 8px;
                  font-size: 16px;
              }
              .security-notice div {
                  color: #ffffff;
                  font-size: 14px;
                  line-height: 1.5;
              }
              .footer {
                  background-color: #000000;
                  padding: 30px;
                  text-align: center;
                  border: 1px solid #333333;
              }
              .footer-brand {
                  font-size: 18px;
                  font-weight: 700;
                  color: #E50914;
                  margin-bottom: 10px;
              }
              .footer-text {
                  color: #b3b3b3;
                  font-size: 13px;
                  line-height: 1.4;
              }
              .divider {
                  height: 1px;
                  background-color: #333333;
                  margin: 25px 0;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <div class="logo">DATFLIX</div>
                  <div class="tagline">Your Premium Streaming Experience</div>
              </div>
              
              <div class="content">
                  <div class="greeting">Hello ${this.userName},</div>
                  
                  <div class="message">
                      We received a request to reset your DATFLIX account password. Your account security is our priority, and we're here to help you regain access to your favorite shows and movies.
                  </div>
                  
                  <div class="message">
                      Click the button below to create a new password and get back to streaming:
                  </div>
                  
                  <div class="cta-container">
                      <a href="${this.resetUrl}" class="reset-button">RESET PASSWORD</a>
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="message">
                      If the button doesn't work, copy and paste this link into your browser:
                  </div>
                  
                  <div class="url-fallback">
                      ${this.resetUrl}
                  </div>
                  
                  <div class="security-notice">
                      <strong>Security Notice</strong>
                      <div>This reset link expires in 1 hour for your protection. If you didn't request this password reset, you can safely ignore this email - your account remains secure.</div>
                  </div>
                  
                  <div class="message">
                      Need help? Visit our Help Center or contact our support team. We're available 24/7 to ensure you never miss a moment of entertainment.
                  </div>
                  
                  <div class="divider"></div>
                  
                  <div class="message" style="color: #ffffff; font-style: italic;">
                      Happy Streaming,<br>
                      <strong style="color: #E50914;">The DATFLIX Team</strong>
                  </div>
              </div>
              
              <div class="footer">
                  <div class="footer-brand">DATFLIX</div>
                  <div class="footer-text">
                      This is an automated security email. Please do not reply.<br>
                      © 2025 DATFLIX. All rights reserved.
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  }

  private getTextContent() {
    return `
DATFLIX - Reset Your Password

Hello ${this.userName},

We received a request to reset your DATFLIX account password. Your account security is our priority, and we're here to help you regain access to your favorite shows and movies.

To reset your password, visit this link:
${this.resetUrl}

Security Notice:
This reset link expires in 1 hour for your protection. If you didn't request this password reset, you can safely ignore this email - your account remains secure.

Need help? Visit our Help Center or contact our support team. We're available 24/7 to ensure you never miss a moment of entertainment.

Happy Streaming,
The DATFLIX Team

---
This is an automated security email. Please do not reply.
© 2025 DATFLIX. All rights reserved.
    `
  }
}
