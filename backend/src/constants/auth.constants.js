module.exports = {
  // Time constants
  OTP: {
    VERIFICATION_EXPIRES: 10 * 60 * 1000, // 10 minutes
    LOGIN_EXPIRES: 5 * 60 * 1000, // 5 minutes
    RESET_EXPIRES: 10 * 60 * 1000, // 10 minutes
  },

  // Common validation messages
  VALIDATION: {
    REQUIRED: 'Trường này là bắt buộc',
    EMAIL_REQUIRED: 'Email là bắt buộc',
    PASSWORD_REQUIRED: 'Mật khẩu là bắt buộc',
    NAME_REQUIRED: 'Họ tên là bắt buộc',
    OTP_REQUIRED: 'Mã OTP là bắt buộc',
    TOKEN_REQUIRED: 'Token là bắt buộc',
    EMAIL_OTP_REQUIRED: 'Email và mã OTP là bắt buộc',
  },

  // Error messages
  ERRORS: {
    // Email related
    EMAIL_NOT_REGISTERED: 'Email này chưa được đăng ký trong hệ thống',
    EMAIL_EXISTS: 'Email đã được sử dụng bởi tài khoản khác',
    EMAIL_NOT_VERIFIED: 'Email chưa được xác thực',
    INVALID_EMAIL: 'Định dạng email không hợp lệ',
    INVALID_EMAIL_ADDRESS:
      'Email không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra lại địa chỉ email.',

    // Authentication
    INVALID_PASSWORD: 'Mật khẩu không chính xác',
    INVALID_OTP: 'Mã OTP không chính xác',
    OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới',
    INVALID_TOKEN: 'Token không hợp lệ',
    TOKEN_EXPIRED: 'Token không hợp lệ hoặc đã hết hạn',
    GOOGLE_OAUTH_REQUIRED:
      'Tài khoản này sử dụng Google OAuth. Vui lòng đăng nhập bằng Google.',

    // Account status
    ACCOUNT_DISABLED: 'Tài khoản đã bị vô hiệu hóa',
    ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản với email này',

    // Email sending
    EMAIL_SEND_FAILED:
      'Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',

    // Verification
    INVALID_VERIFICATION_LINK: 'Link xác thực không hợp lệ hoặc đã hết hạn',
    VERIFY_EMAIL_FIRST:
      'Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.',
  },

  // Success messages
  SUCCESS: {
    REGISTER:
      'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    LOGIN: 'Đăng nhập thành công',
    LOGOUT: 'Đăng xuất thành công',
    EMAIL_VERIFIED: 'Xác thực email thành công',
    PASSWORD_RESET_SENT: 'Email đặt lại mật khẩu đã được gửi thành công',
    PASSWORD_RESET: 'Đặt lại mật khẩu thành công',
    OTP_SENT: 'Mã OTP đã được gửi đến email của bạn',
  },

  // Error codes for frontend handling
  ERROR_CODES: {
    EMAIL_NOT_REGISTERED: 'EMAIL_NOT_REGISTERED',
    INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    GOOGLE_OAUTH_REQUIRED: 'GOOGLE_OAUTH_REQUIRED',
    INVALID_EMAIL_ADDRESS: 'INVALID_EMAIL_ADDRESS',
    EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  },
};
