# 📋 Postman Collections Guide - Hướng Dẫn Sử Dụng

## 📦 Collections Có Sẵn

### **1. Advanced_NLP_APIs.postman_collection.json** ✅ **KHUYẾN NGHỊ**
**Mục đích:** Advanced NLP features với full CRUD operations
- Matching Score (advanced, có caching)
- Learning Roadmap (full CRUD, progress tracking, feedback)

### **2. AI_CV_Analysis_Learning_Roadmap.postman_collection.json**
**Mục đích:** AI features cơ bản (one-time analysis)
- CV Analysis
- Job Analysis
- Skill Gap Analysis
- AI Suggestions
- Candidate Insights

---

## 🔧 Setup

### **1. Import Collections**
1. Mở Postman
2. Click **Import**
3. Chọn 2 file JSON từ `backend/postman/`
4. Collections sẽ xuất hiện trong sidebar

### **2. Setup Variables**
Mỗi collection có variables riêng. Cần set:

#### **Advanced_NLP_APIs:**
- `baseUrl`: `http://localhost:3000` (hoặc `http://localhost:5000` nếu server chạy port 5000)
- `candidateToken`: JWT token từ login (role: candidate/intern)
- `employerToken`: JWT token từ login (role: employer)
- `jobId`: Job ID để test
- `candidateId`: Candidate/User ID
- `roadmapId`: Roadmap ID (sẽ có sau khi generate roadmap)
- `userId`: User ID

#### **AI_CV_Analysis_Learning_Roadmap:**
- `base_url`: `http://localhost:3000` (hoặc `http://localhost:5000`)
- `auth_token`: JWT token từ login
- `job_id`: Job ID để test

---

## 📝 Routes Chính Xác

### **🎓 Learning Roadmap** (Dùng Advanced_NLP_APIs collection)

#### **POST `/api/nlp/learning-roadmap`** ✅
**Collection:** Advanced_NLP_APIs

**Request Body - TỐI THIỂU (Đơn giản nhất):**
```json
{
  "targetJobId": "job_id_here"
}
```
Hoặc:
```json
{
  "targetRole": "Frontend Developer"
}
```

**Request Body - ĐẦY ĐỦ (Nếu muốn override):**
```json
{
  "targetJobId": "job_id_here", // Optional if targetRole provided
  "targetRole": "Frontend Developer", // Optional if targetJobId provided
  "timeframe": 12, // weeks, default: 12 (optional)
  "cvData": { // Optional - sẽ TỰ ĐỘNG lấy từ profile nếu không có
    "skills": [
      { "name": "HTML", "level": "advanced" },
      { "name": "CSS", "level": "advanced" },
      { "name": "JavaScript", "level": "intermediate" }
    ],
    "experience": [
      {
        "position": "Junior Developer",
        "startDate": "2022-01-01",
        "endDate": "2023-12-31"
      }
    ],
    "education": [
      {
        "degree": "bachelor",
        "major": "Computer Science"
      }
    ],
    "currentLevel": "beginner" // beginner | intermediate | advanced | expert
  }
}
```

**Lưu ý quan trọng:**
- ✅ **Chỉ cần `targetJobId` HOẶC `targetRole`** (bắt buộc một trong hai)
- ✅ **`cvData` là optional** - Hệ thống sẽ tự động lấy từ `CandidateProfile` của user
- ✅ **`timeframe` là optional** - Default: 12 weeks
- ✅ Nếu có `targetJobId`, hệ thống sẽ tự động lấy `targetRole` từ job data

**Response:**
```json
{
  "success": true,
  "message": "Learning roadmap generated successfully",
  "data": {
    "_id": "roadmap_id",
    "candidateId": "user_id",
    "targetJobId": "job_id",
    "targetRole": "Frontend Developer",
    "currentLevel": "beginner",
    "skillGaps": [...],
    "phases": [...],
    "milestones": [...],
    "successMetrics": [...],
    "totalDuration": "12 weeks",
    "estimatedTotalHours": 180,
    "difficulty": "intermediate"
  }
}
```

