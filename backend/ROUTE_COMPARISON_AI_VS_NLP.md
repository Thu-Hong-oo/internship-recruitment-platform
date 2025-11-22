# So sánh `/api/ai` vs `/api/nlp` Routes

## 📊 Tổng quan

### `/api/ai` (ai.js) - **AI Features Cơ bản**
- **Base URL**: `/api/ai`
- **Controller**: `aiController`
- **Đặc điểm**: 
  - Tính năng AI cơ bản, không lưu database
  - One-time analysis, không có CRUD operations
  - Không có caching
  - Rate limiting: Có (`apiRateLimit`)

### `/api/nlp` (advancedNLP.js) - **Advanced NLP Features**
- **Base URL**: `/api/nlp`
- **Controller**: `advancedNLPController`
- **Đặc điểm**:
  - Tính năng NLP nâng cao, có lưu database
  - Full CRUD operations
  - Có caching (Redis)
  - Có models: `CVMatchingScore`, `LearningRoadmap`
  - Progress tracking, feedback, resources

---

## 🔍 Chi tiết từng nhóm tính năng

### 1. **MATCHING SCORE** (Có trùng lặp)

#### `/api/ai/match-score` (ai.js)
- **Status**: ✅ Active (không deprecated)
- **Method**: `POST`
- **Features**:
  - Tính điểm match cơ bản
  - Không lưu database
  - Không có caching
  - One-time calculation

#### `/api/nlp/matching-score` (advancedNLP.js)
- **Status**: ✅ Active (Recommended)
- **Methods**: 
  - `POST` - Calculate advanced matching score
  - `GET /:jobId/:candidateId` - Get existing score
- **Features**:
  - ✅ Advanced matching với breakdown chi tiết
  - ✅ Lưu vào database (`CVMatchingScore` model)
  - ✅ Caching (Redis)
  - ✅ Recalculate scores
  - ✅ Get top candidates
  - ✅ Get best job matches

**Khuyến nghị**: Dùng `/api/nlp/matching-score` cho tính năng nâng cao

---

### 2. **LEARNING ROADMAP** (Có trùng lặp)

#### `/api/ai/skill-roadmap` (ai.js)
- **Status**: ⚠️ **DEPRECATED**
- **Method**: `POST`
- **Features**:
  - Generate roadmap cơ bản
  - Không lưu database
  - Không có progress tracking
  - One-time generation

#### `/api/nlp/learning-roadmap` (advancedNLP.js)
- **Status**: ✅ Active (Recommended)
- **Methods**:
  - `POST` - Generate roadmap
  - `GET /:roadmapId` - Get roadmap by ID
  - `GET /my-roadmaps` - Get all user roadmaps
  - `PUT /:roadmapId/progress` - Update progress
  - `PUT /:roadmapId/feedback` - Submit feedback
  - `GET /roadmap/recommended-resources/:roadmapId` - Get resources
  - `GET /popular-roadmaps` - Get popular roadmaps (public)
- **Features**:
  - ✅ Full CRUD operations
  - ✅ Lưu vào database (`LearningRoadmap` model)
  - ✅ Progress tracking
  - ✅ Feedback system
  - ✅ Resource recommendations (RAG-based)
  - ✅ Public roadmaps

**Khuyến nghị**: Dùng `/api/nlp/learning-roadmap` cho tính năng đầy đủ

---

### 3. **CV ANALYSIS** (Chỉ có trong `/api/ai`)

#### `/api/ai/analyze-cv`
- **Status**: ✅ Active
- **Method**: `POST` (multipart/form-data)
- **Features**:
  - Phân tích CV từ file upload
  - Extract skills, experience, education
  - One-time analysis

#### `/api/ai/analyze-cv-text`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - Phân tích CV từ raw text
  - Không cần file upload

---

### 4. **JOB ANALYSIS** (Chỉ có trong `/api/ai`)

#### `/api/ai/analyze-job-posting`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - Phân tích job posting
  - Skill extraction
  - Optimization recommendations

#### `/api/ai/analyze-job-description`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - Phân tích job description chi tiết
  - CV optimization tips

#### `/api/ai/job-recommendations`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - Personalized job recommendations
  - Match score threshold

---

### 5. **SKILL GAP ANALYSIS** (Chỉ có trong `/api/ai`)

#### `/api/ai/skill-gap-analysis`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - Phân tích skill gaps
  - Recommendations

---

