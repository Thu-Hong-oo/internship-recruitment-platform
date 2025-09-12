# Middleware Directory

Thư mục này chứa các middleware functions cho Express.js.

## Active Middleware:

### `auth.js`

- **`protect`**: Xác thực JWT token và gắn user vào req.user
- **`authorize`**: Kiểm tra quyền truy cập theo role (admin, employer, candidate)
- **Sử dụng**: Được import trong tất cả protected routes

### `errorHandler.js`

- **Mục đích**: Xử lý lỗi toàn cục cho ứng dụng
- **Sử dụng**: Được sử dụng trong server.js như error handling middleware

### `globalRateLimit.js`

- **`globalRateLimit`**: Rate limiting toàn cục (100 requests/15 phút)
- **`apiRateLimit`**: Rate limiting cho API endpoints (200 requests/15 phút)
- **`searchRateLimit`**: Rate limiting cho tìm kiếm (30 requests/5 phút)
- **`uploadRateLimit`**: Rate limiting cho upload (10 requests/10 phút)
- **Sử dụng**: Được import trong server.js và các routes cần rate limiting

### `upload.js`

- **`uploadMiddleware`**: Xử lý upload file với multer và Cloudinary
- **Sử dụng**: Được import trong routes cần upload (users, internProfiles, upload)

## Đã xóa:

- ~~`emailVerification.js`~~ - Không được sử dụng, logic đã được tích hợp vào authController
- ~~`otpRateLimit.js`~~ - Không được sử dụng, rate limiting đã được xử lý bởi OTPCooldownService

## Usage Pattern:

```javascript
// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// Use in routes
router.get('/profile', protect, getProfile);
router.post(
  '/upload',
  protect,
  authorize('candidate'),
  uploadMiddleware,
  uploadFile
);
```

## Rate Limiting Strategy:

- **Global**: Bảo vệ toàn bộ ứng dụng
- **API**: Cho phép nhiều requests hơn cho API calls
- **Search**: Hạn chế tìm kiếm để tránh spam
- **Upload**: Hạn chế upload để tiết kiệm bandwidth
