# 🎯 Advanced NLP Features - Technical Documentation

## Tổng quan

Hệ thống NLP nâng cao cung cấp 2 chức năng chính:

1. **🎓 Lộ trình học tập cá nhân hóa (Personalized Learning Roadmap)**
   - Tự động tạo lộ trình học tập dựa trên skill gaps
   - Đề xuất tài liệu học tập cụ thể với độ tin cậy cao
   - Tracking progress và milestones

2. **📊 Tính điểm phù hợp nâng cao (Advanced Matching Score)**
   - Đánh giá chi tiết độ phù hợp CV-Job
   - Lọc ứng viên hiệu quả cho nhà tuyển dụng
   - Gợi ý jobs phù hợp cho ứng viên

---

## 📁 Cấu trúc Files Mới

```
backend/
├── src/
│   ├── models/
│   │   ├── LearningRoadmap.js          # Model cho lộ trình học tập
│   │   └── CVMatchingScore.js          # Model cho matching score
│   ├── controllers/
│   │   └── advancedNLPController.js    # Controller xử lý NLP requests
│   ├── routes/
│   │   └── advancedNLP.js              # API routes cho NLP features
│   └── services/
│       └── aiService.js                # Service với NLP logic (đã cải tiến)
```

---

## 🎓 Learning Roadmap Feature

### Database Schema

**Model: `LearningRoadmap`**

```javascript
{
  candidateId: ObjectId,           // User ID của ứng viên
  targetJobId: ObjectId,           // Job mục tiêu (optional)
  targetRole: String,              // Vị trí mục tiêu (e.g., "Full Stack Developer")
  currentLevel: String,            // beginner, intermediate, advanced, expert
  
  skillGaps: [{                    // Các kỹ năng cần học
    skill: String,
    currentLevel: String,
    targetLevel: String,
    priority: String,              // critical, high, medium, low
    importance: Number             // 0-1
  }],
  
  phases: [{                       // Các giai đoạn học tập
    phaseNumber: Number,
    title: String,
    duration: String,
    objectives: [String],
    
    weeks: [{                      // Chi tiết từng tuần
      weekNumber: Number,
      focus: String,
      learningObjectives: [String],
      
      resources: [{                // 🎯 TÀI LIỆU HỌC TẬP CỤ THỂ
        type: String,              // course, video, article, book, documentation
        title: String,
        url: String,
        provider: String,          // Udemy, Coursera, YouTube, etc.
        duration: String,
        difficulty: String,
        isFree: Boolean,
        rating: Number,            // 0-5
        language: String,
        estimatedCost: Number,
        credibility: Number,       // 🔥 ĐỘ TIN CẬY 0-1
        certificateOffered: Boolean
      }],
      
      projects: [{                 // Dự án thực hành
        title: String,
        description: String,
        difficulty: String,
        estimatedTime: String,
        skills: [String]
      }],
      
      assessments: [{              // Bài kiểm tra
        type: String,
        description: String,
        passingCriteria: String
      }],
      
      timeCommitment: String       // e.g., "12-15 hours/week"
    }]
  }],
  
  milestones: [{                   // Cột mốc quan trọng
    weekNumber: Number,
    title: String,
    criteria: [String],
    isCompleted: Boolean
  }],
  
  progress: {                      // Tracking tiến độ
    currentPhase: Number,
    currentWeek: Number,
    completedWeeks: [Number],
    completedResources: [String],
    overallProgress: Number,       // 0-100%
    startedAt: Date,
    lastUpdatedAt: Date
  },
  
  feedback: {                      // Đánh giá của user
    rating: Number,
    comment: String,
    isHelpful: Boolean
  },
  
  status: String                   // active, paused, completed, abandoned
}
```

### API Endpoints

#### 1. Tạo Lộ trình học tập

