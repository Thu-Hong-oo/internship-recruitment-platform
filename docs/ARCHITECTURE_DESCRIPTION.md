# Sơ Đồ Kiến Trúc Hệ Thống - Internship Recruitment Platform

## Tổng Quan Hệ Thống

Hệ thống **Internship Recruitment Platform** là một nền tảng tuyển dụng thực tập sinh được hỗ trợ bởi AI, được xây dựng theo kiến trúc **multi-tier** với 3 ứng dụng frontend riêng biệt và 1 backend API tập trung. Hệ thống sử dụng các công nghệ AI/NLP để phân tích CV, đánh giá mức độ phù hợp giữa ứng viên và công việc, và tạo lộ trình học tập cá nhân hóa.

---

## 1. Kiến Trúc Tổng Thể

### 1.1. Các Thành Phần Chính

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Frontend   │  │  Employer    │  │    Admin     │        │
│  │  (Candidates)│  │   Frontend   │  │   Frontend   │        │
│  │              │  │              │  │              │        │
│  │  Next.js 15  │  │  Next.js 14  │  │  React + Vite│        │
│  │  TypeScript  │  │  TypeScript  │  │  JavaScript  │        │
│  │  Port: 3001  │  │  Port: 3002  │  │  Port: 5173  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │
│         └─────────────────┴─────────────────┘                 │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ WebSocket (Socket.IO)
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
├───────────────────────────┼─────────────────────────────────────┤
│                           │                                     │
│              ┌────────────▼────────────┐                       │
│              │   Backend API Server    │                       │
│              │   Express.js + Node.js  │                       │
│              │   Port: 3000            │                       │
│              │                         │                       │
│              │  - Authentication       │                       │
│              │  - Rate Limiting       │                       │
│              │  - CORS & Security      │                       │
│              │  - Request Routing      │                       │
│              └────────────┬────────────┘                       │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│   BUSINESS     │  │   AI/NLP      │  │   DATA         │
│   LOGIC LAYER  │  │   SERVICES    │  │   LAYER       │
│                │  │               │  │               │
│  - Controllers │  │  - CV Parsing │  │  - MongoDB    │
│  - Services    │  │  - Matching   │  │  - Redis      │
│  - Validators  │  │  - Roadmap   │  │  - ChromaDB   │
│                │  │  - RAG        │  │  - Cloudinary │
└────────────────┘  └───────────────┘  └───────────────┘
```

---

## 2. Chi Tiết Các Thành Phần

### 2.1. Frontend Applications

#### 2.1.1. Frontend Candidate (fe/)

- **Công nghệ**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Port**: 3001
- **Mục đích**: Ứng dụng dành cho ứng viên (candidates)
- **Tính năng chính**:
  - Đăng ký/Đăng nhập (JWT + Google OAuth)
  - Quản lý hồ sơ cá nhân và CV
  - Tìm kiếm và lưu công việc
  - Phân tích CV bằng AI
  - Xem điểm matching với công việc
  - Tạo lộ trình học tập cá nhân hóa
  - Phân tích skill gap
  - Nhận thông báo real-time
  - Xuất CV (PDF)

#### 2.1.2. Frontend Employer (fe-employer/)

- **Công nghệ**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Port**: 3002
- **Mục đích**: Ứng dụng dành cho nhà tuyển dụng
- **Tính năng chính**:
  - Đăng ký/Đăng nhập công ty
  - Quản lý thông tin công ty
  - Đăng và quản lý tin tuyển dụng
  - Xem danh sách ứng viên ứng tuyển
  - Xem điểm matching của ứng viên
  - Quản lý ứng viên (duyệt/từ chối)
  - Analytics và thống kê
  - Nhận thông báo real-time

#### 2.1.3. Admin Frontend (admin/)

- **Công nghệ**: React 19, Vite, JavaScript, Ant Design, Tailwind CSS
- **Port**: 5173
- **Mục đích**: Ứng dụng quản trị hệ thống
- **Tính năng chính**:
  - Quản lý người dùng (candidates, employers)
  - Quản lý công ty
  - Quản lý kỹ năng (skills) và ngành nghề (industries)
  - Quản lý tin tuyển dụng
  - Quản lý media và templates
  - Dashboard và báo cáo
  - Xác thực công ty

### 2.2. Backend API Server

#### 2.2.1. Kiến Trúc Backend

```
Backend/
├── server.js                    # Entry point
├── src/
│   ├── routes/                  # API endpoints
│   │   ├── auth.js             # Authentication
│   │   ├── users.js            # User management
│   │   ├── jobs.js             # Job CRUD
│   │   ├── candidates.js       # Candidate profiles
│   │   ├── applications.js     # Job applications
│   │   ├── ai.js               # CV parsing
│   │   ├── advancedNLP.js      # Matching & Roadmap
│   │   ├── notifications.js     # Notifications
│   │   ├── skills.js           # Skills management
│   │   └── industries.js       # Industries management
│   │
│   ├── controllers/            # Request handlers
│   │   ├── aiController.js
│   │   ├── advancedNLPController.js
│   │   ├── jobController.js
│   │   └── ...
│   │
│   ├── services/               # Business logic
│   │   ├── ai/                 # AI services
│   │   │   ├── aiService.js
│   │   │   ├── cvParsingService.js
│   │   │   ├── skillExtractionService.js
│   │   │   └── skillNormalizationService.js
│   │   │
│   │   ├── dataCrawlers/       # RAG data sources
│   │   │   ├── ragService.js
│   │   │   ├── youtubeDataService.js
│   │   │   ├── githubDataService.js
│   │   │   └── courseraDataService.js
│   │   │
│   │   ├── vectorStore/        # Vector database
│   │   │   └── vectorStoreService.js
│   │   │
│   │   └── cache/              # Redis cache
│   │       └── cacheService.js
│   │
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── CandidateProfile.js
│   │   ├── CVMatchingScore.js
│   │   └── LearningRoadmap.js
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── globalRateLimit.js
│   │
│   └── socket.js                # Socket.IO setup
│
└── python/                      # Python AI models
    ├── phobert_inference.py
    └── sentence_bert_inference.py
