# ⏱️ Fix Cloudinary Upload Timeout Error

## 🔴 Lỗi

```
error: Cloudinary upload error {"error":"Request Timeout","file":"resume.pdf","size":221725}
error: File upload failed {"error":"Request Timeout"}
error: TimeoutError: Request Timeout
Request completed in 5246ms
```

---

## 📊 Nguyên Nhân

### **1. Cloudinary SDK Default Timeout Quá Ngắn**

- Cloudinary SDK có default timeout khoảng **30 giây**
- File upload lớn hoặc network chậm → timeout trước khi upload xong
- Request timeout sau **5 giây** (5246ms) - có thể do Express timeout

### **2. Không Có Retry Mechanism**

- Khi timeout xảy ra → fail ngay lập tức
- Không có cơ chế retry tự động

### **3. Network Issues**

- Kết nối mạng không ổn định
- Cloudinary server response chậm
- Firewall/proxy timeout

---

## ✅ Giải Pháp Đã Implement

### **1. Tăng Timeout Configuration**

**File:** `backend/src/utils/cloudinary.js`

```javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds (tăng từ default 30s)
  secure: true,
});
```

### **2. Cải Thiện Upload Service với Retry**

**File:** `backend/src/services/unifiedUploadService.js`

**Cải tiến:**
- ✅ Timeout: **60 giây** (tăng từ 30s)
- ✅ Retry mechanism: **2 lần** nếu timeout/network error
- ✅ Exponential backoff: 1s, 2s delay giữa các retry
- ✅ Better error handling: Phân biệt timeout vs other errors

**Code:**
```javascript
async performUpload(file, config) {
  const UPLOAD_TIMEOUT = 60000; // 60 seconds
  const MAX_RETRIES = 2; // Retry 2 lần
  
  const attemptUpload = (retryCount = 0) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Cloudinary upload timeout after ${UPLOAD_TIMEOUT / 1000} seconds`));
      }, UPLOAD_TIMEOUT);
      
      // Retry logic với exponential backoff
      if (error && retryCount < MAX_RETRIES && isRetryableError(error)) {
        setTimeout(() => {
          attemptUpload(retryCount + 1).then(resolve).catch(reject);
        }, 1000 * (retryCount + 1));
      }
    });
  };
  
  return attemptUpload();
}
```

### **3. Express Timeout Configuration**

**File:** `backend/server.js` (line 213-232)

```javascript
app.use('/api/candidates/me/resume', (req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});
```

✅ **Đã có sẵn** - Timeout 5 phút cho resume upload routes

---

## 🎯 Kết Quả Mong Đợi

### **Trước:**
- ❌ Timeout sau 5 giây
- ❌ Không có retry
- ❌ Upload fail ngay lập tức

### **Sau:**
- ✅ Timeout: 60 giây
- ✅ Retry: 2 lần nếu timeout/network error
- ✅ Exponential backoff: 1s, 2s
- ✅ Better error messages

---

## 📝 Các Lỗi Được Retry

**Retry được trigger khi:**
- ✅ `timeout` error
- ✅ `ECONNRESET` (connection reset)
- ✅ `ETIMEDOUT` (connection timeout)

**Không retry khi:**
- ❌ Authentication error
- ❌ Invalid file format
- ❌ File size exceeded
- ❌ Other validation errors

---

## 🚀 Testing

### **Test với file lớn:**
```bash
# Upload file ~2MB
curl -X POST http://localhost:5000/api/candidates/me/resume \
  -H "Authorization: Bearer <token>" \
  -F "file=@large-resume.pdf" \
  -F "action=upload"
```

### **Expected behavior:**
1. Upload bắt đầu
2. Nếu timeout → retry sau 1 giây
3. Nếu vẫn timeout → retry lần 2 sau 2 giây
4. Nếu vẫn fail → return error với message rõ ràng

---

## 🔧 Troubleshooting

### **Nếu vẫn timeout:**

1. **Kiểm tra network:**
```bash
ping api.cloudinary.com
```

2. **Kiểm tra Cloudinary status:**
- https://status.cloudinary.com/

3. **Tăng timeout hơn nữa:**
```javascript
const UPLOAD_TIMEOUT = 120000; // 2 minutes
```

4. **Kiểm tra file size:**
- File quá lớn (>10MB) có thể cần chunked upload

---

## 📊 Monitoring

**Logs để theo dõi:**
```
✅ Cloudinary upload success
❌ Cloudinary upload error (với retryCount)
🔄 Retrying Cloudinary upload (attempt X/2)
```

---

**Tài liệu này giải thích fix cho Cloudinary timeout error.**

