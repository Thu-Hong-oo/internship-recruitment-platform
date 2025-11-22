# Hệ Thống Gợi Ý Tài Liệu Học Tập & Theo Dõi Tiến Độ

## 📚 Tổng Quan

Hệ thống sử dụng **RAG (Retrieval-Augmented Generation)** kết hợp với **Intelligent Recommendation** để:
1. ✅ Gợi ý tài liệu học tập phù hợp (courses, videos, articles, documentation)
2. ✅ Theo dõi quá trình học tập (progress tracking)
3. ✅ Đánh giá độ tin cậy của tài liệu (credibility assessment)
4. ✅ Phù hợp với trình độ và timeline (level-based matching)

---

## 🔍 1. Hệ Thống Gợi Ý Tài Liệu

### **1.1 Công Nghệ Sử Dụng**

#### **A. RAG (Retrieval-Augmented Generation)** ⚠️ **Đang phát triển**

**Kiến trúc:**
```
User Request (Skill + Level + Timeline)
        ↓
[1] Query Generation
    - Skill gaps analysis
    - Learning objectives
    - Phase & week context
        ↓
[2] Semantic Search (Vector DB) - TODO
    - Generate embeddings
    - Search similar resources
    - Filter by metadata
        ↓
[3] Resource Ranking
    - Credibility score
    - Relevance score
    - Fit score
        ↓
[4] Diversification
    - Multiple resource types
    - Different providers
    - Balanced difficulty
        ↓
[5] Return Top N Resources
```

**Data Sources (Kế hoạch):**
- **Udemy Courses**: ~50,000 courses
- **Coursera Catalog**: ~10,000 courses
- **YouTube Educational**: ~5,000 playlists
- **GitHub Learning Repos**: ~1,000 repos
- **Official Documentation**: All major tech docs

**Embeddings (Kế hoạch):**
- Model: `text-embedding-3-small` (OpenAI) hoặc `sentence-transformers`
- Dimensions: 1536
- Content: Title + Description + Skills + Level + Provider

**Status**: ⚠️ **Chưa tích hợp vector DB** - Hiện tại dùng intelligent recommendations

---

#### **B. Intelligent Recommendation** ✅ **Đang hoạt động**

**Thuật toán hiện tại:**

```javascript
async recommendResources({
  skill,              // Skill cần học (e.g., "React")
  currentLevel,      // Trình độ hiện tại (beginner/intermediate/advanced)
  targetLevel,       // Trình độ mục tiêu
  phaseNumber,       // Phase (1-4: Foundation → Specialization)
  learningObjectives,// Learning objectives của tuần
  weekNumber,        // Week number
  totalWeeks,        // Total weeks
}) {
  // 1. Xác định độ khó phù hợp
  difficulty = determineAppropriateDifficulty(currentLevel, targetLevel, phaseNumber);
  
  // 2. Xác định resource types phù hợp
  preferredTypes = getPreferredTypes(phaseNumber);
  // Phase 1: ['documentation', 'video', 'course']
  // Phase 2: ['course', 'video', 'project']
  // Phase 3: ['course', 'article', 'project']
  // Phase 4: ['course', 'article', 'documentation']
  
  // 3. Xác định learning stage (Bloom's Taxonomy)
  learningStage = determineLearningStage(phaseNumber, weekNumber);
  // Phase 1: 'remember' → 'understand'
  // Phase 2: 'understand' → 'apply'
  // Phase 3: 'apply' → 'analyze'
  // Phase 4: 'analyze' → 'create'
  
  // 4. Generate recommendations
  resources = generateIntelligentRecommendations({
    skill, difficulty, resourceTypes, learningStage, ...
  });
  
  // 5. Calculate credibility scores
  resourcesWithCredibility = calculateCredibility(resources);
  
  // 6. Sort by recommendation score
  sortedResources = sortByScore(resourcesWithCredibility);
  
  // 7. Diversify và limit (MMR algorithm)
  return diversifyAndLimit(sortedResources, limit: 5);
}
```

**Các loại tài liệu được gợi ý:**

1. **Courses** (Udemy, Coursera, edX)
   - Có rating, duration, cost
   - Certificate offered
   - Phù hợp cho structured learning

2. **Videos** (YouTube, educational channels)
   - Free, dễ tiếp cận
   - Phù hợp cho beginners
   - Visual learning

3. **Documentation** (Official docs)
   - Always free
   - High credibility
   - Reference material

