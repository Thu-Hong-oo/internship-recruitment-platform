# Redis - Giải Thích và Ứng Dụng

## 🔍 Redis là gì?

**Redis** (Remote Dictionary Server) là một **in-memory data store** (lưu trữ dữ liệu trong RAM) cực kỳ nhanh, được dùng như:
- **Cache** (bộ nhớ đệm) - Lưu tạm dữ liệu thường dùng
- **Session store** - Lưu thông tin phiên đăng nhập
- **Message queue** - Hàng đợi tin nhắn
- **Real-time data** - Dữ liệu cần truy cập nhanh

### Tại sao dùng Redis?

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │ ──────> │   Server    │ ──────> │  MongoDB    │
│  (Browser)  │         │  (Node.js)  │         │  (Database) │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │ (Nếu có Redis)
                              ▼
                        ┌─────────────┐
                        │    Redis    │
                        │   (RAM)     │
                        └─────────────┘
```

**So sánh tốc độ:**
- **MongoDB**: ~5-50ms (đọc từ disk)
- **Redis**: ~0.1-1ms (đọc từ RAM) ⚡ **Nhanh hơn 10-100 lần!**

---

## 📦 Redis trong Codebase Hiện Tại

### 1. **OTP Service** (Xác thực OTP)

**Vấn đề:** OTP chỉ có hiệu lực 10 phút, không cần lưu lâu trong database.

**Giải pháp:** Lưu trong Redis với TTL (Time To Live)

```javascript
// Key format: otp:email:user@example.com
// Value: "123456"
// TTL: 600 giây (10 phút)

// Lưu OTP
await redisClient.setEx('otp:email:user@example.com', 600, '123456');

// Lấy OTP
const otp = await redisClient.get('otp:email:user@example.com');

// Tự động xóa sau 10 phút (Redis tự xóa)
```

**Lợi ích:**
- ✅ Không cần cleanup job (Redis tự xóa)
- ✅ Nhanh hơn database
- ✅ Giảm tải cho MongoDB

---

### 2. **OTP Cooldown Service** (Chống spam OTP)

**Vấn đề:** User có thể spam request OTP liên tục.

**Giải pháp:** Lưu cooldown trong Redis

```javascript
// Key: otp_cooldown:email:user@example.com
// Value: "1"
// TTL: 60 giây

// Kiểm tra cooldown
const inCooldown = await redisClient.get('otp_cooldown:email:user@example.com');
if (inCooldown) {
  return "Vui lòng đợi 60 giây";
}

// Set cooldown
await redisClient.setEx('otp_cooldown:email:user@example.com', 60, '1');
```

**Lợi ích:**
- ✅ Chống spam hiệu quả
- ✅ Tự động reset sau 60s
- ✅ Không cần database query

---

## 🚀 Các Phần Có Thể Cache (Không Chỉ Job)

### 1. **Job Data** (Danh sách công việc)

**Vấn đề:** 
- User thường xem lại danh sách job
- Job data ít thay đổi (chỉ khi employer update)
- Query MongoDB mỗi lần tốn thời gian

**Giải pháp:**
```javascript
// Key: jobs:list:page:1:limit:10:status:active
// TTL: 5 phút (300 giây)

// Lấy từ cache
const cached = await redisClient.get('jobs:list:page:1:limit:10:status:active');
if (cached) {
  return JSON.parse(cached); // Trả về ngay, không query DB
}

// Nếu không có cache, query DB
const jobs = await Job.find({ status: 'active' }).limit(10);

// Lưu vào cache
await redisClient.setEx(
  'jobs:list:page:1:limit:10:status:active',
  300,
  JSON.stringify(jobs)
);
```

**Lợi ích:**
- ✅ Giảm 80-90% database queries
- ✅ Response time nhanh hơn 10-50 lần
- ✅ Giảm tải server

---

### 2. **Matching Scores** (Điểm khớp CV-Job)

**Vấn đề:**
- Tính matching score tốn thời gian (AI processing)
- User có thể xem lại score nhiều lần
- Score không thay đổi trừ khi CV/Job update

**Giải pháp:**
```javascript
// Key: match:score:candidate:123:job:456
// TTL: 24 giờ (86400 giây)

// Kiểm tra cache
const cached = await redisClient.get('match:score:candidate:123:job:456');
if (cached) {
  return JSON.parse(cached);
}

// Tính toán (tốn thời gian)
const score = await calculateMatchScore(cvData, jobData);

// Lưu cache
await redisClient.setEx(
  'match:score:candidate:123:job:456',
  86400,
  JSON.stringify(score)
);
```

**Lợi ích:**
- ✅ Tránh tính toán lại nhiều lần
- ✅ Tiết kiệm AI API calls (tiền!)
- ✅ User experience tốt hơn

---

### 3. **User Profile** (Thông tin người dùng)

**Vấn đề:**
- Profile được truy cập rất thường xuyên
- Profile ít thay đổi
- Mỗi request đều query database

**Giải pháp:**
```javascript
// Key: user:profile:userId:123
// TTL: 15 phút (900 giây)

// Lấy profile
const cached = await redisClient.get('user:profile:userId:123');
if (cached) {
  return JSON.parse(cached);
}

const profile = await UserProfile.findById(123);
await redisClient.setEx('user:profile:userId:123', 900, JSON.stringify(profile));
```

**Lợi ích:**
- ✅ Giảm database load
- ✅ Response nhanh hơn

---

### 4. **Job Recommendations** (Gợi ý công việc)

**Vấn đề:**
- Tính recommendations tốn thời gian (AI)
- User có thể refresh nhiều lần
- Recommendations không đổi trong 1 giờ

**Giải pháp:**
```javascript
// Key: recommendations:candidate:123
// TTL: 1 giờ (3600 giây)