```http
POST /api/nlp/learning-roadmap
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetJobId": "673abc123...",        // Optional
  "targetRole": "Full Stack Developer",  // Required if no targetJobId
  "timeframe": 12,                       // weeks (default: 12)
  "cvData": {                            // Optional, tự động lấy từ profile nếu không có
    "skills": [...],
    "experience": [...],
    "education": [...],
    "currentLevel": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Learning roadmap generated successfully",
  "data": {
    "_id": "roadmap_id",
    "targetRole": "Full Stack Developer",
    "totalDuration": "12 weeks",
    "estimatedTotalHours": 180,
    "difficulty": "intermediate",
    "skillGaps": [
      {
        "skill": "React",
        "currentLevel": "none",
        "targetLevel": "intermediate",
        "priority": "critical"
      }
    ],
    "phases": [
      {
        "phaseNumber": 1,
        "title": "Foundation Phase",
        "duration": "4 weeks",
        "weeks": [
          {
            "weekNumber": 1,
            "focus": "JavaScript ES6",
            "resources": [
              {
                "type": "course",
                "title": "JavaScript: The Complete Guide",
                "url": "https://...",
                "provider": "Udemy",
                "duration": "52 hours",
                "isFree": false,
                "rating": 4.6,
                "credibility": 0.9,
                "certificateOffered": true
              }
            ],
            "projects": [...],
            "timeCommitment": "12-15 hours/week"
          }
        ]
      }
    ],
    "progress": {
      "overallProgress": 0,
      "currentPhase": 1,
      "currentWeek": 1
    }
  }
}
```

#### 2. Lấy danh sách roadmaps của user

```http
GET /api/nlp/my-roadmaps?status=active
Authorization: Bearer <token>
```

#### 3. Cập nhật tiến độ học tập

```http
PUT /api/nlp/learning-roadmap/:roadmapId/progress
Authorization: Bearer <token>

{
  "weekNumber": 1,              // Đánh dấu hoàn thành tuần 1
  "resourceId": "resource123"   // Đánh dấu hoàn thành tài liệu
}
```

#### 4. Gửi feedback

```http
PUT /api/nlp/learning-roadmap/:roadmapId/feedback
Authorization: Bearer <token>

{
  "rating": 5,
  "comment": "Very helpful roadmap!",
  "isHelpful": true
}
```

#### 5. Lấy tài liệu đề xuất cho tuần hiện tại

```http
GET /api/nlp/roadmap/recommended-resources/:roadmapId?phase=1&week=1
Authorization: Bearer <token>
```

#### 6. Xem roadmaps phổ biến (Public)

```http
GET /api/nlp/popular-roadmaps?limit=10
```

---

## 📊 Matching Score Feature

### Database Schema

**Model: `CVMatchingScore`**

```javascript
{
  candidateId: ObjectId,
  jobId: ObjectId,
  applicationId: ObjectId,
  
  overallScore: Number,            // 🎯 ĐIỂM TỔNG (0-100)
  
  scoreBreakdown: {                // 🔍 CHI TIẾT ĐIỂM
    
    // 1. Skills (45% weight)
    skillsScore: {
      score: Number,
      weight: 0.45,
      details: {
        requiredSkillsMatched: Number,
        requiredSkillsTotal: Number,
        requiredSkillsMatchRate: Number,    // percentage
        
        niceToHaveSkillsMatched: Number,
        niceToHaveSkillsTotal: Number,
        
        matchedSkills: [{
          skill: String,
          required: Boolean,
          candidateLevel: String,
          requiredLevel: String,
          matchScore: Number
        }],
        
        missingSkills: [{                   // 🚨 KỸ NĂNG THIẾU
          skill: String,
          required: Boolean,
          importance: Number,
          learnability: String              // easy, moderate, hard
        }]
      }
    },
    
    // 2. Experience (20% weight)
    experienceScore: {
      score: Number,
      weight: 0.2,
      details: {
        candidateYearsOfExperience: Number,
        requiredYearsOfExperience: Number,
        experienceGap: Number,
        relevantExperience: [...]
      }
    },
    
    // 3. Education (10% weight)
    educationScore: {
      score: Number,
      weight: 0.1,
      details: {
        meetsRequirement: Boolean,
        relevantMajor: Boolean
      }
    },
    
    // 4. Keywords & Semantic (15% weight)
    keywordScore: {
      score: Number,
      weight: 0.15,
      details: {
        jaccardSimilarity: Number,
        cosineSimilarity: Number,
        commonKeywords: [String]
      }
    },
    
    // 5. Soft Skills (10% weight)
    softSkillsScore: {
      score: Number,
      weight: 0.1,
      details: {
        communication: Number,
        teamwork: Number,
        leadership: Number,
        detectedSoftSkills: [String]
      }
    }
  },
  
  // 🤖 AI Insights
  insights: {
    strengths: [String],                   // Điểm mạnh
    weaknesses: [String],                  // Điểm yếu
    recommendations: [String],             // Gợi ý cải thiện
    culturalFitScore: Number,
    potentialForGrowth: String            // low, medium, high, excellent
  },
  
  // 📈 Predictions
  predictions: {
    successProbability: Number,           // 0-1
    retentionScore: Number,               // Khả năng ở lại lâu dài
    performanceScore: Number,             // Dự đoán hiệu suất làm việc
    hiringRecommendation: String          // highly-recommended, recommended, consider, not-recommended
  },
  
  // 🏆 Ranking
  ranking: {
    positionInQueue: Number,              // Vị trí trong danh sách
    totalApplicants: Number,
    percentile: Number,                   // 0-100
    tier: String                          // top, high, medium, low
  },
  
  calculatedAt: Date,
  calculationMethod: String,              // nlp-advanced
  modelVersion: String
}
```

