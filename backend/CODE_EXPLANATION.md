# Giải thích chi tiết code Authentication Controller

## Tổng quan
File `src/controllers/authController.js` chứa tất cả logic xử lý authentication cho hệ thống **Internship Bridge**, bao gồm đăng ký, đăng nhập, xác thực email, và quản lý tài khoản người dùng.

## Cấu trúc và Import

```javascript
const User = require('../models/User');
const Company = require('../models/Company');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const nodemailer = require('nodemailer');
```

### Giải thích các module:
- **User**: Model quản lý thông tin người dùng
- **Company**: Model quản lý thông tin công ty
- **asyncHandler**: Wrapper để xử lý lỗi async/await
- **jwt**: Tạo và xác thực JSON Web Tokens
- **crypto**: Tạo token ngẫu nhiên cho reset password
- **logger**: Ghi log hệ thống
- **nodemailer**: Gửi email

## Cấu hình Email

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### Giải thích:
- Sử dụng Gmail SMTP để gửi email
- Port 587 với TLS
- Thông tin đăng nhập từ biến môi trường
- `rejectUnauthorized: false` để tránh lỗi SSL

## 1. Hàm Register (Đăng ký)

### Mục đích:
Đăng ký tài khoản mới cho sinh viên, công ty hoặc admin với xác thực email.

### Quy trình:

#### 1.1 Kiểm tra cấu hình email
```javascript
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  return res.status(500).json({
    success: false,
    error: 'Email configuration is not set up properly'
  });
}
```

#### 1.2 Validate dữ liệu đầu vào
```javascript
const { email, password, firstName, lastName, role, companyName, companyInfo } = req.body;

// Kiểm tra role hợp lệ
const allowedRoles = ['student', 'company', 'admin'];
if (!allowedRoles.includes(role)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid role. Must be student, company, or admin'
  });
}
```

#### 1.3 Kiểm tra trùng lặp
```javascript
// Kiểm tra user đã tồn tại
const existingUser = await User.findOne({ email });

// Kiểm tra company đã tồn tại (nếu đăng ký company)
if (role === 'company') {
  const existingCompany = await Company.findOne({ email });
}

// Kiểm tra admin đã tồn tại (chỉ cho phép 1 admin)
if (role === 'admin') {
  const existingAdmin = await User.findOne({ role: 'admin' });
}
```

#### 1.4 Tạo OTP và thời gian hết hạn
```javascript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 phút
```

#### 1.5 Tạo user với trạng thái chưa xác thực
```javascript
const userData = {
  email,
  password,
  firstName,
  lastName,
  role,
  isEmailVerified: false,
  otp,
  otpExpiry
};

const user = await User.create(userData);
```

#### 1.6 Tạo company record (nếu đăng ký company)
```javascript
if (role === 'company') {
  company = await Company.create({
    email,
    name: companyName,
    info: companyInfo,
    owner: user._id,
    isVerified: false
  });
}
```

#### 1.7 Tạo JWT token cho xác thực
```javascript
const verificationToken = jwt.sign(
  { email, otp },
  process.env.JWT_SECRET,
  { expiresIn: '10m' }
);
```

#### 1.8 Tạo URL xác thực
```javascript
const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
```

#### 1.9 Gửi email xác thực
- Sử dụng template HTML đẹp mắt
- Bao gồm nút xác thực và mã OTP
- Thông tin bảo mật và hướng dẫn

## 2. Hàm Verify Email (Xác thực email)

### Mục đích:
Xác thực email bằng OTP hoặc URL token.

### Quy trình:

#### 2.1 Validate dữ liệu đầu vào
```javascript
const { email, otp } = req.body;

if (!email || !otp) {
  return res.status(400).json({
    success: false,
    error: 'Email and OTP are required'
  });
}
```

#### 2.2 Kiểm tra user tồn tại
```javascript
const user = await User.findOne({ email });

if (!user) {
  return res.status(404).json({
    success: false,
    error: 'User not found'
  });
}
```

#### 2.3 Kiểm tra trạng thái xác thực
```javascript
if (user.isEmailVerified) {
  return res.status(400).json({
    success: false,
    error: 'Email is already verified'
  });
}
```

#### 2.4 Kiểm tra OTP hợp lệ
```javascript
if (!user.otp || !user.otpExpiry) {
  return res.status(400).json({
    success: false,
    error: 'No OTP found or OTP expired'
  });
}

if (Date.now() > user.otpExpiry) {
  return res.status(400).json({
    success: false,
    error: 'OTP has expired'
  });
}

if (user.otp !== otp) {
  return res.status(400).json({
    success: false,
    error: 'Invalid OTP'
  });
}
```

#### 2.5 Cập nhật trạng thái xác thực
```javascript
user.isEmailVerified = true;
user.otp = undefined;
user.otpExpiry = undefined;
await user.save();
```

#### 2.6 Xác thực company (nếu có)
```javascript
if (user.role === 'company') {
  await Company.findOneAndUpdate(
    { email: user.email },
    { isVerified: true }
  );
}
```

## 3. Hàm Verify Email With Token

### Mục đích:
Xác thực email thông qua URL token (phương pháp thay thế).

### Quy trình:

#### 3.1 Decode JWT token
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const { email, otp } = decoded;
```

#### 3.2 Thực hiện xác thực tương tự như OTP
- Kiểm tra user tồn tại
- Kiểm tra trạng thái xác thực
- Kiểm tra OTP hợp lệ
- Cập nhật trạng thái

#### 3.3 Redirect về frontend
```javascript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
const redirectUrl = `${frontendUrl}/email-verified?success=true&token=${loginToken}`;

