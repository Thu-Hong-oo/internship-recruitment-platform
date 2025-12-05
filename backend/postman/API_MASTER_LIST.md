# 📚 DANH SÁCH API CHUẨN - INTERNSHIP RECRUITMENT PLATFORM

> **Cập nhật:** 03/12/2025  
> **Loại bỏ:** API deprecated và trùng lặp  
> **Collections:** 2 Postman collections chính thức

---

## 🎯 **COLLECTION 1: AI - CV Analysis & Job Matching**
**File:** `AI_CV_Analysis_Learning_Roadmap.postman_collection.json`

### 1. CV Analysis (2 APIs)

#### 1.1. Analyze CV from File
```
POST /api/ai/analyze-cv
Auth: Bearer Token (Required)
Body: FormData with 'cv' file (PDF, DOC, DOCX)
```

#### 1.2. Analyze CV from Text
```
POST /api/ai/analyze-cv-text
Auth: Bearer Token (Required)
Body: { "rawCVText": "..." }
```

---

### 2. Job Matching & Analysis (3 APIs)

#### 2.1. Get Job Recommendations (Candidate)
```
POST /api/ai/job-recommendations
Auth: Bearer Token (Candidate/Intern)
Body: { "limit": 10, "minScore": 60 }
Returns: Top matching jobs for candidate
```

#### 2.2. Get Candidate Recommendations (Employer) ⭐ NEW
```
POST /api/ai/candidate-recommendations
Auth: Bearer Token (Employer only)
Body: { "jobId": "...", "limit": 10, "minScore": 60 }
Returns: Top matching candidates with skill gaps & interview questions
```

#### 2.3. Analyze Job Description
```
POST /api/ai/analyze-job-description
Auth: Bearer Token (Required)
Body: { "jobDescription": "...", "targetJob": "...", "companyInfo": {...} }
```

---

### 3. Skill Gap Analysis (1 API)

#### 3.1. Analyze Skill Gaps
```
POST /api/ai/skill-gap-analysis
Auth: Bearer Token (Required)
Body Option 1: { "jobId": "..." }
Body Option 2: { "targetJobDescription": "...", "targetJobTitle": "...", "industry": "..." }
Returns: Missing skills, strong skills, recommendations
Performance: 5-8 seconds (optimized with fuzzy matching)
```

---

### 4. AI Suggestions (3 APIs)

#### 4.1. Get Career Objective Suggestions
```
POST /api/ai/suggestions
Auth: Bearer Token (Required)
Body: { "stepType": "careerObjective", "currentData": {...}, "context": {...} }
```

#### 4.2. Get Skills Suggestions
```
POST /api/ai/suggestions
Auth: Bearer Token (Required)
Body: { "stepType": "skills", "currentData": {}, "context": {...} }
```

#### 4.3. Enhance Experience Description
```
POST /api/ai/suggestions
Auth: Bearer Token (Required)
Body: { "stepType": "experience", "currentData": {...}, "context": {} }
```

---

### 5. Candidate Insights (1 API)

#### 5.1. Get Candidate Insights
```
GET /api/ai/insights
Auth: Bearer Token (Required)
Returns: Comprehensive analytics for candidate
```

---

## 🎓 **COLLECTION 2: Advanced NLP - Matching Score & Learning Roadmap**
**File:** `Advanced_NLP_APIs.postman_collection.json`

### 1. Matching Score (5 APIs)

#### 1.1. Calculate Matching Score
```
POST /api/nlp/matching-score
Auth: Bearer Token (Candidate/Employer)
Body: { "cvData": {...}, "jobId": "...", "candidateId": "..." }
Returns: Score, tier (A/B/C/D), matchDetails, strengths
```

#### 1.2. Get Matching Score
```
GET /api/nlp/matching-score/:jobId/:candidateId
Auth: Bearer Token (Required)
Returns: Existing matching score
```

#### 1.3. Get Top Candidates (Employer)
```
GET /api/nlp/top-candidates/:jobId?limit=20&minScore=70&tier=top
Auth: Bearer Token (Employer only)
Returns: Top candidates for a job
```

#### 1.4. Get Best Job Matches (Candidate)
```
GET /api/nlp/best-matches?limit=10&minScore=60
Auth: Bearer Token (Candidate/Intern)
Returns: Best jobs for current candidate
```

