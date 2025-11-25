# 🔑 Hướng Dẫn Tạo API Key Mới - Từng Bước

## 🎯 Mục Tiêu

Tạo API key mới từ Google AI Studio (cách đơn giản nhất) và test ngay.

---

## 📝 Bước 1: Vào Google AI Studio

**Link:** https://aistudio.google.com/

**Lưu ý:**
- Đăng nhập bằng tài khoản Google (có thể là tài khoản sinh viên)
- Nếu không vào được, thử tài khoản Google cá nhân

---

## 📝 Bước 2: Tạo API Key

**2.1. Tìm nút "Get API Key":**
- Ở góc trên bên phải
- Hoặc vào menu > "Get API Key"

**2.2. Chọn Project:**
- **Option 1:** "Create API key in new project" (khuyến nghị)
- **Option 2:** Chọn project có sẵn

**2.3. Copy API Key:**
- API key sẽ hiển thị
- **QUAN TRỌNG:** Copy ngay (chỉ hiển thị 1 lần)
- Format: `AIzaSy...` (39 ký tự)

---

## 📝 Bước 3: Cập Nhật .env

**3.1. Mở file `.env`:**
```bash
cd backend
notepad .env
# hoặc
code .env
```

**3.2. Tìm dòng:**
```env
GEMINI_API_KEY=AIzaSyAFHb...41y0
```

**3.3. Thay bằng API key mới:**
```env
GEMINI_API_KEY=AIzaSy...your-new-api-key...
```

**3.4. Lưu file:**
- `Ctrl+S`

**⚠️ Lưu ý:**
- Không có khoảng trắng
- Không có dấu ngoặc kép
- Không có comment trên cùng dòng

---

## 📝 Bước 4: Test API Key Mới

**4.1. Test bằng script:**
```bash
cd backend
node scripts/test-gemini-api-key.js
```

**4.2. Kết quả mong đợi:**
```
✅ API call SUCCESSFUL!
📝 Response: "Hello"
🎉 Your API key is VALID and working!
```

**Nếu vẫn lỗi:**
- Đợi 1-2 phút (API key cần thời gian activate)
- Test lại
- Nếu vẫn lỗi → Xem troubleshooting bên dưới

---

## 📝 Bước 5: Restart Server

**5.1. Dừng server:**
- Nhấn `Ctrl+C` trong terminal đang chạy server

**5.2. Khởi động lại:**
```bash
cd backend
npm start
# hoặc
npm run dev
```

**5.3. Kiểm tra log khi khởi động:**
```
✅ GEMINI_API_KEY loaded: AIzaSy...y0 (length: 39)
```

---

## 📝 Bước 6: Test Upload CV

**6.1. Upload CV mới**

**6.2. Kiểm tra log:**

**Log mong đợi (thành công):**
```
✅ Gemini model initialized successfully: gemini-1.5-flash
✅ Gemini response received
📝 Cleaned response preview: {...}
✅ Successfully parsed resume from buffer
```

**Log nếu vẫn lỗi:**
```
❌ Gemini parsing error: API Key not found
⚠️ Gemini API Key error
```

---

## 🔍 Troubleshooting

### **Nếu Test Script Thành Công Nhưng Upload CV Vẫn Lỗi:**

**Nguyên nhân:** Server chưa restart

**Giải pháp:**
1. Dừng server (Ctrl+C)
2. Khởi động lại
3. Test lại

---

### **Nếu Test Script Vẫn Lỗi:**

**1. Kiểm tra API key format:**
```bash
cd backend
node scripts/test-gemini-api-key.js
```
- Xem log để kiểm tra format

**2. Đợi vài phút:**
- API key mới có thể cần 1-2 phút để activate
- Test lại sau vài phút

**3. Tạo API key mới:**
- Có thể API key vừa tạo có vấn đề
- Tạo lại API key mới

**4. Kiểm tra tài khoản:**
- Nếu dùng tài khoản sinh viên, có thể bị block
- Thử tài khoản Google cá nhân

---

### **Nếu Vẫn Không Được:**

**1. Kiểm tra Google Cloud Console:**
- Vào: https://console.cloud.google.com/
- Kiểm tra xem Generative Language API đã enable chưa
- Nếu chưa → Enable

**2. Kiểm tra API Key Restrictions:**
- Vào: https://console.cloud.google.com/apis/credentials
- Click vào API key
- Đảm bảo không bị restrict quá nhiều
- Hoặc tạm thời set "Don't restrict key"

**3. Liên hệ Support:**
- Nếu vẫn không được, có thể do organization policies
- Liên hệ admin hoặc Google support

---

## ✅ Checklist

Trước khi test:

- [ ] ✅ Đã vào Google AI Studio
- [ ] ✅ Đã tạo API key mới
- [ ] ✅ Đã copy API key (39 ký tự, bắt đầu bằng AIzaSy)
- [ ] ✅ Đã cập nhật `GEMINI_API_KEY` trong `.env`
- [ ] ✅ Đã lưu file `.env`
- [ ] ✅ Đã test API key bằng script (`test-gemini-api-key.js`)
- [ ] ✅ Script test thành công
- [ ] ✅ Đã **restart server**
- [ ] ✅ Đã upload CV và kiểm tra log

---

## 🎯 Kết Luận

**Cách tốt nhất:**
1. Tạo API key từ Google AI Studio (đơn giản nhất)
2. Copy vào `.env`
3. Test bằng script
4. Restart server
5. Test upload CV

**Nếu vẫn lỗi sau tất cả các bước:**
- Có thể do organization policies (nếu dùng tài khoản trường)
- Nên dùng tài khoản Google cá nhân
- Hoặc liên hệ admin để enable API

