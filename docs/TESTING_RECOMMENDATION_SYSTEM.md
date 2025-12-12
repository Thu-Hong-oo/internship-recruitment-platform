# Hướng dẫn Test Hệ thống Gợi ý Ứng viên & Job

## 📋 Tổng quan

Test các chức năng đã sửa:
1. **Gợi ý ứng viên** cho nhà tuyển dụng
2. **Gợi ý job** cho ứng viên
3. **Semantic similarity matching** (đã sửa bug)
4. **Edge cases** (job skills rỗng, etc.)

---

## 🧪 Test Cases

### 1. Test Gợi ý Ứng viên (Employer)

#### Test Case 1.1: Basic Flow - Lấy top candidates
**Endpoint:** `GET /api/nlp/top-candidates/:jobId`

**Steps:**
1. Đăng nhập với tài khoản Employer
2. Tạo hoặc chọn một job posting có:
   - Skills: ["JavaScript", "React", "Node.js"]
   - Experience: 1-2 years
   - Education: Bachelor
3. Gọi API:
```bash
GET /api/nlp/top-candidates/{jobId}?limit=10&minScore=40
```

**Expected:**
- ✅ Status 200
- ✅ Response có `success: true`
- ✅ `data.candidates` là array
- ✅ Mỗi candidate có: `candidateId`, `overallScore`, `tier`
- ✅ Candidates được sort theo score giảm dần
- ✅ Chỉ trả về candidates có score >= minScore