```

#### 2.2.2. Luồng Xử Lý Request

```
Client Request
    ↓
Express Middleware (CORS, Helmet, Rate Limiting)
    ↓
Route Handler (src/routes/)
    ↓
Controller (src/controllers/)
    ↓
Service Layer (src/services/)
    ├── Business Logic
    ├── AI/NLP Processing
    └── External API Calls
    ↓
Database Layer
    ├── MongoDB (Primary)
    ├── Redis (Cache)
    └── ChromaDB (Vector Store)
    ↓
Response to Client
```

---

## 3. Công Nghệ và Dependencies

### 3.1. Frontend Stack

**Frontend Candidate (fe/)**:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI components
- React Hook Form + Zod validation
- Socket.IO Client (real-time notifications)
- jsPDF + html2canvas (CV export)

**Frontend Employer (fe-employer/)**:

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS 4
- Radix UI components
- React Hook Form + Zod validation

**Admin Frontend (admin/)**:

- React 19
- Vite
- Ant Design 5
- Tailwind CSS 3
- React Router DOM 7
- SunEditor (rich text editor)

### 3.2. Backend Stack

**Core Framework**:

- Node.js
- Express.js 4
- Socket.IO 4 (real-time communication)

**Database**:

- MongoDB (Mongoose ODM) - Primary database
- Redis - Caching layer
- ChromaDB - Vector database for RAG

**AI/NLP**:

- Google Gemini API (gemini-2.0-flash) - LLM
- Gemini Embeddings (embedding-001) - Vector embeddings
- Natural.js - NLP utilities (TF-IDF, tokenization)
- Python subprocess - PhoBERT NER model integration

**External APIs**:

- YouTube Data API v3 - Learning resources
- GitHub API v3 - Code repositories
- Coursera API (mock) - Course resources

**File Storage**:

- Cloudinary - Image and file uploads
- Local storage - CV uploads

**Security & Performance**:

- Helmet - Security headers
- Compression - Response compression
- Express Rate Limit - Rate limiting
- JWT - Authentication
- bcrypt - Password hashing

**Other**:

- Swagger/OpenAPI - API documentation
- Winston - Logging
- Node-cron - Scheduled tasks
- pdf-parse - PDF parsing
- mammoth - DOCX parsing

### 3.3. Infrastructure

**Deployment**:

- Firebase Hosting (3 sites: internbridge, internbridge-employer, internbridge-admin)
- Docker & Docker Compose (development)
- Environment-based configuration

**Development Tools**:

- ESLint - Code linting
- Prettier - Code formatting
- Nodemon - Auto-reload (development)

---

## 4. Kiến Trúc Database

### 4.1. MongoDB Collections

**Core Collections**:

- `users` - Thông tin người dùng (candidates, employers)
- `candidates` - Hồ sơ ứng viên
- `employers` - Hồ sơ nhà tuyển dụng
- `companies` - Thông tin công ty
- `job_postings` - Tin tuyển dụng
- `job_applications` - Đơn ứng tuyển
- `cvs` - CV của ứng viên
- `notifications` - Thông báo

**Reference Collections**:

- `skills` - Kỹ năng
- `industries` - Ngành nghề
- `skill_categories` - Danh mục kỹ năng

**AI/ML Collections**:

- `cv_matching_scores` - Điểm matching CV-Job
- `learning_roadmaps` - Lộ trình học tập
- `skill_graph_analyses` - Phân tích skill gap

### 4.2. Relationships

**One-to-One**:

- User → Candidate (1:1)
- User → Employer (1:1)
- Job Application → Match Result (1:1)

**One-to-Many**:

- User → Notifications (1:N)
- Candidate → CVs (1:N)
- Candidate → Job Applications (1:N)
- Company → Job Postings (1:N)
- Job → Applications (1:N)

**Many-to-Many**:

- Candidates ↔ Skills (N:M)
- Jobs ↔ Skills (N:M)
- Companies ↔ Industries (N:M)

### 4.3. Caching Strategy

**Redis Cache**:

- Matching scores (TTL: 1 hour)
- User sessions
- OTP codes
- Rate limiting counters

**Vector DB (ChromaDB)**:

- Learning resources embeddings
- Skill-related content
- Persistent storage for RAG system

---

## 5. Tính Năng AI/NLP

### 5.1. CV Parsing & Skill Extraction

**Luồng xử lý**:

1. Upload CV (PDF/DOCX/Text)
2. Extract text từ file
3. Clean và normalize text
4. Gemini AI parse CV → Structured JSON
5. Extract skills (Gemini + Rule-based fallback)
6. Normalize skills (150+ synonyms mapping)
7. Return parsed data

**Output**:

```json
{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "skills": [
    {"name": "React", "level": "intermediate", "yearsOfExperience": 2}
  ],
  "experience": [...],
  "education": [...],
  "projects": [...]
}
```

### 5.2. Job-CV Matching Score

**Thuật toán tính điểm**:

- Skill Matching: 40% weight
- Experience Matching: 30% weight
- Education Matching: 15% weight
- Project/Portfolio Matching: 15% weight

**Tier Classification**:

- Tier A: 85-100 (Excellent fit)
- Tier B: 70-84 (Good fit)
- Tier C: 50-69 (Moderate fit)
- Tier D: <50 (Poor fit)

**Caching**: Redis cache 1 hour

### 5.3. Learning Roadmap Generation (RAG)

**RAG System**:

1. **Skill Gap Analysis**: So sánh skills của candidate với job requirements
2. **Industry Detection**: Tự động phát hiện ngành nghề
3. **Multi-source Resource Retrieval**:
   - Vector DB Search (ChromaDB) - Semantic search
   - YouTube API - Video tutorials
   - GitHub API - Code repositories
   - Coursera API - University courses
4. **Credibility Scoring**: Đánh giá độ tin cậy của resources
5. **Phase Division**: Chia thành các giai đoạn học tập
6. **Resource Assignment**: Gán resources vào từng phase

**Credibility Formula**:

```
credibility = (
  sourceCredibility * 0.4 +
  popularity * 0.25 +
  recency * 0.15 +
  rating * 0.1 +
  similarity * 0.1
)
```

**Industry Support**: 14 ngành nghề (Technology, Marketing, Business, Design, Accounting, Healthcare, Education, Engineering, v.v.)

### 5.4. Candidate Recommendation

**Luồng**:

1. Query matching scores từ database
2. Filter theo tier, minScore, skills
3. Sort theo overallScore DESC
4. Return top candidates

---

## 6. Real-time Communication

### 6.1. Socket.IO

**Events**:

- `join-job` - Join job room
- `application-status-update` - Update application status
- `interview-scheduled` - Schedule interview
- `send-message` - Chat messaging
- `job-updated` - Job updates
- `user-online/offline` - User presence

**Rooms**:

- `user:{userId}` - Personal room
- `role:{role}` - Role-based room
- `job:{jobId}` - Job room
- `application:{applicationId}` - Application room
- `chat:{chatId}` - Chat room

**Authentication**: JWT token validation

---

## 7. Security & Performance

### 7.1. Security

- **Helmet**: Security headers (CSP, XSS protection)
- **CORS**: Configured for specific origins
- **Rate Limiting**:
  - Global: 100 req/15min per IP
  - API: 60 req/15min per user
  - Upload: 10 req/15min per user
  - Search: 30 req/15min per user
- **JWT Authentication**: Token-based auth
- **Password Hashing**: bcrypt
- **Input Validation**: Joi + Express Validator

### 7.2. Performance

- **Compression**: Gzip compression
- **Caching**: Redis + ChromaDB
- **Database Indexing**: Optimized indexes
- **Lazy Loading**: Frontend code splitting
- **CDN**: Firebase Hosting CDN

---

## 8. Deployment Architecture

### 8.1. Firebase Hosting

**3 Sites**:

1. `internbridge` - Frontend Candidate (fe/out)
2. `internbridge-employer` - Frontend Employer (fe-employer/out)
3. `internbridge-admin` - Admin Frontend (admin/dist)

**Configuration**: `firebase.json` với routing rules

### 8.2. Backend Deployment

**Options**:

- Docker container
- Cloud platform (Heroku, Railway, AWS, etc.)
- Environment variables configuration

**Services Required**:

- MongoDB Atlas (or self-hosted)
- Redis (optional, graceful fallback)
- ChromaDB (vector database)
- Cloudinary (file storage)

---

## 9. API Endpoints Summary

### 9.1. Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/refresh` - Refresh token

