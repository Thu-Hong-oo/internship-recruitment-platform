# ⚠️ Giải Thích: Tại Sao Không Dùng Được Gemini API

## 🔴 Lỗi Từ Log

```
❌ Gemini parsing error: [GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: 
[429 Too Many Requests] You exceeded your current quota, please check your plan and billing details.

* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
  limit: 0, model: gemini-2.0-flash-exp

* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count
  limit: 0, model: gemini-2.0-flash-exp

Please retry in 893.975261ms.
```

---

## ✅ Đúng, Đây Là Lỗi Thật Từ Gemini API

### **1. Lỗi 429 Too Many Requests**

- ✅ **Đây là lỗi thật** từ Google Gemini API
- ✅ **Không phải lỗi code** của hệ thống
- ✅ **Lỗi từ phía Google** - API quota limit

### **2. Quota Limit: 0 Requests/Minute**

**Từ error message:**
```
limit: 0, model: gemini-2.0-flash-exp
```

**Nghĩa là:**
- ❌ **Free tier** của Gemini API có **giới hạn 0 requests/phút**
- ❌ **Free tier** có **giới hạn 0 input tokens/phút**
- ⚠️ **Model `gemini-2.0-flash-exp`** là experimental model, có thể có quota khác

---

## 📊 Tại Sao Xảy Ra?

### **1. Gemini API Free Tier Giới Hạn Rất Thấp**

**Gemini API Free Tier Limits:**
- ⚠️ **Requests per minute**: Rất thấp (có thể 0 cho một số models)
- ⚠️ **Input tokens per minute**: Rất thấp (có thể 0 cho một số models)
- ⚠️ **Daily quota**: Có giới hạn hàng ngày

**Model `gemini-2.0-flash-exp`:**
- ⚠️ Đây là **experimental model** (exp = experimental)
- ⚠️ Có thể có **quota limit khác** hoặc **không available** cho free tier
- ⚠️ Google có thể **thay đổi quota** bất cứ lúc nào

### **2. Đã Vượt Quá Quota**

**Có thể do:**
- ✅ Đã dùng hết quota trong phút này
- ✅ Đã dùng hết quota trong ngày
- ✅ Model experimental không available cho free tier
- ✅ API key đã bị limit

### **3. Retry Delay: 893ms (Gần 0s)**

**Từ log:**
```
Please retry in 893.975261ms.
```

**Nghĩa là:**
- ⚠️ Google suggest retry sau **~0.9 giây**
- ⚠️ Nhưng có thể vẫn fail vì quota = 0

---

## ✅ Hệ Thống Đã Xử Lý Đúng

### **1. Fallback Mechanism Hoạt Động** ✅

**Từ log (line 958-962):**
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

**File:** `backend/src/services/aiService.js` (line 375-568)

```javascript
async parseResumeFromBuffer(fileBuffer, mimeType) {
  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return this.fallbackParseResume();
    }

    // Try Gemini API
    const result = await this.model.generateContent(prompt);
    // ...
  } catch (error) {
    console.error('❌ Gemini parsing error:', error.message);
    
    // FALLBACK: Rule-based parsing
    return this.fallbackParseResume();
  }
}
```

**Kết quả:**
- ✅ Khi Gemini API fail → Tự động dùng fallback
- ✅ Không crash, không throw error
- ✅ Vẫn trả về kết quả parse (tuy không tốt bằng AI)

---

## 🎯 Giải Pháp

### **1. Upgrade Gemini API Plan** ✅ **KHUYẾN NGHỊ**

**Options:**
- **Paid Plan**: Có quota cao hơn nhiều
- **Google AI Studio**: Có thể có quota tốt hơn
- **Enterprise Plan**: Không giới hạn (cho production)

**Link:**
- https://ai.google.dev/pricing
- https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

### **2. Đổi Model** ⚠️

**Thay vì `gemini-2.0-flash-exp`:**
- ✅ Dùng `gemini-1.5-flash` (stable, có quota tốt hơn)
- ✅ Dùng `gemini-1.5-pro` (nếu cần accuracy cao hơn)
- ✅ Dùng `gemini-pro` (default, ổn định nhất)

**Cách đổi:**
```bash
# .env
GEMINI_MODEL=gemini-1.5-flash  # Thay vì gemini-2.0-flash-exp
```

### **3. Implement Retry với Exponential Backoff** ⏳

**Cải thiện code để retry khi gặp 429:**
```javascript
async parseResumeFromBuffer(fileBuffer, mimeType) {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Try Gemini API
      const result = await this.model.generateContent(prompt);
      return result;
    } catch (error) {
      if (error.message.includes('429') && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // Fallback to rule-based
      return this.fallbackParseResume();
    }
  }
}
```

### **4. Rate Limiting** ⏳

**Implement rate limiting để tránh vượt quota:**
```javascript
// Limit requests to Gemini API
const geminiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
});
```

---

## 📊 So Sánh: Free Tier vs Paid Plan

| Aspect | Free Tier | Paid Plan |
|--------|-----------|-----------|
| **Requests/Minute** | ⚠️ 0-15 (rất thấp) | ✅ 1000+ |
| **Input Tokens/Minute** | ⚠️ 0-100K | ✅ 1M+ |
| **Daily Quota** | ⚠️ Có giới hạn | ✅ Cao hơn nhiều |
| **Model Access** | ⚠️ Limited | ✅ All models |
| **Experimental Models** | ❌ Có thể không available | ✅ Available |

---

## 🎯 Kết Luận

### **Câu Trả Lời:**

**✅ Đúng, đây là lỗi thật từ Gemini API**

**Nguyên nhân:**
1. ✅ **Free tier quota limit**: 0 requests/phút cho model `gemini-2.0-flash-exp`
2. ✅ **Model experimental**: Có thể không available cho free tier
3. ✅ **Đã vượt quota**: Có thể đã dùng hết quota trong phút/ngày

**Hệ thống đã xử lý đúng:**
- ✅ **Tự động fallback** sang rule-based parsing
- ✅ **Không crash**, vẫn hoạt động
- ✅ **Vẫn parse được** thông tin (tuy không tốt bằng AI)

**Giải pháp:**
1. **Ngắn hạn**: Dùng fallback (đã có sẵn) ✅
2. **Dài hạn**: Upgrade Gemini API plan hoặc đổi model ✅

---

## 📝 Code References

- **Parse Resume**: `backend/src/services/aiService.js` (line 375-568)
- **Fallback Parsing**: `backend/src/services/aiService.js` (line 761-794)
- **Model Config**: `backend/src/services/aiService.js` (line 8, 220-232)

---

**Tài liệu này giải thích tại sao không dùng được Gemini API và cách xử lý.**