#### 1.5. Recalculate Scores (Employer)
```
POST /api/nlp/recalculate-scores/:jobId
Auth: Bearer Token (Employer only)
Marks all scores as stale and triggers recalculation
```

---

### 2. Learning Roadmap (8 APIs)

#### 2.1. Generate RAG-Powered Roadmap ⭐ **RECOMMENDED**
```
POST /api/nlp/learning-roadmap-rag
Auth: Bearer Token (Candidate/Intern)
Body: { "candidateId": "...", "jobId": "..." }

✅ BEST METHOD - Real resources from YouTube, GitHub, ChromaDB
✅ Credibility metrics included
✅ Verifiable URLs
✅ 3-phase plan (Foundation → Core → Advanced)
✅ 12-week timeline

Response includes:
- phases[]: 3 learning phases with real resources
- credibilityMetrics: { totalResources, averageCredibility, verificationRate }
- estimatedDuration: 12 weeks
- generatedBy: "RAG-powered AI"

Performance: 20-30 seconds
```

#### 2.2. Generate Standard Roadmap (Backup)
```
POST /api/nlp/learning-roadmap
Auth: Bearer Token (Candidate/Intern)
Body Option 1: { "targetJobId": "..." }
Body Option 2: { "targetRole": "..." }

⚠️ BACKUP METHOD - Use when RAG unavailable
⚠️ Resources may not be verified
⚠️ No credibilityMetrics

Performance: 5-10 seconds
```

#### 2.3. Get Learning Roadmap by ID
```
GET /api/nlp/learning-roadmap/:roadmapId
Auth: Bearer Token (Required)
Returns: Specific roadmap details
```

#### 2.4. Get My Roadmaps
```
GET /api/nlp/my-roadmaps?status=active
Auth: Bearer Token (Candidate/Intern)
Returns: All roadmaps for current user
```

#### 2.5. Update Roadmap Progress
```
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Auth: Bearer Token (Candidate/Intern)
Body: { "weekNumber": 1, "resourceId": "...", "phaseNumber": 1 }
Marks week or resource as completed
```

#### 2.6. Submit Roadmap Feedback
```
PUT /api/nlp/learning-roadmap/:roadmapId/feedback
Auth: Bearer Token (Candidate/Intern)
Body: { "rating": 5, "comment": "...", "isHelpful": true }
Submit rating and feedback
```

#### 2.7. Get Recommended Resources
```
GET /api/nlp/roadmap/recommended-resources/:roadmapId?phase=1&week=1
Auth: Bearer Token (Required)
Returns: Top resources for specific phase/week
```

#### 2.8. Get Popular Roadmaps (Public)
```
GET /api/nlp/popular-roadmaps?limit=10
Auth: NOT REQUIRED (Public endpoint)
Returns: Popular public roadmaps
Perfect for: Landing pages, browse features
```

#### 2.9. Check RAG Service Health
```
GET /api/nlp/rag-health
Auth: Bearer Token (Required)
Returns: RAG service status, statistics, uptime
```

---

## 🚫 **API ĐÃ BỊ LOẠI BỎ (DEPRECATED)**

### ❌ Không nên dùng:

1. **POST /api/ai/skill-roadmap** (Deprecated)
   - ✅ Thay bằng: `/api/nlp/learning-roadmap-rag`

2. **POST /api/ai/learning-roadmap** (Deprecated)
   - ✅ Thay bằng: `/api/nlp/learning-roadmap-rag`

3. **POST /api/ai/analyze-job-match** (Deprecated)
   - ✅ Thay bằng: `/api/nlp/matching-score`

---

## 📊 **WORKFLOW CHUẨN**

### A. Candidate Flow (Tạo Learning Roadmap):

#### ✅ **CÁCH 1: ĐƠN GIẢN NHẤT (KHUYẾN NGHỊ)**
```
Điều kiện: Candidate đã có profile đầy đủ (skills, experience, education)

1. Gọi trực tiếp API tạo roadmap:
   POST /api/nlp/learning-roadmap-rag
   Body: {
     "candidateId": "675e8a41fb6068fb80971f65",
     "jobId": "677b5a0ed3eff8fc71a6f654"
   }
   
   ⚠️ API sẽ TỰ ĐỘNG:
   - Kiểm tra matching score đã có chưa
   - Nếu chưa → Tự động phân tích skill gaps
   - Tạo roadmap với tài nguyên thực
```

