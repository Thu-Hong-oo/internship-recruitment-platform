# ⚠️ QUAN TRỌNG: Phải Restart Server Sau Khi Đổi API Key

## 🔴 Vấn Đề

**Bạn vừa tạo API key mới và bỏ vào `.env` nhưng vẫn lỗi?**

**Nguyên nhân:**
- ❌ `genAI` được khởi tạo ở **top-level** khi server khởi động
- ❌ Nó dùng API key **cũ** từ lúc server start
- ❌ Dù bạn đổi `.env`, API key cũ vẫn được dùng trong memory

**Code hiện tại:**
```javascript
// backend/src/services/aiService.js (line 8)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ↑ Được khởi tạo MỘT LẦN khi module được load
```

---

## ✅ Giải Pháp

### **Bước 1: Đảm Bảo API Key Mới Trong .env**

```bash
cd backend
Get-Content .env | Select-String "GEMINI_API_KEY"
```

**Kết quả phải là:**
```
GEMINI_API_KEY=AIzaSy...your-new-api-key...
```

### **Bước 2: RESTART SERVER (BẮT BUỘC!)**

**Windows PowerShell:**
```powershell
# 1. Dừng server (nhấn Ctrl+C trong terminal đang chạy server)

# 2. Khởi động lại
cd backend
npm start
# hoặc
npm run dev
```

**Nếu dùng PM2:**
```bash
pm2 restart all
```

**Nếu dùng Docker:**
```bash
docker-compose restart
```

### **Bước 3: Kiểm Tra Log Khi Server Khởi Động**

**Log mong đợi:**
```
✅ GEMINI_API_KEY loaded: AIzaSyAFH...y0 (length: 39)
```

**Nếu thấy:**
```
❌ GEMINI_API_KEY is not set in .env file!
```
→ API key chưa được load đúng

---

## 🔍 Debug Sau Khi Restart

### **1. Upload CV và Kiểm Tra Log**

**Log mong đợi (thành công):**
```
🔍 [DEBUG] GEMINI_API_KEY exists: true
🔍 [DEBUG] GEMINI_API_KEY preview: AIzaSyAFH...y0 (length: 39)
🔄 Creating new Gemini model: gemini-1.5-flash
✅ Gemini model initialized successfully: gemini-1.5-flash
✅ Gemini response received
```

**Log nếu vẫn lỗi:**
```
🔍 [DEBUG] GEMINI_API_KEY exists: false
❌ [DEBUG] GEMINI_API_KEY is NOT SET!
❌ Gemini parsing error: API Key not found
```

---

## 🎯 Code Đã Được Cải Thiện

**Tôi đã sửa code để:**
1. ✅ Log API key khi server khởi động
2. ✅ Log API key mỗi lần gọi `getModel()`
3. ✅ Tạo `genAI` mới mỗi lần (để đọc API key mới từ env)

**Nhưng vẫn cần restart server vì:**
- `require('dotenv').config()` chỉ chạy một lần khi module được load
- Process.env chỉ được cập nhật khi process khởi động lại

---

## 📝 Checklist

Trước khi test:

- [ ] ✅ Đã tạo API key mới từ Google AI Studio
- [ ] ✅ Đã copy API key mới vào `backend/.env`
- [ ] ✅ Đã kiểm tra API key trong `.env` bằng command
- [ ] ✅ Đã **RESTART SERVER** (QUAN TRỌNG!)
- [ ] ✅ Đã kiểm tra log khi server khởi động
- [ ] ✅ Đã upload CV và kiểm tra log

---

## ⚠️ Lưu Ý

1. **Restart Server là BẮT BUỘC:**
   - Không thể hot-reload API key
   - Phải restart để load API key mới

2. **API Key Format:**
   - Phải bắt đầu bằng `AIzaSy`
   - Độ dài khoảng 39 ký tự
   - Không có khoảng trắng

3. **Nếu Vẫn Lỗi Sau Khi Restart:**
   - Kiểm tra API key có đúng format không
   - Kiểm tra API key có được enable trong Google Cloud Console không
   - Kiểm tra API key có quyền truy cập Generative Language API không

---

## 🚀 Quick Fix

**Nếu bạn đã đổi API key nhưng quên restart:**

1. **Dừng server:** Nhấn `Ctrl+C` trong terminal
2. **Khởi động lại:**
   ```bash
   cd backend
   npm start
   ```
3. **Upload CV lại và kiểm tra log**

---

## ✅ Kết Luận

**Vấn đề:** API key mới chưa được load vì server chưa restart.

**Giải pháp:** **RESTART SERVER** ngay bây giờ!

Sau khi restart, upload CV lại và bạn sẽ thấy log mới với API key preview.

