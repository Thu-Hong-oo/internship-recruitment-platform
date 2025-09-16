class EmailTemplate {
  static verificationEmail(user, otp) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Xác thực email - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Xác thực email của bạn</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Xin chào ${user.fullName},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng nhập mã OTP sau:</p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; background-color: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block;">
                ${otp}
              </p>
            </div>
            <p style="text-align: center; color: #666; font-size: 14px;">Mã OTP này sẽ hết hạn sau 10 phút.</p>
            <p style="text-align: center; color: #666; font-size: 14px;">Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static passwordResetEmail(user, otp) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Đặt lại mật khẩu - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Xin chào ${user.fullName},</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP sau để đặt lại mật khẩu:</p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; background-color: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block;">${otp}</p>
            </div>
            <p>Mã OTP này sẽ hết hạn sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static loginOTPEmail(user, otp) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'Mã OTP Đăng nhập - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Mã OTP Đăng nhập</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Xin chào ${user.fullName},</p>
            <p>Đây là mã OTP để đăng nhập vào tài khoản của bạn:</p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 24px; font-weight: bold;">${otp}</p>
            </div>
            <p>Mã OTP này sẽ hết hạn sau 5 phút.</p>
            <p>Nếu bạn không yêu cầu đăng nhập, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }

  static testEmail(email) {
    return {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Test Email - Internship Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Test Email</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Đây là email test để kiểm tra tính hợp lệ của địa chỉ email.</p>
            <p>Nếu bạn nhận được email này, địa chỉ email của bạn là hợp lệ.</p>
            <p>Bạn có thể bỏ qua email này.</p>
          </div>
        </div>
      `,
    };
  }
}

module.exports = EmailTemplate;
