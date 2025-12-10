const nodemailer = require('nodemailer');
const { logger } = require('../../utils/logger');
const EmailTemplate = require('../../templates/email');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('⚠️ SMTP not configured. Email sending will fail.', {
        hasHost: !!process.env.SMTP_HOST,
        hasUser: !!process.env.SMTP_USER,
        hasPass: !!process.env.SMTP_PASS,
      });
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // Sử dụng biến môi trường
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(options) {
    // Check if transporter is available
    if (!this.transporter) {
      const error = new Error('SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
      logger.error('Email sending failed: SMTP not configured', {
        to: options.to,
        subject: options.subject,
      });
      throw error;
    }

    try {
      const result = await this.transporter.sendMail({
        from: options.from || `"${process.env.EMAIL_FROM_NAME || 'InternBridge'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      
      logger.info('✅ Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });
      
      return true;
    } catch (error) {
      logger.error('❌ Email sending failed', {
        error: error.message,
        errorCode: error.code,
        to: options.to,
        subject: options.subject,
        stack: error.stack,
      });
      throw error;
    }
  }

  async sendVerificationEmail(user, otp) {
    // Đảm bảo truyền fullName cho template
    const mailOptions = EmailTemplate.verificationEmail(
      {
        email: user.email,
        fullName: user.fullName,
        // ...các trường khác nếu cần
      },
      otp
    );
    return this.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(user, otp) {
    const mailOptions = EmailTemplate.passwordResetEmail(
      {
        email: user.email,
        fullName: user.fullName,
      },
      otp
    );
    return this.sendMail(mailOptions);
  }

  async sendLoginOTPEmail(user, otp) {
    const mailOptions = EmailTemplate.loginOTPEmail(
      {
        email: user.email,
        fullName: user.fullName,
      },
      otp
    );
    return this.sendMail(mailOptions);
  }

  async sendTestEmail(email) {
    const mailOptions = EmailTemplate.testEmail(email);
    return this.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
