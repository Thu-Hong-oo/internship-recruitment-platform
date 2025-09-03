# Rate Limiting Environment Variables Guide

## 📋 Tổng quan

File này hướng dẫn cách cấu hình tất cả các biến environment cho hệ thống rate limiting, bao gồm cả **GlobalRateLimit** (memory-based) và **OTPCooldownService** (Redis-based).

---

## 🔧 Các biến Environment cần thiết

### **1. Global Rate Limiting (Memory-based)**

```bash
# Giới hạn tất cả requests từ một IP
GLOBAL_RATE_LIMIT_WINDOW=900000    # 15 minutes in milliseconds
GLOBAL_RATE_LIMIT_MAX=100          # 100 requests per 15 minutes
```

**Giải thích:**

- `GLOBAL_RATE_LIMIT_WINDOW`: Thời gian window tính bằng milliseconds
- `GLOBAL_RATE_LIMIT_MAX`: Số lượng requests tối đa trong window

**Ví dụ cấu hình:**

```bash
# Strict (production)
GLOBAL_RATE_LIMIT_WINDOW=900000    # 15 phút
GLOBAL_RATE_LIMIT_MAX=50           # 50 requests/15phút

# Moderate (staging)
GLOBAL_RATE_LIMIT_WINDOW=900000    # 15 phút
GLOBAL_RATE_LIMIT_MAX=100          # 100 requests/15phút

# Relaxed (development)
GLOBAL_RATE_LIMIT_WINDOW=900000    # 15 phút
GLOBAL_RATE_LIMIT_MAX=500          # 500 requests/15phút
```

### **2. API Rate Limiting (User-based)**

```bash
# Giới hạn API calls cho authenticated users
API_RATE_LIMIT_WINDOW=900000       # 15 minutes in milliseconds
API_RATE_LIMIT_MAX=200             # 200 requests per 15 minutes
```

**Giải thích:**

- Áp dụng cho users đã đăng nhập
- Sử dụng User ID làm key thay vì IP
- Giới hạn cao hơn global rate limit

**Ví dụ cấu hình:**

```bash
# Normal users
API_RATE_LIMIT_MAX=200             # 200 requests/15phút

# Premium users (có thể tăng)
API_RATE_LIMIT_MAX=500             # 500 requests/15phút

# Free users (có thể giảm)
API_RATE_LIMIT_MAX=100             # 100 requests/15phút
```

### **3. Search Rate Limiting (Resource-intensive)**

```bash
# Giới hạn search requests (thường bị spam)
SEARCH_RATE_LIMIT_WINDOW=300000    # 5 minutes in milliseconds
SEARCH_RATE_LIMIT_MAX=30           # 30 requests per 5 minutes
```

**Giải thích:**

- Window ngắn hơn (5 phút) vì search thường bị spam
- Giới hạn thấp hơn vì search tốn tài nguyên
- Áp dụng cho tất cả search endpoints

**Ví dụ cấu hình:**

```bash
# Strict search limiting
SEARCH_RATE_LIMIT_WINDOW=300000    # 5 phút
SEARCH_RATE_LIMIT_MAX=20           # 20 requests/5phút

# Moderate search limiting
SEARCH_RATE_LIMIT_WINDOW=300000    # 5 phút
SEARCH_RATE_LIMIT_MAX=30           # 30 requests/5phút

# Relaxed search limiting
SEARCH_RATE_LIMIT_WINDOW=300000    # 5 phút
SEARCH_RATE_LIMIT_MAX=50           # 50 requests/5phút
```

### **4. Upload Rate Limiting (File operations)**

```bash
# Giới hạn file uploads (tốn tài nguyên)
UPLOAD_RATE_LIMIT_WINDOW=600000    # 10 minutes in milliseconds
UPLOAD_RATE_LIMIT_MAX=10           # 10 uploads per 10 minutes
```

**Giải thích:**

- Window dài hơn (10 phút) vì upload tốn tài nguyên
- Giới hạn rất thấp để tránh spam upload
- Áp dụng cho tất cả upload endpoints