const cached = await redisClient.get('recommendations:candidate:123');
if (cached) return JSON.parse(cached);

const recommendations = await generateRecommendations(candidateId);
await redisClient.setEx('recommendations:candidate:123', 3600, JSON.stringify(recommendations));
```

---

### 5. **Skills List** (Danh sách kỹ năng)

**Vấn đề:**
- Skills list được load ở nhiều trang
- Skills ít thay đổi (chỉ admin update)
- Query database mỗi lần không cần thiết

**Giải pháp:**
```javascript
// Key: skills:list:all
// TTL: 1 giờ (3600 giây)

const cached = await redisClient.get('skills:list:all');
if (cached) return JSON.parse(cached);

const skills = await Skill.find({ isActive: true });
await redisClient.setEx('skills:list:all', 3600, JSON.stringify(skills));
```

---

### 6. **Industry/Category Data** (Ngành nghề)

**Vấn đề:**
- Industry list được dùng ở nhiều nơi
- Data ít thay đổi
- Có thể cache lâu

**Giải pháp:**
```javascript
// Key: industries:list:all
// TTL: 24 giờ (86400 giây)

const cached = await redisClient.get('industries:list:all');
if (cached) return JSON.parse(cached);

const industries = await Industry.find();
await redisClient.setEx('industries:list:all', 86400, JSON.stringify(industries));
```

---

### 7. **Job Stats** (Thống kê công việc)

**Vấn đề:**
- Stats được tính toán từ nhiều collections
- User xem stats thường xuyên
- Stats không cần real-time 100%

**Giải pháp:**
```javascript
// Key: job:stats:jobId:123
// TTL: 5 phút (300 giây)

const cached = await redisClient.get('job:stats:jobId:123');
if (cached) return JSON.parse(cached);

const stats = await calculateJobStats(jobId);
await redisClient.setEx('job:stats:jobId:123', 300, JSON.stringify(stats));
```

---

## 🎯 Khi Nào Nên Cache?

### ✅ **NÊN cache khi:**
1. **Data được đọc nhiều, ít thay đổi**
   - Job listings
   - User profiles
   - Skills/Industries list

2. **Tính toán tốn thời gian**
   - Matching scores (AI processing)
   - Recommendations (AI)
   - Aggregations/Stats

3. **Data có thể stale một chút**
   - Job stats (5 phút cũ vẫn OK)
   - Recommendations (1 giờ cũ vẫn OK)

### ❌ **KHÔNG NÊN cache khi:**
1. **Data thay đổi liên tục**
   - Real-time notifications
   - Live chat messages

2. **Data cần chính xác 100%**
   - Payment transactions
   - Critical user data

3. **Data chỉ dùng 1 lần**
   - One-time operations
   - Unique requests

---

## 🔧 Cách Hoạt Động trong Code

### Flow không có cache:
```
User Request → Server → MongoDB Query (50ms) → Response
Total: ~50-100ms
```

### Flow có cache (cache hit):
```
User Request → Server → Redis (0.5ms) → Response
Total: ~1-5ms ⚡ Nhanh hơn 10-20 lần!
```

### Flow có cache (cache miss):
```
User Request → Server → Redis (không có) → MongoDB Query (50ms) → 
Lưu vào Redis → Response
Total: ~50-100ms (lần đầu), các lần sau chỉ ~1-5ms
```

---

## 📊 TTL (Time To Live) - Thời gian sống

| Loại Data | TTL | Lý do |
|-----------|-----|-------|
| OTP Codes | 10 phút | Chỉ dùng 1 lần, ngắn hạn |
| OTP Cooldown | 60 giây | Chống spam |
| Job Listings | 5 phút | Data thay đổi vừa phải |
| Matching Scores | 24 giờ | Tính toán tốn thời gian |
| User Profiles | 15 phút | Thay đổi không thường xuyên |
| Skills/Industries | 1-24 giờ | Rất ít thay đổi |
| Recommendations | 1 giờ | AI processing tốn thời gian |
| Job Stats | 5 phút | Cần tương đối real-time |

---

## 🚨 Cache Invalidation (Xóa cache khi cần)

Khi data thay đổi, cần xóa cache:

```javascript
// Khi job được update
await redisClient.del('jobs:list:page:1:limit:10:status:active');
await redisClient.del('job:detail:jobId:123');
await redisClient.del('job:stats:jobId:123');

// Khi user profile update
await redisClient.del('user:profile:userId:123');

// Khi skills được update (admin)
await redisClient.del('skills:list:all');
```

---

## 💡 Best Practices

1. **Luôn có fallback:** Nếu Redis fail, vẫn query database
2. **Set TTL hợp lý:** Không quá ngắn (tốn query), không quá dài (data cũ)
3. **Invalidate khi cần:** Xóa cache khi data thay đổi
4. **Monitor cache hit rate:** Tỷ lệ cache hit nên > 70%
5. **Compress data lớn:** JSON.stringify có thể lớn, cân nhắc compress

---

## 📝 Tóm Tắt

**Redis = Bộ nhớ đệm siêu nhanh trong RAM**

- ⚡ **Nhanh:** 10-100 lần nhanh hơn database
- 💰 **Tiết kiệm:** Giảm database load, API calls
- 🎯 **Hiệu quả:** Cache data thường dùng, tính toán tốn thời gian
- 🔄 **Tự động:** TTL tự xóa, không cần cleanup

**Trong codebase:**
- ✅ Đang dùng: OTP, Cooldown
- 🚀 Có thể thêm: Jobs, Matching Scores, Profiles, Recommendations, Skills, Industries, Stats

