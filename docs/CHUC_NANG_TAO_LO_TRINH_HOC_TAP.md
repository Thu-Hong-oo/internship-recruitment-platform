# 📚 Chức Năng Tạo Lộ Trình Học Tập - Tài Liệu Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Quy Trình Tạo Lộ Trình Chi Tiết](#4-quy-trình-tạo-lộ-trình-chi-tiết)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Database Schema](#7-database-schema)
8. [API Endpoints](#8-api-endpoints)
9. [Ví Dụ Cụ Thể](#9-ví-dụ-cụ-thể)

---

## 1. Tổng Quan

### 1.1. Mục Đích

Chức năng **Tạo Lộ Trình Học Tập** (Learning Roadmap Generation) tự động tạo ra một lộ trình học tập cá nhân hóa cho ứng viên dựa trên:
- **Kỹ năng hiện có** của ứng viên (từ CV/profile)
- **Kỹ năng yêu cầu** của công việc mục tiêu
- **Khoảng trống kỹ năng** (skill gaps) giữa hai bên
- **Tài liệu học tập** phù hợp được tìm kiếm từ vector database

### 1.2. Tính Năng Chính

- ✅ **Tự động phân tích skill gaps** giữa ứng viên và công việc
- ✅ **Tìm kiếm tài liệu học tập** phù hợp bằng semantic search
- ✅ **Tạo lộ trình theo tuần** với mục tiêu và tài nguyên cụ thể
- ✅ **Ưu tiên kỹ năng** theo mức độ quan trọng (critical → important → optional)
- ✅ **Tính toán độ khó** và thời gian ước tính
- ✅ **Cho phép tùy chỉnh** sau khi tạo (thêm/sửa/xóa resources, weeks, phases)

### 1.3. Điểm Nổi Bật

- **100% Self-Sufficient**: Không phụ thuộc LLM (Gemini là optional)
- **Sử dụng NLP tiên tiến**: PhoBERT NER, Sentence-BERT, ChromaDB
- **Tự động hóa hoàn toàn**: Từ phân tích đến tạo lộ trình
- **Cá nhân hóa cao**: Dựa trên profile thực tế của ứng viên

---

## 2. Kiến Trúc Hệ Thống

### 2.1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Job Detail Page  │  │ Roadmap Detail   │                │
│  │  (Tạo roadmap)   │  │  (Customize)     │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            │ HTTP Request        │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         API Routes & Controllers                      │  │
│  │  - POST /api/roadmaps/generate-from-job/:jobId        │  │
│  │  - GET  /api/roadmaps/:id                             │  │
│  │  - PUT  /api/nlp/learning-roadmap/:id/customize      │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │      Learning Roadmap Service (Core Logic)           │  │
│  │  - generateRoadmapForJob()                           │  │
│  │  - _extractJobSkills()                                │  │
│  │  - _extractCandidateSkills()                         │  │
│  │  - _analyzeSkillGaps()                                │  │
│  │  - _prioritizeSkills()                                │  │
│  │  - _findLearningResources()                           │  │
│  │  - _createWeeklyRoadmap()                             │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │              NLP Services Layer                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Skill        │  │ Sentence-    │  │ Vector      │ │  │
│  │  │ Extraction   │  │ BERT         │  │ Store       │ │  │
│  │  │ (PhoBERT)    │  │ Service      │  │ (ChromaDB)  │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   MongoDB        │  │   ChromaDB       │  │   Python Service │
│   (Roadmap Data)  │  │   (Vector DB)    │  │   (PhoBERT NER)  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.2. Luồng Dữ Liệu

```
1. User chọn công việc → Frontend gọi API
   ↓
2. Backend lấy Job data và Candidate Profile
   ↓
3. Learning Roadmap Service:
   a. Extract skills từ Job (PhoBERT NER)
   b. Extract skills từ Candidate Profile (PhoBERT NER)
   c. Analyze skill gaps
   d. Prioritize skills
   e. Find learning resources (ChromaDB vector search)
   f. Create weekly roadmap
   ↓
4. Lưu vào MongoDB (LearningRoadmap collection)
   ↓
5. Trả về roadmap cho Frontend
   ↓
6. User có thể customize (thêm/sửa/xóa)
```

---

## 3. Công Nghệ Sử Dụng

### 3.1. Backend Technologies

#### **3.1.1. Node.js/Express**
- **Mục đích**: API server, xử lý requests
- **File**: `backend/src/routes/roadmaps.js`, `backend/src/controllers/roadmapController.js`

#### **3.1.2. MongoDB + Mongoose**
- **Mục đích**: Lưu trữ roadmap data
- **Model**: `backend/src/models/LearningRoadmap.js`
- **Schema**: Phases → Weeks → Resources (nested structure)

#### **3.1.3. PhoBERT NER (Named Entity Recognition)**
- **Mục đích**: Trích xuất kỹ năng từ văn bản
- **Model**: `vinai/phobert-base-v2` (F1-score 96%)
- **Service**: `backend/src/services/ai/skillExtractionService.js`
- **Cách hoạt động**:
  - Nhận văn bản (job description, CV text)
  - Phân tích và nhận diện các thực thể kỹ năng
  - Trả về danh sách skills với confidence score

#### **3.1.4. Sentence-BERT**
- **Mục đích**: Chuyển đổi text thành vector embeddings (768 chiều)
- **Model**: `bkai-foundation-models/vietnamese-bi-encoder`
- **Service**: `backend/src/services/ai/sentenceBertService.js`
- **Cách hoạt động**:
  - Encode text thành vector số
  - Tính cosine similarity giữa các vector
  - So khớp ngữ nghĩa (semantic matching)

#### **3.1.5. ChromaDB (Vector Database)**
- **Mục đích**: Lưu trữ và tìm kiếm learning resources bằng vector similarity
- **Service**: `backend/src/services/ai/vectorStoreService.js`
- **Cách hoạt động**:
  - Lưu trữ embeddings của learning resources (pre-computed)
  - Tìm kiếm bằng vector similarity search
  - Trả về top resources phù hợp nhất
- **Data Source**:
  - **Curated resources**: 500+ resources đã được verify, index vào ChromaDB
  - **Crawled data**: Resources từ YouTube, GitHub, Coursera đã được crawl và index trước
  - **Lưu ý**: ChromaDB KHÔNG tự động crawl - data phải được populate trước

#### **3.1.6. Curated Resources Database**
- **Mục đích**: Database hardcoded với 500+ learning resources đã được verify
- **Service**: `backend/src/services/resource/curatedResourcesDatabase.js`
- **Đặc điểm**:
  - 100% verified real URLs
  - Manual verification, high quality
  - Direct links đến courses/videos cụ thể
  - Không cần health check (đã verified)

#### **3.1.7. API Services (Optional - Fallback)**
- **YouTube API**: Tìm kiếm videos (nếu có quota)
- **GitHub API**: Awesome lists, repositories
- **Coursera API**: Courses
- **Service**: 
  - `backend/src/services/api/youtubeApiService.js`
  - `backend/src/services/api/githubApiService.js`
  - `backend/src/services/dataCrawlers/courseraDataService.js`
- **Cách hoạt động**: Chỉ được gọi khi ChromaDB và Curated DB không có đủ resources

#### **3.1.6. TF-IDF (Term Frequency-Inverse Document Frequency)**
- **Mục đích**: Tính độ quan trọng của từ trong văn bản
- **Library**: `natural` (Node.js)
- **Cách hoạt động**:
  - TF: Tần suất từ trong document
  - IDF: Nghịch đảo tần suất trong corpus
  - Dùng để tính điểm khớp kỹ năng

#### **3.1.7. Skill Normalization Service**
- **Mục đích**: Chuẩn hóa tên kỹ năng về dạng chuẩn
- **Service**: `backend/src/services/ai/skillNormalizationService.js`
- **Ví dụ**: "JS" → "JavaScript", "ReactJS" → "React"

### 3.2. Frontend Technologies

#### **3.2.1. Next.js 14 (React)**
- **Framework**: Server-side rendering, routing
- **Pages**:
  - `fe/app/jobs/[id]/page.tsx` - Trang chi tiết công việc (nút tạo roadmap)
  - `fe/app/roadmaps/[id]/page.tsx` - Trang chi tiết roadmap (customize)
  - `fe/app/roadmaps/page.tsx` - Danh sách roadmaps

#### **3.2.2. TypeScript**
- **Mục đích**: Type safety, better IDE support
- **Types**: `Roadmap`, `Phase`, `Week`, `Resource`

#### **3.2.3. UI Components (shadcn/ui)**
- **Components**: Card, Button, Input, Select, Textarea, Progress, Dialog
- **Icons**: lucide-react (Save, Trash2, Pencil, Loader2, etc.)

---

## 4. Quy Trình Tạo Lộ Trình Chi Tiết

### 4.1. Bước 1: Extract Required Skills từ Job

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_extractJobSkills()`

**Quy trình**:
1. **Extract từ structured requirements** (nếu có):
   ```javascript
   if (job.requirements && Array.isArray(job.requirements)) {
     // Lấy skills từ requirements array
     skills.push({
       name: req.name || req.skill,
       level: req.level || 'intermediate',
       importance: req.importance || 'important',
       source: 'structured',
     });
   }
   ```

2. **Extract từ job description bằng PhoBERT NER**:
   ```javascript
   if (job.description) {
     const extractedSkills = await skillExtractionService.extractSkills(job.description);
     // Trả về: [{ name: "JavaScript", confidence: 0.95 }, ...]
   }
   ```

3. **Normalize skill names**:
   ```javascript
   const normalized = await skillNormalizationService.normalizeSkill(skill.name);
   // "JS" → "JavaScript", "ReactJS" → "React"
   ```

**Kết quả**: Array of skills với format:
```javascript
[
  {
    name: "JavaScript",
    level: "intermediate",
    importance: "critical",
    category: "programming",
    source: "phobert",
    confidence: 0.95
  },
  // ...
]
```

### 4.2. Bước 2: Extract Current Skills từ Candidate Profile

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_extractCandidateSkills()`

**Quy trình**:
1. **Extract từ profile skills array**:
   ```javascript
   if (candidateProfile.skills && Array.isArray(candidateProfile.skills)) {
     skills.push({
       name: skill.name || skill,
       level: skill.level || 'beginner',
       yearsOfExperience: skill.yearsOfExperience || 0,
       source: 'profile',
     });
   }
   ```

2. **Extract từ experience descriptions bằng PhoBERT**:
   ```javascript
   for (const exp of candidateProfile.experience) {
     if (exp.description) {
       const extractedSkills = await skillExtractionService.extractSkills(exp.description);
       // Tìm skills ẩn trong mô tả kinh nghiệm
     }
   }
   ```

3. **Normalize skill names** (giống bước 1)

**Kết quả**: Array of current skills của ứng viên

### 4.3. Bước 3: Analyze Skill Gaps

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_analyzeSkillGaps()`

**Quy trình**:
1. **So sánh từng required skill với current skills**:
   ```javascript
   for (const required of requiredSkills) {
     const hasSkill = currentSkills.find(
       current => current.name.toLowerCase() === required.name.toLowerCase()
     );
   ```

2. **Phân loại gaps**:
   - **Missing skill**: Ứng viên chưa có skill này
   - **Insufficient level**: Ứng viên có skill nhưng level thấp hơn yêu cầu

3. **Categorize theo importance**:
   ```javascript
   if (required.importance === 'critical' || required.level === 'required') {
     gaps.critical.push(gap);
   } else if (required.importance === 'important') {
     gaps.important.push(gap);
   } else {
     gaps.optional.push(gap);
   }
   ```

**Kết quả**: Object với 3 categories:
```javascript
{
  critical: [
    { skillName: "React", requiredLevel: "intermediate", currentLevel: "none", ... },
    // ...
  ],
  important: [ /* ... */ ],
  optional: [ /* ... */ ]
}
```

### 4.4. Bước 4: Prioritize Skills

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_prioritizeSkills()`

**Quy trình**:
1. **Thêm critical skills trước** (priority 1):
   ```javascript
   prioritized.push(...skillGaps.critical.map(gap => ({
     ...gap,
     priority: 1,
     estimatedWeeks: this._estimateWeeksToLearn(gap),
   })));
   ```

2. **Thêm important skills** (priority 2)

3. **Thêm optional skills nếu còn thời gian** (priority 3):
   ```javascript
   const weeksUsed = prioritized.reduce((sum, skill) => sum + skill.estimatedWeeks, 0);
   const weeksRemaining = duration - weeksUsed;
   
   if (weeksRemaining > 0) {
     // Thêm optional skills vào roadmap
   }
   ```

**Ước tính thời gian học**:
```javascript
_estimateWeeksToLearn(gap) {
  const levelWeeks = {
    beginner: 2,
    intermediate: 3,
    advanced: 4,
    expert: 6,
  };
  
  let weeks = levelWeeks[gap.requiredLevel] || 3;
  
  // Nếu đang upgrade (không phải học từ đầu), giảm 40% thời gian
  if (gap.currentLevel && gap.currentLevel !== 'none') {
    weeks = Math.ceil(weeks * 0.6);
  }
  
  return Math.max(1, weeks);
}
```

**Kết quả**: Array of prioritized skills với `priority` và `estimatedWeeks`

### 4.5. Bước 5: Find Learning Resources

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_findLearningResources()`

#### 📖 Giải Thích Đơn Giản (Cho Giảng Viên)

**Cách hệ thống tìm tài liệu học tập:**

Hệ thống tìm tài liệu theo **4 mức độ ưu tiên**, giống như tìm sách trong thư viện:

**1. Thư viện sẵn có (Curated Database) - Ưu tiên cao nhất** ⭐
- Có sẵn **500+ tài liệu** đã được kiểm tra kỹ, lưu trực tiếp trong code
- Giống như có một tủ sách đã được chọn lọc sẵn, chỉ cần lấy ra dùng
- Ví dụ: Link trực tiếp đến khóa học React trên Udemy, tài liệu chính thức của React
- **Ưu điểm**: Chắc chắn có, link đúng, chất lượng cao

**2. Kho lưu trữ thông minh (ChromaDB) - Ưu tiên thứ 2** 🔍
- Là một **cơ sở dữ liệu vector** lưu trữ thông tin về tài liệu học tập
- Dữ liệu trong đây đã được **chuẩn bị sẵn trước** (từ curated DB hoặc đã crawl trước đó)
- Tìm kiếm bằng cách so sánh **ngữ nghĩa** (semantic similarity)
- Ví dụ: Tìm "React tutorial" → hệ thống hiểu và tìm các tài liệu liên quan đến React
- **Lưu ý**: ChromaDB **KHÔNG tự động** vào YouTube/GitHub để lấy dữ liệu mới. Dữ liệu phải được **nạp vào trước** (thủ công hoặc lên lịch tự động)

**3. Gọi API bên ngoài (YouTube/GitHub/Coursera) - Dự phòng** 🌐
- Chỉ được gọi khi:
  - Thư viện sẵn có không có tài liệu cho skill đó
  - Kho lưu trữ ChromaDB không có đủ dữ liệu
  - Cần thêm tài liệu để bổ sung
- **YouTube API**: Tìm video hướng dẫn (nếu có quota)
- **GitHub API**: Tìm repositories, awesome lists
- **Coursera API**: Tìm khóa học
- **Hạn chế**: Có thể hết quota, tốn thời gian, không chắc chắn có kết quả

**4. Gợi ý chung (Generic Fallback) - Cuối cùng** 🔗
- Nếu tất cả đều không có, hệ thống tạo link tìm kiếm chung
- Ví dụ: Link đến trang tìm kiếm trên Coursera, Udemy
- **Chất lượng thấp nhất**: User phải tự tìm trong trang đó

#### 🔄 Quy Trình Kỹ Thuật Chi Tiết

1. **Tạo search query**:
   ```javascript
   const query = `${skill.skillName} ${skill.requiredLevel} tutorial course`;
   // Ví dụ: "React intermediate tutorial course"
   ```

2. **Tìm kiếm trong ChromaDB** (Vector Database):
   ```javascript
   const resources = await vectorStoreService.searchResources(query, 5);
   // Trả về top 5 resources phù hợp nhất
   ```

3. **Vector Search Process** (trong `vectorStoreService.js`):
   - Encode query text thành embedding bằng Sentence-BERT
   - Tìm kiếm trong ChromaDB bằng cosine similarity
   - Trả về resources có similarity score cao nhất

4. **Fallback Strategy** (nếu ChromaDB không có data hoặc không available):
   
   **a. Curated Database (Priority 1 - Highest Quality)**:
   - 500+ curated resources đã được verify thủ công
   - Hardcoded trong `curatedResourcesDatabase.js`
   - 100% verified real URLs, high quality
   - Direct links đến courses/videos cụ thể
   
   **b. ChromaDB Vector Search (Priority 2)**:
   - Pre-computed embeddings của learning resources
   - Data có thể từ:
     - Curated resources đã được index
     - Crawled data từ YouTube, GitHub, Coursera (đã được index trước)
   - Semantic similarity search
   
   **c. API Calls (Priority 3 - Fallback/Enhancement)**:
   - **YouTube API**: Tìm kiếm videos (nếu có quota)
   - **GitHub API**: Awesome lists, repositories
   - **Coursera API**: Courses (cho non-tech industries)
   - Chỉ được gọi nếu curated DB và ChromaDB không có đủ resources
   
   **d. Generic Fallback (Priority 4 - Last Resort)**:
   ```javascript
   if (resources.length === 0) {
     // Tạo generic resource suggestions
     resources = this._generateFallbackResources(skill);
     // Ví dụ: Coursera search URL, Udemy search URL, Documentation links
   }
   ```

#### ⚠️ Lưu Ý Quan Trọng

- **ChromaDB KHÔNG tự động crawl YouTube/GitHub**: Data trong ChromaDB phải được populate trước (manual hoặc scheduled job)
- **API calls là optional**: Chỉ dùng khi ChromaDB không available hoặc không có đủ data
- **Curated Database là nguồn đáng tin cậy nhất**: Đã được verify, không cần health check

**Kết quả**: Array of skills với resources:
```javascript
[
  {
    skillName: "React",
    priority: 1,
    estimatedWeeks: 3,
    resources: [
      {
        title: "React - The Complete Guide",
        url: "https://...",
        type: "course",
        difficulty: "intermediate",
        provider: "Udemy",
        score: 0.92,
        source: "curated",  // hoặc "chromadb" hoặc "youtube-api"
        isCurated: true     // true nếu từ curated DB
      },
      // ...
    ]
  },
  // ...
]
```

**Nguồn dữ liệu resources**:
1. **Curated Database** (ưu tiên cao nhất): Hardcoded, verified
2. **ChromaDB**: Pre-computed embeddings từ curated + crawled data
3. **API calls**: YouTube, GitHub, Coursera (fallback)
4. **Generic fallback**: Search URLs nếu không có gì khác

### 4.6. Bước 6: Create Weekly Roadmap

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_createWeeklyRoadmap()`

**Quy trình**:
1. **Phân bổ skills vào các tuần**:
   ```javascript
   while (currentWeek <= totalDuration && skillIndex < skillsWithResources.length) {
     const skill = skillsWithResources[skillIndex];
     const weeksForSkill = Math.min(skill.estimatedWeeks, totalDuration - currentWeek + 1);
     
     // Tạo weeks cho skill này
     for (let i = 0; i < weeksForSkill; i++) {
       weeks.push({
         weekNumber: currentWeek,
         title: `Week ${currentWeek}: ${skill.skillName}`,
         // ...
       });
       currentWeek++;
     }
     
     skillIndex++;
   }
   ```

2. **Generate weekly tasks**:
   ```javascript
   _generateWeeklyTasks(skill, weekNumber, totalWeeks) {
     if (weekNumber === 1) {
       // Tuần đầu: Fundamentals
       tasks.push(
         `Review ${skill.skillName} fundamentals`,
         `Watch introductory tutorials`,
         `Set up development environment`
       );
     } else if (weekNumber === totalWeeks) {
       // Tuần cuối: Project
       tasks.push(
         `Complete a mini-project using ${skill.skillName}`,
         `Review and consolidate knowledge`
       );
     } else {
       // Tuần giữa: Practice
       tasks.push(
         `Continue hands-on practice`,
         `Work through intermediate exercises`
       );
     }
   }
   ```

3. **Estimate weekly hours**:
   ```javascript
   _estimateWeeklyHours(level) {
     const hoursMap = {
       beginner: 8,
       intermediate: 12,
       advanced: 15,
       expert: 20,
     };
     return hoursMap[level] || 10;
   }
   ```

**Kết quả**: Array of weeks:
```javascript
[
  {
    weekNumber: 1,
    title: "Week 1: React",
    description: "Learn React to intermediate level",
    skills: [{ skillName: "React", targetLevel: "intermediate" }],
    resources: [ /* ... */ ],
    tasks: [
      "Review React fundamentals",
      "Watch introductory tutorials",
      "Set up development environment"
    ],
    estimatedHours: 12,
    milestones: []
  },
  // ...
]
```

### 4.7. Bước 7: Calculate Metrics

**File**: `backend/src/services/ai/learningRoadmapService.js` → `_calculateTotalHours()`, `_calculateDifficulty()`

**Tính tổng giờ học**:
```javascript
_calculateTotalHours(weeks) {
  return weeks.reduce((total, week) => total + (week.estimatedHours || 0), 0);
}
```

**Tính độ khó**:
```javascript
_calculateDifficulty(skillGaps, candidateProfile) {
  let difficultyScore = 0;
  
  // Weight by gap severity
  difficultyScore += criticalCount * 3;
  difficultyScore += importantCount * 2;
  difficultyScore += optionalCount * 1;
  
  // Adjust for candidate experience
  if (experienceYears > 5) {
    difficultyScore *= 0.7; // Easier for experienced
  } else if (experienceYears > 2) {
    difficultyScore *= 0.85;
  }
  
  // Categorize
  if (difficultyScore < 5) return 'beginner';
  if (difficultyScore < 10) return 'intermediate';
  if (difficultyScore < 15) return 'advanced';
  return 'expert';
}
```

### 4.8. Bước 8: Save to Database

**File**: `backend/src/controllers/roadmapController.js` → `generateRoadmapFromJob()`

**Quy trình**:
1. **Tạo roadmap document**:
   ```javascript
   const roadmapData = {
     candidateId: userId,
     targetJobId: jobId,
     title: `Roadmap: ${job.title}`,
     targetRole: job.title,
     targetSkills: [ /* ... */ ],
     weeks: aiRoadmap.weeks,
     phases: this._groupWeeksIntoPhases(aiRoadmap.weeks),
     settings: {
       duration: parseInt(duration),
       difficulty: aiRoadmap.difficulty,
       estimatedTotalHours: aiRoadmap.estimatedTotalHours,
     },
     metadata: {
       skillGaps: aiRoadmap.skillGaps,
       // ...
     },
   };
   ```

2. **Lưu vào MongoDB**:
   ```javascript
   const roadmap = await LearningRoadmap.create(roadmapData);
   ```

3. **Trả về cho Frontend**:
   ```javascript
   res.status(201).json({
     success: true,
     data: roadmap,
     message: 'Tạo roadmap thành công',
   });
   ```

---

## 5. Backend Implementation

### 5.1. Core Service: Learning Roadmap Service

**File**: `backend/src/services/ai/learningRoadmapService.js`

**Class**: `LearningRoadmapService`

**Main Method**: `generateRoadmapForJob(job, candidateProfile, duration)`

**Flow**:
```javascript
async generateRoadmapForJob(job, candidateProfile, duration = 12) {
  // 1. Initialize services
  await this.initialize();
  
  // 2. Extract skills
  const requiredSkills = await this._extractJobSkills(job);
  const currentSkills = await this._extractCandidateSkills(candidateProfile);
  
  // 3. Analyze gaps
  const skillGaps = await this._analyzeSkillGaps(requiredSkills, currentSkills);
  
  // 4. Prioritize
  const prioritizedSkills = this._prioritizeSkills(skillGaps, duration);
  
  // 5. Find resources
  const skillsWithResources = await this._findLearningResources(prioritizedSkills);
  
  // 6. Create roadmap
  const weeks = this._createWeeklyRoadmap(skillsWithResources, duration);
  
  // 7. Calculate metrics
  const estimatedTotalHours = this._calculateTotalHours(weeks);
  const difficulty = this._calculateDifficulty(skillGaps, candidateProfile);
  
  // 8. Return result
  return {
    success: true,
    roadmap: {
      targetJobTitle: job.title,
      duration,
      difficulty,
      estimatedTotalHours,
      skillGaps,
      weeks,
      metadata: { /* ... */ }
    }
  };
}
```

### 5.2. Controller: Roadmap Controller

**File**: `backend/src/controllers/roadmapController.js`

**Method**: `generateRoadmapFromJob(req, res)`

**Flow**:
```javascript
const generateRoadmapFromJob = async (req, res) => {
  // 1. Get jobId and userId
  const { jobId } = req.params;
  const userId = req.user.id;
  
  // 2. Get job and user profile
  const job = await Job.findById(jobId);
  const userProfile = await CandidateProfile.findOne({ userId });
  
  // 3. Check if roadmap exists
  const existingRoadmap = await LearningRoadmap.findOne({ 
    candidateId: userId, 
    targetJobId: jobId 
  });
  
  // 4. Generate roadmap
  const result = await learningRoadmapService.generateRoadmapForJob(
    job,
    userProfile,
    duration
  );
  
  // 5. Save to database
  const roadmap = await LearningRoadmap.create(roadmapData);
  
  // 6. Return response
  res.status(201).json({ success: true, data: roadmap });
};
```

### 5.3. API Routes

**File**: `backend/src/routes/roadmaps.js`

```javascript
router.post('/generate-from-job/:jobId', 
  protect,  // Authentication required
  generateRoadmapFromJob
);
```

**Endpoint**: `POST /api/roadmaps/generate-from-job/:jobId`

**Request Body**:
```json
{
  "duration": 12  // Optional, default: 8
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "targetRole": "Frontend Developer",
    "weeks": [ /* ... */ ],
    "phases": [ /* ... */ ],
    "settings": {
      "duration": 12,
      "difficulty": "intermediate",
      "estimatedTotalHours": 144
    }
  },
  "message": "Tạo roadmap thành công"
}
```

### 5.4. Customize Roadmap API

**File**: `backend/src/controllers/advancedNLPController.js` → `customizeRoadmap()`

**Endpoint**: `PUT /api/nlp/learning-roadmap/:id/customize`

**Actions**:
- `addResource`: Thêm resource vào week
- `updateResource`: Cập nhật resource
- `removeResource`: Xóa resource
- `addWeek`: Thêm week vào phase
- `removeWeek`: Xóa week
- `removePhase`: Xóa phase

**Request Body**:
```json
{
  "action": "addResource",
  "phaseNumber": 1,
  "weekNumber": 1,
  "resource": {
    "type": "video",
    "title": "React Tutorial",
    "url": "https://...",
    "difficulty": "beginner"
  }
}
```

---

## 6. Frontend Implementation

### 6.1. Trang Tạo Roadmap (Job Detail Page)

**File**: `fe/app/jobs/[id]/page.tsx`

**Component**: `JobDetailPage`

**Flow**:
```typescript
const handleGenerateRoadmap = async () => {
  // 1. Show progress
  setRoadmapProgress(0);
  setRoadmapProgressMessage("Đang xác định kỹ năng cần thiết...");
  
  // 2. Simulate progress steps
  const progressSteps = [
    { progress: 30, message: "Đang phân tích skill gaps..." },
    { progress: 40, message: "Đang tìm kiếm tài liệu học tập..." },
    { progress: 50, message: "Đang tìm kiếm video YouTube..." },
    { progress: 60, message: "Đang tìm kiếm dự án GitHub..." },
    { progress: 70, message: "Đang đánh giá độ tin cậy tài liệu..." },
    { progress: 80, message: "Đang tạo lộ trình học tập..." },
    { progress: 90, message: "Đang tính toán metrics..." },
  ];
  
  // 3. Call API
  const response = await nlpService.generateLearningRoadmapRag({
    jobId: id,
    candidateId: userId,
    timeframe: 12,
  });
  
  // 4. Redirect to roadmap detail page
  if (response.success && response.data?._id) {
    router.push(`/roadmaps/${response.data._id}`);
  }
};
```

**UI Elements**:
- Button "Tạo lộ trình học tập"
- Progress bar với messages
- Loading state

### 6.2. Trang Chi Tiết Roadmap (Customize)

**File**: `fe/app/roadmaps/[id]/page.tsx`

**Component**: `RoadmapDetailPage`

**Layout** (2 cột):
- **Bên trái**: Form thêm tài nguyên và tuần
- **Bên phải**: Danh sách phases với weeks và resources

**Features**:
1. **Thêm tài nguyên**:
   ```typescript
   const addResource = async () => {
     await handleCustomize({
       action: "addResource",
       phaseNumber: selectedPhase,
       weekNumber: selectedWeek,
       resource: resourceForm,
     });
   };
   ```

2. **Thêm tuần**:
   ```typescript
   const addWeek = async () => {
     await handleCustomize({
       action: "addWeek",
       phaseNumber: selectedPhase,
       week: {
         focus: weekForm.focus,
         timeCommitment: weekForm.timeCommitment,
         learningObjectives: weekForm.learningObjectives,
         resources: [],
       },
     });
   };
   ```

3. **Xóa** (resource/week/phase):
   ```typescript
   const confirmDelete = (type, opts) => {
     setPendingDelete({ type, ...opts });
   };
   ```

4. **Hoàn tác** (Undo):
   ```typescript
   const handleUndo = () => {
     if (undoStack.length === 0) return;
     const [last, ...rest] = undoStack;
     setUndoStack(rest);
     setRoadmap(last);
   };
   ```

5. **Lưu và quay về danh sách**:
   ```typescript
   const handleSave = async () => {
     router.push("/roadmaps");
   };
   ```

**State Management**:
- `roadmap`: Current roadmap data
- `selectedPhase`, `selectedWeek`: Selected items for adding resources/weeks
- `resourceForm`, `weekForm`: Form data
- `undoStack`: Stack for undo functionality
- `pendingDelete`: Pending deletion confirmation

---

## 7. Database Schema

### 7.1. Learning Roadmap Model

**File**: `backend/src/models/LearningRoadmap.js`

**Schema Structure**:
```javascript
{
  candidateId: ObjectId,        // Reference to User
  targetJobId: ObjectId,        // Reference to Job (optional)
  targetRole: String,           // "Frontend Developer"
  
  // Skill gaps
  skillGaps: [{
    skill: String,
    currentLevel: String,        // "none" | "beginner" | ...
    targetLevel: String,         // "intermediate" | "advanced" | ...
    priority: String,            // "critical" | "high" | "medium" | "low"
    importance: Number           // 0-1
  }],
  
  // Phases (grouped weeks)
  phases: [{
    phaseNumber: Number,         // 1, 2, 3, ...
    title: String,               // "Foundation Phase"
    duration: String,             // "4 weeks"
    objectives: [String],
    
    // Weeks within phase
    weeks: [{
      weekNumber: Number,         // 1, 2, 3, ...
      focus: String,              // "React Basics"
      learningObjectives: [String],
      
      // Resources for this week
      resources: [{
        type: String,             // "course" | "video" | "article" | ...
        title: String,
        url: String,
        provider: String,         // "Udemy" | "Coursera" | "YouTube"
        duration: String,         // "10 hours"
        difficulty: String,       // "beginner" | "intermediate" | "advanced"
        isFree: Boolean,
        rating: Number,           // 0-5
        // ...
      }],
      
      // Tasks for this week
      tasks: [String],
      estimatedHours: Number,
      milestones: [String]
    }]
  }],
  
  // Settings
  settings: {
    duration: Number,            // Total weeks
    difficulty: String,           // "beginner" | "intermediate" | ...
    estimatedTotalHours: Number,
    pace: String                  // "normal" | "fast" | "slow"
  },
  
  // Metadata
  metadata: {
    skillGaps: Object,           // Full skill gaps analysis
    userProfile: Object,          // Snapshot of user profile
    targetJob: Object,            // Snapshot of target job
    generatedAt: Date,
    generationMethod: String      // "self-sufficient-nlp"
  },
  
  // Progress tracking
  progress: {
    currentPhase: Number,
    currentWeek: Number,
    overallProgress: Number        // 0-100
  },
  
  status: String,                 // "active" | "completed" | "paused"
  createdAt: Date,
  updatedAt: Date
}
```

### 7.2. Indexes

```javascript
{
  candidateId: 1,        // Index for user queries
  targetJobId: 1,       // Index for job-based queries
  status: 1,            // Index for filtering
  createdAt: -1         // Index for sorting
}
```

---

## 8. API Endpoints

### 8.1. Generate Roadmap from Job

**Endpoint**: `POST /api/roadmaps/generate-from-job/:jobId`

**Authentication**: Required (JWT token)

**Request**:
```http
POST /api/roadmaps/generate-from-job/507f1f77bcf86cd799439011
Content-Type: application/json
Authorization: Bearer <token>

{
  "duration": 12
}
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "targetRole": "Frontend Developer",
    "phases": [ /* ... */ ],
    "weeks": [ /* ... */ ],
    "settings": {
      "duration": 12,
      "difficulty": "intermediate",
      "estimatedTotalHours": 144
    }
  },
  "message": "Tạo roadmap thành công"
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "Roadmap cho công việc này đã tồn tại"
}
```

### 8.2. Get Roadmap

**Endpoint**: `GET /api/roadmaps/:id`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "targetRole": "Frontend Developer",
    "phases": [ /* ... */ ],
    // ...
  }
}
```

### 8.3. Customize Roadmap

**Endpoint**: `PUT /api/nlp/learning-roadmap/:id/customize`

**Authentication**: Required

**Request** (Add Resource):
```json
{
  "action": "addResource",
  "phaseNumber": 1,
  "weekNumber": 1,
  "resource": {
    "type": "video",
    "title": "React Tutorial",
    "url": "https://www.youtube.com/watch?v=...",
    "difficulty": "beginner"
  }
}
```

**Request** (Add Week):
```json
{
  "action": "addWeek",
  "phaseNumber": 1,
  "week": {
    "focus": "Advanced React",
    "timeCommitment": "10-15 hours/week",
    "learningObjectives": [
      "Learn React Hooks",
      "Understand Context API"
    ]
  }
}
```

**Request** (Remove Resource):
```json
{
  "action": "removeResource",
  "phaseNumber": 1,
  "weekNumber": 1,
  "resourceIndex": 0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated roadmap
  }
}
```

### 8.4. Get All Roadmaps

**Endpoint**: `GET /api/roadmaps`

**Query Parameters**:
- `status`: Filter by status ("active" | "completed" | "paused")
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "targetRole": "Frontend Developer",
      "progress": { "overallProgress": 25 },
      // ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

## 9. Ví Dụ Cụ Thể

### 9.1. Scenario: Tạo Roadmap cho Frontend Developer

**Input**:
- **Job**: Frontend Developer tại công ty ABC
- **Job Requirements**: React, JavaScript, TypeScript, HTML/CSS
- **Candidate Profile**: 
  - Skills: JavaScript (beginner), HTML/CSS (intermediate)
  - Experience: 1 năm làm web developer

**Quy trình**:

1. **Extract Required Skills**:
   ```
   - React (intermediate, critical)
   - JavaScript (intermediate, critical)
   - TypeScript (intermediate, important)
   - HTML/CSS (intermediate, important)
   ```

2. **Extract Current Skills**:
   ```
   - JavaScript (beginner)
   - HTML/CSS (intermediate)
   ```

3. **Analyze Skill Gaps**:
   ```
   Critical:
   - React (required: intermediate, current: none)
   - JavaScript (required: intermediate, current: beginner)
   
   Important:
   - TypeScript (required: intermediate, current: none)
   ```

4. **Prioritize Skills**:
   ```
   Priority 1 (Critical):
   - React: 3 weeks (learn from scratch)
   - JavaScript: 2 weeks (upgrade from beginner)
   
   Priority 2 (Important):
   - TypeScript: 3 weeks (learn from scratch)
   ```

5. **Find Learning Resources** (ChromaDB search):
   **a. Curated Database** (Priority 1):
   ```
   React:
   - "React - The Complete Guide" (Udemy, 4.8⭐) - từ curated DB
   - "React Official Documentation" (free) - từ curated DB
   
   JavaScript:
   - "JavaScript: The Complete Guide" (Udemy) - từ curated DB
   - "MDN JavaScript Guide" (free) - từ curated DB
   ```
   
   **b. ChromaDB Vector Search** (Priority 2):
   ```
   - Tìm kiếm semantic similarity trong ChromaDB
   - Trả về resources có embeddings tương đồng
   - Data từ curated resources đã được index
   ```
   
   **c. API Calls** (Priority 3 - nếu cần thêm):
   ```
   - YouTube API: "React Tutorial for Beginners" (nếu có quota)
   - GitHub API: Awesome React lists
   - Coursera API: React courses
   ```
   
   **Lưu ý**: ChromaDB KHÔNG tự động gọi YouTube/GitHub API. Data trong ChromaDB phải được populate trước từ curated DB hoặc scheduled crawl jobs.

6. **Create Weekly Roadmap**:
   ```
   Week 1-3: React
     - Week 1: React Fundamentals (12 hours)
       - Resources: React Tutorial, Documentation
       - Tasks: Set up environment, Learn JSX, Components
     - Week 2: React Hooks (12 hours)
       - Resources: Hooks Tutorial, Practice Projects
       - Tasks: useState, useEffect, Custom Hooks
     - Week 3: React Advanced (12 hours)
       - Resources: Context API, Redux Basics
       - Tasks: Build a Todo App
   
   Week 4-5: JavaScript Upgrade
     - Week 4: ES6+ Features (12 hours)
     - Week 5: Async JavaScript (12 hours)
   
   Week 6-8: TypeScript
     - Week 6: TypeScript Basics (12 hours)
     - Week 7: TypeScript with React (12 hours)
     - Week 8: Advanced TypeScript (12 hours)
   ```

7. **Calculate Metrics**:
   ```
   Total Duration: 8 weeks
   Total Hours: 96 hours
   Difficulty: Intermediate
   ```

8. **Save to Database**:
   - Tạo document trong `LearningRoadmap` collection
   - Link với `candidateId` và `targetJobId`

### 9.2. Customize Roadmap

**User muốn thêm resource vào Week 1**:

1. **Select Phase và Week**:
   - Phase: 1 (Foundation Phase)
   - Week: 1 (React Fundamentals)

2. **Fill Resource Form**:
   ```
   Title: "React Crash Course 2024"
   URL: "https://www.youtube.com/watch?v=..."
   Type: "video"
   Difficulty: "beginner"
   Duration: "5 hours"
   ```

3. **Call API**:
   ```javascript
   PUT /api/nlp/learning-roadmap/:id/customize
   {
     "action": "addResource",
     "phaseNumber": 1,
     "weekNumber": 1,
     "resource": { /* ... */ }
   }
   ```

4. **Result**: Resource được thêm vào Week 1

---

## 10. Kết Luận

### 10.1. Điểm Mạnh

- ✅ **Tự động hóa hoàn toàn**: Từ phân tích đến tạo lộ trình
- ✅ **Cá nhân hóa cao**: Dựa trên profile thực tế
- ✅ **Sử dụng NLP tiên tiến**: PhoBERT, Sentence-BERT, ChromaDB
- ✅ **Self-sufficient**: Không phụ thuộc LLM
- ✅ **Có thể tùy chỉnh**: User có thể thêm/sửa/xóa

### 10.2. Hạn Chế

- ⚠️ **ChromaDB không tự động crawl**: Data trong ChromaDB phải được populate trước (manual hoặc scheduled job). Hệ thống KHÔNG tự động gọi YouTube/GitHub API mỗi lần tạo roadmap.
- ⚠️ **Chất lượng resources phụ thuộc Curated DB và ChromaDB**: 
  - Nếu Curated DB không có skill → dùng ChromaDB
  - Nếu ChromaDB không có data → dùng API calls (nếu có quota)
  - Nếu API calls fail → dùng generic fallback (search URLs)
- ⚠️ **Ước tính thời gian có thể không chính xác**: Dựa trên heuristic, không phải dữ liệu thực tế
- ⚠️ **Không xem xét learning style**: Chưa có personalization theo cách học
- ⚠️ **API quota limits**: YouTube/GitHub API có quota, có thể hết quota

### 10.3. Hướng Phát Triển

- 🔮 **Machine Learning**: Sử dụng ML để cải thiện ước tính thời gian
- 🔮 **A/B Testing**: Test các lộ trình khác nhau để tối ưu
- 🔮 **Social Learning**: Cho phép học cùng nhóm
- 🔮 **Progress Tracking**: Theo dõi tiến độ thực tế và điều chỉnh roadmap

---

**Tài liệu này cung cấp cái nhìn toàn diện về chức năng tạo lộ trình học tập, từ kiến trúc hệ thống đến implementation chi tiết.**