### API Endpoints

#### 1. Tính điểm matching

```http
POST /api/nlp/matching-score
Authorization: Bearer <token>

{
  "cvData": {
    "skills": [...],
    "experience": [...],
    "education": [...]
  },
  "jobId": "673abc123...",
  "candidateId": "user_id"              // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "scoreBreakdown": {
      "skillsScore": {
        "score": 90,
        "weight": 0.45,
        "details": {
          "requiredSkillsMatched": 8,
          "requiredSkillsTotal": 10,
          "requiredSkillsMatchRate": 80,
          "matchedSkills": [
            {
              "skill": "React",
              "required": true,
              "candidateLevel": "intermediate",
              "requiredLevel": "intermediate",
              "matchScore": 1
            }
          ],
          "missingSkills": [
            {
              "skill": "TypeScript",
              "required": true,
              "importance": 0.9,
              "learnability": "moderate"
            }
          ]
        }
      },
      "experienceScore": { ... },
      "educationScore": { ... },
      "keywordScore": { ... },
      "softSkillsScore": { ... }
    },
    "insights": {
      "strengths": [
        "Excellent technical skills match",
        "Strong relevant experience"
      ],
      "weaknesses": [
        "Missing TypeScript experience"
      ],
      "recommendations": [
        "Consider learning TypeScript",
        "Highlight React projects in your CV"
      ],
      "culturalFitScore": 0.85,
      "potentialForGrowth": "high"
    },
    "predictions": {
      "successProbability": 0.85,
      "hiringRecommendation": "highly-recommended"
    },
    "ranking": {
      "positionInQueue": 3,
      "totalApplicants": 50,
      "percentile": 94,
      "tier": "top"
    }
  }
}
```

#### 2. Lấy top candidates cho job (Employer)

```http
GET /api/nlp/top-candidates/:jobId?limit=20&minScore=70&tier=top
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "_id": "score_id",
        "candidateId": {
          "fullName": "Nguyen Van A",
          "email": "a@example.com"
        },
        "overallScore": 92,
        "ranking": {
          "positionInQueue": 1,
          "tier": "top",
          "percentile": 98
        },
        "predictions": {
          "hiringRecommendation": "highly-recommended"
        }
      }
    ],
    "statistics": {
      "totalCandidates": 50,
      "averageScore": 72,
      "topTierCount": 5,
      "highTierCount": 15
    }
  }
}
```

#### 3. Lấy jobs phù hợp nhất cho candidate

```http
GET /api/nlp/best-matches?limit=10&minScore=60
Authorization: Bearer <token>
```

#### 4. Xem chi tiết matching score

