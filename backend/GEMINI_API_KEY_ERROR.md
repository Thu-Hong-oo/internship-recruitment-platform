# 🔑 Lỗi Gemini API Key: "API Key not found"

## 🔴 Lỗi Từ Log

```
❌ Gemini parsing error: [GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: 
[400 Bad Request] API Key not found. Please pass a valid API key.

reason: "API_KEY_INVALID"
domain: "googleapis.com"
message: "API Key not found. Please pass a valid API key."
```

---

## ✅ Đúng, Đây Là Lỗi API Key

### **1. Lỗi 400 Bad Request - API Key Invalid**

- ✅ **Đây là lỗi thật** từ Google Gemini API
- ✅ **Không phải lỗi code** của hệ thống
- ✅ **Lỗi từ phía Google** - API key không hợp lệ

### **2. Error Details**

**Từ error message:**
```
reason: "API_KEY_INVALID"
message: "API Key not found. Please pass a valid API key."
```

**Nghĩa là:**
- ❌ API key **không tồn tại** hoặc **không hợp lệ**
- ❌ API key **đã bị revoke** hoặc **expired**
- ❌ API key **format sai** hoặc **không được set**

---

## 📊 Tại Sao Xảy Ra?

### **1. API Key Không Được Set** ❌

**Có thể:**
- ❌ File `.env` không có `GEMINI_API_KEY`
- ❌ `GEMINI_API_KEY` bị comment hoặc empty
- ❌ `.env` file không được load

**Kiểm tra:**
```bash
# Kiểm tra .env file
cat .env | grep GEMINI_API_KEY

# Hoặc trong code
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length);
```

### **2. API Key Không Hợp Lệ** ❌

**Có thể:**
- ❌ API key **sai format** (không đúng format của Google)
- ❌ API key **đã bị revoke** (bị xóa hoặc disable)
- ❌ API key **expired** (hết hạn)
- ❌ API key **không có quyền** truy cập Gemini API

**Format đúng:**
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### **3. API Key Không Có Quyền** ❌

**Có thể:**
- ❌ API key không được enable cho **Generative Language API**
- ❌ API key không có quyền truy cập model `gemini-2.0-flash-exp`
- ❌ Project không có billing enabled (cho paid features)

---

## ✅ Hệ Thống Đã Xử Lý Đúng

### **1. Fallback Mechanism Hoạt Động** ✅

**Từ log (line 968-972):**
```
⚠️ Using fallback rule-based parsing
📝 Parsing with rules from extracted text
📝 Using enhanced skill extraction
✅ Found 2 skills with enhanced fallback
✅ Fallback parsing complete
```

**Hệ thống:**
- ✅ **Tự động fallback** sang rule-based parsing
- ✅ **Vẫn parse được** thông tin từ CV
- ✅ **Vẫn upload được** file lên Cloudinary
- ✅ **Vẫn điền được** vào profile

### **2. Code Xử Lý**

**File:** `backend/src/services/aiService.js` (line 375-597)

```javascript
async parseResumeFromBuffer(fileBuffer, mimeType) {
  try {
    // Check API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.warn('❌ Gemini API key not configured');
      return this.fallbackParseResume();
    }

    // Try Gemini API
    const result = await this.model.generateContent(prompt);
    // ...
  } catch (error) {
    console.error('❌ Gemini parsing error:', error.message);
    
    // Check if it's API key error
    if (error.message.includes('API Key') || error.message.includes('API_KEY_INVALID')) {
      console.warn('⚠️ Model not found. Please update to: gemini-1.5-flash or gemini-1.5-pro');
    }
    
    // FALLBACK: Rule-based parsing
    return this.fallbackParseResume();
  }
}
```

**Kết quả:**
- ✅ Khi API key invalid → Tự động dùng fallback
- ✅ Không crash, không throw error
- ✅ Vẫn trả về kết quả parse (tuy không tốt bằng AI)

---

## 🎯 Giải Pháp

### **1. Kiểm Tra API Key Trong .env** ✅

**File:** `backend/.env`

```bash
# Kiểm tra xem có GEMINI_API_KEY không
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Đảm bảo:
# - Không có dấu ngoặc kép thừa
# - Không có khoảng trắng
# - Không bị comment (#)
```

### **2. Lấy API Key Mới Từ Google AI Studio** ✅

**Bước 1: Truy cập Google AI Studio**
- Link: https://aistudio.google.com/apikey

**Bước 2: Tạo API Key Mới**
1. Click "Create API Key"
2. Chọn project (hoặc tạo mới)
3. Copy API key