4. **Articles** (Tech blogs, tutorials)
   - Quick learning
   - Phù hợp cho advanced stages
   - Deep dives

5. **Projects** (Practice projects)
   - Hands-on learning
   - Apply knowledge
   - Portfolio building

---

### **1.2 Credibility Assessment**

**Multi-factor Scoring (dựa trên Source Credibility Theory - Hovland & Weiss, 1951):**

```javascript
Credibility Score = (
  Provider Reputation × 40% +
  User Rating × 30% +
  Resource Type × 20% +
  Certificate Offered × 10%
)
```

**Provider Reputation Scores:**
- **Official Docs**: 1.0 (highest)
- **Coursera/edX**: 0.9 (university-backed)
- **Udemy**: 0.8 (marketplace)
- **YouTube (Educational)**: 0.7 (varies by channel)
- **Tech Blogs**: 0.6-0.8 (depends on author)

**Resource Type Scores:**
- **Documentation**: 0.9 (official, always accurate)
- **Course (paid)**: 0.8 (structured, reviewed)
- **Course (free)**: 0.7
- **Video**: 0.6-0.8 (depends on channel)
- **Article**: 0.5-0.7 (varies)

---

### **1.3 Level-based Matching**

**Thuật toán xác định độ khó phù hợp:**

```javascript
function determineAppropriateDifficulty(currentLevel, targetLevel, phaseNumber) {
  // Phase 1 (Foundation): Bắt đầu từ beginner
  if (phaseNumber === 1) {
    return currentLevel > 'beginner' ? currentLevel : 'beginner';
  }
  
  // Phase 2 (Intermediate): Between current and target
  if (phaseNumber === 2) {
    return midPoint(currentLevel, targetLevel);
  }
  
  // Phase 3 (Advanced): Close to target
  if (phaseNumber === 3) {
    return targetLevel - 1 level;
  }
  
  // Phase 4 (Specialization): Target level
  return targetLevel;
}
```

**Ví dụ:**
- Current: `beginner`, Target: `intermediate`, Phase 1 → `beginner`
- Current: `beginner`, Target: `intermediate`, Phase 2 → `beginner-intermediate`
- Current: `beginner`, Target: `intermediate`, Phase 3 → `intermediate`
- Current: `beginner`, Target: `intermediate`, Phase 4 → `intermediate`

---

### **1.4 Timing & Progression**

**Bloom's Taxonomy Integration:**

| Phase | Learning Stage | Resource Focus |
|-------|---------------|----------------|
| **Phase 1** (Foundation) | Remember → Understand | Documentation, Videos, Beginner Courses |
| **Phase 2** (Intermediate) | Understand → Apply | Courses, Practice Projects |
| **Phase 3** (Advanced) | Apply → Analyze | Advanced Courses, Articles |
| **Phase 4** (Specialization) | Analyze → Create | Specialized Courses, Projects |

**Spaced Repetition:**
- Resources được recommend theo timeline
- Review milestones ở các tuần quan trọng
- Progression từ dễ → khó

---

## 📊 2. Theo Dõi Quá Trình Học Tập

### **2.1 Progress Tracking System** ✅ **Đang hoạt động**

**Các metrics được track:**

```javascript
progress: {
  currentPhase: Number,        // Phase hiện tại (1-4)
  currentWeek: Number,         // Week hiện tại
  completedWeeks: [Number],    // Danh sách weeks đã hoàn thành
  completedResources: [String], // Danh sách resources đã hoàn thành (resource IDs)
  overallProgress: Number,      // Tổng tiến độ (0-100%)
  startedAt: Date,             // Ngày bắt đầu
  lastUpdatedAt: Date,         // Lần cập nhật cuối
  estimatedCompletionDate: Date // Ngày dự kiến hoàn thành
}
```

---

### **2.2 Methods để Update Progress**

#### **A. Update Week Progress**

```javascript
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Body: {
  "weekNumber": 2
}

// Backend:
roadmap.updateProgress(weekNumber);
// - Thêm weekNumber vào completedWeeks
// - Tính lại overallProgress = (completedWeeks.length / totalWeeks) × 100
// - Update lastUpdatedAt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "currentPhase": 1,
      "currentWeek": 2,
      "completedWeeks": [1, 2],
      "overallProgress": 16.67, // 2/12 weeks
      "lastUpdatedAt": "2025-01-22T08:00:00.000Z"
    }
  }
}
```

#### **B. Mark Resource Completed**