### 9.2. CV & AI

- `POST /api/ai/parse-cv` - Parse CV
- `POST /api/nlp/matching-score` - Tính điểm matching
- `GET /api/nlp/top-candidates/:jobId` - Top candidates
- `POST /api/nlp/learning-roadmap-rag` - Tạo roadmap (RAG)

### 9.3. Jobs

- `GET /api/jobs` - Danh sách jobs
- `POST /api/jobs` - Tạo job
- `GET /api/jobs/:id` - Chi tiết job
- `PUT /api/jobs/:id` - Cập nhật job

### 9.4. Applications

- `POST /api/applications` - Nộp đơn
- `GET /api/applications` - Danh sách applications
- `PUT /api/applications/:id/status` - Cập nhật status

### 9.5. Notifications

- `GET /api/notifications` - Danh sách notifications
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc

---

## 10. Data Flow Examples

### 10.1. CV Upload & Analysis Flow

```
1. User uploads CV (Frontend)
   ↓
2. POST /api/ai/parse-cv (Backend)
   ↓
3. Extract text from PDF/DOCX
   ↓
4. Gemini AI parses CV
   ↓
5. Extract & normalize skills
   ↓
6. Save to MongoDB (candidates collection)
   ↓
7. Return parsed data to Frontend
   ↓
8. Display in UI
```

