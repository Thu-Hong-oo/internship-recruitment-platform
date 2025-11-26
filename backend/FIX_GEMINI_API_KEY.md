# 🔧 Hướng Dẫn Sửa Lỗi Gemini API Key

## 🔴 Vấn Đề Hiện Tại

Từ log debug, API key có **format đúng** nhưng Google API vẫn báo:
```
❌ API Key not found. Please pass a valid API key.
```

**Điều này có nghĩa là:**
- ✅ Format API key đúng (39 ký tự, bắt đầu bằng `AIzaSy`)
- ❌ API key **không hợp lệ** hoặc **không có quyền** truy cập Gemini API

---

## ✅ Giải Pháp

### **Bước 1: Tạo API Key Mới**

1. **Truy cập Google AI Studio:**
   - Link: https://aistudio.google.com/app/apikey
   - Đăng nhập bằng Google account

2. **Tạo API Key mới:**
   - Click "Create API Key"
   - Chọn project (hoặc tạo project mới)
   - Copy API key mới (bắt đầu bằng `AIzaSy...`)

3. **Kiểm tra API Key:**
   - Đảm bảo không có khoảng trắng
   - Độ dài khoảng 39 ký tự
   - Bắt đầu bằng `AIzaSy`

---

### **Bước 2: Cập Nhật .env File**

1. **Mở file `backend/.env`**

2. **Tìm dòng `GEMINI_API_KEY`:**

   ```env
   GEMINI_API_KEY=AIzaSyAFHbuGssTuO8GzRki4BQT4uARp8aw41y0
   ```

3. **Thay thế bằng API key mới:**

   ```env
   GEMINI_API_KEY=AIzaSy...your-new-api-key...
   ```

   **Lưu ý:**
   - Không có khoảng trắng trước/sau dấu `=`
   - Không có dấu ngoặc kép
   - Không có khoảng trắng trong API key

4. **Lưu file**

---

### **Bước 3: Restart Server**

**Sau khi cập nhật `.env`, BẮT BUỘC phải restart server:**

```bash
# Dừng server hiện tại (Ctrl+C)
# Sau đó chạy lại:
cd backend
npm start
```

**⚠️ QUAN TRỌNG:** Server phải được restart để load API key mới từ `.env`

---

### **Bước 4: Test API Key**

**Chạy script test:**

```bash
cd backend
node scripts/debug-gemini-connection.js
```

**Kết quả mong đợi:**
```
✅ SUCCESS! API Key is VALID and working!
📝 Response: "Hello"
🎉 Gemini API connection is working correctly!
```

---

## 🔍 Kiểm Tra API Key Restrictions

Nếu vẫn lỗi sau khi tạo API key mới, kiểm tra restrictions:

1. **Vào Google Cloud Console:**
   - Link: https://console.cloud.google.com/apis/credentials

2. **Tìm API key của bạn**

3. **Kiểm tra "API restrictions":**
   - Đảm bảo **"Generative Language API"** được enable
   - Hoặc chọn "Don't restrict key" (cho development)

4. **Kiểm tra "Application restrictions":**
   - Nếu có restrictions, đảm bảo domain/IP của bạn được cho phép
   - Hoặc tạm thời chọn "None" (cho development)

---

## 📊 Các Lỗi Thường Gặp

### **1. "API Key not found"**
- ✅ **Nguyên nhân:** API key không hợp lệ hoặc đã bị revoke
- ✅ **Giải pháp:** Tạo API key mới

### **2. "API Key format is invalid"**
- ✅ **Nguyên nhân:** API key có khoảng trắng hoặc ký tự đặc biệt
- ✅ **Giải pháp:** Trim API key, loại bỏ khoảng trắng

### **3. "Quota exceeded"**
- ✅ **Nguyên nhân:** Vượt quota free tier
- ✅ **Giải pháp:** Đợi reset hoặc upgrade plan

### **4. "Model not found"**
- ✅ **Nguyên nhân:** Model name sai
- ✅ **Giải pháp:** Đổi sang `gemini-1.5-flash`

---

## 💡 Lưu Ý

1. **Fallback Parsing:**
   - Khi Gemini API không hoạt động, hệ thống tự động dùng **rule-based parsing**
   - Ứng dụng vẫn hoạt động bình thường, chỉ không có AI enhancement

2. **API Key Security:**
   - Không commit API key vào Git
   - Thêm `.env` vào `.gitignore`
   - Không chia sẻ API key công khai

3. **Free Tier Limits:**
   - Google Gemini có free tier với giới hạn requests
   - Nếu vượt quota, sẽ báo lỗi 429

---

## ✅ Checklist

Sau khi làm theo hướng dẫn, kiểm tra:

- [ ] Đã tạo API key mới từ Google AI Studio
- [ ] Đã cập nhật `GEMINI_API_KEY` trong `backend/.env`
- [ ] API key không có khoảng trắng
- [ ] Đã restart server
- [ ] Script test chạy thành công
- [ ] Log không còn lỗi "API Key not found"

---

## 🆘 Vẫn Không Hoạt Động?

Nếu vẫn gặp lỗi sau khi làm theo hướng dẫn:

1. **Kiểm tra lại API key:**
   ```bash
   cd backend
   node scripts/debug-gemini-connection.js
   ```

2. **Kiểm tra Google Cloud Console:**
   - Đảm bảo "Generative Language API" được enable
   - Kiểm tra billing account (nếu cần)

3. **Thử API key khác:**
   - Tạo API key mới từ project khác
   - Hoặc dùng Google account khác

4. **Liên hệ support:**
   - Google AI Studio: https://aistudio.google.com/
   - Google Cloud Support

---

## 📝 Tóm Tắt

**Vấn đề:** API key format đúng nhưng Google API báo "not found"

**Nguyên nhân:** API key không hợp lệ, đã bị revoke, hoặc không có quyền

**Giải pháp:** 
1. Tạo API key mới
2. Cập nhật `.env`
3. Restart server
4. Test lại

**Lưu ý:** Hệ thống vẫn hoạt động với fallback parsing khi Gemini API không khả dụng.

