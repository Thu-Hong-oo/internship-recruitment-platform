# Cache Service - Hướng Dẫn Sử Dụng

## 📦 Đã Tạo

### 1. **CacheService** (`src/services/cacheService.js`)
Service tổng quát để cache mọi loại data, không chỉ job.

### 2. **Tích hợp vào hệ thống**
- Đã khởi tạo trong `src/config/initializeServices.js`
- Đã tích hợp vào `jobController.js` (một số endpoints)

---

## 🚀 Cách Sử Dụng

### Import Cache Service

```javascript
const { getCacheService } = require('../config/initializeServices');
```

### Pattern: Cache-Aside (Lazy Loading)

```javascript
// 1. Check cache trước
const cacheService = getCacheService();
let data = null;

if (cacheService) {
  data = await cacheService.get(key);
}

// 2. Nếu không có cache, query database
if (!data) {
  data = await Model.find(query);
  
  // 3. Lưu vào cache
  if (cacheService) {
    await cacheService.set(key, data, ttl);
  }
}

// 4. Trả về data
return data;
```

### Hoặc dùng helper method `getOrSet`:

```javascript
const cacheService = getCacheService();
const data = await cacheService.getOrSet(
  'my:cache:key',
  async () => {
    // Function này chỉ chạy khi cache miss
    return await Model.find(query);
  },
  300 // TTL: 5 phút
);
```

---

## 📋 Các Methods Có Sẵn

### 1. **Job Caching**

```javascript
// Cache job list
await cacheService.cacheJobList(params, jobs);

// Get cached job list
const jobs = await cacheService.getCachedJobList(params);

// Cache job detail
await cacheService.cacheJobDetail(jobId, job);

// Get cached job detail
const job = await cacheService.getCachedJobDetail(jobId);

// Invalidate job cache (khi job được create/update/delete)
await cacheService.invalidateJobCache(jobId); // Specific job
await cacheService.invalidateJobCache(); // All jobs
```

### 2. **Matching Score Caching**

```javascript
// Cache matching score
await cacheService.cacheMatchingScore(candidateId, jobId, score);

// Get cached matching score
const score = await cacheService.getCachedMatchingScore(candidateId, jobId);

// Invalidate matching score
await cacheService.invalidateMatchingScore(jobId, candidateId);
```

### 3. **Profile Caching**

```javascript
// Cache profile
await cacheService.cacheProfile(userId, 'candidate', profile);
await cacheService.cacheProfile(userId, 'employer', profile);
await cacheService.cacheProfile(userId, 'user', profile);

// Get cached profile
const profile = await cacheService.getCachedProfile(userId, 'candidate');

// Invalidate profile
await cacheService.invalidateProfile(userId, 'candidate');
```

### 4. **Static Data Caching**

```javascript
// Cache skills list
await cacheService.cacheSkillsList(skills);

// Get cached skills
const skills = await cacheService.getCachedSkillsList();

// Cache industries
await cacheService.cacheIndustriesList(industries);

// Get cached industries
const industries = await cacheService.getCachedIndustriesList();

// Invalidate static data
await cacheService.invalidateStaticData('skills');
await cacheService.invalidateStaticData('industries');
await cacheService.invalidateStaticData('all');
```

### 5. **Recommendations Caching**

```javascript
// Cache job recommendations for candidate
await cacheService.cacheJobRecommendations(candidateId, recommendations);

// Get cached recommendations
const recommendations = await cacheService.getCachedJobRecommendations(candidateId);

// Cache candidate recommendations for job
await cacheService.cacheCandidateRecommendations(jobId, recommendations);
```

### 6. **Generic Methods**

```javascript
// Get any data
const data = await cacheService.get('my:key');

// Set any data
await cacheService.set('my:key', data, 300); // TTL: 5 phút

// Delete cache
await cacheService.delete('my:key');

// Delete by pattern
await cacheService.deleteByPattern('jobs:list:*');

// Get or set (cache-aside pattern)
const data = await cacheService.getOrSet(
  'my:key',
  async () => await fetchData(),
  300
);
```

---

## 🎯 TTL Mặc Định

| Data Type | TTL | Lý do |
|-----------|-----|-------|
| Job List | 5 phút | Thay đổi vừa phải |
| Job Detail | 10 phút | Ít thay đổi |
| Matching Score | 24 giờ | Tính toán tốn thời gian |
| User Profile | 15 phút | Ít thay đổi |
| Skills List | 1 giờ | Rất ít thay đổi |
| Industries | 24 giờ | Rất ít thay đổi |
| Recommendations | 1 giờ | AI processing tốn thời gian |

---

## ✅ Đã Tích Hợp

### Job Controller:
- ✅ `getAllJobs` - Cache job lists
- ✅ `getJob` - Cache job details
- ✅ `getRecentJobs` - Cache recent jobs
- ✅ `createJob` - Invalidate cache khi tạo mới
- ✅ `updateJob` - Invalidate cache khi update
- ✅ `deleteJob` - Invalidate cache khi xóa

---

## 🚧 Cần Tích Hợp Tiếp

### 1. **Skills Controller**
```javascript
// src/controllers/skillController.js
const { getCacheService } = require('../config/initializeServices');

// Trong getAllSkills
const cacheService = getCacheService();
let skills = null;

if (cacheService) {
  skills = await cacheService.getCachedSkillsList();
}

if (!skills) {
  skills = await Skill.find({ isActive: true });
  if (cacheService) {
    await cacheService.cacheSkillsList(skills);
  }
}
```

### 2. **Industries Controller**
```javascript
// Tương tự skills
const industries = await cacheService.getCachedIndustriesList();
```

### 3. **Matching Score Controller**
```javascript
// src/controllers/advancedNLPController.js
// Trong calculateMatchingScore
const score = await cacheService.getCachedMatchingScore(candidateId, jobId);
if (!score) {
  score = await calculateScore();
  await cacheService.cacheMatchingScore(candidateId, jobId, score);
}
```

### 4. **Profile Controllers**
```javascript
// Cache user/candidate/employer profiles
const profile = await cacheService.getCachedProfile(userId, 'candidate');
```

---

## 🔧 Cache Invalidation

**Quan trọng:** Phải invalidate cache khi data thay đổi!

```javascript
// Khi job được update
await cacheService.invalidateJobCache(jobId);

// Khi profile được update
await cacheService.invalidateProfile(userId, 'candidate');

// Khi skills được update (admin)
await cacheService.invalidateStaticData('skills');
```

---

## 📊 Monitoring

```javascript
// Get cache statistics
const stats = await cacheService.getStats();
console.log(stats);

// Clear all cache (use with caution!)
await cacheService.clearAll();
```

---

## ⚠️ Lưu Ý

1. **Fallback:** Luôn có fallback nếu Redis không available
2. **TTL hợp lý:** Không quá ngắn, không quá dài
3. **Invalidate khi cần:** Xóa cache khi data thay đổi
4. **Check null:** Luôn check `cacheService` trước khi dùng

---

## 🎯 Next Steps

1. ✅ Cache Service đã tạo
2. ✅ Tích hợp vào Job Controller
3. 🚧 Tích hợp vào Skills/Industries Controllers
4. 🚧 Tích hợp vào Matching Score Controller
5. 🚧 Tích hợp vào Profile Controllers
6. 🚧 Tích hợp vào Recommendations

