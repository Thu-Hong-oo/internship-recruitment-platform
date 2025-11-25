# 📋 API Routes - Routes Chính Xác

## 🔍 Phân Loại Routes

### **1. `/api/nlp/*` - Advanced NLP Features** ✅ **KHUYẾN NGHỊ**
**File route:** `backend/src/routes/advancedNLP.js`
**Controller:** `advancedNLPController`
**Đặc điểm:** Full CRUD, lưu database, có caching, progress tracking

### **2. `/api/ai/*` - AI Features Cơ bản**
**File route:** `backend/src/routes/ai.js`
**Controller:** `aiController`
**Đặc điểm:** One-time analysis, không lưu database, rate limiting

---

## 📊 Matching Score Routes

### ✅ **Dùng `/api/nlp/matching-score`** (KHUYẾN NGHỊ)

#### **POST `/api/nlp/matching-score`**
- **Method:** `POST`
- **Auth:** Required (Bearer token)
- **Access:** Candidate + Employer
- **Body:**
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
- **Response:** Advanced matching score với detailed breakdown
- **Features:** ✅ Lưu database, ✅ Caching, ✅ Detailed breakdown

#### **GET `/api/nlp/matching-score/:jobId/:candidateId`**
- **Method:** `GET`
- **Auth:** Required
- **Description:** Get existing matching score

#### **GET `/api/nlp/top-candidates/:jobId`**
- **Method:** `GET`
- **Auth:** Required
- **Access:** Employer only
- **Query params:** `?limit=20&minScore=70&tier=top`
- **Description:** Get top matching candidates for a job

#### **GET `/api/nlp/best-matches`**
- **Method:** `GET`
- **Auth:** Required
- **Access:** Candidate/Intern only
- **Query params:** `?limit=10&minScore=60`
- **Description:** Get best matching jobs for current candidate

#### **POST `/api/nlp/recalculate-scores/:jobId`**
- **Method:** `POST`
- **Auth:** Required
- **Access:** Employer only
- **Description:** Recalculate matching scores for all applicants

---

## 🎓 Learning Roadmap Routes

### ✅ **Dùng `/api/nlp/learning-roadmap`** (KHUYẾN NGHỊ)

#### **POST `/api/nlp/learning-roadmap`**
- **Method:** `POST`
- **Auth:** Required (Bearer token)
- **Access:** Candidate/Intern only

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
    "experience": [...],
    "education": [...],
    "currentLevel": "beginner" // beginner | intermediate | advanced | expert
  }
}
```

**Lưu ý:**
- ✅ **Chỉ cần `targetJobId` HOẶC `targetRole`** (bắt buộc một trong hai)
- ✅ **`cvData` là optional** - Hệ thống sẽ tự động lấy từ `CandidateProfile` của user
- ✅ **`timeframe` là optional** - Default: 12 weeks
- ✅ Nếu có `targetJobId`, hệ thống sẽ tự động lấy `targetRole` từ job data
- **Response:**
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
- **Features:** ✅ Rule-Based Algorithm, ✅ Lưu database, ✅ Real resources

#### **GET `/api/nlp/learning-roadmap/:roadmapId`**
- **Method:** `GET`
- **Auth:** Required
- **Description:** Get specific learning roadmap by ID

#### **GET `/api/nlp/my-roadmaps`**
- **Method:** `GET`
- **Auth:** Required
- **Access:** Candidate/Intern only
- **Query params:** `?status=active`
- **Description:** Get all roadmaps for current user

#### **PUT `/api/nlp/learning-roadmap/:roadmapId/progress`**
- **Method:** `PUT`
- **Auth:** Required
- **Access:** Candidate/Intern only
- **Body:**
```json
{
  "weekNumber": 1,
  "resourceId": "resource_123", // Optional
  "phaseNumber": 1 // Optional
}
```
- **Description:** Update roadmap progress (mark week or resource as completed)

#### **PUT `/api/nlp/learning-roadmap/:roadmapId/feedback`**
- **Method:** `PUT`
- **Auth:** Required
- **Access:** Candidate/Intern only
- **Body:**
```json
{
  "rating": 5, // 1-5
  "comment": "Very helpful roadmap!",
  "isHelpful": true
}
```
- **Description:** Submit feedback and rating for a roadmap

#### **GET `/api/nlp/roadmap/recommended-resources/:roadmapId`**
- **Method:** `GET`
- **Auth:** Required
- **Query params:** `?phase=1&week=1`
- **Description:** Get top recommended resources for specific phase and week

#### **GET `/api/nlp/popular-roadmaps`**
- **Method:** `GET`
- **Auth:** Not required (Public)
- **Query params:** `?limit=10`
- **Description:** Get popular public roadmaps

---

## 🔍 CV Analysis Routes

### ✅ **Dùng `/api/ai/analyze-cv`**

#### **POST `/api/ai/analyze-cv`**
- **Method:** `POST`
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Body:** Form data với field `cv` (file: PDF, DOC, DOCX)
- **Description:** Analyze CV content using AI (with file upload)

#### **POST `/api/ai/analyze-cv-text`**
- **Method:** `POST`
- **Auth:** Required
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "rawCVText": "CURRICULUM VITAE\n\nName: John Doe\n..."
}
```
- **Description:** Analyze CV from raw text (no file upload needed)

