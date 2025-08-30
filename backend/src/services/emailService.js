const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email verification with OTP
const sendEmailVerification = async (user, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    // Generate 6-digit OTP from the token
    const otp = verificationToken.substring(0, 6).toUpperCase();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Xác thực email - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Xác thực Email</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Xin chào ${user.firstName} ${user.lastName}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Internship Recruitment Platform.</p>
            <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP sau:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4F46E5; color: white; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 10px; display: inline-block; min-width: 200px;">
                ${otp}
              </div>
            </div>
            <p style="text-align: center; font-size: 18px; color: #4F46E5; font-weight: bold;">
              Mã OTP này sẽ hết hạn sau 24 giờ.
            </p>
            <p>Vui lòng nhập mã này vào trang xác thực email để hoàn tất đăng ký.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Email này được gửi tự động, vui lòng không trả lời email này.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email verification OTP sent to ${user.email}`, { 
      userId: user._id, 
      messageId: info.messageId,
      otp: otp
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send email verification', { 
      error: error.message, 
      userId: user._id 
    });
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    
    // Generate 6-digit OTP from the token
    const otp = resetToken.substring(0, 6).toUpperCase();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Đặt lại mật khẩu - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #DC2626; color: white; padding: 20px; text-align: center;">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Xin chào ${user.firstName} ${user.lastName}!</h2>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
            <p>Vui lòng sử dụng mã OTP sau để đặt lại mật khẩu:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #DC2626; color: white; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 10px; display: inline-block; min-width: 200px;">
                ${otp}
              </div>
            </div>
            <p style="text-align: center; font-size: 18px; color: #DC2626; font-weight: bold;">
              Mã OTP này sẽ hết hạn sau 10 phút.
            </p>
            <p>Vui lòng nhập mã này vào trang đặt lại mật khẩu.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Email này được gửi tự động, vui lòng không trả lời email này.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Password reset OTP sent to ${user.email}`, { 
      userId: user._id, 
      messageId: info.messageId,
      otp: otp
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { 
      error: error.message, 
      userId: user._id 
    });
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendEmailVerification,
  sendPasswordResetEmail
};