```http
GET /api/nlp/matching-score/:jobId/:candidateId
Authorization: Bearer <token>
```

#### 5. Tính lại điểm cho tất cả ứng viên (Employer)

```http
POST /api/nlp/recalculate-scores/:jobId
Authorization: Bearer <token>
```

---

## 🔧 Service Methods

### aiService.js - New Methods

#### 1. calculateAdvancedMatchScore()
```javascript
const result = await aiService.calculateAdvancedMatchScore(
  cvData,      // CV data object or text
  jobData,     // Job object
  {
    candidateId: 'user_id',
    jobId: 'job_id',
    saveToDatabase: true
  }
);
```

#### 2. generatePersonalizedRoadmap()
```javascript
const roadmap = await aiService.generatePersonalizedRoadmap({
  candidateId: 'user_id',
  targetJobId: 'job_id',
  targetRole: 'Full Stack Developer',
  cvData: {...},
  jobData: {...},
  timeframe: 12,
  saveToDatabase: true
});
```

---

## 🎨 Use Cases

### Use Case 1: Ứng viên tạo lộ trình học tập

1. Ứng viên chọn job mục tiêu
2. System phân tích skill gaps
3. AI tạo roadmap 12 tuần với:
   - Tài liệu học từ Udemy, Coursera, YouTube
   - Dự án thực hành
   - Bài kiểm tra
   - Milestones
4. Ứng viên track progress từng tuần
5. Submit feedback khi hoàn thành

### Use Case 2: Nhà tuyển dụng lọc CV

1. Nhà tuyển dụng post job
2. Ứng viên apply
3. System tự động tính matching score cho mỗi CV
4. Nhà tuyển dụng xem:
   - Top candidates (tier: top, high)
   - Chi tiết điểm từng phần
   - AI recommendations
5. Filter theo score, tier, skills
6. Review top 10-20 candidates nhanh chóng

### Use Case 3: Ứng viên tìm jobs phù hợp

1. Ứng viên upload CV
2. System tính matching score với tất cả jobs
3. Hiển thị jobs best match (score >= 70)
4. Xem skill gaps và recommendations
5. Tạo roadmap để improve skills
6. Apply vào jobs phù hợp

---

## 💡 Key Features & Benefits

### Lộ trình học tập (Learning Roadmap)

✅ **Tự động hóa hoàn toàn**
- Phân tích skill gaps tự động
- AI tạo lộ trình cá nhân hóa

✅ **Tài liệu có độ tin cậy cao**
- Credibility score 0-1
- Rating từ users
- Provider uy tín (Udemy, Coursera, MDN)

✅ **Tracking tiến độ chi tiết**
- Progress theo tuần
- Milestones tracking
- Completed resources

✅ **Đa dạng resource types**
- Online courses (có certificate)
- Videos (YouTube)
- Documentation
- Books
- Practice projects

### Matching Score System

✅ **Chính xác cao**
- 5 components scoring (skills 45%, exp 20%, edu 10%, keywords 15%, soft 10%)
- NLP algorithms (Jaccard, Cosine similarity)
- AI-powered insights

✅ **Chi tiết & minh bạch**
- Breakdown điểm từng phần
- Missing skills với learnability
- Strengths & weaknesses

✅ **Ranking thông minh**
- Auto ranking theo percentile
- Tier system (top, high, medium, low)
- Hiring recommendations

✅ **Predictions**
- Success probability
- Retention score
- Performance score

---

## 🚀 Setup & Configuration

### 1. Environment Variables

```env
# Gemini AI (for roadmap generation)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-pro

# MongoDB
MONGODB_URI=your_mongodb_uri
```

### 2. Install Dependencies

```bash
cd backend
npm install natural @google/generative-ai
```

### 3. Run Server

```bash
npm run dev
```

---

## 📊 Database Indexes

### LearningRoadmap Indexes
```javascript
{ candidateId: 1, status: 1 }
{ targetRole: 1, currentLevel: 1 }
{ 'skillGaps.skill': 1 }
{ createdAt: -1 }
```

