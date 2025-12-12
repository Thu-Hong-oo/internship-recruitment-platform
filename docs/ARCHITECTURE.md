# 🧠 LUỒNG HOẠT ĐỘNG CÁC TÍNH NĂNG THÔNG MINH - Backend Architecture

## 📋 Mục lục

1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Tính năng 1: CV Parsing & Skill Extraction](#1-cv-parsing--skill-extraction)
3. [Tính năng 2: Job-CV Matching Score](#2-job-cv-matching-score)
4. [Tính năng 3: Learning Roadmap Generation](#3-learning-roadmap-generation)
5. [Tính năng 4: Candidate Recommendation](#4-candidate-recommendation)
6. [Tính năng 5: RAG (Retrieval-Augmented Generation)](#5-rag-retrieval-augmented-generation)
7. [Cấu trúc thư mục](#cấu-trúc-thư-mục)

---

## Tổng quan hệ thống

### Tech Stack AI/NLP
- **LLM**: Google Gemini API (gemini-2.0-flash)
- **NLP**: Natural.js (TF-IDF, Word Tokenizer)
- **Vector DB**: ChromaDB (cho RAG system)
- **Embedding**: Google Gemini embedding-001
- **PDF Parsing**: pdf-parse
- **Cache**: Redis

### Luồng request chung

```
Client Request
    ↓
Express Route (src/routes/)
    ↓
Controller (src/controllers/)
    ↓
Service Layer (src/services/)
    ↓
AI/NLP Processing
    ↓
Database (MongoDB)
    ↓
Response to Client
```

---

## 1. CV Parsing & Skill Extraction

### 🎯 Mục đích
Parse CV (PDF/DOCX) → Extract thông tin (skills, experience, education, contact...)

### 📂 Files liên quan
```
src/routes/ai.js                           → POST /api/ai/parse-cv
src/controllers/aiController.js            → parseCV()
src/services/ai/aiService.js              → parseCV()
src/services/ai/cvParsingService.js       → extractTextFromCV()
src/services/ai/skillExtractionService.js → extractSkills()
src/services/ai/skillNormalizationService.js → normalizeSkills()
```

### 🔄 Luồng chi tiết

```mermaid
POST /api/ai/parse-cv (file upload)
    ↓
[Controller] aiController.parseCV()
    ↓
[Service] aiService.parseCV(fileBuffer, mimeType)
    ↓
    ├─→ [1] cvParsingService.extractTextFromCV()
    │       ├─ PDF → pdf-parse
    │       ├─ DOCX → mammoth
    │       └─ Plain text → direct
    │
    ├─→ [2] cvParsingService.cleanExtractedText()
    │       └─ Remove encoding issues, normalize text
    │
    ├─→ [3] Gemini API: parseCV() prompt
    │       ├─ Input: Cleaned text
    │       ├─ Prompt: "Parse CV and extract structured data"
    │       └─ Output: JSON {fullName, email, phone, skills, experience...}
    │
    ├─→ [4] skillExtractionService.extractSkills(text)
    │       ├─ Gemini API: Extract all technical skills
    │       └─ Rule-based fallback: Regex + keyword matching
    │
    ├─→ [5] skillNormalizationService.normalizeSkills(skills)
    │       ├─ "ReactJS" → "React"
    │       ├─ "nodejs" → "Node.js"
    │       └─ "python3" → "Python"
    │
    └─→ [6] Return parsed CV data
            {
              fullName, email, phone, address,
              skills: [{name, level, yearsOfExperience}],
              experience: [{title, company, duration}],
              education: [{degree, school, year}],
              projects: [{name, description, technologies}]
            }
```

### 💡 Điểm đặc biệt
- **Hybrid approach**: Gemini AI + Rule-based fallback
- **Vietnamese support**: Xử lý encoding đặc biệt (Đỗ, Ngô, Đặng...)
- **Skill normalization**: 150+ synonyms mapping
- **Multi-format**: PDF, DOCX, plain text

---

## 2. Job-CV Matching Score

### 🎯 Mục đích
Tính điểm matching giữa CV ứng viên và Job posting (0-100 scale)

### 📂 Files liên quan
```
src/routes/advancedNLP.js                  → POST /api/nlp/matching-score
src/controllers/advancedNLPController.js   → calculateMatchingScore()
src/services/ai/aiService.js              → calculateAdvancedMatchScore()
models/CVMatchingScore.js                  → Database schema
```

### 🔄 Luồng chi tiết

```mermaid
POST /api/nlp/matching-score
    {cvData, jobId, candidateId}
    ↓
[Controller] advancedNLPController.calculateMatchingScore()
    ↓
    ├─→ [1] Check Redis cache
    │       └─ If exists → Return cached result
    │
    ├─→ [2] Fetch Job data from MongoDB
    │       └─ Job.findById(jobId)
    │
    └─→ [3] aiService.calculateAdvancedMatchScore(cvData, job)
            │
            ├─→ [3.1] Skill Matching (40% weight)
            │       ├─ Extract CV skills
            │       ├─ Extract Job required skills
            │       ├─ Normalize both (ReactJS → React)
            │       ├─ Calculate overlap: matched/total
            │       └─ Score = (matched/required) * 100
            │
            ├─→ [3.2] Experience Matching (30% weight)
            │       ├─ Compare years of experience
            │       ├─ Match job titles/roles
            │       └─ Industry alignment
            │
            ├─→ [3.3] Education Matching (15% weight)
            │       ├─ Degree level comparison
            │       ├─ Field of study relevance
            │       └─ Institution reputation
            │
            ├─→ [3.4] Project/Portfolio Matching (15% weight)
            │       ├─ Project technologies overlap
            │       ├─ Project complexity
            │       └─ Relevance to job requirements
            │
            ├─→ [3.5] Gemini AI Final Analysis
            │       ├─ Input: CV data + Job requirements
            │       ├─ Prompt: "Analyze fit and provide detailed breakdown"
            │       └─ Output: {overallScore, breakdown, recommendations}
            │
            └─→ [3.6] Save to MongoDB + Redis cache
                    └─ CVMatchingScore.create({
                        jobId, candidateId,
                        overallScore,
                        skillMatchScore,
                        experienceScore,
                        educationScore,
                        matchedSkills: [],
                        missingSkills: [],
                        recommendations: ""
                      })
```

### 📊 Scoring Algorithm

```javascript
Overall Score = (
  Skill Match * 0.40 +
  Experience Match * 0.30 +
  Education Match * 0.15 +
  Project Match * 0.15
)

// Tier Classification
- Tier A: 85-100 (Excellent fit)
- Tier B: 70-84 (Good fit)
- Tier C: 50-69 (Moderate fit)
- Tier D: <50 (Poor fit)
```

### 💡 Điểm đặc biệt
- **Multi-dimensional**: 4 factors scoring
- **AI-enhanced**: Gemini provides qualitative analysis
- **Caching**: Redis cache 1 hour
- **Batch processing**: Có thể recalculate tất cả candidates cho 1 job

---

## 3. Learning Roadmap Generation

### 🎯 Mục đích
Tạo lộ trình học tập cá nhân hóa để bridge skill gap giữa candidate và job requirements

### 📂 Files liên quan
```
src/routes/advancedNLP.js                      → POST /api/nlp/learning-roadmap
                                               → POST /api/nlp/learning-roadmap-rag (RAG version)
src/controllers/advancedNLPController.js       → generateLearningRoadmap()
                                               → generateRagRoadmap()
src/services/ai/aiService.js                  → generateLearningRoadmap()
src/services/dataCrawlers/ragService.js       → generateRoadmap() [RAG version]
models/LearningRoadmap.js                      → Database schema
```

### 🔄 Luồng chi tiết (Legacy AI-only)

```mermaid
POST /api/nlp/learning-roadmap
    {candidateSkills, jobSkills, timeframe}
    ↓
[Controller] advancedNLPController.generateLearningRoadmap()
    ↓
    ├─→ [1] Skill Gap Analysis
    │       ├─ candidateSkills = ["JavaScript", "HTML"]
    │       ├─ jobSkills = ["React", "Node.js", "MongoDB"]
    │       └─ skillGaps = ["React", "Node.js", "MongoDB"]
    │
    ├─→ [2] aiService.generateLearningRoadmap(skillGaps, timeframe)
    │       │
    │       ├─→ [2.1] Gemini AI Prompt
    │       │       Input: {
    │       │         skillGaps: ["React", "Node.js", "MongoDB"],
    │       │         timeframe: 3 months,
    │       │         currentLevel: "beginner"
    │       │       }
    │       │       Prompt: "Create a personalized learning roadmap..."
    │       │
    │       └─→ [2.2] AI generates phases
    │               Phase 1 (Month 1): JavaScript Fundamentals
    │                 - Topics: ES6, Async/Await, DOM...
    │                 - Resources: [Generic descriptions]
    │                 - Milestones: Build TODO app
    │               Phase 2 (Month 2): React Basics...
    │               Phase 3 (Month 3): Backend with Node.js...
    │
    └─→ [3] Save to MongoDB
            LearningRoadmap.create({
              candidateId,
              targetJob: jobId,
              phases: [...],
              totalDuration: "12 weeks",
              difficulty: "intermediate"
            })
```

### 🔄 Luồng chi tiết (RAG version - Recommended)

```mermaid
POST /api/nlp/learning-roadmap-rag
    {candidateSkills, jobSkills, timeframe}
    ↓
[Controller] advancedNLPController.generateRagRoadmap()
    ↓
    ├─→ [1] Skill Gap Analysis (same as above)
    │
    ├─→ [2] ragService.generateRoadmap(skillGaps, options)
    │       │
    │       ├─→ [2.1] Detect Industry
    │       │       "React" → Technology
    │       │       "SEO Marketing" → Marketing
    │       │       "Figma" → Design
    │       │
    │       ├─→ [2.2] Multi-source Resource Retrieval
    │       │       For each skill gap:
    │       │       │
    │       │       ├─→ [A] Vector DB Search (ChromaDB)
    │       │       │       └─ Semantic search: "Learn React beginner tutorial"
    │       │       │
    │       │       ├─→ [B] YouTube API
    │       │       │       ├─ Search: "React tutorial beginner"
    │       │       │       ├─ Trusted channels: freeCodeCamp, Traversy Media...
    │       │       │       └─ Return: {title, url, views, duration, credibility}
    │       │       │
    │       │       ├─→ [C] GitHub API (for Technology)
    │       │       │       ├─ Search: "React project tutorial"
    │       │       │       ├─ Awesome lists: awesome-react
    │       │       │       └─ Return: {repo, stars, description, url}
    │       │       │
    │       │       └─→ [D] Coursera API (for Business/Design/Marketing)
    │       │               ├─ Search: "Digital Marketing course"
    │       │               ├─ Universities: Stanford, MIT, Harvard...
    │       │               └─ Return: {course, university, rating, certificate}
    │       │
    │       ├─→ [2.3] Credibility Scoring & Ranking
    │       │       For each resource:
    │       │       credibility = (
    │       │         sourceCredibility * 0.4 +    // YouTube/Coursera/GitHub reputation
    │       │         popularity * 0.25 +          // Views/Stars/Enrollments
    │       │         recency * 0.15 +             // Updated within 2 years
    │       │         rating * 0.1 +               // User ratings
    │       │         similarity * 0.1             // Match with skill query
    │       │       )
    │       │
    │       ├─→ [2.4] Phase Division
    │       │       Divide skills into phases based on:
    │       │       - Dependencies (React needs JavaScript)
    │       │       - Difficulty (beginner → intermediate → advanced)
    │       │       - Timeframe (3 months → 3 phases)
    │       │
    │       └─→ [2.5] Resource Assignment
    │               Phase 1: JavaScript Fundamentals
    │                 Resources: [
    │                   {
    │                     title: "JavaScript Full Course - 8 Hours",
    │                     source: "youtube",
    │                     url: "https://youtube.com/...",
    │                     credibility: 0.92,
    │                     type: "video",
    │                     duration: "8h"
    │                   },
    │                   {
    │                     title: "javascript-algorithms",
    │                     source: "github",
    │                     url: "https://github.com/...",
    │                     credibility: 0.88,
    │                     stars: 150000,
    │                     type: "project"
    │                   }
    │                 ]
    │
    └─→ [3] Save to MongoDB with verifiable resources
            LearningRoadmap.create({
              candidateId,
              targetJob: jobId,
              phases: [...],
              totalDuration: "12 weeks",
              difficulty: "intermediate",
              averageCredibility: 0.85,
              sourceBreakdown: {
                youtube: 10,
                github: 5,
                coursera: 3
              }
            })
```

### 📊 RAG vs AI-only Comparison

| Feature | AI-only | RAG (Recommended) |
|---------|---------|-------------------|
| Resource quality | ❌ Generic descriptions | ✅ Real URLs (YouTube, GitHub, Coursera) |
| Verifiability | ❌ Cannot verify | ✅ 100% verifiable |
| Industry support | ✅ Technology only | ✅ 14 industries (Marketing, Design, Accounting...) |
| Credibility score | ❌ No scoring | ✅ Multi-factor scoring (0.6-1.0) |
| Data sources | 1 (Gemini AI) | 3-4 (YouTube + GitHub + Coursera + Vector DB) |
| Cache | ❌ No | ✅ Vector DB caching |

### 💡 Điểm đặc biệt RAG
- **Multi-industry**: Tự động detect ngành và route đến data sources phù hợp
- **Credibility-first**: Chỉ lấy resources với credibility > 0.6
- **University courses**: Coursera from Stanford, MIT, Harvard...
- **Community validation**: YouTube views, GitHub stars
- **100% verifiable**: Tất cả resources đều có URL thật

---

## 4. Candidate Recommendation

### 🎯 Mục đích
Recommend top candidates cho employer dựa trên matching score

### 📂 Files liên quan
```
src/routes/advancedNLP.js                  → GET /api/nlp/top-candidates/:jobId
src/controllers/advancedNLPController.js   → getTopCandidates()
models/CVMatchingScore.js                  → Query và sort
```

### 🔄 Luồng chi tiết

```mermaid
GET /api/nlp/top-candidates/:jobId?limit=20&minScore=70&tier=A
    ↓
[Controller] advancedNLPController.getTopCandidates()
    ↓
    ├─→ [1] Verify job ownership
    │       └─ Job.findById(jobId) + check employer
    │
    ├─→ [2] Query matching scores
    │       CVMatchingScore.find({
    │         jobId,
    │         overallScore: {$gte: minScore},
    │         tier: tier || {$in: ['A', 'B', 'C']}
    │       })
    │       .sort({overallScore: -1})
    │       .limit(limit)
    │       .populate('candidateId')
    │
    └─→ [3] Return sorted list
            [
              {
                candidateId: {...},
                overallScore: 92,
                tier: "A",
                matchedSkills: ["React", "Node.js"],
                missingSkills: ["AWS"],
                recommendations: "Excellent fit..."
              },
              ...
            ]
```

### 💡 Điểm đặc biệt
- **Real-time**: Query from pre-calculated scores
- **Filtering**: By tier, minScore, skill requirements
- **Sorting**: By overallScore DESC
- **Pagination**: Limit + offset support

---

## 5. RAG (Retrieval-Augmented Generation)

### 🎯 Mục đích
Tăng cường độ tin cậy của learning resources bằng cách retrieve từ real data sources

### 📂 Files liên quan
```
src/services/dataCrawlers/ragService.js           → Main orchestrator
src/services/dataCrawlers/youtubeDataService.js   → YouTube API v3
src/services/dataCrawlers/githubDataService.js    → GitHub API v3
src/services/dataCrawlers/courseraDataService.js  → Coursera (mock)
src/services/vectorStore/vectorStoreService.js    → ChromaDB + Gemini embeddings
scripts/populateVectorDB.js                       → Populate script
```

### 🔄 Luồng chi tiết - Population

```mermaid
npm run rag:populate
    ↓
[Script] populateVectorDB.js
    ↓
    ├─→ [1] Initialize services
    │       ├─ ragService.initialize()
    │       ├─ vectorStoreService.initialize()
    │       ├─ youtubeDataService.initialize()
    │       ├─ githubDataService.initialize()
    │       └─ courseraDataService.initialize()
    │
    ├─→ [2] Loop through 66 essential skills
    │       For each skill in ESSENTIAL_SKILLS:
    │       │
    │       ├─→ [2.1] Detect industry
    │       │       "React" → Technology
    │       │       "SEO Marketing" → Marketing
    │       │       "Figma Design" → Design
    │       │
    │       ├─→ [2.2] Fetch resources from data sources
    │       │       [A] YouTube API
    │       │           ├─ Search general: "React tutorial"
    │       │           ├─ Search trusted channels
    │       │           └─ Calculate credibility from views/likes
    │       │       
    │       │       [B] GitHub API
    │       │           ├─ Search repositories: "React project"
    │       │           ├─ Get awesome lists: "awesome-react"
    │       │           └─ Calculate credibility from stars
    │       │       
    │       │       [C] Coursera API
    │       │           ├─ Search courses: "Digital Marketing"
    │       │           ├─ Filter universities: Stanford, MIT...
    │       │           └─ Calculate credibility from institution
    │       │
    │       ├─→ [2.3] Generate embeddings (Gemini)
    │       │       For each resource:
    │       │       embedding = await gemini.embedContent({
    │       │         model: "embedding-001",
    │       │         content: `${title} ${description}`
    │       │       })
    │       │
    │       ├─→ [2.4] Store in ChromaDB
    │       │       await chromaCollection.add({
    │       │         ids: [resourceId],
    │       │         embeddings: [embedding],
    │       │         metadatas: [{
    │       │           skill, source, url, credibility,
    │       │           title, description, type
    │       │         }]
    │       │       })
    │       │
    │       └─→ [2.5] Log progress
    │               ✅ [15/66] Digital Marketing
    │               📊 Found 5 from Coursera, 8 from YouTube
    │               💾 Stored 13 resources in vector DB
    │
    └─→ [3] Summary
            🎉 Population complete!
            Total skills: 66
            Total resources: 800+
            Average credibility: 0.82
```

### 🔄 Luồng chi tiết - Retrieval

```mermaid
ragService.getResources("React", {difficulty: "beginner"})
    ↓
    ├─→ [1] Detect industry
    │       "React" → Technology
    │       Data sources: [youtube, github, vector]
    │
    ├─→ [2] Vector search (if available)
    │       query = "Learn React beginner tutorial"
    │       embedding = await gemini.embedContent(query)
    │       results = await chromaCollection.query({
    │         queryEmbeddings: [embedding],
    │         nResults: 5,
    │         where: {
    │           skill: "React",
    │           credibility: {$gte: 0.6}
    │         }
    │       })
    │
    ├─→ [3] YouTube search
    │       ├─ General search
    │       └─ Trusted channels (freeCodeCamp, Traversy Media...)
    │
    ├─→ [4] GitHub search
    │       ├─ Repository search
    │       └─ Awesome lists
    │
    ├─→ [5] Merge & rank by credibility
    │       allResources = [...vector, ...youtube, ...github]
    │       ranked = sort by credibility score DESC
    │       filtered = credibility >= 0.6
    │
    └─→ [6] Return top resources
            [
              {source: "youtube", credibility: 0.92, url: "..."},
              {source: "github", credibility: 0.88, url: "..."},
              {source: "vector", credibility: 0.85, url: "..."}
            ]
```

### 📊 Industry-specific Data Sources

```javascript
const industryDataSources = {
  Technology: ['youtube', 'github', 'vector'],
  Marketing: ['coursera', 'youtube', 'vector'],
  Business: ['coursera', 'youtube', 'vector'],
  Design: ['coursera', 'youtube', 'vector'],
  Accounting: ['coursera', 'youtube', 'vector'],
  Healthcare: ['coursera', 'youtube', 'vector'],
  Education: ['coursera', 'youtube', 'vector'],
  Engineering: ['youtube', 'coursera', 'github', 'vector'],
  // ... 6 industries khác
};
```

### 💡 Điểm đặc biệt
- **Multi-industry**: 14 ngành nghề (không chỉ IT)
- **Smart routing**: Auto-detect industry và chọn data sources phù hợp
- **Fault tolerance**: Tiếp tục work nếu 1 service fail
- **Quota management**: YouTube 10k/day, GitHub 5k/hour, Gemini 1500/day
- **Credibility-first**: Chỉ return resources với score > 0.6

---

## Cấu trúc thư mục

### Core Structure
```
backend/
├── server.js                          # Entry point
├── .env                               # Environment variables
├── package.json                       # Dependencies
│
├── src/
│   ├── routes/                        # API routes
│   │   ├── ai.js                      # CV parsing
│   │   ├── advancedNLP.js            # Matching + Roadmap
│   │   ├── jobs.js                    # Job CRUD
│   │   ├── candidate/                 # Candidate routes
│   │   └── admin/                     # Admin routes
│   │
│   ├── controllers/                   # Request handlers
│   │   ├── aiController.js           # CV parsing controller
│   │   ├── advancedNLPController.js  # NLP features controller
│   │   └── jobController.js          # Job controller
│   │
│   ├── services/                      # Business logic
│   │   ├── ai/                        # AI services
│   │   │   ├── aiService.js          # Main AI service (8400+ lines)
│   │   │   ├── cvParsingService.js   # CV parsing
│   │   │   ├── skillExtractionService.js
│   │   │   └── skillNormalizationService.js
│   │   │
│   │   ├── dataCrawlers/              # RAG data sources
│   │   │   ├── ragService.js         # RAG orchestrator
│   │   │   ├── youtubeDataService.js # YouTube API
│   │   │   ├── githubDataService.js  # GitHub API
│   │   │   └── courseraDataService.js # Coursera (mock)
│   │   │
│   │   ├── vectorStore/               # Vector DB
│   │   │   └── vectorStoreService.js # ChromaDB + embeddings
│   │   │
│   │   └── cache/                     # Redis cache
│   │       └── cacheService.js
│   │
│   ├── models/                        # MongoDB schemas
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── CandidateProfile.js
│   │   ├── CVMatchingScore.js
│   │   └── LearningRoadmap.js
│   │
│   ├── middleware/                    # Express middleware
│   │   ├── auth.js                    # JWT authentication
│   │   ├── errorHandler.js           # Error handling
│   │   └── globalRateLimit.js        # Rate limiting
│   │
│   └── utils/                         # Utilities
│       └── logger.js                  # Winston logger
│
├── scripts/                           # CLI scripts
│   └── populateVectorDB.js           # Populate RAG vector DB
│
├── uploads/                           # File uploads (CV files)
└── logs/                              # Application logs
```

### Key Files Size
- `aiService.js`: 8465 lines (largest, contains all AI logic)
- `advancedNLPController.js`: 917 lines
- `ragService.js`: 593 lines
- `youtubeDataService.js`: 406 lines
- `cvParsingService.js`: 350 lines

---

## API Endpoints Summary

### CV Parsing
```
POST /api/ai/parse-cv
POST /api/ai/parse-cv-rule-based (fallback)
```

### Matching Score
```
POST /api/nlp/matching-score
GET  /api/nlp/matching-score/:jobId/:candidateId
GET  /api/nlp/top-candidates/:jobId
GET  /api/nlp/best-matches
POST /api/nlp/recalculate-scores/:jobId
```

### Learning Roadmap
```
POST /api/nlp/learning-roadmap          # AI-only (legacy)
POST /api/nlp/learning-roadmap-rag      # RAG version (recommended)
GET  /api/nlp/learning-roadmap/:roadmapId
GET  /api/nlp/my-roadmaps
PUT  /api/nlp/learning-roadmap/:roadmapId/progress
```

### RAG Health Check
```
GET /api/nlp/rag-health
```

---

## Environment Variables Quan trọng

```bash
# AI/LLM
GEMINI_API_KEY=AIzaSy...              # Google Gemini API (required)
GEMINI_MODEL=gemini-2.0-flash         # Model name (optional, default: gemini-2.0-flash)

# RAG Data Sources
YOUTUBE_API_KEY=AIzaSy...             # YouTube Data API v3
GITHUB_TOKEN=ghp_...                  # GitHub Personal Access Token
COURSERA_API_KEY=...                  # Coursera API (optional, uses mock)

# Vector Database
CHROMADB_URL=http://localhost:8000    # ChromaDB server

# Cache & Database
REDIS_URL=redis://...                 # Redis cache
MONGO_URI=mongodb+srv://...           # MongoDB Atlas

# Feature Flags
ENABLE_RAG=true                       # Enable RAG system
USE_LOCAL_LLM=false                   # Use Ollama (deprecated)
ALLOW_RULE_BASED_FALLBACK=true        # Fallback to rule-based parsing
```

---

## Performance & Optimization

### Caching Strategy
1. **Redis Cache**: Matching scores (TTL 1h)
2. **Vector DB Cache**: Learning resources (persistent)
3. **In-memory Cache**: Skill normalization mapping

### Rate Limiting
- Global: 100 req/15min per IP
- API: 60 req/15min per user
- Upload: 10 req/15min per user
- Search: 30 req/15min per user

### Database Indexing
```javascript
// CVMatchingScore indexes
{jobId: 1, candidateId: 1}  // Unique
{jobId: 1, overallScore: -1}  // Top candidates query
{tier: 1, overallScore: -1}   // Tier filtering

// LearningRoadmap indexes
{candidateId: 1}
{targetJob: 1}
{createdAt: -1}
```

---

## Deployment Notes

### Docker Setup
```yaml
# docker-compose.yml
services:
  backend:
    build: .
    ports: 
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - MONGODB_URI=${MONGODB_URI}
  
  chromadb:
    image: chromadb/chroma
    ports:
      - "8000:8000"
```

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure Redis in production mode
- [ ] Enable Helmet security headers
- [ ] Setup CloudWatch/Datadog logging
- [ ] Configure CORS properly
- [ ] Setup SSL/TLS
- [ ] Monitor API quotas (YouTube, Gemini, GitHub)

---

**Last Updated**: 2025-12-01  
**Version**: 2.0 (Multi-Industry RAG)