res.redirect(redirectUrl);
```

## 4. Hàm Resend OTP

### Mục đích:
Gửi lại mã OTP mới khi người dùng yêu cầu.

### Quy trình:

#### 4.1 Kiểm tra user tồn tại và chưa xác thực
```javascript
const user = await User.findOne({ email });

if (!user) {
  return res.status(404).json({
    success: false,
    error: 'User not found'
  });
}

if (user.isEmailVerified) {
  return res.status(400).json({
    success: false,
    error: 'Email is already verified'
  });
}
```

#### 4.2 Tạo OTP mới
```javascript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiry = Date.now() + 10 * 60 * 1000;

user.otp = otp;
user.otpExpiry = otpExpiry;
await user.save();
```

#### 4.3 Gửi email mới với OTP mới
- Tạo token và URL mới
- Gửi email với template cập nhật

## 5. Hàm Login (Đăng nhập)

### Mục đích:
Xác thực người dùng và tạo session token.

### Quy trình:

#### 5.1 Validate dữ liệu đầu vào
```javascript
const { email, password } = req.body;

if (!email || !password) {
  return res.status(400).json({
    success: false,
    error: 'Please provide an email and password'
  });
}
```

#### 5.2 Tìm user và kiểm tra password
```javascript
const user = await User.findOne({ email }).select('+password');

if (!user) {
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}

const isMatch = await user.matchPassword(password);

if (!isMatch) {
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}
```

#### 5.3 Kiểm tra email đã xác thực
```javascript
if (!user.isEmailVerified) {
  return res.status(401).json({
    success: false,
    error: 'Please verify your email before logging in',
    needsVerification: true
  });
}
```

#### 5.4 Kiểm tra tài khoản active
```javascript
if (!user.isActive) {
  return res.status(401).json({
    success: false,
    error: 'Account is deactivated'
  });
}
```

#### 5.5 Cập nhật thời gian đăng nhập và tạo token
```javascript
user.lastLogin = new Date();
await user.save();

const token = user.getSignedJwtToken();
```

## 6. Các hàm quản lý profile

### 6.1 Get Me
Lấy thông tin user hiện tại từ token.

### 6.2 Update Details
Cập nhật thông tin cá nhân của user.

### 6.3 Update Password
Thay đổi mật khẩu với xác thực mật khẩu cũ.

### 6.4 Logout
Đăng xuất user (hiện tại chỉ log, có thể mở rộng để blacklist token).

## 7. Hàm Forgot/Reset Password

### 7.1 Forgot Password
- Tìm user theo email
- Tạo reset token ngẫu nhiên
- Hash token và lưu vào database
- Gửi email với reset URL

### 7.2 Reset Password
- Verify reset token
- Cập nhật mật khẩu mới
- Xóa reset token

## Email Template Features

### Thiết kế:
- **Responsive**: Tương thích với mobile và desktop
- **Branding**: Logo và màu sắc của Internship Bridge
- **Tiếng Việt**: Nội dung hoàn toàn bằng tiếng Việt
- **Professional**: Thiết kế chuyên nghiệp, dễ đọc

### Cấu trúc:
1. **Header**: Logo, tên thương hiệu, tagline
2. **Content**: Nội dung chính với nút CTA
3. **Alternative Method**: Mã OTP thay thế
4. **Important Info**: Thông tin bảo mật
5. **Footer**: Thông tin công ty và disclaimer

### Tính năng:
- **Gradient Background**: Tạo hiệu ứng đẹp mắt
- **Emoji Icons**: Tăng tính thân thiện
- **Box Shadow**: Tạo độ sâu cho email
- **Color Coding**: Phân biệt các loại thông tin
- **Mobile Optimized**: Responsive design

## Security Features

### 1. Password Hashing
Sử dụng bcrypt để hash password.

### 2. JWT Tokens
- Token có thời hạn
- Secret key được bảo vệ
- Token chứa thông tin cần thiết

### 3. OTP System
- 6 chữ số ngẫu nhiên
- Thời hạn 10 phút
- One-time use

### 4. Email Verification
- Bắt buộc xác thực email trước khi login
- Double verification (OTP + URL)

### 5. Input Validation
- Validate tất cả input
- Sanitize data
- Prevent injection attacks

## Error Handling

### 1. Async Handler
Sử dụng `express-async-handler` để tự động catch lỗi async.

### 2. Structured Error Responses
```javascript
{
  success: false,
  error: 'Error message'
}
```

### 3. Logging
Ghi log tất cả hoạt động quan trọng:
- User registration
- Email verification
- Login attempts
- Password changes

## Performance Optimizations

### 1. Database Queries
- Sử dụng index cho email
- Select chỉ fields cần thiết
- Avoid N+1 queries

### 2. Email Sending
- Async email sending
- Error handling cho email failures
- Retry mechanism (có thể implement)

### 3. Token Management
- JWT với thời hạn hợp lý
- Stateless authentication
- Efficient token verification

## Future Enhancements

### 1. Rate Limiting
- Limit số lần đăng ký/đăng nhập
- Prevent brute force attacks

### 2. Two-Factor Authentication
- SMS/Email 2FA
- TOTP support

### 3. Social Login
- Google OAuth
- Facebook Login
- GitHub OAuth

### 4. Advanced Email Features
- Email templates với variables
- Email scheduling
- Email analytics

### 5. Account Recovery
- Security questions
- Backup email
- Phone verification