### CVMatchingScore Indexes
```javascript
{ jobId: 1, overallScore: -1 }
{ candidateId: 1, overallScore: -1 }
{ jobId: 1, 'ranking.tier': 1, overallScore: -1 }
{ isStale: 1, calculatedAt: 1 }
```

---

## 🧪 Testing Examples

### Test Matching Score

```javascript
// Test data
const cvData = {
  skills: [
    { name: 'React', level: 'intermediate' },
    { name: 'Node.js', level: 'advanced' }
  ],
  experience: [
    {
      position: 'Frontend Developer',
      company: 'ABC Corp',
      startDate: '2021-01-01',
      endDate: '2023-12-31'
    }
  ],
  education: [
    {
      degree: 'bachelor',
      major: 'Computer Science'
    }
  ]
};

const jobData = {
  title: 'Senior Full Stack Developer',
  skills: [
    { name: 'React', required: true, level: 'advanced' },
    { name: 'Node.js', required: true, level: 'advanced' },
    { name: 'TypeScript', required: false, level: 'intermediate' }
  ],
  experience: { years: 3 },
  education: { level: 'bachelor' }
};

// Call API
const response = await fetch('/api/nlp/matching-score', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ cvData, jobId: 'job123' })
});

const result = await response.json();
console.log('Overall Score:', result.data.overallScore);
console.log('Recommendations:', result.data.insights.recommendations);
```

---

## 📈 Performance Considerations

### Caching Strategy
- Cache matching scores for 24 hours
- Mark as stale when job requirements change
- Background recalculation

### Optimization
- Parallel processing for bulk scoring
- Lazy loading resources in roadmap
- Efficient MongoDB queries with indexes

### Scalability
- Async processing for large candidate pools
- Queue system for AI roadmap generation
- Redis caching for frequently accessed scores

---

## 🔒 Security & Permissions

### Authorization Rules

**Candidates (intern, candidate):**
- ✅ Generate roadmaps
- ✅ View own roadmaps
- ✅ View own matching scores
- ✅ View best job matches
- ❌ View other candidates' data

**Employers:**
- ✅ View matching scores for own jobs
- ✅ Get top candidates
- ✅ Recalculate scores
- ❌ Access candidates' roadmaps

**Admins:**
- ✅ Full access

---

## 📝 Future Enhancements

1. **Real-time Resource API Integration**
   - Fetch live courses from Udemy, Coursera APIs
   - Auto-update pricing and availability
   - Sync ratings and reviews

2. **Advanced AI Models**
   - ML-based matching (beyond NLP)
   - Personality fit analysis
   - Interview success prediction

3. **Gamification**
   - Badges for milestone completion
   - Leaderboards
   - Achievement system

4. **Social Features**
   - Share roadmaps publicly
   - Collaborative learning
   - Mentor recommendations

5. **Analytics Dashboard**
   - Employer hiring analytics
   - Candidate progress insights
   - Market trends visualization

---

## 🐛 Troubleshooting

### Common Issues

**1. Roadmap generation fails**
- Check GEMINI_API_KEY is set
- Verify API quota
- Fallback to default roadmap works automatically

**2. Matching score calculation errors**
- Ensure cvData has required fields
- Check job skills array exists
- Validate data types

**3. Permission denied errors**
- Verify JWT token
- Check user role
- Ensure resource ownership

---

## 📞 Support

For questions or issues:
- Check logs in `backend/logs/`
- Review API responses for error messages
- Contact: [your-email@example.com]

---

## ✅ Summary

Hệ thống NLP nâng cao này cung cấp:

🎓 **Learning Roadmap:**
- Tự động tạo lộ trình học tập cá nhân hóa
- Tài liệu cụ thể với độ tin cậy cao
- Tracking progress chi tiết

📊 **Matching Score:**
- Tính điểm phù hợp chính xác 5-dimensional
- Lọc CV hiệu quả cho nhà tuyển dụng
- Gợi ý jobs phù hợp cho ứng viên

🚀 **Production Ready:**
- RESTful APIs
- MongoDB models với indexes
- Security & permissions
- Error handling
- Scalable architecture

**All endpoints are working and ready to use! 🎉**
