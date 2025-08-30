# Hướng dẫn cấu hình Email cho xác thực email

## Tổng quan
Hệ thống sử dụng email để xác thực tài khoản người dùng và đặt lại mật khẩu. Email được gửi thông qua SMTP server.

## Cấu hình Gmail SMTP

### 1. Bật 2-Factor Authentication
- Đăng nhập vào tài khoản Google
- Vào Settings > Security
- Bật 2-Step Verification

### 2. Tạo App Password
- Sau khi bật 2FA, vào Settings > Security > App passwords
- Chọn "Mail" và "Other (Custom name)"
- Đặt tên: "Internship Platform"
- Copy mật khẩu được tạo ra

### 3. Cấu hình biến môi trường
Thêm các biến sau vào file `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM_NAME=Internship Recruitment Platform
EMAIL_FROM_ADDRESS=your-email@gmail.com
FRONTEND_URL=http://localhost:3001
```

## Cấu hình khác

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Tính năng Email

### 1. Xác thực Email
- Tự động gửi email xác thực khi đăng ký
- Token có hiệu lực trong 24 giờ
- Có thể gửi lại email xác thực

### 2. Đặt lại mật khẩu
- Gửi email đặt lại mật khẩu
- Token có hiệu lực trong 10 phút
- Link an toàn với token được mã hóa

### 3. Template Email
- Email được format đẹp với HTML
- Responsive design
- Hỗ trợ tiếng Việt
- Logo và branding tùy chỉnh

## API Endpoints

### Xác thực Email
- `GET /api/auth/verify-email/:token` - Xác thực email
- `POST /api/auth/resend-verification` - Gửi lại email xác thực

### Đặt lại mật khẩu
- `POST /api/auth/forgotpassword` - Yêu cầu đặt lại mật khẩu
- `PUT /api/auth/resetpassword/:token` - Đặt lại mật khẩu

## Middleware

### requireEmailVerification
- Bắt buộc email phải được xác thực
- Trả về lỗi 403 nếu chưa xác thực
- Bỏ qua cho tài khoản Google OAuth

### checkEmailVerification
- Kiểm tra email đã xác thực chưa
- Không block request, chỉ cảnh báo
- Thêm warning vào response

## Troubleshooting

### Email không gửi được
1. Kiểm tra cấu hình SMTP
2. Đảm bảo App Password đúng
3. Kiểm tra firewall/antivirus
4. Thử với SMTP khác

### Token không hợp lệ
1. Kiểm tra thời gian hết hạn
2. Đảm bảo token chưa được sử dụng
3. Kiểm tra URL frontend

### Email vào spam
1. Cấu hình SPF record
2. Sử dụng email domain riêng
3. Thêm DKIM signature
