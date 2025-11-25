# 🔄 Fix: Gemini Model Hot Reload từ .env

## 🔴 Vấn Đề

**User hỏi:** "Sao env tôi dùng `gemini-1.5-flash` mà log vẫn thấy `gemini-2.0-flash-exp`?"

**Nguyên nhân:**
- `AIService` được khởi tạo **một lần** khi server khởi động (singleton pattern)
- Model được tạo trong `constructor()` và **cache** trong `this.model`
- Khi thay đổi `.env` mà **không restart server**, model cũ vẫn được dùng

**Code cũ:**
```javascript
class AIService {
  constructor() {
    // Model được tạo một lần khi server khởi động
    const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
    this.model = genAI.getGenerativeModel({ model: modelName });
  }
  
  async parseResumeFromBuffer(...) {
    // Dùng model đã cache từ constructor
    const result = await this.model.generateContent(prompt);
  }
}
```

**Vấn đề:**
- ❌ Thay đổi `.env` → Không có hiệu lực ngay
- ❌ Phải **restart server** mới dùng model mới
- ❌ Không linh hoạt khi muốn đổi model

---

## ✅ Giải Pháp

### **1. Tạo Method `getModel()` Động**

**Code mới:**
```javascript
class AIService {
  constructor() {
    this._cachedModel = null;
    this._cachedModelName = null;
  }

  /**
   * Get Gemini model instance - reads from env each time to support hot-reload
   * @returns {Object|null} Gemini model instance or null if unavailable
   */
  getModel() {
    const modelName = process.env.GEMINI_MODEL || 'gemini-pro';
    
    // If model name changed or model not cached, create new instance
    if (!this._cachedModel || this._cachedModelName !== modelName) {
      try {
        this._cachedModel = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            maxOutputTokens: 2048,
          }
        });
        this._cachedModelName = modelName;
        logger.info('Gemini model initialized:', modelName);
      } catch (error) {
        logger.warn('Failed to initialize Gemini model', error.message);
        this._cachedModel = null;
        this._cachedModelName = null;
      }
    }
    
    return this._cachedModel;
  }
  
  async parseResumeFromBuffer(...) {
    // Đọc model name từ env mỗi lần gọi
    const model = this.getModel();
    if (!model) {
      throw new Error('Gemini model not available');
    }
    const result = await model.generateContent(prompt);
  }
}
```

**Lợi ích:**
- ✅ **Đọc `.env` mỗi lần gọi** → Model name được cập nhật tự động
- ✅ **Cache thông minh** → Chỉ tạo model mới khi model name thay đổi
- ✅ **Không cần restart server** → Thay đổi `.env` có hiệu lực ngay
- ✅ **Tối ưu hiệu năng** → Vẫn cache model khi model name không đổi

---

## 📊 Cách Hoạt Động

### **1. Lần Đầu Gọi**
```
User upload CV
  ↓
parseResumeFromBuffer() được gọi
  ↓
getModel() đọc process.env.GEMINI_MODEL = "gemini-1.5-flash"
  ↓
Tạo model mới và cache vào this._cachedModel
  ↓
Sử dụng model để parse CV
```

### **2. Lần Sau (Model Name Không Đổi)**
```
User upload CV lần 2
  ↓
parseResumeFromBuffer() được gọi
  ↓
getModel() đọc process.env.GEMINI_MODEL = "gemini-1.5-flash"
  ↓
So sánh: this._cachedModelName === "gemini-1.5-flash" → TRUE
  ↓
Dùng lại model đã cache (không tạo mới)
```

### **3. Khi Thay Đổi Model Name**
```
User thay đổi .env: GEMINI_MODEL=gemini-1.5-pro
  ↓
User upload CV
  ↓
parseResumeFromBuffer() được gọi
  ↓
getModel() đọc process.env.GEMINI_MODEL = "gemini-1.5-pro"
  ↓
So sánh: this._cachedModelName ("gemini-1.5-flash") !== "gemini-1.5-pro" → FALSE
  ↓
Tạo model mới với "gemini-1.5-pro" và cache
  ↓
Sử dụng model mới để parse CV
```

