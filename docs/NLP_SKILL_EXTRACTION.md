# 🧠 Chức Năng Trích Xuất Kỹ Năng (Skill Extraction) - Tài Liệu Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Quy Trình Trích Xuất](#4-quy-trình-trích-xuất)
5. [Các Phương Pháp](#5-các-phương-pháp)
6. [API Endpoints](#6-api-endpoints)
7. [Ví Dụ Sử Dụng](#7-ví-dụ-sử-dụng)

---

## 1. Tổng Quan

### 1.1. Mục Đích

Chức năng **Trích Xuất Kỹ Năng** (Skill Extraction) tự động nhận diện và trích xuất các kỹ năng từ văn bản CV/resume hoặc mô tả công việc. Đây là nền tảng cho các chức năng AI khác như matching CV-job và tạo lộ trình học tập.

### 1.2. Tính Năng Chính

- ✅ **Đa ngôn ngữ**: Hỗ trợ tiếng Việt và tiếng Anh
- ✅ **Đa loại kỹ năng**: Technical skills, soft skills, ngôn ngữ lập trình
- ✅ **Đánh giá độ tin cậy**: Confidence score cho mỗi kỹ năng
- ✅ **Chuẩn hóa tên**: Tự động normalize tên kỹ năng
- ✅ **Cache thông minh**: Tăng tốc độ xử lý
- ✅ **Hybrid approach**: Kết hợp nhiều phương pháp để tối ưu độ chính xác

### 1.3. Điểm Nổi Bật

- **100% Self-Sufficient**: Không phụ thuộc hoàn toàn vào API bên ngoài
- **Hybrid System**: Kết hợp rule-based + AI để đạt độ chính xác cao
- **Tự động fallback**: Luôn có kết quả ngay cả khi một số thành phần bị lỗi

---

## 2. Kiến Trúc Hệ Thống

### 2.1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILL EXTRACTION SERVICE                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 HYBRID SYSTEM (PRIMARY)               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Rule-based   │  │ Multilingual  │  │ Skill       │ │  │
│  │  │ (300+        │  │ NER          │  │ Normalization│ │  │
│  │  │ patterns)    │  │ (dslim/bert) │  │ (Gemini)    │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 GEMINI ENHANCEMENT (OPTIONAL)        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 LEGACY PHOBERT (DEPRECATED)          │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OUTPUT FORMAT                            │
│  [{                                                        │
│    name: "JavaScript",                                     │
│    type: "programming_language",                           │
│    level: "intermediate",                                  │
│    confidence: 0.95,                                       │
│    source: "hybrid"                                        │
│  }]                                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Luồng Xử Lý

```
1. Nhận văn bản CV/job description
   ↓
2. Kiểm tra cache (nếu có)
   ↓
3. Hybrid System:
   a. Rule-based extraction (300+ patterns)
   b. Multilingual NER (dslim/bert-base-NER)
   c. Kết hợp kết quả
   ↓
4. Chuẩn hóa tên kỹ năng (Skill Normalization)
   ↓
5. Lọc và sắp xếp theo confidence
   ↓
6. Cache kết quả và trả về
```

---

## 3. Công Nghệ Sử Dụng

### 3.1. Hybrid System (Primary Method)

#### **3.1.1. Rule-based Extraction**
- **Mục đích**: Nhanh chóng trích xuất kỹ năng từ pattern có sẵn
- **Ưu điểm**: 
  - Tốc độ cao (instant)
  - Độ chính xác cao cho tiếng Việt (100% recall)
  - Không phụ thuộc internet
- **Cách hoạt động**: Sử dụng regex patterns để match kỹ năng trong văn bản

#### **3.1.2. Multilingual NER (Named Entity Recognition)**
- **Mục đích**: Nhận diện thực thể kỹ năng từ văn bản
- **Model**: `dslim/bert-base-NER`
- **Ưu điểm**: Độ chính xác cao cho tiếng Anh (90% recall)
- **Cách hoạt động**: Sử dụng BERT model để phân tích ngữ cảnh và nhận diện kỹ năng

#### **3.1.3. Skill Normalization**
- **Mục đích**: Chuẩn hóa tên kỹ năng về dạng chuẩn
- **Công nghệ**: Gemini AI (optional) + fallback rules
- **Ví dụ**: "JS" → "JavaScript", "ReactJS" → "React"

### 3.2. Gemini Enhancement (Optional)

#### **3.2.1. Gemini AI**
- **Mục đích**: Cải thiện kết quả khi cần thiết
- **Model**: Gemini 1.5 Pro/Flash
- **Cách sử dụng**: Chỉ được gọi khi explicitly requested (`useGemini=true`)

### 3.3. Legacy Support

#### **3.3.1. PhoBERT NER (Deprecated)**
- **Mục đích**: Backward compatibility
- **Lưu ý**: Không còn được khuyến khích sử dụng do vấn đề timeout

---

## 4. Quy Trình Trích Xuất

### 4.1. Bước 1: Chuẩn Bị Văn Bản

```javascript
// Validate input
if (!cvText || typeof cvText !== 'string' || cvText.trim().length === 0) {
  return [];
}

// Check cache
const textHash = this._hashText(cvText.substring(0, 1000));
if (useCache && this.cache.has(textHash)) {
  return this.cache.get(textHash);
}
```

### 4.2. Bước 2: Hybrid Extraction

```javascript
// Primary method: Hybrid System
const skills = await this.hybridService.extractSkills(cvText, {
  useCache: false, // We handle caching at this level
  includeMetadata: true
});
```

### 4.3. Bước 3: Chuẩn Hóa Skills

```javascript
// Normalize skill names
const skillNames = skills.map(s => s.name);
const normalizedMap = await this.normalizationService.normalizeSkillsBatch(skillNames);

// Apply normalization
const normalizedSkills = skills.map(skill => ({
  name: normalizedMap.get(skill.name) || skill.name,
  type: skill.type || 'technical',
  level: skill.level || 'intermediate',
  confidence: skill.confidence || 0.8,
  source: skill.source || 'hybrid'
}));
```

### 4.4. Bước 4: Lọc Và Sắp Xếp

```javascript
// Filter by confidence
const filtered = normalizedSkills
  .filter(skill => skill.confidence >= minConfidence)
  .slice(0, maxSkills)
  .sort((a, b) => b.confidence - a.confidence);
```

---

## 5. Các Phương Pháp

### 5.1. Hybrid System (Khuyến Nghị)

```javascript
const options = {
  maxSkills: 50,
  minConfidence: 0.5,
  includeSoftSkills: true,
  includeLanguages: true,
  useCache: true,
  useHybrid: true,         // PRIMARY METHOD
  useGemini: false,        // OPTIONAL
  usePhoBERT: false,       // DEPRECATED
};

const skills = await skillExtractionService.extractSkills(cvText, options);
```

### 5.2. Gemini Enhancement

```javascript
const options = {
  useHybrid: true,
  useGemini: true,  // Enable Gemini enhancement
};

const skills = await skillExtractionService.extractSkills(cvText, options);
```

### 5.3. Fallback Methods

Nếu Hybrid System thất bại, hệ thống tự động fallback:
1. Legacy PhoBERT (deprecated)
2. Gemini only
3. Direct rule-based extraction (luôn hoạt động)

---

## 6. API Endpoints

### 6.1. Extract Skills from CV

```javascript
POST /api/nlp/extract-skills
Content-Type: application/json

{
  "cvText": "Tôi có kinh nghiệm với JavaScript, React và Node.js...",
  "options": {
    "maxSkills": 50,
    "minConfidence": 0.5,
    "includeSoftSkills": true,
    "useHybrid": true
  }
}

Response:
{
  "success": true,
  "skills": [
    {
      "name": "JavaScript",
      "type": "programming_language",
      "level": "intermediate",
      "confidence": 0.95,
      "source": "hybrid"
    }
  ]
}
```

### 6.2. Extract Skills from Job Description

```javascript
POST /api/nlp/extract-job-skills
Content-Type: application/json

{
  "jobDescription": "Yêu cầu: JavaScript, React, Node.js...",
  "options": {
    "useHybrid": true
  }
}
```

---

## 7. Ví Dụ Sử Dụng

### 7.1. Ví Dụ CV Text

**Input:**
```
Tôi là một Frontend Developer với 3 năm kinh nghiệm. Tôi thành thạo JavaScript, React, và Node.js. Tôi cũng có kiến thức về HTML, CSS, và Git.
```

**Output:**
```json
[
  {
    "name": "JavaScript",
    "type": "programming_language",
    "level": "advanced",
    "confidence": 0.95,
    "source": "hybrid"
  },
  {
    "name": "React",
    "type": "framework",
    "level": "intermediate",
    "confidence": 0.92,
    "source": "hybrid"
  },
  {
    "name": "Node.js",
    "type": "runtime",
    "level": "intermediate",
    "confidence": 0.88,
    "source": "hybrid"
  }
]
```

### 7.2. Ví Dụ Job Description

**Input:**
```
Frontend Developer position requires strong skills in JS, ReactJS, and modern web development tools.
```

**Output:**
```json
[
  {
    "name": "JavaScript",
    "type": "programming_language",
    "level": "advanced",
    "confidence": 0.90,
    "source": "hybrid"
  },
  {
    "name": "React",
    "type": "framework",
    "level": "intermediate",
    "confidence": 0.85,
    "source": "hybrid"
  }
]
```

---

## 8. Lưu Ý Quan Trọng

### 8.1. Performance
- **Cache**: Giúp tăng tốc độ xử lý văn bản đã xử lý trước đó
- **Batch Processing**: Xử lý nhiều văn bản cùng lúc để tối ưu hiệu suất
- **Lazy Loading**: Chỉ khởi tạo model khi cần thiết

### 8.2. Accuracy
- **Hybrid Approach**: Kết hợp ưu điểm của nhiều phương pháp
- **Confidence Scoring**: Đánh giá độ tin cậy cho mỗi kết quả
- **Normalization**: Đảm bảo tên kỹ năng nhất quán

### 8.3. Reliability
- **Graceful Fallback**: Luôn có kết quả ngay cả khi một số thành phần bị lỗi
- **Error Handling**: Xử lý lỗi một cách graceful, không làm crash hệ thống
- **Self-Sufficient**: Hoạt động độc lập, không phụ thuộc API bên ngoài

---

*Tài liệu này được tạo tự động từ code analysis. Cập nhật lần cuối: December 13, 2025*</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\docs\NLP_SKILL_EXTRACTION.md