**Check trong response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "candidateId": "...",
        "overallScore": 85,
        "tier": "A",
        "breakdown": {
          "skills": {
            "score": 90,
            "matched": ["JavaScript", "React"],
            "missing": ["Node.js"]
          }
        }
      }
    ],
    "statistics": {...},
    "total": 10
  }
}
```

---

#### Test Case 1.2: Semantic Similarity Matching (QUAN TRỌNG - Đã sửa bug)
**Mục đích:** Verify semantic matching hoạt động đúng sau khi sửa bug

**Setup:**
1. Tạo job với skills: ["JavaScript", "React", "Node.js"]
2. Tạo candidate với skills: ["JS", "ReactJS", "Express"] (tên khác nhưng tương tự)

**Steps:**
1. Gọi API gợi ý ứng viên
2. Check response

**Expected:**
- ✅ Candidate có skills tương tự ("JS" ~ "JavaScript", "ReactJS" ~ "React") được match
- ✅ `breakdown.skills.matched` chứa các skills đã match (cả exact và semantic)
- ✅ Score > 0 (không phải 0 vì không match được)

**Verify trong logs:**
```bash
# Check backend logs
grep "Semantic similarity" logs/app.log
# Should see: "Semantic similarity matched: JS -> JavaScript"
```

---

#### Test Case 1.3: Edge Case - Job không có skills
**Mục đích:** Test division by zero fix

**Setup:**
1. Tạo job với `skills: []` hoặc không có field skills

**Steps:**
1. Gọi API gợi ý ứng viên

**Expected:**
- ✅ Không crash
- ✅ Trả về neutral score (0.5) hoặc handle gracefully
- ✅ Log không có error về division by zero

---

#### Test Case 1.4: Filter by Tier
**Endpoint:** `GET /api/nlp/top-candidates/:jobId?tier=A`

**Steps:**
1. Gọi API với `tier=A`
2. Gọi API với `tier=B`
3. Gọi API với `tier=C`

**Expected:**
- ✅ Chỉ trả về candidates có tier tương ứng
- ✅ Tier A: score >= 80%
- ✅ Tier B: score >= 60%
- ✅ Tier C: score >= 40%

---

#### Test Case 1.5: Frontend Display
**URL:** `/jobs/[jobId]` (Employer dashboard)

**Steps:**
1. Mở trang job detail
2. Scroll xuống phần "Gợi ý ứng viên"
3. Check UI

**Expected:**
- ✅ Hiển thị danh sách candidates
- ✅ Mỗi candidate có: tên, email, score, tier badge
- ✅ Button "Xem hồ sơ" và "Mời ứng tuyển" hoạt động
- ✅ Candidates không có email bị ẩn (filtered out)
- ✅ Không có error message đỏ khi có candidates

---

### 2. Test Gợi ý Job (Candidate)

#### Test Case 2.1: Basic Flow - Lấy best job matches
**Endpoint:** `GET /api/nlp/best-matches`

**Steps:**
1. Đăng nhập với tài khoản Candidate
2. Đảm bảo candidate có:
   - Skills: ["JavaScript", "React", "Node.js"]
   - Experience: 1-2 years
   - Education: Bachelor
3. Gọi API:
```bash
GET /api/nlp/best-matches?limit=10&minScore=60
```

**Expected:**
- ✅ Status 200
- ✅ Response có `success: true`
- ✅ `data` là array các job matches
- ✅ Mỗi job có: `jobId`, `overallScore`, `tier`
- ✅ Jobs được sort theo score giảm dần

---

#### Test Case 2.2: Profile Validation
**Mục đích:** Test validation khi profile rỗng

**Setup:**
1. Tạo candidate mới không có skills/experience/education

**Steps:**
1. Gọi API `/api/nlp/best-matches`

**Expected:**
- ✅ Status 400
- ✅ Message: "Bạn chưa cập nhật hồ sơ hoặc tải CV..."
- ✅ Không crash

---

#### Test Case 2.3: Semantic Matching cho Job Recommendations
**Mục đích:** Verify RAG-enhanced recommendations hoạt động

**Setup:**
1. Candidate có skills: ["JS", "ReactJS"]
2. Job có requirements: ["JavaScript", "React", "TypeScript"]

**Steps:**
1. Gọi API với RAG enabled (nếu có)
2. Check response

**Expected:**
- ✅ Semantic matching hoạt động
- ✅ Jobs có requirements tương tự được recommend
- ✅ Score cao hơn nhờ semantic similarity

---

### 3. Test Semantic Similarity (Chi tiết)

#### Test Case 3.1: Exact Match
**Input:**
- Job skills: ["JavaScript", "React"]
- Candidate skills: ["JavaScript", "React"]

**Expected:**
- ✅ 100% match
- ✅ `matched: ["JavaScript", "React"]`
- ✅ `missing: []`

---

#### Test Case 3.2: Semantic Match (Đã sửa bug)
**Input:**
- Job skills: ["JavaScript", "React"]
- Candidate skills: ["JS", "ReactJS"]

**Expected:**
- ✅ Semantic matching phát hiện similarity
- ✅ `matched: ["JavaScript", "React"]` (sau semantic check)
- ✅ Score > 0 (không phải 0)

**Verify:**
- Check logs: "Semantic similarity matched: JS -> JavaScript"
- Check `breakdown.skills.score` > 0

---

#### Test Case 3.3: Partial Match
**Input:**
- Job skills: ["JavaScript", "React", "Node.js", "TypeScript"]
- Candidate skills: ["JavaScript", "React"]

**Expected:**
- ✅ Exact match: 2/4 skills
- ✅ Score: ~50% (2/4 * 0.8 + coverage * 0.2)
- ✅ `matched: ["JavaScript", "React"]`
- ✅ `missing: ["Node.js", "TypeScript"]`

---

#### Test Case 3.4: No Match
**Input:**
- Job skills: ["Python", "Django"]
- Candidate skills: ["JavaScript", "React"]

**Expected:**
- ✅ No match
- ✅ `matched: []`
- ✅ `missing: ["Python", "Django"]`
- ✅ Score: 0 hoặc rất thấp

---

### 4. Test Edge Cases

#### Test Case 4.1: Job Skills Rỗng (Đã sửa)
**Input:**
- Job skills: []
- Candidate skills: ["JavaScript", "React"]

**Expected:**
- ✅ Không crash
- ✅ Trả về neutral score (0.5) hoặc handle gracefully
- ✅ Log không có "Division by zero" error

---

#### Test Case 4.2: Candidate Skills Rỗng
**Input:**
- Job skills: ["JavaScript", "React"]
- Candidate skills: []

**Expected:**
- ✅ `matched: []`
- ✅ `missing: ["JavaScript", "React"]`
- ✅ Score: 0

---

#### Test Case 4.3: Cả 2 đều rỗng
**Input:**
- Job skills: []
- Candidate skills: []

**Expected:**
- ✅ Không crash
- ✅ Trả về neutral score hoặc 0
- ✅ `matched: []`, `missing: []`

---

## 🛠️ Cách Test Manual

### Option 1: Test qua Frontend (Dễ nhất)

#### Test Gợi ý Ứng viên:
1. Mở browser, đăng nhập với tài khoản Employer
2. Vào trang job detail: `/jobs/[jobId]`
3. Scroll xuống phần "Gợi ý ứng viên"
4. Check:
   - ✅ Danh sách candidates hiển thị
   - ✅ Score, tier, matched skills hiển thị đúng
   - ✅ Click "Xem hồ sơ" mở modal
   - ✅ Click "Mời ứng tuyển" mở email client

#### Test Gợi ý Job:
1. Đăng nhập với tài khoản Candidate
2. Vào trang dashboard hoặc jobs page
3. Check phần "Gợi ý việc làm"
4. Verify jobs được recommend phù hợp

---

### Option 2: Test qua API (Postman/curl)

#### Test Gợi ý Ứng viên:
```bash
# 1. Login để lấy token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employer@example.com", "password": "password"}'

# 2. Gọi API gợi ý ứng viên
curl -X GET "http://localhost:3000/api/nlp/top-candidates/{jobId}?limit=10&minScore=40" \
  -H "Authorization: Bearer {token}"
```

#### Test Gợi ý Job:
```bash
# 1. Login với candidate
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "candidate@example.com", "password": "password"}'

# 2. Gọi API gợi ý job
curl -X GET "http://localhost:3000/api/nlp/best-matches?limit=10&minScore=60" \
  -H "Authorization: Bearer {token}"