**Lưu ý:** 
- ✅ Dùng Rule-Based Algorithm (deterministic, có căn cứ)
- ✅ Lưu vào database
- ✅ Có progress tracking
- ✅ Real resources từ RAG/Intelligent Recommendation

#### **GET `/api/nlp/learning-roadmap/:roadmapId`**
**Collection:** Advanced_NLP_APIs
**Path Variable:** `{{roadmapId}}`
**Description:** Get specific roadmap by ID

#### **GET `/api/nlp/my-roadmaps`**
**Collection:** Advanced_NLP_APIs
**Query Params:** `?status=active`
**Description:** Get all roadmaps for current user

#### **PUT `/api/nlp/learning-roadmap/:roadmapId/progress`**
**Collection:** Advanced_NLP_APIs
**Path Variable:** `{{roadmapId}}`
**Body:**
```json
{
  "weekNumber": 1,
  "resourceId": "resource_123", // Optional
  "phaseNumber": 1 // Optional
}
```

#### **PUT `/api/nlp/learning-roadmap/:roadmapId/feedback`**
**Collection:** Advanced_NLP_APIs
**Path Variable:** `{{roadmapId}}`
**Body:**
```json
{
  "rating": 5,
  "comment": "Very helpful roadmap!",
  "isHelpful": true
}
```

#### **GET `/api/nlp/roadmap/recommended-resources/:roadmapId`**
**Collection:** Advanced_NLP_APIs
**Path Variable:** `{{roadmapId}}`
**Query Params:** `?phase=1&week=1`

#### **GET `/api/nlp/popular-roadmaps`**
**Collection:** Advanced_NLP_APIs
**Query Params:** `?limit=10`
**Auth:** Not required (Public)

---

### **📊 Matching Score** (Dùng Advanced_NLP_APIs collection)

#### **POST `/api/nlp/matching-score`** ✅
**Collection:** Advanced_NLP_APIs
**Body:**
```json
{
  "cvData": {
    "skills": [
      { "name": "React", "level": "intermediate" },
      { "name": "Node.js", "level": "advanced" }
    ],
    "experience": [...],
    "education": [...]
  },
  "jobId": "job_id_here",
  "candidateId": "candidate_id_here" // Optional, defaults to current user
}
```

#### **GET `/api/nlp/matching-score/:jobId/:candidateId`**
**Collection:** Advanced_NLP_APIs
**Path Variables:** `{{jobId}}`, `{{candidateId}}`

#### **GET `/api/nlp/top-candidates/:jobId`**
**Collection:** Advanced_NLP_APIs
**Path Variable:** `{{jobId}}`
**Query Params:** `?limit=20&minScore=70&tier=top`
**Access:** Employer only

#### **GET `/api/nlp/best-matches`**
**Collection:** Advanced_NLP_APIs
**Query Params:** `?limit=10&minScore=60`
**Access:** Candidate/Intern only

#### **POST `/api/nlp/recalculate-scores/:jobId`**
**Collection:** Advanced_NLP_APIs
**Path Variable:** `{{jobId}}`
**Access:** Employer only

---

### **🔍 CV Analysis** (Dùng AI_CV_Analysis collection)

#### **POST `/api/ai/analyze-cv`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Content-Type:** `multipart/form-data`
**Body:** Form data với field `cv` (file: PDF, DOC, DOCX)

#### **POST `/api/ai/analyze-cv-text`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Body:**
```json
{
  "rawCVText": "CURRICULUM VITAE\n\nName: John Doe\n..."
}
```

---

### **💼 Job Analysis** (Dùng AI_CV_Analysis collection)

#### **POST `/api/ai/job-recommendations`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Body:**
```json
{
  "limit": 10,
  "minScore": 60
}
```

#### **POST `/api/ai/analyze-job-description`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Body:**
```json
{
  "jobDescription": "We are seeking a talented Full Stack Developer...",
  "targetJob": "Full Stack Developer",
  "companyInfo": {
    "name": "Tech Innovators Inc.",
    "industry": "technology"
  }
}
```