**Bước 3: Cập Nhật .env**
```bash
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Bước 4: Restart Server**
```bash
# Restart để load .env mới
npm run dev
# hoặc
pm2 restart all
```

### **3. Enable Generative Language API** ✅

**Bước 1: Truy cập Google Cloud Console**
- Link: https://console.cloud.google.com/

**Bước 2: Enable API**
1. Vào "APIs & Services" > "Library"
2. Tìm "Generative Language API"
3. Click "Enable"

**Bước 3: Kiểm Tra Quyền**
- Đảm bảo API key có quyền truy cập API này

### **4. Kiểm Tra API Key Format** ✅

**Format đúng:**
```
AIzaSy[32 characters]
```

**Ví dụ:**
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

**Kiểm tra:**
```javascript
// Test API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || !apiKey.startsWith('AIzaSy') || apiKey.length < 39) {
  console.error('Invalid API key format');
}
```

### **5. Đổi Model (Nếu API Key Không Hỗ Trợ Experimental Model)** ⚠️

**Nếu dùng free tier:**
- ❌ `gemini-2.0-flash-exp` có thể không available
- ✅ Dùng `gemini-1.5-flash` (stable, có quota tốt hơn)

**Cách đổi:**
```bash
# .env
GEMINI_MODEL=gemini-1.5-flash  # Thay vì gemini-2.0-flash-exp
```

---

## 🔍 Debug Steps

### **1. Kiểm Tra API Key Có Được Load Không**

```javascript
// backend/src/services/aiService.js
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length);
console.log('GEMINI_API_KEY preview:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
```

### **2. Test API Key Trực Tiếp**

```javascript
// Test script
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

model.generateContent('Hello')
  .then(result => {
    console.log('✅ API key is valid');
    console.log(result.response.text());
  })
  .catch(error => {
    console.error('❌ API key is invalid:', error.message);
  });
```

### **3. Kiểm Tra .env File**

```bash
# Kiểm tra .env có được load không
node -e "require('dotenv').config(); console.log(process.env.GEMINI_API_KEY ? 'Found' : 'Not found');"
```

---

## 📊 So Sánh: Các Lỗi Gemini API

| Lỗi | HTTP Code | Nguyên Nhân | Giải Pháp |
|-----|-----------|-------------|-----------|
| **API Key Invalid** | 400 | API key không hợp lệ | Lấy API key mới từ Google AI Studio |
| **Quota Limit** | 429 | Vượt quota | Upgrade plan hoặc đợi |
| **Model Not Found** | 404 | Model không tồn tại | Đổi model (gemini-1.5-flash) |
| **Timeout** | 408 | Request timeout | Tăng timeout hoặc retry |

---

## 🎯 Kết Luận

### **Câu Trả Lời:**

**✅ Đúng, đây là lỗi API key không hợp lệ**

**Nguyên nhân:**
1. ✅ **API key không được set** trong `.env`
2. ✅ **API key không hợp lệ** (sai format, đã bị revoke)
3. ✅ **API key không có quyền** truy cập Gemini API
4. ✅ **Model experimental** không available cho API key này

**Hệ thống đã xử lý đúng:**
- ✅ **Tự động fallback** sang rule-based parsing
- ✅ **Không crash**, vẫn hoạt động
- ✅ **Vẫn parse được** thông tin (tuy không tốt bằng AI)

**Giải pháp:**
1. **Kiểm tra .env**: Đảm bảo `GEMINI_API_KEY` được set ✅
2. **Lấy API key mới**: Từ https://aistudio.google.com/apikey ✅
3. **Enable API**: Enable Generative Language API trong Google Cloud Console ✅
4. **Đổi model**: Dùng `gemini-1.5-flash` thay vì `gemini-2.0-flash-exp` ✅

---

## 📝 Code References

- **API Key Check**: `backend/src/services/aiService.js` (line 8, 381-384)
- **Error Handling**: `backend/src/services/aiService.js` (line 575-597)
- **Fallback Parsing**: `backend/src/services/aiService.js` (line 761-794)

---

## 🚀 Quick Fix

**1. Kiểm tra .env:**
```bash
# backend/.env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**2. Lấy API key mới:**
- https://aistudio.google.com/apikey
- Copy và paste vào `.env`

**3. Restart server:**
```bash
npm run dev
```

**4. Test:**
- Upload CV lại
- Kiểm tra log xem có còn lỗi API key không

---

**Tài liệu này giải thích lỗi API key và cách fix.**