### 10.2. Job Application Flow

```
1. Candidate applies to job (Frontend)
   ↓
2. POST /api/applications (Backend)
   ↓
3. Calculate matching score
   ├── Fetch CV data
   ├── Fetch Job requirements
   ├── Calculate score (AI service)
   └── Save to cv_matching_scores
   ↓
4. Create application record
   ↓
5. Emit Socket.IO event (notify employer)
   ↓
6. Return application data
```

### 10.3. Learning Roadmap Generation Flow

```
1. User requests roadmap (Frontend)
   ↓
2. POST /api/nlp/learning-roadmap-rag
   ↓
3. Skill gap analysis
   ↓
4. RAG Service:
   ├── Detect industry
   ├── Search Vector DB
   ├── Fetch YouTube resources
   ├── Fetch GitHub resources
   ├── Fetch Coursera resources
   └── Calculate credibility scores
   ↓
5. Generate phases & assign resources
   ↓
6. Save to MongoDB (learning_roadmaps)
   ↓
7. Return roadmap to Frontend
```

---

## 11. Environment Variables

### 11.1. Backend (.env)

```bash
# Database
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...

# AI/LLM
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.0-flash

# RAG Data Sources
YOUTUBE_API_KEY=AIzaSy...
GITHUB_TOKEN=ghp_...

# Vector Database
CHROMADB_URL=http://localhost:8000

# Security
JWT_SECRET=...
JWT_EXPIRE=7d

# File Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Frontend URLs
FRONTEND_URL=https://internbridge.web.app
EMPLOYER_APP_URL=https://internbridge-employer.web.app
ADMIN_APP_URL=https://internbridge-admin.web.app
```

