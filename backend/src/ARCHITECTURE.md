# Project Architecture

## Cấu trúc thư mục đã được dọn dẹp và tối ưu:

```
src/
├── config/                 # Cấu hình ứng dụng
│   ├── initializeServices.js    # Khởi tạo Redis services
│   ├── rateLimitConfig.js       # Cấu hình rate limiting
│   ├── socket.js               # Cấu hình Socket.IO
│   └── README.md               # Tài liệu config
│
├── services/               # Business logic layer
│   ├── otpService.js           # Quản lý OTP với Redis
│   ├── otpCooldownService.js   # Quản lý cooldown OTP
│   ├── emailService.js         # Gửi email
│   ├── googleAuth.js           # Google OAuth
│   ├── cloudinaryService.js    # Upload file với Cloudinary
│   ├── imageUploadService.js   # Xử lý upload hình ảnh
│   ├── aiService.js            # AI features
│   └── README.md               # Tài liệu services
│
├── controllers/            # API endpoints
├── models/                 # Database models
├── routes/                 # Route definitions
├── middleware/             # Custom middleware (4 files)
├── utils/                  # Utility functions
└── templates/              # Email templates
```

## Flow Authentication:

1. **Register** → Lưu user data vào Redis (24h)
2. **Send OTP** → Lưu OTP vào Redis (10 phút) + Gửi email
3. **Verify Email** → Kiểm tra OTP + Tạo user trong MongoDB + Xóa Redis data

## Dependencies:

- **Redis**: OTP storage, user registration temp data
- **MongoDB**: User data, applications, jobs, etc.
- **Cloudinary**: File uploads
- **Nodemailer**: Email sending
- **Socket.IO**: Real-time notifications

## Đã dọn dẹp:

### Config:

- ❌ `redis.config.js` (trùng lặp với initializeServices.js)

### Services:

- ❌ `chatbot.js` (không sử dụng)
- ❌ `aiFilter.js` (không sử dụng)
- ❌ `jobRecommendation.js` (không sử dụng)

### Middleware:

- ❌ `emailVerification.js` (không sử dụng, logic đã tích hợp vào authController)
- ❌ `otpRateLimit.js` (không sử dụng, đã có OTPCooldownService)

### Controllers:

- ❌ `validateEmail` function (không có route, đã xóa)

## Best Practices:

1. **Single Responsibility**: Mỗi service có một nhiệm vụ cụ thể
2. **Error Handling**: Tất cả services đều có try-catch
3. **Logging**: Sử dụng winston logger
4. **Redis Fallback**: Services có fallback khi Redis không khả dụng
5. **Clean Architecture**: Tách biệt rõ ràng giữa config, services, controllers
