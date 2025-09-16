const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const EmailTemplate = require('../templates/email');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // Sử dụng biến môi trường
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(options) {
    try {
      await this.transporter.sendMail(options);
      return true;
    } catch (error) {
      logger.error('Email sending failed', {
        error: error.message,
        to: options.to,
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