```

---

### Option 3: Test Script (Node.js)

Tạo file `test-recommendations.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCandidateRecommendations() {
  try {
    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'employer@example.com',
      password: 'password'
    });
    const token = loginRes.data.token;

    // 2. Get top candidates
    const jobId = 'YOUR_JOB_ID';
    const res = await axios.get(
      `${BASE_URL}/api/nlp/top-candidates/${jobId}?limit=10&minScore=40`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Candidate Recommendations:', res.data);
    
    // Verify
    if (res.data.success && Array.isArray(res.data.data.candidates)) {
      console.log(`✅ Found ${res.data.data.candidates.length} candidates`);
      
      // Check semantic matching
      res.data.data.candidates.forEach(c => {
        console.log(`  - ${c.candidateId}: Score=${c.overallScore}, Tier=${c.tier}`);
        if (c.breakdown?.skills?.matched?.length > 0) {
          console.log(`    Matched skills: ${c.breakdown.skills.matched.join(', ')}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testJobRecommendations() {
  try {
    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'candidate@example.com',
      password: 'password'
    });
    const token = loginRes.data.token;

    // 2. Get best job matches
    const res = await axios.get(
      `${BASE_URL}/api/nlp/best-matches?limit=10&minScore=60`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Job Recommendations:', res.data);
    
    if (res.data.success && Array.isArray(res.data.data)) {
      console.log(`✅ Found ${res.data.data.length} job matches`);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
(async () => {
  console.log('🧪 Testing Candidate Recommendations...');
  await testCandidateRecommendations();
  
  console.log('\n🧪 Testing Job Recommendations...');
  await testJobRecommendations();
})();
```

Run:
```bash
node test-recommendations.js
```

---

## 🔍 Check Logs

### Backend Logs
```bash
# Check semantic similarity logs
tail -f logs/app.log | grep -i "semantic"

# Check recommendation logs
tail -f logs/app.log | grep -i "recommendation"

# Check errors
tail -f logs/app.log | grep -i "error"
```

### Expected Log Messages:
```
✅ Match calculated: Candidate XXX vs Job YYY = 85% (Tier A)
✅ Semantic similarity matched: JS -> JavaScript
✅ Generated 10 recommendations for job XXX
```

---

## ✅ Checklist Test

### Gợi ý Ứng viên:
- [ ] API trả về status 200
- [ ] Response có đúng format
- [ ] Candidates được sort theo score
- [ ] Semantic matching hoạt động (test với skills tương tự)
- [ ] Tier filtering hoạt động
- [ ] Frontend hiển thị đúng
- [ ] Candidates không có email bị ẩn
- [ ] Button "Xem hồ sơ" và "Mời ứng tuyển" hoạt động

### Gợi ý Job:
- [ ] API trả về status 200
- [ ] Response có đúng format
- [ ] Jobs được sort theo score
- [ ] Profile validation hoạt động
- [ ] Semantic matching hoạt động (nếu RAG enabled)

### Edge Cases:
- [ ] Job skills rỗng → không crash
- [ ] Candidate skills rỗng → score = 0
- [ ] Cả 2 rỗng → handle gracefully

### Semantic Similarity (Quan trọng - đã sửa):
- [ ] "JS" match với "JavaScript"
- [ ] "ReactJS" match với "React"
- [ ] Logs show semantic matching
- [ ] Score > 0 khi có semantic match

---

## 🐛 Debug Tips

### Nếu không có candidates:
1. Check database có candidates không
2. Check candidates có skills/experience không
3. Check job có skills requirements không
4. Check `minScore` có quá cao không

### Nếu semantic matching không hoạt động:
1. Check Sentence-BERT service available:
   ```bash
   # Check logs
   grep "Sentence-BERT" logs/app.log
   ```
2. Check Python script:
   ```bash
   python3 backend/python/sentence_bert_inference.py --check
   ```
3. Check logs có error không:
   ```bash
   grep "Semantic similarity failed" logs/app.log
   ```

### Nếu frontend không hiển thị:
1. Check browser console có error không
2. Check network tab - API response có đúng format không
3. Check `suggestedCandidates` state có data không

---

## 📊 Performance Test

### Test với nhiều candidates:
```bash
# Test với 100+ candidates
# Check response time
time curl -X GET "http://localhost:3000/api/nlp/top-candidates/{jobId}?limit=20" \
  -H "Authorization: Bearer {token}"
```

**Expected:**
- Response time < 3s (không có RAG)
- Response time < 5s (có RAG)

---

## 🎯 Kết quả mong đợi

Sau khi test, bạn nên thấy:

1. ✅ **Semantic matching hoạt động:** Skills tương tự được match
2. ✅ **Không có crashes:** Edge cases được handle
3. ✅ **API response đúng format:** Frontend parse được
4. ✅ **UI hiển thị đúng:** Candidates/jobs được show với đầy đủ thông tin
5. ✅ **Performance ổn:** Response time hợp lý

---

**Lưu ý:** 
- Test trên môi trường development trước
- Backup database trước khi test
- Check logs để debug nếu có vấn đề