### 11.2. Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url
```

---

## 12. Monitoring & Logging

### 12.1. Logging

- **Winston**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Log Files**: `logs/error.log`, `logs/combined.log`

### 12.2. Health Checks

- `GET /health` - System health check
- Returns: database status, Redis status, uptime

### 12.3. API Documentation

- Swagger UI: `/api-docs`
- OpenAPI 3.0 specification

---

## 13. Scalability Considerations

### 13.1. Horizontal Scaling

- **Stateless Backend**: Có thể scale multiple instances
- **Load Balancer**: Cần thiết cho multiple instances
- **Session Storage**: Redis (shared session)

### 13.2. Database Scaling

- **MongoDB**: Sharding cho large datasets
- **Redis**: Cluster mode
- **ChromaDB**: Multiple instances với load balancing

### 13.3. Caching Strategy

- **CDN**: Static assets (Firebase Hosting)
- **Redis**: API response caching
- **Browser Cache**: Static resources với Cache-Control headers

---

## 14. Kết Luận

Hệ thống **Internship Recruitment Platform** được xây dựng với kiến trúc **microservices-oriented**, tách biệt rõ ràng giữa frontend và backend. Hệ thống sử dụng các công nghệ AI/NLP tiên tiến để cung cấp trải nghiệm tuyển dụng thông minh và cá nhân hóa cho cả ứng viên và nhà tuyển dụng.

**Điểm mạnh**:

- ✅ Kiến trúc modular, dễ maintain
- ✅ AI/NLP tích hợp sâu
- ✅ Real-time communication
- ✅ Scalable và performant
- ✅ Security best practices
- ✅ Multi-industry support

**Công nghệ chính**:

- Frontend: Next.js, React, TypeScript
- Backend: Node.js, Express.js
- Database: MongoDB, Redis, ChromaDB
- AI: Google Gemini, RAG system
- Real-time: Socket.IO
- Deployment: Firebase Hosting

---

**Tài liệu này được tạo tự động dựa trên phân tích codebase.**
**Cập nhật lần cuối**: 2025-01-XX