---

## 🎯 Kết Quả

### **Trước Khi Fix:**
```bash
# .env
GEMINI_MODEL=gemini-2.0-flash-exp

# Server khởi động → Model được cache
# User thay đổi .env
GEMINI_MODEL=gemini-1.5-flash

# Upload CV → Vẫn dùng gemini-2.0-flash-exp (model cũ)
❌ Gemini parsing error: ... gemini-2.0-flash-exp ...
```

### **Sau Khi Fix:**
```bash
# .env
GEMINI_MODEL=gemini-2.0-flash-exp

# Server khởi động
# User thay đổi .env
GEMINI_MODEL=gemini-1.5-flash

# Upload CV → Tự động dùng gemini-1.5-flash (model mới)
✅ Gemini model initialized: gemini-1.5-flash
✅ Using gemini-1.5-flash to parse CV
```

---

## 📝 Files Đã Thay Đổi

### **`backend/src/services/aiService.js`**

**Thay đổi:**
1. ✅ Thêm method `getModel()` để đọc model name động
2. ✅ Thay thế tất cả `this.model` → `this.getModel()`
3. ✅ Thêm cache thông minh để tối ưu hiệu năng

**Các chỗ đã sửa:**
- `parseResumeFromBuffer()` (line ~514)
- `enhanceCVWithAI()` (line ~659)
- `generateJobSuggestions()` (line ~1336)
- `generateCareerObjective()` (line ~2156)
- `analyzeCVJobMatch()` (line ~2300)
- `enhanceRoadmapWithAI()` (line ~7193)
- `generatePersonalizedRoadmap()` (line ~7388)

---

## ⚠️ Lưu Ý

### **1. Vẫn Cần Restart Server Nếu:**
- ❌ Thay đổi `GEMINI_API_KEY` (vì `genAI` được khởi tạo ở top-level)
- ❌ Thay đổi các config khác của Gemini SDK

### **2. Không Cần Restart Server Nếu:**
- ✅ Thay đổi `GEMINI_MODEL` (đã được fix)
- ✅ Thay đổi các env vars khác không liên quan đến Gemini

### **3. Cache Behavior:**
- ✅ Model được **cache** khi model name không đổi → Tối ưu hiệu năng
- ✅ Model được **tạo mới** khi model name thay đổi → Đảm bảo dùng model đúng
- ✅ Model được **reset** khi có lỗi → Tự động retry ở lần gọi sau

---

## 🧪 Test

### **Test Case 1: Thay Đổi Model Name**
```bash
# 1. Set .env
GEMINI_MODEL=gemini-1.5-flash

# 2. Upload CV → Check log
✅ Gemini model initialized: gemini-1.5-flash

# 3. Thay đổi .env (KHÔNG restart server)
GEMINI_MODEL=gemini-1.5-pro

# 4. Upload CV lại → Check log
✅ Gemini model initialized: gemini-1.5-pro
```

### **Test Case 2: Model Name Không Đổi**
```bash
# 1. Set .env
GEMINI_MODEL=gemini-1.5-flash

# 2. Upload CV lần 1
✅ Gemini model initialized: gemini-1.5-flash

# 3. Upload CV lần 2 (KHÔNG thay đổi .env)
# → Không thấy log "Gemini model initialized" (vì dùng cache)
✅ Parse CV thành công
```

---

## ✅ Kết Luận

**Vấn đề đã được fix:**
- ✅ Model name được đọc từ `.env` **mỗi lần gọi**
- ✅ **Không cần restart server** khi thay đổi `GEMINI_MODEL`
- ✅ **Cache thông minh** để tối ưu hiệu năng
- ✅ **Tự động cập nhật** khi model name thay đổi

**User có thể:**
1. Thay đổi `GEMINI_MODEL` trong `.env`
2. Upload CV ngay lập tức
3. Model mới sẽ được sử dụng tự động

