# Rate Limiting Guide

## 📋 Tổng quan

Hệ thống rate limiting được chia thành 2 loại chính:

### **1. OTPCooldownService** - Chống spam OTP

- **Mục đích**: Ngăn gửi OTP quá nhiều lần
- **Storage**: Redis (persistent)
- **Scope**: User-specific operations
- **Window**: 30-60 seconds

### **2. GlobalRateLimit** - Chống DDoS/API abuse

- **Mục đích**: Ngăn gọi API quá nhiều lần
- **Storage**: Memory (express-rate-limit)
- **Scope**: IP/User-based requests
- **Window**: 5-15 minutes

---

## 🔧 Cấu hình Environment Variables

### **OTP Cooldown (Redis-based)**

```bash
# OTP Cooldown periods (seconds)
EMAIL_VERIFICATION_COOLDOWN=60
PASSWORD_RESET_COOLDOWN=60
RESEND_VERIFICATION_COOLDOWN=30
```

### **Global Rate Limiting (Memory-based)**

```bash
# Global rate limiting
GLOBAL_RATE_LIMIT_WINDOW=900000    # 15 minutes (ms)
GLOBAL_RATE_LIMIT_MAX=100          # 100 requests per window

# API rate limiting
API_RATE_LIMIT_WINDOW=900000       # 15 minutes (ms)
API_RATE_LIMIT_MAX=200             # 200 requests per window

# Search rate limiting
SEARCH_RATE_LIMIT_WINDOW=300000    # 5 minutes (ms)
SEARCH_RATE_LIMIT_MAX=30           # 30 requests per window

# Upload rate limiting
UPLOAD_RATE_LIMIT_WINDOW=600000    # 10 minutes (ms)
UPLOAD_RATE_LIMIT_MAX=10           # 10 requests per window
```

---

## 🎯 Sử dụng trong Routes

### **1. Global Rate Limiting**

```javascript
// server.js - Áp dụng cho tất cả routes
const { globalRateLimit } = require('./src/middleware/globalRateLimit');
app.use(globalRateLimit);
```

### **2. Specific Rate Limiting**

```javascript
// routes/auth.js
const { apiRateLimit } = require('../middleware/globalRateLimit');

// Áp dụng cho auth routes
router.post('/register', apiRateLimit, register);
router.post('/login', apiRateLimit, login);

// routes/search.js
const { searchRateLimit } = require('../middleware/globalRateLimit');

// Áp dụng cho search routes
router.get('/jobs', searchRateLimit, searchJobs);
router.get('/companies', searchRateLimit, searchCompanies);

// routes/upload.js
const { uploadRateLimit } = require('../middleware/globalRateLimit');

// Áp dụng cho upload routes
router.post('/cv', uploadRateLimit, uploadCV);
router.post('/avatar', uploadRateLimit, uploadAvatar);
```

### **3. OTP Cooldown**

```javascript
// controllers/authController.js
const { otpCooldownService } = require('../services/otpService');

// Kiểm tra cooldown trước khi gửi OTP
const inCooldown = await otpCooldownService.isInCooldown(
  'email_verification',
  email
);

if (inCooldown) {
  const remainingTime = await otpCooldownService.getRemainingCooldown(
    'email_verification',
    email
  );
  return res.status(429).json({
    success: false,
    error: `Vui lòng đợi ${Math.ceil(remainingTime / 60)} phút`,
    retryAfter: remainingTime,
  });
}

// Set cooldown sau khi gửi OTP
await otpCooldownService.setCooldown('email_verification', email);
```

---

## 📊 Monitoring & Analytics

### **1. Rate Limit Metrics**

```javascript
// Log rate limit violations
logger.warn('Rate limit exceeded', {
  type: 'Global/API/Search/Upload',
  ip: req.ip,
  userId: req.user?.id,
  userAgent: req.get('User-Agent'),
  path: req.path,
  method: req.method,
});
```

### **2. OTP Cooldown Metrics**

```javascript
// Log OTP cooldown operations
logger.info('OTP cooldown set', {
  type: 'email_verification',
  identifier: email,
  cooldownPeriod: 60,
});
```

### **3. Health Check**

```javascript
// Check Redis connection for OTP cooldown
const healthCheck = async () => {
  try {
    await redisClient.ping();
    return { status: 'healthy', redis: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', redis: 'disconnected' };
  }
};
```

---

## 🚀 Best Practices

### **1. Layered Rate Limiting**

```javascript
// Layer 1: Global rate limiting (IP-based)
app.use(globalRateLimit);

// Layer 2: Specific rate limiting (User-based)
router.use('/api', apiRateLimit);

// Layer 3: OTP cooldown (Operation-based)
await otpCooldownService.setCooldown('email_verification', email);
```

### **2. Graceful Degradation**

```javascript
// OTP cooldown falls back to no rate limiting when Redis is down
if (!this.redisClient) {
  return false; // No cooldown when Redis is down
}
```

### **3. User-Friendly Messages**

```javascript
// Provide clear error messages with retry information
res.status(429).json({
  success: false,
  error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
  retryAfter: 15 * 60,
  type: 'rate_limit',
});
```

### **4. Admin Override**

```javascript
// Allow admins to bypass rate limits
if (req.user?.role === 'admin') {
  return next(); // Skip rate limiting for admins
}
```

---

## 🔍 Debugging

### **1. Check Rate Limit Status**

```javascript
// Check current rate limit status
const rateLimitInfo = await getRateLimitInfo(req.ip);
console.log('Rate limit info:', rateLimitInfo);
```

### **2. Check OTP Cooldown Status**

```javascript
// Check OTP cooldown status
const cooldownInfo = await otpCooldownService.getCooldownInfo(
  'email_verification',
  email
);
console.log('Cooldown info:', cooldownInfo);
```

### **3. Clear Rate Limits (Admin only)**

```javascript
// Clear rate limits for testing/admin purposes
await clearRateLimit(req.ip);
await otpCooldownService.clearCooldown('email_verification', email);
```

---

## 📈 Performance Considerations

### **1. Redis Optimization**

```javascript
// Use Redis pipeline for batch operations
const pipeline = redis.pipeline();
pipeline.get(key1);
pipeline.get(key2);
pipeline.exec();
```

### **2. Memory Usage**

```javascript
// Monitor memory usage of express-rate-limit
// Consider using Redis store for distributed systems
const RedisStore = require('rate-limit-redis');
const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
});
```

### **3. Key Strategy**

```javascript
// Use consistent key generation
const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
```

---

## 🎉 Kết luận

**Hệ thống rate limiting hoàn chỉnh bao gồm:**

✅ **OTPCooldownService** - Chống spam OTP operations
✅ **GlobalRateLimit** - Chống DDoS và API abuse
✅ **Environment configuration** - Dễ customize
✅ **Monitoring & logging** - Debug và analytics
✅ **Graceful degradation** - Hoạt động khi Redis down
✅ **Admin override** - Bypass cho admin
✅ **User-friendly messages** - Clear error messages

**Cả hai system đều cần thiết và bổ sung cho nhau!** 🔒
