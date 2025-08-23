# Authentication Features

## Overview
Hệ thống xác thực đã được mở rộng để hỗ trợ:
- Đăng ký cho sinh viên (student)
- Đăng ký cho công ty (company) 
- Đăng ký cho admin
- Xác thực email bằng OTP

## Các Role được hỗ trợ

### 1. Student (Sinh viên)
- Role mặc định khi đăng ký
- Có thể tìm kiếm và ứng tuyển thực tập
- Có thể cập nhật profile cá nhân

### 2. Company (Công ty)
- Cần cung cấp thông tin công ty khi đăng ký
- Có thể đăng tin tuyển dụng thực tập
- Có thể quản lý ứng viên

### 3. Admin
- Chỉ cho phép 1 admin duy nhất trong hệ thống
- Có quyền quản lý toàn bộ hệ thống
- Có thể quản lý users, companies, jobs

## Quy trình đăng ký

### Bước 1: Đăng ký tài khoản
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Cho Company:**
```json
{
  "email": "company@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Manager",
  "role": "company",
  "companyName": "Tech Company Ltd",
  "companyInfo": "A technology company specializing in software development"
}
```

**Cho Admin:**
```json
{
  "email": "admin@example.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin"
}
```

### Bước 2: Xác thực email bằng OTP
Sau khi đăng ký thành công, hệ thống sẽ gửi OTP 6 chữ số qua email.

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Bước 3: Đăng nhập
Sau khi xác thực email thành công, user có thể đăng nhập:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Các API Endpoints

### 1. Đăng ký
- **POST** `/api/auth/register`
- Tạo tài khoản mới với email chưa xác thực

### 2. Xác thực email
- **POST** `/api/auth/verify-email`
- Xác thực email bằng OTP

### 3. Gửi lại OTP
- **POST** `/api/auth/resend-otp`
- Gửi lại mã OTP nếu hết hạn

### 4. Đăng nhập
- **POST** `/api/auth/login`
- Đăng nhập (chỉ cho phép email đã xác thực)

### 5. Lấy thông tin user
- **GET** `/api/auth/me`
- Lấy thông tin user hiện tại

### 6. Cập nhật thông tin
- **PUT** `/api/auth/updatedetails`
- Cập nhật thông tin cá nhân

### 7. Đổi mật khẩu
- **PUT** `/api/auth/updatepassword`
- Đổi mật khẩu

### 8. Quên mật khẩu
- **POST** `/api/auth/forgotpassword`
- Gửi email reset password

### 9. Reset mật khẩu
- **PUT** `/api/auth/resetpassword/:resettoken`
- Đặt lại mật khẩu bằng token

## Cấu hình Email

Để sử dụng tính năng gửi OTP, cần cấu hình email trong file `.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Lưu ý:** 
- Sử dụng Gmail App Password thay vì mật khẩu thông thường
- Cần bật 2FA cho Gmail để tạo App Password

## Response Format

### Thành công
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "fullName": "John Doe",
    "isEmailVerified": true
  }
}
```

### Lỗi
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Bảo mật

1. **OTP Expiry**: OTP có hiệu lực trong 10 phút
2. **Email Verification**: Bắt buộc xác thực email trước khi đăng nhập
3. **Password Hashing**: Mật khẩu được hash bằng bcrypt
4. **JWT Tokens**: Sử dụng JWT cho authentication
5. **Role-based Access**: Phân quyền theo role

## Error Handling

### Các lỗi thường gặp:

1. **Email đã tồn tại**
   - Status: 400
   - Message: "User already exists with this email"

2. **OTP không đúng**
   - Status: 400
   - Message: "Invalid OTP"

3. **OTP hết hạn**
   - Status: 400
   - Message: "OTP has expired"

4. **Email chưa xác thực**
   - Status: 401
   - Message: "Please verify your email before logging in"

5. **Thông tin công ty thiếu**
   - Status: 400
   - Message: "Company name and company info are required for company registration"

6. **Admin đã tồn tại**
   - Status: 400
   - Message: "Admin already exists. Only one admin is allowed."
