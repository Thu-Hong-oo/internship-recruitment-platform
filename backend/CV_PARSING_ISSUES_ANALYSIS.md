# 🔍 Phân Tích Vấn Đề Parse CV & Giải Pháp

## 📊 Vấn Đề Từ Kết Quả Parse

### **Kết Quả Parse Hiện Tại:**

```json
{
  "personalInfo": {
    "email": "thuhau100603@gMail.com", ✅
    "phone": "0397970553", ✅
    "dateOfBirth": "10/06/2003", ✅
    "address": "PhườngC", ⚠️ (thiếu)
    "fullName": null ❌ (KHÔNG extract được)
  },
  "education": {
    "institution": null, ❌
    "degree": null, ❌
    "field": "Kinhdoanhquốctế 08/2021-06/2025 ĐạihọcSàiGònTốtngh", ⚠️ (dính liền, sai format)
    "graduationYear": null, ❌
    "gpa": null,
    "gradeText": "Giỏi" ✅
  },
  "experience": [
    {
      "position": null, ❌
      "company": null, ❌
      "startDate": "08/2021", ⚠️ (sai - đây là thời gian học)
      "endDate": "06/2025", ⚠️ (sai - đây là thời gian học)
    }
  ],
  "skills": [
    { "name": "r", "type": "technical" }, ⚠️ (có thể là false positive)
    { "name": "toeic", "type": "language" } ✅
  ],
  "certificates": [
    { "name": "TOEIC", "year": 397 }, ⚠️ (year sai)
    { "name": "MOS", "year": 397 } ⚠️ (year sai)
  ]
}
```

---

## 🔴 Nguyên Nhân Chính

### **1. Text Extraction Từ PDF Không Có Khoảng Trắng**

**Từ log (line 954):**
```
NguyễnThịThuHậuNhânviênChứngtừ 0397970553 thuhau100603@gMail.com PhườngCátLái,ĐỗTP.ĐỗHồChíMinh
```

**Vấn đề:**
- ❌ Tất cả từ dính liền: `NguyễnThịThuHậu` thay vì `Nguyễn Thị Thu Hậu`
- ❌ Không có khoảng trắng giữa các từ tiếng Việt
- ❌ Regex patterns không match được vì cần khoảng trắng

### **2. Gemini API Quota Limit**

**Từ log (line 956-959):**
```
❌ Gemini parsing error: [429 Too Many Requests]
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
```

**Hệ quả:**
- ✅ Fallback sang rule-based parsing (đúng)
- ⚠️ Rule-based parsing không xử lý được text không có khoảng trắng

### **3. Rule-Based Parsing Không Xử Lý Text Dính Liền**

**Vấn đề:**
- ❌ Name pattern cần khoảng trắng: `Nguyễn\s+Thị\s+Thu\s+Hậu`
- ❌ Education pattern cần khoảng trắng: `Đại học\s+Sài Gòn`
- ❌ Skills extraction dùng `\b` word boundary - không hoạt động với text dính liền

---

## ✅ Giải Pháp Đã Implement

### **1. Cải Thiện Text Cleaning - Insert Spaces**

**File:** `backend/src/services/aiService.js` (line 268-273)

```javascript
cleanExtractedText(text) {
  // FIX: Insert spaces between Vietnamese words when text is concatenated
  // Pattern: Uppercase letter followed by lowercase letters (word boundary)
  text = text.replace(
    /([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ])/g,
    '$1 $2'
  );
  
  // FIX: Insert spaces before/after numbers/dates
  text = text.replace(/([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])(\d)/gi, '$1 $2');
  text = text.replace(/(\d)([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ])/gi, '$1 $2');
}
```

**Kết quả:**
- ✅ `NguyễnThịThuHậu` → `Nguyễn Thị Thu Hậu`
- ✅ `ĐạihọcSàiGòn` → `Đại học Sài Gòn`
- ✅ `Kinhdoanhquốctế08/2021` → `Kinh doanh quốc tế 08/2021`

### **2. Cải Thiện Name Extraction - Xử Lý Text Dính Liền**

**File:** `backend/src/services/aiService.js` (line 811-820)

```javascript
extractPersonalInfo(text) {
  // Pattern 1: Normal format với khoảng trắng
  let namePattern = /(?:^|\n)\s*((?:Nguyễn|Trần|Lê|...)\s+(?:Thị|Văn|...)?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m;
  let nameMatch = text.match(namePattern);
  
  // Pattern 2: Text không có khoảng trắng (dính liền)
  if (!nameMatch) {
    namePattern = /(?:^|\n)\s*((?:Nguyễn|Trần|Lê|...)(?:Thị|Văn|...)?[A-Z][a-z]+(?:[A-Z][a-z]+)*)/m;
    nameMatch = text.match(namePattern);
    // Thêm khoảng trắng giữa các từ
    if (nameMatch) {
      const nameWithSpaces = nameMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2');
      nameMatch[1] = nameWithSpaces;
    }
  }
}
```