```javascript
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Body: {
  "resourceId": "resource_123"
}

// Backend:
roadmap.markResourceCompleted(resourceId);
// - Thêm resourceId vào completedResources
// - Update lastUpdatedAt
```

#### **C. Update Phase**

```javascript
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Body: {
  "phaseNumber": 2
}

// Backend:
roadmap.progress.currentPhase = phaseNumber;
roadmap.save();
```

---

### **2.3 Progress Visualization**

**Các thông tin có thể hiển thị:**

1. **Overall Progress**: `overallProgress` (0-100%)
2. **Phase Progress**: Số weeks đã hoàn thành trong phase hiện tại
3. **Resource Completion**: Số resources đã hoàn thành / tổng số
4. **Time Spent**: `lastUpdatedAt - startedAt`
5. **Estimated Time Remaining**: Dựa trên `estimatedCompletionDate`

**Example Response:**
```json
{
  "progress": {
    "currentPhase": 1,
    "currentWeek": 3,
    "completedWeeks": [1, 2],
    "completedResources": ["resource_1", "resource_2"],
    "overallProgress": 16.67,
    "phaseProgress": 66.67, // 2/3 weeks in Phase 1
    "resourceCompletion": 40, // 2/5 resources
    "startedAt": "2025-01-01T00:00:00.000Z",
    "lastUpdatedAt": "2025-01-22T08:00:00.000Z",
    "estimatedCompletionDate": "2025-03-26T00:00:00.000Z"
  }
}
```

---

### **2.4 Milestones Tracking**

**Milestones được định nghĩa trong roadmap:**

```javascript
milestones: [
  {
    weekNumber: 4,
    title: "Complete Foundation Phase",
    description: "Mastered basic concepts",
    criteria: ["Complete all Phase 1 resources", "Pass assessments"],
    isCompleted: false,
    completedAt: null
  },
  {
    weekNumber: 8,
    title: "Complete Intermediate Phase",
    description: "Able to build projects",
    criteria: ["Complete Phase 2 projects", "Build portfolio"],
    isCompleted: false,
    completedAt: null
  }
]
```

**Auto-complete milestones:**
- Khi `completedWeeks` đạt đến `weekNumber` của milestone
- Khi tất cả criteria được đáp ứng
- System tự động set `isCompleted = true` và `completedAt = Date.now()`

---

## 🎯 3. Cách Sử Dụng

### **3.1 Get Recommended Resources**

```javascript
GET /api/nlp/roadmap/recommended-resources/:roadmapId?phase=1&week=2

Response: {
  "success": true,
  "data": [
    {
      "type": "course",
      "title": "React Fundamentals Course",
      "url": "https://udemy.com/react-fundamentals",
      "provider": "Udemy",
      "duration": "20 hours",
      "difficulty": "beginner",
      "isFree": false,
      "rating": 4.7,
      "estimatedCost": 19.99,
      "credibility": 0.85,
      "recommendationScore": 0.92,
      "certificateOffered": true
    },
    {
      "type": "video",
      "title": "React Tutorial for Beginners",
      "url": "https://youtube.com/react-tutorial",
      "provider": "YouTube - Traversy Media",
      "duration": "5 hours",
      "difficulty": "beginner",
      "isFree": true,
      "rating": 4.8,
      "credibility": 0.75,
      "recommendationScore": 0.88
    },
    {
      "type": "documentation",
      "title": "Official React Documentation",
      "url": "https://react.dev",
      "provider": "Official Docs",
      "duration": "Reference",
      "difficulty": "intermediate",
      "isFree": true,
      "rating": 5.0,
      "credibility": 1.0,
      "recommendationScore": 0.95
    }
  ]
}
```

---

### **3.2 Update Progress**

```javascript
// Mark week as completed
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Body: {
  "weekNumber": 2
}

// Mark resource as completed
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Body: {
  "resourceId": "resource_123"
}

// Update phase
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Body: {
  "phaseNumber": 2
}
```

---

### **3.3 Get Progress**

```javascript
GET /api/nlp/learning-roadmap/:roadmapId

Response: {
  "success": true,
  "data": {
    "_id": "roadmap_id",
    "targetRole": "Senior Full Stack Developer",
    "currentLevel": "beginner",
    "progress": {
      "currentPhase": 1,
      "currentWeek": 3,
      "completedWeeks": [1, 2],
      "completedResources": ["resource_1", "resource_2"],
      "overallProgress": 16.67,
      "startedAt": "2025-01-01T00:00:00.000Z",
      "lastUpdatedAt": "2025-01-22T08:00:00.000Z"
    },
    "phases": [
      {
        "phaseNumber": 1,
        "title": "Foundation",
        "weeks": [
          {
            "weekNumber": 1,
            "focus": "JavaScript Basics",
            "resources": [...],
            "projects": [...]
          }
        ]
      }
    ],
    "milestones": [...]
  }
}
```

