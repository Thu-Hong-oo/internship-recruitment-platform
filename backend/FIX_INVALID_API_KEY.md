# 🔧 Fix: API Key Invalid - "API Key not found"

## 🔴 Vấn Đề Đã Xác Định

**Test script đã xác nhận:**
- ✅ API Key format đúng (39 ký tự, bắt đầu bằng `AIzaSy`)
- ✅ API Key không có khoảng trắng
- ❌ **Google API vẫn báo "API Key not found"**

**Nghĩa là:** API key **không hợp lệ** hoặc **không có quyền** truy cập Gemini API.

---

## ✅ Giải Pháp

### **Bước 1: Tạo API Key Mới**

**1.1. Vào Google AI Studio:**
- Link: https://aistudio.google.com/app/apikey
- Đăng nhập bằng Google account

**1.2. Xóa API Key Cũ (Nếu Cần):**
- Nếu API key cũ đã bị revoke, có thể bỏ qua bước này
- Hoặc xóa API key cũ trong Google Cloud Console

**1.3. Tạo API Key Mới:**
1. Click **"Create API Key"**
2. Chọn project (hoặc tạo project mới)
3. **KHÔNG** set restrictions (để test trước)
4. Copy API key mới

**1.4. Cập Nhật .env:**
```env
GEMINI_API_KEY=AIzaSy...your-new-api-key...
```

**1.5. Test API Key Mới:**
```bash
cd backend
node scripts/test-gemini-api-key.js
```

**Kết quả mong đợi:**
```
✅ API call SUCCESSFUL!
📝 Response: "Hello"
🎉 Your API key is VALID and working!
```

---

### **Bước 2: Kiểm Tra API Key Restrictions**

**2.1. Vào Google Cloud Console:**
- Link: https://console.cloud.google.com/
- Chọn project của bạn

**2.2. Kiểm Tra API Restrictions:**
1. Vào **"APIs & Services"** > **"Credentials"**
2. Click vào API key của bạn
3. Kiểm tra **"API restrictions"**:
   - ✅ **"Don't restrict key"** → OK (cho phép tất cả APIs)
   - ⚠️ **"Restrict key"** → Đảm bảo có **"Generative Language API"**

**2.3. Kiểm Tra Application Restrictions:**
- Nếu có **"Application restrictions"**, đảm bảo không block requests từ server của bạn
- Hoặc tạm thời set **"None"** để test

---

### **Bước 3: Enable Generative Language API**

**3.1. Vào API Library:**
- Link: https://console.cloud.google.com/apis/library
- Chọn project của bạn

**3.2. Tìm và Enable API:**
1. Search: **"Generative Language API"**
2. Click vào **"Generative Language API"**
3. Click **"Enable"**

**3.3. Kiểm Tra:**
- Vào **"APIs & Services"** > **"Enabled APIs"**
- Đảm bảo **"Generative Language API"** có trong danh sách

---

### **Bước 4: Restart Server**

**Sau khi cập nhật API key:**
```bash
# Dừng server (Ctrl+C)
# Khởi động lại
cd backend
npm start
```

---

## 🧪 Test Sau Khi Fix

### **1. Test Bằng Script:**
```bash
cd backend
node scripts/test-gemini-api-key.js
```

### **2. Test Bằng Upload CV:**
- Upload CV mới
- Kiểm tra log

**Log mong đợi (thành công):**
```
✅ Gemini model initialized successfully: gemini-1.5-flash
✅ Gemini response received
📝 Cleaned response preview: {...}
✅ Successfully parsed resume from buffer
```

---

## 🔍 Troubleshooting

### **Nếu Vẫn Lỗi Sau Khi Tạo API Key Mới:**

**1. Kiểm Tra API Key Format:**
```bash
cd backend
node scripts/test-gemini-api-key.js
```
- Xem log để kiểm tra format

**2. Kiểm Tra Billing:**
- Một số features của Gemini API cần billing enabled
- Vào Google Cloud Console > Billing
- Đảm bảo có billing account (nếu cần)

**3. Kiểm Tra Quota:**
- Vào Google Cloud Console > APIs & Services > Quotas
- Kiểm tra quota của Generative Language API
- Đảm bảo không bị limit

**4. Test Với Model Khác:**
- Thử đổi `GEMINI_MODEL=gemini-pro` trong `.env`
- Test lại

**5. Kiểm Tra Network/Firewall:**
- Đảm bảo server có thể kết nối đến `generativelanguage.googleapis.com`
- Kiểm tra firewall/proxy settings

---

## 📝 Checklist

Trước khi test lại:

- [ ] ✅ Đã tạo API key mới từ Google AI Studio
- [ ] ✅ Đã copy API key mới vào `backend/.env`
- [ ] ✅ Đã test API key bằng script (`test-gemini-api-key.js`)
- [ ] ✅ Đã enable Generative Language API trong Google Cloud Console
- [ ] ✅ Đã kiểm tra API key restrictions (không restrict hoặc có Generative Language API)
- [ ] ✅ Đã **restart server**
- [ ] ✅ Đã upload CV và kiểm tra log

---

## ⚠️ Lưu Ý

1. **API Key Mới Cần Thời Gian:**
   - Đôi khi API key mới cần vài phút để activate
   - Nếu test ngay mà fail, đợi 2-3 phút rồi test lại

2. **Không Share API Key:**
   - Không commit API key vào Git
   - Không share API key public
   - Nếu đã share, nên tạo API key mới

3. **API Key Restrictions:**
   - Nếu set restrictions, đảm bảo cho phép Generative Language API
   - Hoặc tạm thời không restrict để test

---

## ✅ Kết Luận

**Vấn đề:** API key hiện tại không hợp lệ hoặc không có quyền.

**Giải pháp:** 
1. Tạo API key mới
2. Enable Generative Language API
3. Kiểm tra restrictions
4. Restart server
5. Test lại

Sau khi làm theo các bước trên, API key sẽ hoạt động và bạn sẽ thấy log thành công!