---

### **🎯 Skill Gap Analysis** (Dùng AI_CV_Analysis collection)

#### **POST `/api/ai/skill-gap-analysis`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Body:**
```json
{
  "targetJobDescription": "We are looking for a Senior Full Stack Developer...",
  "targetJobTitle": "Senior Full Stack Developer",
  "industry": "technology",
  "jobId": "job_id_here" // Optional
}
```

---

### **💡 AI Suggestions** (Dùng AI_CV_Analysis collection)

#### **POST `/api/ai/suggestions`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Body:**
```json
{
  "stepType": "careerObjective", // careerObjective | skills | experience | targetJob
  "currentData": {
    "targetJob": "Full Stack Developer"
  },
  "context": {
    "experience": "3 years",
    "education": "Bachelor's in Computer Science"
  }
}
```

---

### **📊 Insights** (Dùng AI_CV_Analysis collection)

#### **GET `/api/ai/insights`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Description:** Get AI insights for dashboard (auto-detects user role)

#### **GET `/api/ai/candidate-insights`**
**Collection:** AI_CV_Analysis_Learning_Roadmap
**Description:** Get AI insights specifically for candidates

---

## ⚠️ Lưu Ý Quan Trọng

### **1. Base URL**
- **Default:** `http://localhost:3000`
- **Nếu server chạy port 5000:** Đổi thành `http://localhost:5000`
- **Production:** Thay bằng production URL

### **2. Authentication**
- Tất cả routes (trừ `/api/nlp/popular-roadmaps`) đều cần JWT token
- Header: `Authorization: Bearer <token>`
- Token lấy từ login endpoint

### **3. Deprecated Routes**
- ❌ `/api/ai/skill-roadmap` → Dùng `/api/nlp/learning-roadmap` thay vì
- ❌ `/api/ai/learning-roadmap` → Dùng `/api/nlp/learning-roadmap` thay vì
- ❌ `/api/ai/analyze-job-match` → Dùng `/api/nlp/matching-score` thay vì

### **4. Collection Nào Dùng Khi Nào?**

**Dùng Advanced_NLP_APIs khi:**
- ✅ Cần Learning Roadmap với full CRUD
- ✅ Cần Matching Score với caching và detailed breakdown
- ✅ Cần progress tracking, feedback
- ✅ Cần lưu vào database

**Dùng AI_CV_Analysis khi:**
- ✅ Cần CV analysis (one-time)
- ✅ Cần Job analysis (one-time)
- ✅ Cần Skill gap analysis (one-time)
- ✅ Cần AI suggestions
- ✅ Cần Insights

---

## 🧪 Testing Flow

### **1. Test Learning Roadmap:**
```
1. POST /api/nlp/learning-roadmap
   → Lưu roadmapId từ response
   
2. GET /api/nlp/learning-roadmap/:roadmapId
   → Verify roadmap data
   
3. PUT /api/nlp/learning-roadmap/:roadmapId/progress
   → Update progress
   
4. GET /api/nlp/roadmap/recommended-resources/:roadmapId?phase=1&week=1
   → Get resources
   
5. PUT /api/nlp/learning-roadmap/:roadmapId/feedback
   → Submit feedback
```

### **2. Test Matching Score:**
```
1. POST /api/nlp/matching-score
   → Calculate score
   
2. GET /api/nlp/matching-score/:jobId/:candidateId
   → Get cached score
   
3. GET /api/nlp/best-matches?limit=10
   → Get best job matches (candidate)
   
4. GET /api/nlp/top-candidates/:jobId?limit=20
   → Get top candidates (employer)
```

---

## 📚 Tài Liệu Tham Khảo

- **API Routes Corrected:** `backend/postman/API_ROUTES_CORRECTED.md`
- **Route Comparison:** `backend/ROUTE_COMPARISON_AI_VS_NLP.md`
- **Learning Roadmap Generation:** `backend/LEARNING_ROADMAP_GENERATION.md`

