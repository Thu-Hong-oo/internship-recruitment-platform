# Config Directory

Thư mục này chứa các file cấu hình cho ứng dụng.

## Files:

### `initializeServices.js`

- **Mục đích**: Khởi tạo các dịch vụ Redis (OTP Service, OTP Cooldown Service)
- **Sử dụng**: Được import trong `server.js` và `authController.js`
- **Dependencies**:
  - `redis` package (v4)
  - `OTPService`
  - `OTPCooldownService`

### `rateLimitConfig.js`

- **Mục đích**: Cấu hình rate limiting cho API
- **Sử dụng**: Được import trong middleware

### `socket.js`

- **Mục đích**: Cấu hình Socket.IO cho real-time communication
- **Sử dụng**: Được import trong các service cần real-time features

## Đã xóa:

- ~~`redis.config.js`~~ - Trùng lặp với `initializeServices.js`, sử dụng ioredis thay vì redis v4
