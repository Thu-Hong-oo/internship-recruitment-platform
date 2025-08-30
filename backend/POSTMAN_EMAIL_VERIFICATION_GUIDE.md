# 📧 Hướng dẫn sử dụng Postman Collection với Email Verification

## 🎯 Tổng quan

Postman collection đã được cập nhật để hỗ trợ đầy đủ tính năng xác thực email. Collection bao gồm các endpoint mới cho email verification và password reset.

## 🔧 Cài đặt Environment Variables

### Biến môi trường cần thiết:

```json
{
  "base_url": "http://localhost:3000",
  "api_url": "http://localhost:3000/api",
  "token": "",
  "user_id": "",
  "is_email_verified": "",
  "auth_method": "",
  "user_email": "",
  "otp_code": "",
  "google_id_token": ""
}
```

### Cách thiết lập:

1. **Import Collection**: Import file `postman_collection.json`
2. **Tạo Environment**: Tạo environment mới với các biến trên
3. **Cấu hình Email**: Đảm bảo server đã được cấu hình email (xem `EMAIL_SETUP_GUIDE.md`)

## 📋 Workflow Email Verification với OTP

### 1. Đăng ký tài khoản mới

**Request**: `POST /api/auth/register`

```json
{
  "email": "test@example.com",
  "password": "123456",
  "firstName": "Test",
  "lastName": "User",
  "role": "student"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student",
    "fullName": "Test User",
    "authMethod": "local",
    "isEmailVerified": false
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Lưu ý**: 
- `isEmailVerified` sẽ là `false`
- Email xác thực sẽ được gửi tự động
- **Tài khoản chưa thể đăng nhập cho đến khi xác thực email**
- Kiểm tra console để xem thông báo về email verification

### 2. Xác thực Email

**Request**: `POST /api/auth/verify-email`

1. Kiểm tra email đã nhận
2. Copy mã OTP 6 số từ email
3. Set request body với email và OTP:
   ```json
   {
     "email": "test@example.com",
     "otp": "123456"
   }
   ```
4. Chạy request

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student",
    "fullName": "Test User",
    "isEmailVerified": true
  }
}
```

### 3. Đăng nhập (Chỉ sau khi xác thực email)

**Request**: `POST /api/auth/login`

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**Lưu ý quan trọng**: 
- Nếu email chưa xác thực, sẽ nhận được lỗi 401 với thông báo yêu cầu xác thực email
- Response lỗi sẽ có `"requiresEmailVerification": true` và thông tin user
- Sau khi xác thực email, đăng nhập sẽ thành công

**Response lỗi khi email chưa xác thực**:
```json
{
  "success": false,
  "error": "Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.",
  "errorType": "EMAIL_NOT_VERIFIED",
  "requiresEmailVerification": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student",
    "fullName": "Test User",
    "isEmailVerified": false,
    "authMethod": "local"
  }
}
```

**Các loại lỗi đăng nhập khác**:

1. **Email chưa đăng ký**:
```json
{
  "success": false,
  "error": "Email này chưa được đăng ký trong hệ thống",
  "errorType": "EMAIL_NOT_REGISTERED"
}
```

2. **Sai mật khẩu**:
```json
{
  "success": false,
  "error": "Mật khẩu không chính xác",
  "errorType": "INVALID_PASSWORD"
}
```

3. **Tài khoản bị vô hiệu hóa**:
```json
{
  "success": false,
  "error": "Tài khoản đã bị vô hiệu hóa",
  "errorType": "ACCOUNT_DISABLED"
}
```

4. **Yêu cầu đăng nhập Google**:
```json
{
  "success": false,
  "error": "Tài khoản này sử dụng Google OAuth. Vui lòng đăng nhập bằng Google.",
  "errorType": "GOOGLE_OAUTH_REQUIRED"
}
```

**Response thành công sau khi xác thực email**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "student",
    "fullName": "Test User",
    "avatar": "",
    "isEmailVerified": true,
    "authMethod": "local"
  }
}
```

### 4. Gửi lại Email Xác thực

**Request**: `POST /api/auth/resend-verification`

- Yêu cầu authentication token
- Gửi lại email xác thực nếu token cũ hết hạn

**Response**:
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

## 🔐 Workflow Password Reset

### 1. Yêu cầu đặt lại mật khẩu

**Request**: `POST /api/auth/forgotpassword`

```json
{
  "email": "test@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 2. Đặt lại mật khẩu

**Request**: `POST /api/auth/resetpassword`

1. Kiểm tra email đã nhận
2. Copy mã OTP 6 số từ email
3. Set request body với email, OTP và mật khẩu mới:
   ```json
   {
     "email": "test@example.com",
     "otp": "123456",
     "password": "newpassword123"
   }
   ```
4. Gửi request với mật khẩu mới

```json
{
  "password": "newpassword123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔍 Kiểm tra trạng thái Email Verification

### 1. Đăng nhập

**Request**: `POST /api/auth/login`

Response sẽ bao gồm `isEmailVerified`:
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "isEmailVerified": true,
    "authMethod": "local"
  }
}
```

### 2. Lấy thông tin user

**Request**: `GET /api/auth/me`

Response sẽ hiển thị trạng thái email verification:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "isEmailVerified": true,
    "authMethod": "local"
  }
}
```

## ⚠️ Lưu ý quan trọng

### 1. Token hết hạn
- **Email verification token**: 24 giờ
- **Password reset token**: 10 phút
- Nếu token hết hạn, sử dụng "Resend Email Verification"

### 2. Google OAuth
- Tài khoản Google OAuth tự động được xác thực email
- `isEmailVerified` sẽ là `true` cho Google users

### 3. Test Scripts
- Collection đã có test scripts tự động
- Kiểm tra console để xem thông báo về email verification
- Environment variables được tự động cập nhật

### 4. Error Handling
- Token không hợp lệ: 400 Bad Request
- Email đã được xác thực: 400 Bad Request
- Email không tồn tại: 404 Not Found

## 🧪 Testing Scenarios

### Scenario 1: Đăng ký và xác thực email
1. Register user mới
2. Kiểm tra email verification status
3. Verify email với token
4. Login và kiểm tra trạng thái

### Scenario 2: Gửi lại email xác thực
1. Register user mới
2. Đợi token hết hạn (hoặc giả lập)
3. Sử dụng "Resend Email Verification"
4. Verify với token mới

### Scenario 3: Password reset
1. Request password reset
2. Kiểm tra email reset
3. Reset password với token
4. Login với mật khẩu mới

### Scenario 4: Google OAuth
1. Login với Google OAuth
2. Kiểm tra email verification status (sẽ là true)
3. Link/unlink Google account

## 🔧 Troubleshooting

### Email không gửi được
1. Kiểm tra cấu hình SMTP trong `.env`
2. Kiểm tra logs của server
3. Sử dụng `test-email.js` để test email service

### Token không hợp lệ
1. Kiểm tra thời gian hết hạn
2. Đảm bảo token chưa được sử dụng
3. Sử dụng "Resend Email Verification"

### Environment variables không cập nhật
1. Kiểm tra test scripts
2. Đảm bảo response format đúng
3. Refresh environment trong Postman

## 📚 Tài liệu tham khảo

- [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) - Cấu hình email service
- [API_STRUCTURE.md](./API_STRUCTURE.md) - Cấu trúc API
- [README.md](./README.md) - Tổng quan dự án

---

**Lưu ý**: Đảm bảo server đang chạy và email service đã được cấu hình đúng trước khi test các endpoint email verification! 🚀
