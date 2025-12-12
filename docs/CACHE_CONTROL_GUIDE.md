# Cache Control Guide

## 🎯 Mục đích

Fix vấn đề **cache cũ** gây ra kết quả sai lệch khi:
- Algorithm được cải tiến
- Weights thay đổi
- CV/Profile được update
- Data model thay đổi

## 🚀 Cách sử dụng

### 1. Force Refresh với Headers

**Postman / Thunder Client / Insomnia:**
```
POST http://localhost:3000/api/nlp/matching-score
Headers:
  X-Force-Refresh: true
  Content-Type: application/json
Body:
  {
    "candidateId": "...",
    "jobId": "..."
  }
```

**JavaScript Fetch API:**
```javascript
fetch('http://localhost:3000/api/nlp/matching-score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Force-Refresh': 'true',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    candidateId: '...',
    jobId: '...'
  })
})
```

**Axios:**
```javascript
axios.post('http://localhost:3000/api/nlp/matching-score', 
  { candidateId: '...', jobId: '...' },
  { 
    headers: { 
      'X-Force-Refresh': 'true' 
    } 
  }
)
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/nlp/matching-score \
  -H "Content-Type: application/json" \
  -H "X-Force-Refresh: true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"candidateId":"...","jobId":"..."}'
```

### 2. Custom Cache TTL

Nếu muốn cache nhưng với thời gian ngắn:
```
Headers:
  X-Cache-TTL: 60  # Cache 1 phút
```

### 3. Query Parameters (Alternative)

```
POST /api/nlp/matching-score?forceRefresh=true
```

## 📋 API Cache Policies

| Endpoint | Cache Policy | TTL | Force Refresh |
|----------|-------------|-----|---------------|
| `POST /api/nlp/matching-score` | **NO CACHE** | 0 | ✅ Always fresh |
| `POST /roadmaps/generate-from-job/:jobId` | **NO CACHE** | 0 | ✅ Always fresh |
| `GET /roadmaps` | Short cache | 60s | ✅ X-Force-Refresh |
| `GET /roadmaps/:id` | Short cache | 60s | ✅ X-Force-Refresh |
| `PUT /roadmaps/:id` | **NO CACHE** | 0 | N/A |
| `POST /roadmaps` | **NO CACHE** | 0 | N/A |
| `GET /skills` | Long cache | 1 hour | ✅ X-Force-Refresh |
| `GET /industries` | Long cache | 1 hour | ✅ X-Force-Refresh |

## 🔧 Developer Guide

### Apply Cache Control to Routes

```javascript
// routes/yourRoute.js
const { noCache, shortCache, mediumCache, longCache } = require('../middleware/cacheControl');

// No cache (always fresh)
router.post('/matching-score', protect, noCache(), controller.calculate);

// Short cache (1 minute)
router.get('/roadmaps', protect, shortCache(), controller.getRoadmaps);

// Medium cache (5 minutes)
router.get('/jobs', protect, mediumCache(), controller.getJobs);

// Long cache (1 hour)
router.get('/skills', protect, longCache(), controller.getSkills);
```

### Check if Cache Should Be Bypassed

```javascript
// In controller
const { shouldBypassCache } = require('../middleware/cacheControl');

async function myController(req, res) {
  if (shouldBypassCache(req)) {
    // Force recalculate
    result = await calculateFresh();
  } else {
    // Try cache first
    result = await getFromCache() || await calculateFresh();
  }
}
```

## 🐛 Troubleshooting

### Problem: Vẫn nhận được cached result cũ

**Solution 1:** Thêm header `X-Force-Refresh: true`

**Solution 2:** Restart Redis
```bash
# Clear all Redis cache
redis-cli -h YOUR_HOST -p YOUR_PORT -a YOUR_PASSWORD FLUSHALL
```

**Solution 3:** Code đã disable cache rồi, check lại:
```javascript
// advancedNLPController.js
// MUST NOT have cacheService.getCachedMatchingScore()
```

### Problem: Response header vẫn có Cache-Control

**Check:** Middleware đã apply chưa?
```javascript
router.post('/matching-score', 
  protect, 
  noCache(), // ← Phải có dòng này
  controller.calculateMatchingScore
);
```

### Problem: Logs show "Returning cached result"

**Fix:** Controller code phải xóa logic cache:
```javascript
// ❌ BAD
if (cacheService && !forceRecalculate) {
  matchingResult = await cacheService.getCachedMatchingScore(...);
}

// ✅ GOOD
// CACHE DISABLED: Always calculate fresh
const matchingResult = await aiService.calculateAdvancedMatchScore(...);
```

## ✅ Verification

Test với Postman/Thunder Client:

1. **Call API lần 1** → Note `calculatedAt` timestamp
2. **Call API lần 2** (ngay sau đó)
3. **Check:** `calculatedAt` phải **KHÁC NHAU** (không cache)
4. **Check logs:** Phải thấy `"🔄 Calculating new matching score"`
5. **Check response:** `semanticScore.method` phải là `"keyword-matching"` (TF-IDF fallback)

## 📝 Notes

- **Matching Score API**: Cache **hoàn toàn disabled** vì:
  - Algorithm thay đổi thường xuyên
  - Weights được điều chỉnh
  - CV data update liên tục
  - Stale cache gây kết quả sai 70% vs 32%

- **Roadmap API**: Cache ngắn (1 phút) vì:
  - Resources thay đổi (YouTube videos)
  - User progress updates
  - Weights điều chỉnh

- **Skills/Industries API**: Cache dài (1 giờ) vì:
  - Data ổn định
  - Ít thay đổi
  - Improve performance

## 🎯 Migration từ cache cũ

Nếu code cũ có cache logic:

**Before:**
```javascript
if (cacheService && !forceRecalculate) {
  matchingResult = await cacheService.getCachedMatchingScore(...);
  if (matchingResult) return res.json(matchingResult);
}
```

**After:**
```javascript
// CACHE DISABLED - Always calculate fresh
const matchingResult = await aiService.calculateAdvancedMatchScore(...);
```

## 📚 Related Files

- `src/middleware/cacheControl.js` - Cache control middleware
- `src/routes/advancedNLP.js` - Matching score routes (NO CACHE)
- `src/routes/roadmaps.js` - Roadmap routes (SHORT CACHE)
- `src/controllers/advancedNLPController.js` - Cache logic removed
- `src/services/cache/cacheService.js` - Redis cache service (still used for other APIs)