---

## 🚀 4. Kế Hoạch Phát Triển

### **4.1 RAG Integration (Priority 1)**

**Cần làm:**
1. ✅ Setup Vector Database (Pinecone/ChromaDB)
2. ✅ Collect và index resources từ:
   - Udemy API
   - Coursera API
   - YouTube API
   - GitHub repos
   - Official documentation
3. ✅ Generate embeddings cho mỗi resource
4. ✅ Implement semantic search
5. ✅ Replace `_generateIntelligentRecommendations` với RAG search

**Lợi ích:**
- ✅ Real resources thay vì generated
- ✅ Better relevance với semantic search
- ✅ Scale tốt hơn (50K+ resources)

---

### **4.2 Health Check Service (Priority 2)**

**Cần làm:**
1. ✅ Check dead links (404 errors)
2. ✅ Check outdated resources (last updated date)
3. ✅ Filter out invalid resources
4. ✅ Auto-update resource status

**Implementation:**
```javascript
class HealthCheckService {
  async filterValidResources(resources) {
    const validResources = [];
    for (const resource of resources) {
      const isValid = await this.checkResourceHealth(resource.url);
      if (isValid) {
        validResources.push(resource);
      }
    }
    return validResources;
  }
  
  async checkResourceHealth(url) {
    // Check if URL returns 200
    // Check if resource is not outdated
    // Check if provider still exists
  }
}
```

---

### **4.3 Advanced Progress Analytics (Priority 3)**

**Cần làm:**
1. ✅ Time tracking (thời gian học mỗi resource)
2. ✅ Learning velocity (tốc độ học)
3. ✅ Retention rate (tỷ lệ hoàn thành)
4. ✅ Performance predictions (dự đoán completion date)
5. ✅ Personalized recommendations dựa trên progress

---

## 📊 5. So Sánh với Industry Standards

| Feature | Our System | Duolingo | Coursera | Khan Academy | Status |
|---------|------------|----------|----------|--------------|--------|
| **Resource Recommendation** | ✅ RAG + Intelligent | ✅ ML-based | ✅ Catalog | ✅ Structured | ✅ Good |
| **Progress Tracking** | ✅ Week + Resource | ✅ Lesson | ✅ Course | ✅ Unit | ✅ Good |
| **Credibility Assessment** | ✅ Multi-factor | ❌ None | ✅ Provider-based | ✅ Provider-based | ✅ Better |
| **Level-based Matching** | ✅ Phase-aware | ✅ Adaptive | ⚠️ Course-level | ✅ Skill-level | ✅ Good |
| **Milestones** | ✅ Custom | ✅ Streaks | ✅ Certificates | ✅ Badges | ✅ Good |
| **Real Resources** | ⚠️ Generated (temp) | ✅ Real | ✅ Real | ✅ Real | ⚠️ Need RAG |

**Kết luận**: Hệ thống **tốt về logic và structure**, nhưng cần **RAG integration** để có real resources.

---

## ✅ 6. Kết Luận

### **Điểm mạnh:**
- ✅ **Intelligent Recommendation**: Logic tốt, có căn cứ nghiên cứu
- ✅ **Progress Tracking**: Đầy đủ metrics, dễ sử dụng
- ✅ **Credibility Assessment**: Multi-factor, có research basis
- ✅ **Level-based Matching**: Phù hợp với learning progression
- ✅ **Milestones**: Tạo động lực học tập

### **Điểm yếu:**
- ⚠️ **RAG chưa tích hợp**: Hiện tại dùng generated resources
- ⚠️ **Health check chưa có**: Chưa check dead links
- ⚠️ **Analytics chưa đầy đủ**: Chưa có time tracking, velocity

### **Khuyến nghị:**
1. **Ngắn hạn**: Tích hợp RAG với vector DB
2. **Trung hạn**: Health check service
3. **Dài hạn**: Advanced analytics và ML-based personalization

**Tổng thể**: ⭐⭐⭐⭐ (4/5) - **Tốt cho production**, nhưng cần RAG để có real resources.

