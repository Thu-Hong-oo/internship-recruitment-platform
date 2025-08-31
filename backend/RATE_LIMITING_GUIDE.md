# 🛡️ Hướng dẫn Rate Limiting

## 📋 Tổng quan

Hệ thống đã được trang bị nhiều lớp rate limiting để bảo vệ khỏi spam, DDoS attacks và lạm dụng API.

## 🔒 Các loại Rate Limiting

### 1. **Global Rate Limiting** (Áp dụng cho tất cả requests)
- **Giới hạn**: 100 requests/15 phút/IP
- **Mục đích**: Bảo vệ server khỏi spam từ một IP
- **Áp dụng**: Tất cả endpoints

### 2. **Auth Rate Limiting** (Chỉ cho authentication)
- **Email Verification**: 3 requests/15 phút/email
- **Password Reset**: 3 requests/15 phút/email  
- **OTP Verification**: 5 requests/15 phút/email
- **Resend Verification**: 3 requests/15 phút/email
- **Mục đích**: Ngăn spam OTP và brute force

### 3. **Upload Rate Limiting** (Cho file uploads)
- **Giới hạn**: 10 uploads/10 phút/user
- **Áp dụng**: 
  - `/api/upload/*` - Tất cả upload endpoints
  - `/api/users/upload-avatar` - Upload avatar
  - `/api/ai/analyze-cv` - Upload CV để phân tích

### 4. **API Rate Limiting** (Cho API endpoints)
- **Giới hạn**: 200 requests/15 phút/user
- **Mục đích**: Bảo vệ API khỏi lạm dụng

### 5. **Search Rate Limiting** (Cho tìm kiếm)
- **Giới hạn**: 30 requests/5 phút/user
- **Mục đích**: Ngăn spam search requests

## ⚙️ Cấu hình

### Environment Variables
```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

### Redis Configuration (Cho OTP cooldown)
```env
REDIS_URL=redis://localhost:6379
```

## 📊 Response Headers

Khi rate limit bị vượt quá, response sẽ bao gồm:

```json
{
  "success": false,
  "error": "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút.",
  "retryAfter": 900
}
```

Headers:
- `X-RateLimit-Limit`: Giới hạn requests
- `X-RateLimit-Remaining`: Số requests còn lại
- `X-RateLimit-Reset`: Thời gian reset (Unix timestamp)
- `Retry-After`: Thời gian chờ (giây)

## 🔧 Customization

### Thay đổi giới hạn cho từng loại

```javascript
// Trong globalRateLimit.js
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Thay đổi số này
  // ...
});
```

### Thêm rate limiting cho route mới

```javascript
const { apiRateLimit } = require('../middleware/globalRateLimit');

router.post('/new-endpoint', apiRateLimit, controllerFunction);
```

## 🚨 Monitoring

### Logs
Rate limiting violations được log với level `warn`:
```
WARN: Global rate limit exceeded - IP: 192.168.1.1, Path: /api/auth/login
```

### Metrics
Có thể monitor qua:
- Redis keys cho OTP cooldown
- Express rate limit headers
- Application logs

## 🛠️ Troubleshooting

### Rate limit quá thấp
- Tăng `max` value trong rate limit config
- Tăng `windowMs` để mở rộng window

### Redis không khả dụng
- OTP sẽ fallback về database
- Cooldown sẽ không hoạt động
- Log warning message

### Performance issues
- Monitor Redis memory usage
- Clean up expired keys
- Adjust rate limit values

## 📈 Best Practices

1. **Phân loại endpoints**: Áp dụng rate limit khác nhau cho từng loại
2. **User-based limiting**: Sử dụng user ID thay vì chỉ IP
3. **Graceful degradation**: Fallback khi Redis down
4. **Monitoring**: Log và alert khi có violations
5. **Documentation**: Thông báo rõ ràng cho users

## 🔐 Security Considerations

- Rate limiting không thay thế authentication
- Kết hợp với các biện pháp bảo mật khác
- Monitor và alert cho suspicious patterns
- Regular review và update limits