### 6. **INSIGHTS & ANALYTICS** (Chỉ có trong `/api/ai`)

#### `/api/ai/insights`
- **Status**: ✅ Active
- **Method**: `GET`
- **Features**:
  - Auto-detect user role
  - Personalized insights

#### `/api/ai/candidate-insights`
- **Status**: ✅ Active
- **Method**: `GET`
- **Features**:
  - Candidate-specific insights

#### `/api/ai/employer-insights`
- **Status**: ✅ Active
- **Method**: `GET`
- **Features**:
  - Employer-specific insights

---

### 7. **BATCH OPERATIONS** (Chỉ có trong `/api/ai`)

#### `/api/ai/batch-analyze-applications`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - Batch analyze all applications for a job
  - Employer only

---

### 8. **AI SUGGESTIONS** (Chỉ có trong `/api/ai`)

#### `/api/ai/suggestions`
- **Status**: ✅ Active
- **Method**: `POST`
- **Features**:
  - AI suggestions for form fields
  - Career objective, skills, experience

---

## 📋 Tóm tắt sự khác biệt

| Tính năng | `/api/ai` | `/api/nlp` | Ghi chú |
|-----------|-----------|------------|---------|
| **Matching Score** | ✅ Basic (one-time) | ✅ Advanced (cached, stored) | `/api/ai` deprecated, dùng `/api/nlp` |
| **Learning Roadmap** | ⚠️ Deprecated | ✅ Full CRUD + Progress | `/api/ai` deprecated, dùng `/api/nlp` |
| **CV Analysis** | ✅ Có | ❌ Không có | Chỉ có trong `/api/ai` |
| **Job Analysis** | ✅ Có | ❌ Không có | Chỉ có trong `/api/ai` |
| **Skill Gap** | ✅ Có | ❌ Không có | Chỉ có trong `/api/ai` |
| **Insights** | ✅ Có | ❌ Không có | Chỉ có trong `/api/ai` |
| **Batch Operations** | ✅ Có | ❌ Không có | Chỉ có trong `/api/ai` |
| **Database Storage** | ❌ Không | ✅ Có | `/api/nlp` lưu kết quả |
| **Caching** | ❌ Không | ✅ Có (Redis) | `/api/nlp` có cache |
| **Progress Tracking** | ❌ Không | ✅ Có | Chỉ `/api/nlp` có |

---

## 🎯 Khuyến nghị sử dụng

### **Dùng `/api/nlp/*` khi:**
- ✅ Cần tính năng **persistent** (lưu kết quả)
- ✅ Cần **caching** để tối ưu performance
- ✅ Cần **CRUD operations** (get, update, delete)
- ✅ Cần **progress tracking**
- ✅ Cần **recalculate** scores
- ✅ Cần **top candidates** hoặc **best matches**

### **Dùng `/api/ai/*` khi:**
- ✅ Cần **one-time analysis** (không cần lưu)
- ✅ Cần **CV analysis** từ file/text
- ✅ Cần **job analysis** và optimization
- ✅ Cần **skill gap analysis**
- ✅ Cần **insights** và analytics
- ✅ Cần **batch operations**
- ✅ Cần **AI suggestions** cho forms

---

## 🔄 Migration Path

### **Đang deprecated trong `/api/ai`:**
1. `/api/ai/analyze-job-match` → Dùng `/api/nlp/matching-score`
2. `/api/ai/skill-roadmap` → Dùng `/api/nlp/learning-roadmap`
3. `/api/ai/learning-roadmap` → Dùng `/api/nlp/learning-roadmap`

### **Các endpoints deprecated sẽ:**
- Vẫn hoạt động (backward compatibility)
- Có thể redirect hoặc return 410 (Gone)
- Khuyến nghị migrate sang `/api/nlp/*`

---

## 💡 Kết luận

**2 route files này phục vụ mục đích khác nhau:**

1. **`/api/ai`**: 
   - AI features cơ bản, one-time analysis
   - Không persistent, không caching
   - Phù hợp cho: CV analysis, job analysis, insights, suggestions

2. **`/api/nlp`**: 
   - Advanced NLP features với persistent data
   - Có caching, CRUD operations
   - Phù hợp cho: Matching scores (advanced), Learning roadmaps (full features)

**Không có sự trùng lặp thực sự** - mỗi route phục vụ use case khác nhau. Các endpoints deprecated trong `/api/ai` đã được thay thế bằng versions tốt hơn trong `/api/nlp`.

