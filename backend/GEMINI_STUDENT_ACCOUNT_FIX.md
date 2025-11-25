# 🎓 Fix: Gemini API Key với Tài Khoản Sinh Viên

## 🔴 Vấn Đề Với Tài Khoản Sinh Viên

**Bạn có tài khoản sinh viên (Google Workspace for Education) nhưng API key vẫn báo "not found"?**

**Nguyên nhân có thể:**
1. ❌ Tài khoản sinh viên có **giới hạn** khác với tài khoản thường
2. ❌ Cần **enable API** trong Google Cloud Console
3. ❌ Cần **verify/activate** API key cho tài khoản giáo dục
4. ❌ Có thể cần **billing account** (một số features)
5. ❌ **Organization policies** có thể block API access

---

## ✅ Giải Pháp Cho Tài Khoản Sinh Viên

### **Bước 1: Kiểm Tra Google Cloud Project**

**1.1. Vào Google Cloud Console:**
- Link: https://console.cloud.google.com/
- Đăng nhập bằng tài khoản sinh viên của bạn

**1.2. Tạo Project Mới (Nếu Chưa Có):**
1. Click **"Select a project"** > **"New Project"**
2. Đặt tên project (ví dụ: "My Gemini Project")
3. Click **"Create"**

**1.3. Chọn Project:**
- Chọn project vừa tạo từ dropdown

---

### **Bước 2: Enable Generative Language API**

**2.1. Vào API Library:**
- Link: https://console.cloud.google.com/apis/library
- Hoặc: **"APIs & Services"** > **"Library"**

**2.2. Tìm Generative Language API:**
1. Search: **"Generative Language API"**
2. Click vào **"Generative Language API"**
3. Click **"Enable"**

**2.3. Kiểm Tra Enabled APIs:**
- Vào **"APIs & Services"** > **"Enabled APIs"**
- Đảm bảo **"Generative Language API"** có trong danh sách

**⚠️ Nếu Không Thấy "Enable" Button:**
- Có thể do organization policies block
- Liên hệ admin của trường để enable API
- Hoặc dùng tài khoản Google cá nhân (không phải tài khoản trường)

---

### **Bước 3: Tạo API Key**

**3.1. Vào Credentials:**
- Link: https://console.cloud.google.com/apis/credentials
- Hoặc: **"APIs & Services"** > **"Credentials"**

**3.2. Tạo API Key:**
1. Click **"+ CREATE CREDENTIALS"** > **"API Key"**
2. Copy API key mới
3. **QUAN TRỌNG:** Click vào API key vừa tạo để cấu hình

**3.3. Cấu Hình API Key:**
1. **API restrictions:**
   - Chọn **"Restrict key"**
   - Chọn **"Generative Language API"** (hoặc "Don't restrict key" để test)
2. **Application restrictions:**
   - Chọn **"None"** (hoặc "IP addresses" nếu biết IP server)
3. Click **"Save"**

---

### **Bước 4: Kiểm Tra Billing (Nếu Cần)**

**4.1. Kiểm Tra Billing:**
- Vào: https://console.cloud.google.com/billing
- Kiểm tra xem có billing account không

**4.2. Free Tier:**
- Gemini API có **free tier** (60 requests/minute)
- Tài khoản sinh viên thường có free tier
- Không cần billing cho basic usage

**4.3. Nếu Cần Billing:**
- Một số features cần billing
- Nhưng basic API calls không cần

---

### **Bước 5: Kiểm Tra Organization Policies**

**5.1. Nếu Dùng Tài Khoản Trường:**
- Admin có thể đã block API access
- Liên hệ IT department để hỏi về:
  - Google Cloud API access
  - Generative Language API
  - API key restrictions

**5.2. Nếu Bị Block:**
- Có thể dùng tài khoản Google cá nhân
- Hoặc request admin enable API

---

### **Bước 6: Test API Key**

**6.1. Test Bằng Script:**
```bash
cd backend
node scripts/test-gemini-api-key.js
```

**6.2. Test Trực Tiếp:**
- Vào: https://aistudio.google.com/
- Đăng nhập bằng tài khoản sinh viên
- Thử tạo API key từ đây
- Test trong playground

---

## 🔍 Troubleshooting Đặc Biệt Cho Tài Khoản Sinh Viên

### **1. "API not enabled" Error:**

**Nguyên nhân:**
- Organization policies block API
- API chưa được enable trong project

**Giải pháp:**
- Enable API trong Google Cloud Console
- Hoặc liên hệ admin

---

### **2. "Permission denied" Error:**

**Nguyên nhân:**
- Tài khoản không có quyền truy cập project
- Organization policies restrict access

**Giải pháp:**
- Đảm bảo bạn là owner/editor của project
- Hoặc request quyền từ admin

---

### **3. "Quota exceeded" Error:**

**Nguyên nhân:**
- Free tier limit (60 requests/minute)
- Organization có quota limit

**Giải pháp:**
- Đợi vài phút rồi thử lại
- Hoặc upgrade billing (nếu cần)

---

### **4. API Key Không Hoạt Động:**

**Nguyên nhân:**
- API key bị restrict quá nhiều
- API key không có quyền truy cập model

**Giải pháp:**
- Tạo API key mới
- Set "Don't restrict key" để test
- Sau đó mới set restrictions

---

## 📝 Checklist Cho Tài Khoản Sinh Viên

- [ ] ✅ Đã tạo Google Cloud Project
- [ ] ✅ Đã enable Generative Language API
- [ ] ✅ Đã tạo API key mới
- [ ] ✅ Đã cấu hình API key (restrictions)
- [ ] ✅ Đã test API key bằng script
- [ ] ✅ Đã kiểm tra organization policies (nếu dùng tài khoản trường)
- [ ] ✅ Đã cập nhật API key vào `.env`
- [ ] ✅ Đã restart server
- [ ] ✅ Đã test upload CV

---

## 🎯 Khuyến Nghị

### **Nếu Vẫn Không Được:**

**1. Dùng Tài Khoản Google Cá Nhân:**
- Tạo tài khoản Google mới (không phải tài khoản trường)
- Tạo API key từ tài khoản này
- Dùng API key này cho project

**2. Liên Hệ Admin:**
- Nếu dùng tài khoản trường
- Request enable Generative Language API
- Request quyền truy cập Google Cloud

**3. Dùng Google AI Studio:**
- Vào: https://aistudio.google.com/
- Đăng nhập bằng tài khoản sinh viên
- Tạo API key từ đây (dễ hơn)
- Copy API key vào `.env`

---

## ✅ Kết Luận

**Với tài khoản sinh viên:**
- ✅ Có thể dùng Gemini API (free tier)
- ⚠️ Có thể cần enable API trong Google Cloud Console
- ⚠️ Có thể bị organization policies block
- ✅ Nên dùng Google AI Studio để tạo API key (dễ hơn)

**Giải pháp tốt nhất:**
1. Vào https://aistudio.google.com/
2. Đăng nhập bằng tài khoản sinh viên
3. Tạo API key từ đây
4. Copy vào `.env`
5. Restart server
6. Test lại

Nếu vẫn không được, có thể do organization policies. Trong trường hợp đó, nên dùng tài khoản Google cá nhân.