#### ✅ **CÁCH 2: MANUAL (Kiểm soát từng bước)**
```
1. Phân tích skill gaps:
   POST /api/ai/skill-gap-analysis
   Body: { "jobId": "677b5a0ed3eff8fc71a6f654" }
   → Lưu lại: missingSkills, strongSkills

2. Tạo roadmap với skill gaps đã biết:
   POST /api/nlp/learning-roadmap-rag
   Body: {
     "candidateId": "675e8a41fb6068fb80971f65",
     "jobId": "677b5a0ed3eff8fc71a6f654"
   }
   → API dùng matching score từ bước 1

3. Track progress:
   PUT /api/nlp/learning-roadmap/:roadmapId/progress
   Body: { "weekNumber": 1, "phaseNumber": 1 }

4. Submit feedback:
   PUT /api/nlp/learning-roadmap/:roadmapId/feedback
   Body: { "rating": 5, "comment": "Great!", "isHelpful": true }
```

#### ✅ **CÁCH 3: Full Workflow (Toàn bộ quy trình)**
```
1. Upload CV:
   POST /api/ai/analyze-cv
   Body: FormData với 'cv' file

2. Browse jobs:
   GET /api/jobs

3. Get job recommendations:
   POST /api/ai/job-recommendations
   Body: { "limit": 10, "minScore": 60 }

4. Chọn job phù hợp, phân tích skill gaps:
   POST /api/ai/skill-gap-analysis
   Body: { "jobId": "selected_job_id" }

5. Tạo roadmap:
   POST /api/nlp/learning-roadmap-rag
   Body: { "candidateId": "...", "jobId": "selected_job_id" }

6. Track progress:
   PUT /api/nlp/learning-roadmap/:roadmapId/progress

7. Submit feedback:
   PUT /api/nlp/learning-roadmap/:roadmapId/feedback
```

---

### B. Employer Flow:
```
1. Upload CV → POST /api/ai/analyze-cv
2. Browse jobs → GET /api/jobs
3. Get job recommendations → POST /api/ai/job-recommendations
4. Check skill gaps → POST /api/ai/skill-gap-analysis (jobId)
5. Generate roadmap → POST /api/nlp/learning-roadmap-rag ⭐
6. Track progress → PUT /api/nlp/learning-roadmap/:id/progress
7. Submit feedback → PUT /api/nlp/learning-roadmap/:id/feedback
```

### B. Employer Flow:
```
1. Post job:
   POST /api/jobs

2. Get top candidates:
   GET /api/nlp/top-candidates/:jobId?limit=20&minScore=70

3. Get candidate recommendations with skill gaps:
   POST /api/ai/candidate-recommendations
   Body: { "jobId": "...", "limit": 10, "minScore": 60 }
   → Response includes: skill gaps, interview questions

4. Review candidate profiles and interview
```

---

## ⚠️ **LỖI THƯỜNG GẶP VÀ CÁCH FIX**

### 1. **"Unable to identify skill gaps"**
```json
{
  "success": false,
  "message": "Unable to identify skill gaps. Please ensure you have a complete profile and try again."
}
```

**Nguyên nhân:**
- Candidate profile chưa đầy đủ (thiếu skills, experience, education)
- candidateId hoặc jobId không tồn tại

**Cách fix:**
✅ Đảm bảo candidate đã complete profile:
```
POST /api/candidate-profile
Body: {
  "skills": {
    "technical": [
      { "name": "React", "level": "intermediate" },
      { "name": "Node.js", "level": "advanced" }
    ]
  },
  "experience": {
    "internships": [
      {
        "position": "Frontend Developer",
        "company": "ABC Corp",
        "startDate": "2021-01-01",
        "description": "..."
      }
    ]
  },
  "education": [...]
}
```

### 2. **"Not authorized to access this route"**
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

**Nguyên nhân:**
- Thiếu Bearer token trong header
- Token hết hạn
- Role không đúng (VD: candidate gọi employer API)

**Cách fix:**
✅ Thêm Authorization header:
```
Headers: {
  "Authorization": "Bearer your_token_here",
  "Content-Type": "application/json"
}
```

✅ Đảm bảo đúng role:
- Candidate/Intern APIs: `/learning-roadmap`, `/my-roadmaps`
- Employer APIs: `/top-candidates/:jobId`, `/recalculate-scores`

