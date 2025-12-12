# 🚀 Quick Test Guide - Recommendation System

## Cách chạy test tự động nhanh nhất

### Bước 1: Cấu hình credentials

Mở file `backend/test-recommendations.js` và sửa:

```javascript
const TEST_EMPLOYER = {
  email: 'your-employer@example.com',  // ← Sửa email của bạn
  password: 'your-password'            // ← Sửa password của bạn
};

const TEST_CANDIDATE = {
  email: 'your-candidate@example.com', // ← Sửa email của bạn
  password: 'your-password'            // ← Sửa password của bạn
};
```

### Bước 2: Đảm bảo backend đang chạy

```bash
# Check health
curl http://localhost:3000/health

# Hoặc
npm run test-api
```

### Bước 3: Chạy test

#### Option A: Tự động tìm job ID
```bash
cd backend
npm run test:recommendations
```

Script sẽ tự động:
- ✅ Login với employer account
- ✅ Tìm một job ID trong database
- ✅ Test gợi ý ứng viên
- ✅ Test semantic matching
- ✅ Test edge cases
- ✅ Login với candidate account
- ✅ Test gợi ý job

#### Option B: Chỉ định job ID cụ thể
```bash
cd backend
node test-recommendations.js <jobId>

# Ví dụ:
node test-recommendations.js 507f1f77bcf86cd799439011
```

#### Option C: Dùng environment variable
```bash
export TEST_JOB_ID=507f1f77bcf86cd799439011
npm run test:recommendations

# Windows PowerShell:
$env:TEST_JOB_ID="507f1f77bcf86cd799439011"
npm run test:recommendations
```

---

## 📊 Kết quả mong đợi

Khi chạy thành công, bạn sẽ thấy:

```
🚀 Starting Recommendation System Tests...

📝 Logging in as employer...
✅ API call successful
✅ Found 10 candidates

📋 Sample candidate:
   - Candidate ID: 507f1f77bcf86cd799439012
   - Score: 85%
   - Tier: A
   - Matched skills: 3
   - Missing skills: 1
   - Matched: JavaScript, React, Node.js

🧪 Testing Semantic Similarity Matching...
✅ Semantic matching appears to be working

🧪 Testing Edge Cases...
   ✅ High minScore (100): 0 candidates
   ✅ Tier filter (A): 5 candidates, all tier A

📝 Logging in as candidate...
✅ API call successful
✅ Found 8 job matches

✅ Tests completed!
```

---

## 🔍 Troubleshooting

### Lỗi: "Login failed"
- ✅ Check email/password trong `test-recommendations.js`
- ✅ Đảm bảo tài khoản tồn tại trong database
- ✅ Check backend đang chạy

### Lỗi: "No job ID provided"
- ✅ Script sẽ tự động tìm job ID
- ✅ Hoặc cung cấp job ID: `node test-recommendations.js <jobId>`
- ✅ Đảm bảo có job trong database

### Lỗi: "Cannot find job"
- ✅ Tạo job mới qua frontend hoặc API
- ✅ Đảm bảo job có status = "active"
- ✅ Check employer có quyền truy cập job đó

### Không có candidates được recommend
- ✅ Đảm bảo có candidates trong database
- ✅ Candidates phải có skills/experience
- ✅ Check `minScore` có quá cao không (thử giảm xuống 30-40)

### Semantic matching không hoạt động
- ✅ Check Sentence-BERT service:
  ```bash
  python3 backend/python/sentence_bert_inference.py --check
  ```
- ✅ Check logs: `grep "Semantic similarity" logs/app.log`
- ✅ Đảm bảo Python dependencies đã cài: `pip install sentence-transformers`

---

## 📝 Test Cases được chạy

1. ✅ **Basic Candidate Recommendations**
   - API call thành công
   - Response format đúng
   - Candidates được sort theo score

2. ✅ **Semantic Similarity Matching** (Quan trọng - đã sửa bug)
   - Skills tương tự được match
   - Logs show semantic matching

3. ✅ **Edge Cases**
   - High minScore filter
   - Tier filter
   - Division by zero fix (job skills rỗng)

4. ✅ **Job Recommendations**
   - API call thành công
   - Profile validation
   - Jobs được sort theo score

---

## 🎯 Next Steps

Sau khi test tự động thành công:

1. **Test qua Frontend:**
   - Mở browser, đăng nhập
   - Vào trang job detail
   - Check UI hiển thị đúng

2. **Test với data thực tế:**
   - Tạo job với skills cụ thể
   - Tạo candidate với skills tương tự (để test semantic)
   - Verify matching hoạt động

3. **Check logs:**
   ```bash
   tail -f logs/app.log | grep -i "recommendation\|semantic"
   ```

---

## 💡 Tips

- **Test nhanh:** Chỉ cần chạy `npm run test:recommendations`
- **Test chi tiết:** Xem `docs/TESTING_RECOMMENDATION_SYSTEM.md`
- **Debug:** Check logs và response trong console output
- **Performance:** Test với nhiều candidates/jobs để check performance

---

**Happy Testing! 🎉**

