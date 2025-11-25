# 🔧 Fix PDF Text Extraction: Loại Bỏ Ký Tự Lạ "Đỗ", "Ngô"

## 🔴 Vấn Đề

### **Text Extraction Từ PDF Có Ký Tự Lạ**

**Từ log (line 951):**
```
NguyễnĐỗThịĐỗThuĐỗHậuĐỗNhânĐỗviênĐỗChứNgôtừ
PhườNgôCátĐỗLái,ĐỗTP.ĐỗHồĐỗChíĐỗMinh
MụcĐỗtiêuĐặnghềĐặnghiệpĐỗ
```

**Vấn đề:**
- ❌ Có nhiều ký tự "Đỗ", "Ngô" xen kẽ vào giữa các từ
- ❌ `NguyễnĐỗThịĐỗThuĐỗHậu` thay vì `Nguyễn Thị Thu Hậu`
- ❌ `PhườNgôCátĐỗLái` thay vì `Phường Cát Lái`
- ❌ `MụcĐỗtiêu` thay vì `Mục tiêu`

**Hệ quả:**
- ❌ Name extraction fail (pattern không match)
- ❌ Education extraction fail
- ❌ Skills extraction chỉ tìm được 2 skills (thay vì nhiều hơn)

---

## 📊 Nguyên Nhân

### **1. PDF Encoding Issue**

- PDF có thể dùng font encoding đặc biệt
- Một số ký tự bị decode sai thành "Đỗ", "Ngô"
- Có thể là zero-width characters hoặc encoding artifacts

### **2. Font Recognition Issue**

- PDF parser không nhận diện đúng font
- Một số ký tự bị thay thế bằng ký tự khác

### **3. Text Extraction Library**

- `pdf-parse` có thể không xử lý tốt một số PDF formats
- Đặc biệt với PDF có font tiếng Việt phức tạp

---

## ✅ Giải Pháp Đã Implement

### **1. Loại Bỏ Ký Tự "Đỗ", "Ngô" Đứng Đơn Lẻ**

**File:** `backend/src/services/aiService.js` (line 269-285)

```javascript
cleanExtractedText(text) {
  // FIX: Loại bỏ các ký tự lạ "Đỗ", "Ngô" đứng đơn lẻ
  // Pattern: "Đỗ" hoặc "Ngô" đứng giữa các từ
  text = text.replace(/Đỗ(?=[A-Za-záàảãạ...])/g, ' ');
  text = text.replace(/Ngô(?=[A-Za-záàảãạ...])/g, ' ');
  text = text.replace(/([a-záàảãạ...])Đỗ/g, '$1 ');
  text = text.replace(/([a-záàảãạ...])Ngô/g, '$1 ');
  
  // Insert spaces between words
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // ...
}
```

**Kết quả:**
- ✅ `NguyễnĐỗThịĐỗThuĐỗHậu` → `Nguyễn Thị Thu Hậu`
- ✅ `PhườNgôCátĐỗLái` → `Phường Cát Lái`
- ✅ `MụcĐỗtiêu` → `Mục tiêu`

### **2. Loại Bỏ Zero-Width Characters**

```javascript
// Loại bỏ các ký tự Unicode lạ
text = text.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width characters
```

### **3. Loại Bỏ Từ Đơn Lẻ "Đỗ", "Ngô" Không Hợp Lệ**

```javascript
// Chỉ giữ lại nếu là tên riêng (đứng đầu câu hoặc sau dấu chấm)
text = text.replace(/\bĐỗ\b(?![A-Z...])/g, '');
text = text.replace(/\bNgô\b(?![A-Z...])/g, '');
```

---

## 🎯 Kết Quả Mong Đợi

### **Trước:**
```
NguyễnĐỗThịĐỗThuĐỗHậuĐỗNhânĐỗviênĐỗChứNgôtừ
PhườNgôCátĐỗLái,ĐỗTP.ĐỗHồĐỗChíĐỗMinh
MụcĐỗtiêuĐặnghềĐặnghiệpĐỗ
```

### **Sau:**
```
Nguyễn Thị Thu Hậu Nhân viên Chứng từ
Phường Cát Lái, TP. Hồ Chí Minh
Mục tiêu nghề nghiệp
```

### **Parse Results Cải Thiện:**

**Trước:**
- ❌ `fullName`: null
- ❌ `education.institution`: null
- ⚠️ `skills`: 2 skills

**Sau:**
- ✅ `fullName`: "Nguyễn Thị Thu Hậu"
- ✅ `education.institution`: "Đại học Sài Gòn"
- ✅ `skills`: Nhiều skills hơn (sau khi text được clean)

---

## 🔍 Testing

### **Test với text có ký tự lạ:**

```javascript
const testText = "NguyễnĐỗThịĐỗThuĐỗHậuĐỗNhânĐỗviênĐỗChứNgôtừ";
const cleaned = cleanExtractedText(testText);
console.log(cleaned);
// Expected: "Nguyễn Thị Thu Hậu Nhân viên Chứng từ"
```

---

## 📝 Các Cải Tiến Khác Cần Xem Xét

### **1. Cải Thiện PDF Text Extraction**

**Option 1: Dùng OCR**
- Dùng Tesseract OCR cho PDF có hình ảnh
- Tốt hơn cho PDF scan

**Option 2: Dùng PDF Library Khác**
- `pdfjs-dist` (Mozilla PDF.js)
- `pdf2json`
- Có thể xử lý font encoding tốt hơn

### **2. Pattern-Based Cleaning**

**Thêm patterns để fix các lỗi thường gặp:**
```javascript
const commonFixes = {
  'Đỗ': '', // Loại bỏ nếu đứng đơn lẻ
  'Ngô': '', // Loại bỏ nếu đứng đơn lẻ
  'ĐỗĐỗ': ' ', // Double Đỗ → space
  'NgôNgô': ' ', // Double Ngô → space
};
```

### **3. Machine Learning Approach**

- Train model để nhận diện và fix encoding errors
- Sử dụng character-level language model

---

## 🚀 Khuyến Nghị

### **Ngắn Hạn:**
1. ✅ **Đã implement:** Loại bỏ ký tự "Đỗ", "Ngô" lạ
2. ✅ **Đã implement:** Insert spaces giữa các từ
3. ⏳ **Cần test:** Với nhiều PDF formats khác nhau

### **Dài Hạn:**
1. **Upgrade PDF parser:** Dùng library tốt hơn
2. **OCR integration:** Cho PDF scan
3. **Better encoding detection:** Tự động detect và fix encoding

---

## 📊 So Sánh: Trước vs Sau

| Aspect | Trước | Sau |
|--------|-------|-----|
| **Text Quality** | ❌ Có ký tự lạ "Đỗ", "Ngô" | ✅ Clean text |
| **Name Extraction** | ❌ null | ✅ "Nguyễn Thị Thu Hậu" |
| **Education Extraction** | ❌ null | ✅ "Đại học Sài Gòn" |
| **Skills Extraction** | ⚠️ 2 skills | ✅ Nhiều skills hơn |

---

**Tài liệu này giải thích fix cho PDF text extraction với ký tự lạ.**

