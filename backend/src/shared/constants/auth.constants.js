// Auth constants for authentication and validation

const OTP = Object.freeze({
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  COOLDOWN_MINUTES: 1,
});

const VALIDATION = Object.freeze({
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[0-9+\-\s()]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
});

const ERRORS = Object.freeze({
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  USER_ALREADY_EXISTS: 'Người dùng đã tồn tại',
  INVALID_TOKEN: 'Token không hợp lệ hoặc đã hết hạn',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực',
  ACCOUNT_SUSPENDED: 'Tài khoản đã bị tạm ngừng',
  INVALID_OTP: 'Mã OTP không hợp lệ',
  OTP_EXPIRED: 'Mã OTP đã hết hạn',
  OTP_LIMIT_EXCEEDED: 'Đã vượt quá giới hạn gửi OTP',
  PASSWORD_TOO_WEAK: 'Mật khẩu quá yếu',
  EMAIL_INVALID: 'Định dạng email không hợp lệ',
  PHONE_INVALID: 'Định dạng số điện thoại không hợp lệ',
  NAME_INVALID: 'Định dạng tên không hợp lệ',
  INVALID_PASSWORD: 'Mật khẩu không đúng',
  EMAIL_NOT_REGISTERED: 'Email chưa được đăng ký',
  GOOGLE_OAUTH_REQUIRED: 'Vui lòng đăng nhập bằng Google',
  ACCOUNT_DISABLED: 'Tài khoản đã bị vô hiệu hóa',
  VERIFY_EMAIL_FIRST: 'Vui lòng xác thực email trước',
});

const SUCCESS = Object.freeze({
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  EMAIL_SENT: 'Email đã được gửi thành công',
  EMAIL_VERIFIED: 'Email đã được xác thực thành công',
  PASSWORD_RESET: 'Mật khẩu đã được đặt lại thành công',
  OTP_SENT: 'Mã OTP đã được gửi thành công',
  OTP_VERIFIED: 'Mã OTP đã được xác thực thành công',
  PROFILE_UPDATED: 'Hồ sơ đã được cập nhật thành công',
});

const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EMAIL_NOT_REGISTERED: 'EMAIL_NOT_REGISTERED',
  GOOGLE_OAUTH_REQUIRED: 'GOOGLE_OAUTH_REQUIRED',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_EMAIL_ADDRESS: 'INVALID_EMAIL_ADDRESS',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
});

module.exports = {
  OTP,
  VALIDATION,
  ERRORS,
  SUCCESS,
  ERROR_CODES,
};