---

## 💼 Job Analysis Routes

### ✅ **Dùng `/api/ai/*`**

#### **POST `/api/ai/job-recommendations`**
- **Method:** `POST`
- **Auth:** Required
- **Body:**
```json
{
  "limit": 10,
  "minScore": 60
}
```
- **Description:** Get personalized job recommendations

#### **POST `/api/ai/analyze-job-description`**
- **Method:** `POST`
- **Auth:** Required
- **Body:**
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
- **Description:** Analyze job description in detail for CV optimization

#### **POST `/api/ai/analyze-job-posting`**
- **Method:** `POST`
- **Auth:** Required
- **Body:**
```json
{
  "jobId": "job_id_here", // Optional
  "jobDescription": "..." // Optional if jobId provided
}
```
- **Description:** Analyze job posting for optimization (Employer feature)

---

## 🎯 Skill Gap Analysis Routes

### ✅ **Dùng `/api/ai/skill-gap-analysis`**

#### **POST `/api/ai/skill-gap-analysis`**
- **Method:** `POST`
- **Auth:** Required
- **Body:**
```json
{
  "targetJobDescription": "We are looking for a Senior Full Stack Developer...",
  "targetJobTitle": "Senior Full Stack Developer",
  "industry": "technology",
  "jobId": "job_id_here" // Optional
}
```
- **Description:** Analyze skill gaps between current profile and target job

---

## 💡 AI Suggestions Routes

### ✅ **Dùng `/api/ai/suggestions`**

#### **POST `/api/ai/suggestions`**
- **Method:** `POST`
- **Auth:** Required
- **Body:**
```json
{
  "stepType": "careerObjective", // careerObjective | skills | experience | targetJob
  "currentData": {
    "targetJob": "Full Stack Developer"
  },
  "context": {
    "experience": "3 years",
    "education": "Bachelor's in Computer Science",
    "industry": "technology"
  }
}
```
- **Description:** Get AI suggestions for form fields

---

## 📊 Insights Routes

### ✅ **Dùng `/api/ai/insights`**

#### **GET `/api/ai/insights`**
- **Method:** `GET`
- **Auth:** Required
- **Description:** Get AI insights for dashboard (auto-detects user role)

#### **GET `/api/ai/candidate-insights`**
- **Method:** `GET`
- **Auth:** Required
- **Description:** Get AI insights specifically for candidates

---

## ⚠️ Deprecated Routes (KHÔNG DÙNG)

### ❌ `/api/ai/skill-roadmap` - DEPRECATED
- **Status:** ⚠️ Deprecated
- **Thay thế:** Dùng `/api/nlp/learning-roadmap` thay vì

### ❌ `/api/ai/learning-roadmap` - DEPRECATED
- **Status:** ⚠️ Deprecated
- **Thay thế:** Dùng `/api/nlp/learning-roadmap` thay vì

### ❌ `/api/ai/analyze-job-match` - DEPRECATED
- **Status:** ⚠️ Deprecated
- **Thay thế:** Dùng `/api/nlp/matching-score` thay vì

---

## 📝 Base URL

- **Development:** `http://localhost:5000` hoặc `http://localhost:3000`
- **Production:** `https://your-domain.com`

---

## 🔑 Authentication

Tất cả routes (trừ `/api/nlp/popular-roadmaps`) đều cần:
- **Header:** `Authorization: Bearer <token>`
- **Token:** JWT token từ login endpoint

---

## 📌 Tóm Tắt

### **Learning Roadmap:**
- ✅ **Dùng:** `/api/nlp/learning-roadmap` (Full CRUD, progress tracking)
- ❌ **Không dùng:** `/api/ai/skill-roadmap` (deprecated)

### **Matching Score:**
- ✅ **Dùng:** `/api/nlp/matching-score` (Advanced, có caching)
- ⚠️ **Có thể dùng:** `/api/ai/match-score` (Basic, không lưu DB)

### **CV Analysis:**
- ✅ **Dùng:** `/api/ai/analyze-cv` hoặc `/api/ai/analyze-cv-text`

### **Job Analysis:**
- ✅ **Dùng:** `/api/ai/analyze-job-description` hoặc `/api/ai/job-recommendations`

### **Skill Gap Analysis:**
- ✅ **Dùng:** `/api/ai/skill-gap-analysis`