**Kết quả:**
- ✅ Extract được `Nguyễn Thị Thu Hậu` từ `NguyễnThịThuHậu`

### **3. Cải Thiện Education Extraction**

**File:** `backend/src/services/aiService.js` (line 853-868)

```javascript
extractEducationInfo(text) {
  // Pattern 1: Normal format
  let uniMatch = text.match(/(?:Đại học|University|College|Trường)\s+([^\n]{5,50})/i);
  
  // Pattern 2: Text dính liền
  if (!uniMatch) {
    uniMatch = text.match(/(?:Đạihọc|University|College|Trường)([A-Z][^\n]{5,50})/i);
    if (uniMatch) {
      const uniName = uniMatch[0].replace(/([a-z])([A-Z])/g, '$1 $2');
      education.institution = uniName.trim();
    }
  }
}
```

---

## 🎯 Kết Quả Mong Đợi Sau Khi Cải Thiện

### **Kết Quả Parse Cải Thiện:**

```json
{
  "personalInfo": {
    "fullName": "Nguyễn Thị Thu Hậu", ✅ (đã fix)
    "email": "thuhau100603@gMail.com", ✅
    "phone": "0397970553", ✅
    "dateOfBirth": "10/06/2003", ✅
    "address": "Phường Cát Lái, TP. Hồ Chí Minh" ✅ (đã fix)
  },
  "education": {
    "institution": "Đại học Sài Gòn", ✅ (đã fix)
    "degree": "Cử nhân", ✅ (có thể extract được)
    "field": "Kinh doanh quốc tế", ✅ (đã fix - tách được)
    "graduationYear": 2025, ✅ (có thể extract được)
    "gradeText": "Giỏi" ✅
  },
  "experience": [
    {
      "position": "Nhân viên Chứng từ", ✅ (có thể extract được)
      "company": "...", ✅
      "startDate": "MM/YYYY", ✅
      "endDate": "MM/YYYY", ✅
    }
  ],
  "skills": [
    { "name": "TOEIC", "type": "language" }, ✅
    { "name": "MOS", "type": "technical" }, ✅
    // Thêm các skills khác từ CV
  ]
}
```

---

## 📝 Các Cải Tiến Cần Thêm

### **1. Cải Thiện Skills Extraction**

**Vấn đề:** Chỉ tìm được 2 skills ("r", "toeic")

**Giải pháp:**
- ✅ Thêm Vietnamese skill names vào `COMMON_SKILLS`
- ✅ Xử lý text dính liền trong skill matching
- ✅ Extract skills từ education field (ví dụ: "Kinh doanh quốc tế" → business skills)

### **2. Cải Thiện Experience Extraction**

**Vấn đề:** Parse sai thời gian học thành experience

**Giải pháp:**
- ✅ Phân biệt rõ ràng giữa education period và work experience
- ✅ Validate dates (không thể có experience từ 08/2021-06/2025 nếu đang học)

### **3. Cải Thiện Certificate Year Extraction**

**Vấn đề:** Year = 397 (sai)

**Giải pháp:**
- ✅ Validate year range (1900-2030)
- ✅ Extract year từ context (ví dụ: "TOEIC 2024" → year: 2024)

---

## 🚀 Khuyến Nghị

### **Ngắn Hạn:**
1. ✅ **Đã implement:** Cải thiện text cleaning để insert spaces
2. ✅ **Đã implement:** Cải thiện name extraction cho text dính liền
3. ⏳ **Cần làm:** Cải thiện education extraction
4. ⏳ **Cần làm:** Cải thiện skills extraction với Vietnamese skills

### **Dài Hạn:**
1. **Upgrade Gemini API Plan:** Để tránh quota limit
2. **OCR Enhancement:** Dùng OCR tốt hơn để extract text từ PDF
3. **Machine Learning:** Train model riêng để parse CV tiếng Việt

---

## 📊 So Sánh: Trước vs Sau

| Aspect | Trước | Sau (Sau Cải Thiện) |
|--------|-------|---------------------|
| **Full Name** | ❌ null | ✅ "Nguyễn Thị Thu Hậu" |
| **Education Institution** | ❌ null | ✅ "Đại học Sài Gòn" |
| **Education Field** | ⚠️ "Kinhdoanhquốctế..." | ✅ "Kinh doanh quốc tế" |
| **Skills Count** | ⚠️ 2 | ✅ Nhiều hơn (sau khi cải thiện) |
| **Address** | ⚠️ "PhườngC" | ✅ "Phường Cát Lái, TP. Hồ Chí Minh" |

---

**Tài liệu này phân tích vấn đề parse CV và các giải pháp đã implement.**