### 3. **"Job not found" hoặc "Candidate profile not found"**

**Cách fix:**
✅ Kiểm tra IDs có đúng không:
```
GET /api/jobs/:jobId → Xác nhận job tồn tại
GET /api/candidate-profile → Xác nhận profile tồn tại
```

---

## 🎯 **THỨ TỰ THỰC HIỆN TẠO ROADMAP**

### ⭐ **RECOMMENDED: 1 bước duy nhất**
```
POST /api/nlp/learning-roadmap-rag
Body: {
  "candidateId": "675e8a41fb6068fb80971f65",
  "jobId": "677b5a0ed3eff8fc71a6f654"
}

✅ API tự động:
1. Kiểm tra candidate profile
2. Lấy job data
3. Phân tích skill gaps (nếu chưa có)
4. Tạo roadmap với tài nguyên thực
5. Lưu vào database

⏱️ Thời gian: 20-30 giây
```

### 📋 **ALTERNATIVE: Kiểm soát từng bước**
```
Bước 1: Phân tích skill gaps (5-8s)
POST /api/ai/skill-gap-analysis
Body: { "jobId": "677b5a0ed3eff8fc71a6f654" }

Bước 2: Tạo roadmap (20-30s)
POST /api/nlp/learning-roadmap-rag
Body: {
  "candidateId": "675e8a41fb6068fb80971f65",
  "jobId": "677b5a0ed3eff8fc71a6f654"
}

⏱️ Tổng thời gian: 25-38 giây
```

---

## 📊 **SO SÁNH 2 PHƯƠNG PHÁP TẠO ROADMAP**

| Tính năng | Standard Roadmap | RAG-Powered Roadmap ⭐ |
|-----------|------------------|----------------------|
| Endpoint | `/learning-roadmap` | `/learning-roadmap-rag` |
| Tốc độ | 5-10s | 20-30s |
| Dữ liệu thực | ❌ | ✅ YouTube, GitHub |
| Credibility Metrics | ❌ | ✅ |
| URLs kiểm chứng | ❌ | ✅ |
| Độ chính xác | 70% | 95% |
| Khuyến nghị | Backup | **Dùng chính** |

---

## ⚙️ **TECHNICAL SPECS**

### NLP Stack:
- **PhoBERT NER**: F1 96% for Vietnamese skill extraction
- **Sentence-BERT**: 768-dim embeddings (paraphrase-multilingual-mpnet-base-v2)
- **TF-IDF**: Text similarity and matching
- **Fuzzy Matching**: Fast keyword-based matching (fallback)

### Scoring Breakdown:
- Skills: 40%
- Experience: 30%
- Education: 15%
- Projects: 15%

### Tier System:
- **A Tier**: 85-100% match (Excellent fit)
- **B Tier**: 70-84% match (Good fit)
- **C Tier**: 55-69% match (Moderate fit)
- **D Tier**: <55% match (Poor fit)

---

## 📝 **NOTES**

1. **Authentication:**
   - Most endpoints require Bearer token
   - Popular roadmaps endpoint is public
   - Employer-only endpoints marked clearly

2. **Performance:**
   - Skill gap analysis: 5-8s (optimized)
   - Standard roadmap: 5-10s
   - RAG roadmap: 20-30s (fetches real data)

3. **Data Sources:**
   - YouTube API (videos, channels)
   - GitHub API (repositories, projects)
   - ChromaDB (vector database)
   - Coursera API (courses)

4. **Credibility Metrics:**
   - totalResources: Count of all resources
   - averageCredibility: 0.0-1.0 score
   - verificationRate: % with valid URLs
   - trustedSourceRate: % with credibility ≥0.8
   - sourceBreakdown: { youtube, github, vectorDB, other }

---

## 🔗 **POSTMAN COLLECTIONS**

1. **AI_CV_Analysis_Learning_Roadmap.postman_collection.json**
   - CV Analysis (2)
   - Job Matching (3)
   - Skill Gap Analysis (1)
   - AI Suggestions (3)
   - Candidate Insights (1)
   - **Total: 10 APIs**

2. **Advanced_NLP_APIs.postman_collection.json**
   - Matching Score (5)
   - Learning Roadmap (8)
   - **Total: 13 APIs**

**Grand Total: 23 Official APIs** (loại bỏ 3 deprecated APIs)
