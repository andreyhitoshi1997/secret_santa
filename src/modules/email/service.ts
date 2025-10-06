import nodemailer from "nodemailer";

export interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface AssignmentEmail {
  participantName: string;
  participantEmail: string;
  sessionName: string;
  giftRecipientName: string;
  giftRecipientEmail: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor(config: EmailConfig = {}) {
    this.config = {
      smtpHost: config.smtpHost || process.env.SMTP_HOST || "localhost",
      smtpPort: config.smtpPort || parseInt(process.env.SMTP_PORT || "587"),
      smtpUser: config.smtpUser || process.env.SMTP_USER,
      smtpPass: config.smtpPass || process.env.SMTP_PASS,
      fromEmail:
        config.fromEmail || process.env.FROM_EMAIL || "noreply@secretsanta.com",
      fromName: config.fromName || process.env.FROM_NAME || "Secret Santa",
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      if (
        !this.config.smtpUser ||
        !this.config.smtpPass ||
        this.config.smtpUser === "your_email@gmail.com" ||
        this.config.smtpPass === "your_app_password" ||
        this.config.smtpPass === "your_gmail_app_password"
      ) {
        console.log("📧 SMTP Configuration Status: DISABLED");
        console.log("   Email functionality is running in MOCK MODE.");
        console.log("   To enable actual email sending:");
        console.log("   1. Set SMTP_USER to your Gmail address");
        console.log("   2. Set SMTP_PASS to your Gmail App Password");
        console.log(
          "   3. For Gmail App Passwords: https://support.google.com/accounts/answer/185833"
        );
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.config.smtpUser)) {
        console.warn(
          "⚠️  Invalid SMTP_USER email format. Falling back to mock mode."
        );
        return;
      }

      console.log("📧 SMTP Configuration Status: ENABLED");
      console.log(`   Host: ${this.config.smtpHost}:${this.config.smtpPort}`);
      console.log(`   User: ${this.config.smtpUser}`);

      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } catch (error) {
      console.error("❌ Failed to initialize email transporter:", error);
      console.log("   Falling back to mock mode for email functionality.");
      this.transporter = null;
    }
  }

  async sendAssignmentEmail(emailData: AssignmentEmail): Promise<boolean> {
    if (!this.transporter) {
      console.log(
        `📧 [MOCK EMAIL] Assignment for ${emailData.participantName} (${emailData.participantEmail})`
      );
      console.log(
        `   Subject: Your Secret Santa Assignment for ${emailData.sessionName}`
      );
      console.log(
        `   Gift recipient: ${emailData.giftRecipientName} (${emailData.giftRecipientEmail})`
      );
      console.log(`   📬 Email would be sent successfully (mock mode)`);
      return true;
    }

    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: emailData.participantEmail,
        subject: `Your Secret Santa Assignment for ${emailData.sessionName}`,
        html: this.generateAssignmentEmailHTML(emailData),
        text: this.generateAssignmentEmailText(emailData),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ Email sent successfully to ${emailData.participantEmail}: ${result.messageId}`
      );
      return true;
    } catch (error: any) {
      if (error?.code === "EAUTH") {
        console.error(
          `❌ Authentication failed for ${emailData.participantEmail}:`
        );
        console.error(`   Gmail credentials are invalid or expired.`);
        console.error(
          `   Please check your SMTP_USER and SMTP_PASS in .env file.`
        );
        console.error(
          `   For Gmail, use App Passwords: https://support.google.com/accounts/answer/185833`
        );
      } else {
        console.error(
          `❌ Failed to send email to ${emailData.participantEmail}:`,
          error?.message || error
        );
      }
      return false;
    }
  }

  private generateAssignmentEmailHTML(data: AssignmentEmail): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Secret Santa Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .assignment-box { 
            background-color: #fff; 
            border: 2px solid #4caf50; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 20px 0; 
            text-align: center;
          }
          .gift-recipient { font-size: 24px; font-weight: bold; color: #4caf50; }
          .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0;
          }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Secret Santa Assignment</h1>
            <h2>${data.sessionName}</h2>
          </div>
          
          <div class="content">
            <h3>Hi ${data.participantName}!</h3>
            <p>Your Secret Santa assignment is ready! Here's who you'll be giving a gift to:</p>
            
            <div class="assignment-box">
              <p>🎯 <strong>Your Gift Recipient:</strong></p>
              <div class="gift-recipient">${data.giftRecipientName}</div>
              <p><em>${data.giftRecipientEmail}</em></p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Important Reminders:</strong></p>
              <ul>
                <li>Keep this assignment <strong>SECRET</strong>! 🤫</li>
                <li>Do not reveal who you are giving a gift to</li>
                <li>Do not try to find out who is giving you a gift</li>
                <li>Have fun and spread the holiday cheer! 🎄</li>
              </ul>
            </div>
            
            <p>Happy gift giving! 🎅</p>
          </div>
          
          <div class="footer">
            <p><small>This is an automated message from Secret Santa. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAssignmentEmailText(data: AssignmentEmail): string {
    return `
🎁 Secret Santa Assignment - ${data.sessionName}

Hi ${data.participantName}!

Your Secret Santa assignment is ready! Here's who you'll be giving a gift to:

🎯 Your Gift Recipient: ${data.giftRecipientName}
Email: ${data.giftRecipientEmail}

⚠️ Important Reminders:
- Keep this assignment SECRET! 
- Do not reveal who you are giving a gift to
- Do not try to find out who is giving you a gift  
- Have fun and spread the holiday cheer!

Happy gift giving! 🎅

---
This is an automated message from Secret Santa. Please do not reply to this email.
    `;
  }

  async sendMultipleAssignmentEmails(
    emailData: AssignmentEmail[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emailData) {
      const success = await this.sendAssignmentEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }
}