**Ví dụ cấu hình:**

```bash
# Strict upload limiting
UPLOAD_RATE_LIMIT_WINDOW=600000    # 10 phút
UPLOAD_RATE_LIMIT_MAX=5            # 5 uploads/10phút

# Moderate upload limiting
UPLOAD_RATE_LIMIT_WINDOW=600000    # 10 phút
UPLOAD_RATE_LIMIT_MAX=10           # 10 uploads/10phút

# Relaxed upload limiting
UPLOAD_RATE_LIMIT_WINDOW=600000    # 10 phút
UPLOAD_RATE_LIMIT_MAX=20           # 20 uploads/10phút
```

---

## 🔒 OTP Cooldown Configuration (Redis-based)

### **5. OTP Cooldown Periods**

```bash
# OTP Cooldown periods (in seconds)
EMAIL_VERIFICATION_COOLDOWN=60     # 1 minute cooldown for email verification
PASSWORD_RESET_COOLDOWN=60         # 1 minute cooldown for password reset
RESEND_VERIFICATION_COOLDOWN=30    # 30 seconds cooldown for resend OTP
```

**Giải thích:**

- `EMAIL_VERIFICATION_COOLDOWN`: Thời gian chờ giữa các lần gửi OTP email verification
- `PASSWORD_RESET_COOLDOWN`: Thời gian chờ giữa các lần gửi OTP password reset
- `RESEND_VERIFICATION_COOLDOWN`: Thời gian chờ giữa các lần resend OTP

**Ví dụ cấu hình:**

```bash
# Strict OTP limiting
EMAIL_VERIFICATION_COOLDOWN=120    # 2 phút
PASSWORD_RESET_COOLDOWN=120        # 2 phút
RESEND_VERIFICATION_COOLDOWN=60    # 1 phút

# Moderate OTP limiting
EMAIL_VERIFICATION_COOLDOWN=60     # 1 phút
PASSWORD_RESET_COOLDOWN=60         # 1 phút
RESEND_VERIFICATION_COOLDOWN=30    # 30 giây

# Relaxed OTP limiting
EMAIL_VERIFICATION_COOLDOWN=30     # 30 giây
PASSWORD_RESET_COOLDOWN=30         # 30 giây
RESEND_VERIFICATION_COOLDOWN=15    # 15 giây
```

---

## ⚙️ Advanced Configuration

### **6. Admin Bypass**

```bash
# Admin bypass (set to 'true' to allow admins to bypass rate limits)
ADMIN_BYPASS_RATE_LIMIT=false
```

**Giải thích:**

- Khi `true`: Admin users sẽ bypass tất cả rate limits
- Khi `false`: Admin users cũng bị rate limit như users khác
- Chỉ nên enable trong development hoặc emergency situations

### **7. IP Whitelist**

```bash
# Whitelist IPs (comma-separated)
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,192.168.1.100
```

**Giải thích:**

- Các IP trong whitelist sẽ không bị rate limit
- Thường dùng cho internal services, monitoring tools
- Format: comma-separated list

**Ví dụ:**

```bash
# Development
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,localhost

# Production with monitoring
RATE_LIMIT_WHITELIST_IPS=192.168.1.100,10.0.0.50

# Empty whitelist
RATE_LIMIT_WHITELIST_IPS=
```

### **8. Storage Configuration**

```bash
# Rate limit storage (memory or redis)
RATE_LIMIT_STORAGE=memory          # Options: memory, redis

# Redis configuration for rate limiting (if using redis storage)
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_REDIS_PREFIX=rate_limit:
```

**Giải thích:**

- `RATE_LIMIT_STORAGE`: Chọn storage backend
  - `memory`: Sử dụng memory (default, đơn giản)
  - `redis`: Sử dụng Redis (distributed systems)
- `RATE_LIMIT_REDIS_URL`: Redis connection URL
- `RATE_LIMIT_REDIS_PREFIX`: Prefix cho Redis keys

---

## 📊 Monitoring Configuration

### **9. Monitoring Settings**

