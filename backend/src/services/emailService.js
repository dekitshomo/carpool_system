const db = require('../config/db');
const smtpClient = require('./smtpClient');
const googleAppsScriptClient = require('./googleAppsScriptClient');

/**
 * College Email Dispatch Service
 * Formats Carpool System verification emails.
 */
class EmailService {
  getProvider() {
    return (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();
  }

  isConfigured() {
    const provider = this.getProvider();
    if (provider === 'google-apps-script') return googleAppsScriptClient.isConfigured();
    if (provider === 'smtp') return smtpClient.isConfigured();
    return false;
  }

  requiresLiveDelivery() {
    return this.getProvider() !== 'smtp' || this.isConfigured();
  }

  /**
   * Dispatch a student verification email
   */
  async sendVerificationEmail({ toEmail, name, code, frontendUrl }) {
    const subject = 'Carpool System email verification code';
    const baseUrl = (frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(toEmail)}`;

    // Format code with wide spaces: "6 1 3 2 1 8"
    const spacedCode = code.toString().split('').join(' ');
    const displayName = name ? name.trim() : 'Student';

    // HTML template replicating the user's Gmail screenshot layout with high fidelity
    const bodyHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carpool System email verification code</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #edf5ee;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          table {
            border-spacing: 0;
            border-collapse: collapse;
          }
          .outer-table {
            width: 100%;
            background-color: #edf5ee;
            padding: 36px 16px;
          }
          .card-container {
            max-width: 440px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 28px;
            padding: 44px 32px 40px 32px;
            text-align: left;
            border: 1px solid #e1ece2;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          }
          .emblem-wrapper {
            text-align: center;
            margin-bottom: 28px;
          }
          .brand-name {
            color: #1b4332;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 1px;
          }
          .heading {
            font-family: 'Comic Sans MS', 'Chalkboard SE', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1b4332;
            font-size: 32px;
            font-weight: 800;
            line-height: 1.2;
            margin: 0 0 20px 0;
            letter-spacing: -0.5px;
          }
          .greeting {
            color: #2d3748;
            font-size: 15px;
            font-weight: 500;
            line-height: 1.6;
            margin: 0 0 16px 0;
          }
          .instructions {
            color: #2d3748;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 28px 0;
          }
          .code-display {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            color: #1b4332;
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 8px;
            text-align: left;
            margin: 16px 0 28px 0;
          }
          .btn-container {
            margin-top: 16px;
            margin-bottom: 24px;
          }
          .verify-btn {
            display: inline-block;
            background-color: #1b4332;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.3px;
          }
          .footer-note {
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.5;
            margin-top: 24px;
            border-top: 1px solid #f1f5f9;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <table class="outer-table" role="presentation">
          <tr>
            <td align="center">
              <div class="card-container">
                <div class="emblem-wrapper">
                  <div class="brand-name">CARPOOL SYSTEM</div>
                </div>

                <!-- Verify your email heading -->
                <div class="heading">Verify your<br>email</div>

                <!-- Personal greeting -->
                <div class="greeting">Hello ${displayName},</div>

                <!-- Instructions -->
                <div class="instructions">Enter this code on the Carpool System verification page:</div>

                <!-- Large spaced 6-digit code: e.g. 6 1 3 2 1 8 -->
                <div class="code-display">${spacedCode}</div>

                <div class="btn-container">
                  <a href="${verifyUrl}" class="verify-btn">Open verification page &rarr;</a>
                </div>

                <!-- Footer disclaimer -->
                <div class="footer-note">
                  This code expires in 24 hours. If you did not sign up for the Carpool System, you can safely ignore this email.
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Plain text fallback
    const bodyText = `Carpool System email verification\n\nHello ${displayName},\n\nEnter this code on the Carpool System verification page:\n\n${spacedCode}\n\nOpen the verification page: ${verifyUrl}\n\n(Code expires in 24 hours)`;

    try {
      // 1. Attempt live delivery through the configured provider.
      const provider = this.getProvider();
      const mailClient = provider === 'google-apps-script'
        ? googleAppsScriptClient
        : provider === 'smtp'
          ? smtpClient
          : null;
      let deliveryStatus = 'recorded';
      let liveSent = false;
      let deliveryReason = '';

      try {
        if (!mailClient) {
          deliveryReason = `Unsupported EMAIL_PROVIDER "${provider}". Set it to "google-apps-script" or "smtp".`;
        } else {
          const mailResult = await mailClient.sendMail({
            to: toEmail,
            subject,
            html: bodyHtml,
            text: bodyText
          });
          liveSent = mailResult.sent;
          deliveryReason = mailResult.reason || '';
        }
        deliveryStatus = liveSent ? `delivered_live_${provider}` : 'recorded_simulated';
      } catch (deliveryError) {
        deliveryReason = deliveryError.message;
        deliveryStatus = 'recorded_simulated';
      }

      // 2. Record email in SentEmails table for audit & simulated college mailbox preview
      const stmt = db.prepare(`
        INSERT INTO SentEmails (to_email, subject, body_html, verification_code, status)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(toEmail, subject, bodyHtml, code, deliveryStatus);

      // 3. High-visibility console log for local testing
      console.log('\n======================================================');
      console.log('📧 [CARPOOL SYSTEM VERIFICATION EMAIL]');
      console.log(`To:                 ${toEmail}`);
      console.log(`Recipient Name:     ${displayName}`);
      console.log(`Subject:            ${subject}`);
      console.log(`Verification Code:  [ ${spacedCode} ]`);
      console.log(`Live Email Sent:    ${liveSent ? `✅ YES (${provider})` : 'ℹ️ NO (' + deliveryReason + ')'}`);
      console.log(`Direct Link:        ${verifyUrl}`);
      console.log('======================================================\n');

      return {
        success: true,
        to: toEmail,
        code,
        formatted_code: spacedCode,
        live_sent: liveSent,
        provider,
        reason: deliveryReason,
        message: liveSent
          ? 'Carpool System verification email sent directly to your inbox!'
          : 'Carpool System verification email recorded in the simulated mailbox'
      };
    } catch (error) {
      console.error('Failed to dispatch verification email:', error);
      throw error;
    }
  }

  /**
   * Get all emails dispatched to a student's address (for simulated college webmail preview)
   */
  getInboxForEmail(email) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();
    const emails = db.prepare(`
      SELECT id, to_email, subject, body_html, verification_code, status, created_at
      FROM SentEmails
      WHERE LOWER(to_email) = ?
      ORDER BY id DESC
      LIMIT 15
    `).all(cleanEmail);

    const replaceLegacyBrand = (content) => content
      .replace(/Zhenphen/gi, 'Carpool System')
      .replace(/Sherubtse/gi, 'Carpool System');

    return emails.map((message) => ({
      ...message,
      subject: replaceLegacyBrand(message.subject),
      body_html: replaceLegacyBrand(message.body_html)
        .replace(/<img\b(?=[^>]*\balt=["'][^"']*(?:Carpool System)[^"']*["'])[^>]*>/gi, '')
    }));
  }
}

module.exports = new EmailService();
