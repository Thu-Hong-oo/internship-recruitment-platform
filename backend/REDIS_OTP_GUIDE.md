# 🔐 Hướng dẫn sử dụng OTP với Redis

## 📋 Tổng quan

Hệ thống đã được cập nhật để lưu trữ OTP trong Redis thay vì database, với thời gian xác thực 10 phút. Điều này giúp tăng performance và giảm tải cho database.

## 🚀 Tính năng mới

### 1. **OTP Service với Redis**
- Lưu trữ OTP trong Redis với TTL 10 phút
- Tự động xóa OTP sau khi xác thực thành công
- Fallback về database khi Redis không khả dụng

### 2. **Thời gian xác thực**
- **Email verification OTP**: 10 phút
- **Password reset OTP**: 10 phút
- **Tự động hết hạn**: Redis TTL

### 3. **Bảo mật**
- OTP được lưu trữ an toàn trong Redis
- Tự động xóa sau khi sử dụng
- Fallback mechanism khi Redis down

## 🔧 Cấu hình

### 1. **Redis Configuration**
Thêm vào file `.env`:
```env
REDIS_URL=redis://localhost:6379
```

### 2. **Cài đặt Redis**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows
# Tải Redis từ https://redis.io/download
```

### 3. **Khởi động Redis**
```bash
# Ubuntu/Debian
sudo systemctl start redis-server

# macOS
brew services start redis

# Windows
redis-server
```

## 📊 Cấu trúc Redis Keys

### OTP Keys Pattern
```
otp:email_verification:user@example.com
otp:password_reset:user@example.com
```

### TTL (Time To Live)
- **10 phút** (600 giây) cho tất cả OTP
- Tự động xóa khi hết hạn

## 🔄 Workflow

### 1. **Đăng ký tài khoản**
```javascript
// OTP được tạo và lưu vào Redis
await otpService.storeOTP('email_verification', email, otp);
// Key: otp:email_verification:user@example.com
// TTL: 10 phút
```

### 2. **Xác thực Email**
```javascript
// OTP được verify và xóa khỏi Redis
const isValid = await otpService.verifyAndDeleteOTP('email_verification', email, otp);
```

### 3. **Quên mật khẩu**
```javascript
// OTP được tạo và lưu vào Redis
await otpService.storeOTP('password_reset', email, otp);
// Key: otp:password_reset:user@example.com
// TTL: 10 phút
```

### 4. **Đặt lại mật khẩu**
```javascript
// OTP được verify và xóa khỏi Redis
const isValid = await otpService.verifyAndDeleteOTP('password_reset', email, otp);
```

## 🛡️ Fallback Mechanism

### Khi Redis không khả dụng:
1. **Lưu trữ**: OTP được lưu vào database
2. **Xác thực**: So sánh OTP từ database
3. **Thời gian**: Sử dụng `emailVerificationExpire` và `resetPasswordExpire`

### Logs
```
[INFO] OTP Service initialized with Redis
[WARN] OTP Service initialized without Redis - falling back to database
[ERROR] Failed to store OTP in Redis, falling back to database
```

## 📈 Performance Benefits

### So sánh với Database:
| Metric | Database | Redis |
|--------|----------|-------|
| **Speed** | ~10-50ms | ~1-5ms |
| **Concurrent** | Limited | High |
| **Memory** | Persistent | In-memory |
| **TTL** | Manual | Automatic |

### Lợi ích:
- ⚡ **Tốc độ nhanh hơn 10x**
- 🔄 **Xử lý concurrent tốt hơn**
- 💾 **Giảm tải database**
- 🕐 **TTL tự động**

## 🧪 Testing

### 1. **Test Redis Connection**
```bash
redis-cli ping
# Response: PONG
```

### 2. **Test OTP Storage**
```bash
redis-cli setex "otp:test:user@example.com" 600 "123456"
redis-cli get "otp:test:user@example.com"
# Response: "123456"
```

### 3. **Test TTL**
```bash
redis-cli ttl "otp:test:user@example.com"
# Response: 600 (seconds)
```

## 🔍 Monitoring

### Redis Commands hữu ích:
```bash
# Xem tất cả OTP keys
redis-cli keys "otp:*"

# Xem memory usage
redis-cli info memory

# Xem connected clients
redis-cli client list

# Monitor Redis commands
redis-cli monitor
```

## 🚨 Troubleshooting

### 1. **Redis Connection Failed**
```
[WARN] Redis connection refused, continuing without Redis
```
**Giải pháp:**
- Kiểm tra Redis service đang chạy
- Kiểm tra REDIS_URL trong .env
- Kiểm tra firewall/port 6379

### 2. **OTP Not Found**
```
[WARN] OTP not found or expired
```
**Nguyên nhân:**
- OTP đã hết hạn (10 phút)
- OTP đã được sử dụng
- Redis key không tồn tại

### 3. **Performance Issues**
**Giải pháp:**
- Tăng Redis memory
- Sử dụng Redis cluster
- Monitor Redis performance

## 📝 API Endpoints

### Không thay đổi:
- `POST /api/auth/register` - Đăng ký (OTP lưu Redis)
- `POST /api/auth/verify-email` - Xác thực email (OTP từ Redis)
- `POST /api/auth/forgotpassword` - Quên mật khẩu (OTP lưu Redis)
- `PUT /api/auth/resetpassword` - Đặt lại mật khẩu (OTP từ Redis)
- `POST /api/auth/resend-verification` - Gửi lại OTP (OTP lưu Redis)

### Response format giữ nguyên
```json
{
  "success": true,
  "message": "Email xác thực đã được gửi thành công"
}
```

## 🔐 Security Considerations

### 1. **Redis Security**
- Sử dụng Redis password
- Bind Redis chỉ cho localhost
- Sử dụng SSL/TLS cho production

### 2. **OTP Security**
- OTP tự động xóa sau khi sử dụng
- TTL 10 phút ngắn
- Rate limiting cho OTP generation

### 3. **Fallback Security**
- Database OTP cũng có TTL
- Logging cho security audit
- Error handling an toàn

## 📚 References

- [Redis Documentation](https://redis.io/documentation)
- [Node.js Redis Client](https://github.com/redis/node-redis)
- [Redis Security](https://redis.io/topics/security)