```bash
# Enable rate limit monitoring
ENABLE_RATE_LIMIT_MONITORING=true

# Rate limit alert threshold
RATE_LIMIT_ALERT_THRESHOLD=100     # Alert when violations exceed this number

# Rate limit metrics collection
ENABLE_RATE_LIMIT_METRICS=true
```

**Giải thích:**

- `ENABLE_RATE_LIMIT_MONITORING`: Bật/tắt monitoring
- `RATE_LIMIT_ALERT_THRESHOLD`: Ngưỡng để gửi alert
- `ENABLE_RATE_LIMIT_METRICS`: Bật/tắt metrics collection

### **10. Debugging Settings**

```bash
# Enable detailed rate limit logging
RATE_LIMIT_DEBUG_LOGGING=false

# Log rate limit violations to file
RATE_LIMIT_LOG_VIOLATIONS=true

# Rate limit log file path
RATE_LIMIT_LOG_FILE=logs/rate_limit.log
```

**Giải thích:**

- `RATE_LIMIT_DEBUG_LOGGING`: Bật detailed logging (chỉ dùng development)
- `RATE_LIMIT_LOG_VIOLATIONS`: Log violations vào file riêng
- `RATE_LIMIT_LOG_FILE`: Đường dẫn file log

---

## 🎯 Environment Profiles

### **Development Environment**

```bash
# Development - Relaxed limits
GLOBAL_RATE_LIMIT_WINDOW=900000
GLOBAL_RATE_LIMIT_MAX=500
API_RATE_LIMIT_MAX=1000
SEARCH_RATE_LIMIT_MAX=100
UPLOAD_RATE_LIMIT_MAX=50
EMAIL_VERIFICATION_COOLDOWN=30
PASSWORD_RESET_COOLDOWN=30
RESEND_VERIFICATION_COOLDOWN=15
ADMIN_BYPASS_RATE_LIMIT=true
RATE_LIMIT_DEBUG_LOGGING=true
```

### **Staging Environment**

```bash
# Staging - Moderate limits
GLOBAL_RATE_LIMIT_WINDOW=900000
GLOBAL_RATE_LIMIT_MAX=200
API_RATE_LIMIT_MAX=400
SEARCH_RATE_LIMIT_MAX=50
UPLOAD_RATE_LIMIT_MAX=20
EMAIL_VERIFICATION_COOLDOWN=60
PASSWORD_RESET_COOLDOWN=60
RESEND_VERIFICATION_COOLDOWN=30
ADMIN_BYPASS_RATE_LIMIT=false
RATE_LIMIT_DEBUG_LOGGING=false
```

### **Production Environment**

```bash
# Production - Optimized limits (RECOMMENDED)
GLOBAL_RATE_LIMIT_WINDOW=900000
GLOBAL_RATE_LIMIT_MAX=300          # 20 requests/phút (tăng từ 100)
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=200              # 13.3 requests/phút (giữ nguyên)
SEARCH_RATE_LIMIT_WINDOW=300000
SEARCH_RATE_LIMIT_MAX=60            # 12 requests/phút (tăng từ 30)
UPLOAD_RATE_LIMIT_WINDOW=600000
UPLOAD_RATE_LIMIT_MAX=10            # 1 request/phút (giữ nguyên)
EMAIL_VERIFICATION_COOLDOWN=60
PASSWORD_RESET_COOLDOWN=60
RESEND_VERIFICATION_COOLDOWN=30
ADMIN_BYPASS_RATE_LIMIT=false
RATE_LIMIT_DEBUG_LOGGING=false
ENABLE_RATE_LIMIT_MONITORING=true
RATE_LIMIT_ALERT_THRESHOLD=50
```

### **High-Traffic Production Environment**

```bash
# High-Traffic Production - Higher limits
GLOBAL_RATE_LIMIT_WINDOW=900000
GLOBAL_RATE_LIMIT_MAX=500          # 33 requests/phút
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=300             # 20 requests/phút
SEARCH_RATE_LIMIT_WINDOW=300000
SEARCH_RATE_LIMIT_MAX=100          # 20 requests/phút
UPLOAD_RATE_LIMIT_WINDOW=600000
UPLOAD_RATE_LIMIT_MAX=15           # 1.5 requests/phút
EMAIL_VERIFICATION_COOLDOWN=60
PASSWORD_RESET_COOLDOWN=60
RESEND_VERIFICATION_COOLDOWN=30
ADMIN_BYPASS_RATE_LIMIT=false
RATE_LIMIT_DEBUG_LOGGING=false
ENABLE_RATE_LIMIT_MONITORING=true
RATE_LIMIT_ALERT_THRESHOLD=100
```

---

## 🔍 Validation & Testing

### **1. Validate Configuration**

```javascript
// Validate environment variables
const validateRateLimitConfig = () => {
  const required = [
    'GLOBAL_RATE_LIMIT_WINDOW',
    'GLOBAL_RATE_LIMIT_MAX',
    'API_RATE_LIMIT_WINDOW',
    'API_RATE_LIMIT_MAX',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required rate limit config: ${missing.join(', ')}`
    );
  }
};
```

### **2. Test Rate Limits**

```bash
# Test global rate limit
curl -X GET http://localhost:3000/api/test \
  -H "X-Forwarded-For: 192.168.1.1" \
  -w "HTTP Status: %{http_code}\n"

# Test API rate limit (with auth)
curl -X GET http://localhost:3000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "HTTP Status: %{http_code}\n"

# Test search rate limit
curl -X GET "http://localhost:3000/api/search?q=test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -w "HTTP Status: %{http_code}\n"
```

---

## 🚨 Troubleshooting

### **1. Common Issues**

```bash
# Issue: Rate limits too strict
# Solution: Increase limits
GLOBAL_RATE_LIMIT_MAX=200          # Tăng từ 100 lên 200
API_RATE_LIMIT_MAX=400             # Tăng từ 200 lên 400

# Issue: Rate limits too loose
# Solution: Decrease limits
GLOBAL_RATE_LIMIT_MAX=50           # Giảm từ 100 xuống 50
API_RATE_LIMIT_MAX=100             # Giảm từ 200 xuống 100

# Issue: Redis connection failed
# Solution: Check Redis config
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_STORAGE=memory          # Fallback to memory
```

### **2. Monitoring Commands**

```bash
# Check Redis keys
redis-cli keys "rate_limit:*"

# Check memory usage
redis-cli info memory

# Monitor rate limit logs
tail -f logs/rate_limit.log

# Check application logs
tail -f logs/combined.log | grep "rate limit"
```

---

## 📈 Performance Considerations

### **1. Memory Usage**

```bash
# Monitor memory usage
# express-rate-limit sử dụng memory để track
# Mỗi IP/user tạo 1 entry trong memory

# Estimate memory usage:
# 1000 unique IPs × 100 bytes per entry = ~100KB
# 10000 unique IPs × 100 bytes per entry = ~1MB
```

### **2. Redis Usage**

```bash
# Redis keys format:
# rate_limit:ip:192.168.1.1
# rate_limit:user:123456

# TTL: Tự động expire theo window
# Memory: Minimal (chỉ lưu counter)
```

---

## 🎉 Kết luận

**Các biến environment quan trọng nhất:**

✅ **Core Rate Limits**: `GLOBAL_RATE_LIMIT_*`, `API_RATE_LIMIT_*`
✅ **Specialized Limits**: `SEARCH_RATE_LIMIT_*`, `UPLOAD_RATE_LIMIT_*`
✅ **OTP Cooldowns**: `EMAIL_VERIFICATION_COOLDOWN`, `PASSWORD_RESET_COOLDOWN`
✅ **Advanced Config**: `ADMIN_BYPASS_RATE_LIMIT`, `RATE_LIMIT_WHITELIST_IPS`
✅ **Monitoring**: `ENABLE_RATE_LIMIT_MONITORING`, `RATE_LIMIT_ALERT_THRESHOLD`

**Copy các biến này vào file `.env` và adjust theo environment!** 🔧
