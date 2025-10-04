# Tài Liệu Chi Tiết Các Model - Hệ Thống Tuyển Dụng Thực Tập

## Tổng Quan

Hệ thống sử dụng MongoDB với Mongoose ODM, bao gồm 16 model chính được thiết kế để hỗ trợ nền tảng tuyển dụng thực tập sinh với các tính năng AI và phân tích nâng cao.

## 1. User Model

### Mục đích

Quản lý thông tin người dùng cơ bản, xác thực và phân quyền trong hệ thống.

### Cấu trúc chính

- **Thông tin cơ bản**: email, password, fullName, avatar
- **Xác thực**: authMethod (local/google/hybrid), googleId, googleProfile
- **Phân quyền**: role (candidate/employer/admin)
- **Profile references**: candidateProfile, employerProfile
- **Preferences**: privacySettings, notifications, language, timezone
- **Trạng thái**: isEmailVerified, status, isActive

### Tính năng đặc biệt

- Hỗ trợ đăng nhập đa phương thức (local + Google)
- Quản lý trạng thái tài khoản chi tiết
- Virtual field `displayFullName` tự động lấy tên từ profile tương ứng
- Mã hóa mật khẩu tự động với bcrypt

### Indexes

- Text search trên fullName và email
- Unique constraint trên email và googleId

---

## 2. EmployerProfile Model

### Mục đích

Quản lý hồ sơ nhà tuyển dụng với thông tin công ty, xác minh và quản lý team.

### Cấu trúc chính

- **Thông tin công ty**: CompanyInfoSchema (tên, ngành, quy mô, địa chỉ)
- **Thông tin pháp lý**: BusinessInfoSchema (mã số thuế, giấy phép)
- **Đại diện pháp luật**: thông tin cá nhân và giấy tờ tùy thân
- **Thông tin liên hệ**: người liên hệ chính
- **Quản lý team**: members array với roles và permissions chi tiết
- **Xác minh**: VerificationSchema với các bước xác minh
- **AI & Analytics**: companyEmbedding, industryAnalysis, cultureProfile
- **Reputation**: rating system, review count
- **Subscription**: quản lý gói dịch vụ

### Tính năng đặc biệt

- Hệ thống phân quyền chi tiết cho team members
- AI analysis cho văn hóa công ty và xu hướng tuyển dụng
- Quản lý subscription với giới hạn features
- Auto-expire pending invitations (7 ngày)

### Methods quan trọng

- `addMember()`, `removeMember()`, `userCan()`
- `canPostNewJob()`, `updateStats()`, `incrementView()`

---

## 3. CandidateProfile Model

### Mục đích

Quản lý hồ sơ ứng viên với thông tin cá nhân, kỹ năng, kinh nghiệm và preferences.

### Cấu trúc chính

- **Thông tin cá nhân**: personalInfo (tên, ngày sinh, giới tính, địa chỉ)
- **Học vấn**: university, major, degree, certifications
- **Kỹ năng**: technical skills, soft skills, languages với levels
- **Kinh nghiệm**: internships, projects với chi tiết
- **Preferences**: locations, internship types, industries, salary
- **Resume**: quản lý CV với AI analysis
- **Progress tracking**: profile completion, skill verification
- **Analytics**: view count, application stats, skill growth

### Tính năng đặc biệt

- AI analysis cho resume với skills extraction
- Progress tracking cho profile completion
- Virtual fields: `skillsCount`, `isProfileComplete`, `topSkills`, `experienceYears`
- Skill verification system

### Methods quan trọng

- `updateProfileCompletion()`, `updateSkillVerification()`, `incrementViews()`

---

## 4. Job Model

### Mục đích

Quản lý thông tin việc làm với AI-powered features và matching system.

### Cấu trúc chính

- **Thông tin cơ bản**: title, description, requirements, benefits
- **Phân loại**: category, industry, level, jobType, workingMode
- **Địa điểm & lương**: address, location, salaryMin/Max, currency
- **Thời gian**: deadline, positions, experience, education
- **Trạng thái**: status, views, stats (applications, interviews, offers)
- **AI Features**: keywords, embedding, extractedSkills, jobCategory
- **Matching System**: matchingPool, suggestedCandidates
- **Soft Delete**: deletedAt, deletedBy

### Tính năng đặc biệt

- AI-powered skill extraction với importance levels
- Job category classification
- Candidate matching pool với scores
- Text search trên multiple fields
- Virtual fields: `isExpired`, `isUrgent`, `applicationRate`, `isHot`

### Indexes

- Text search trên title, description, tags, skills, industry
- Vector search cho AI matching
- Performance indexes cho queries phổ biến

---

## 5. Application Model

### Mục đích

Quản lý đơn ứng tuyển với AI analysis và workflow management.

### Cấu trúc chính

- **Thông tin cơ bản**: candidateId, jobId, status, coverLetter
- **Attachments**: resume, additional files
- **Matching Score**: overall, skills, experience, education
- **Interview Management**: scheduled interviews với feedback
- **Timeline**: tracking status changes
- **AI Analysis**: resumeScore, matchAnalysis, predictedSuccess

### Tính năng đặc biệt

- AI analysis cho resume quality và job matching
- Predicted success probability
- Interview scheduling và feedback system
- Timeline tracking cho audit trail

### Methods quan trọng

- `updateStatus()`, `scheduleInterview()`, `addFeedback()`

---

## 6. Skill Model

### Mục đích

Quản lý danh sách kỹ năng với AI embeddings và market data.

### Cấu trúc chính

- **Thông tin cơ bản**: name, category, aliases, description
- **AI**: embedding vector cho semantic search
- **Metadata**: popularity, isActive
- **Market Data**: demandLevel, trend

### Tính năng đặc biệt

- AI embeddings cho semantic search
- Market demand tracking
- Popularity calculation dựa trên job postings
- Virtual fields: `userCount`, `jobCount`

---

## 7. SkillCategory Model

### Mục đích

Quản lý danh mục kỹ năng với cấu trúc phân cấp và metadata.

### Cấu trúc chính

- **Thông tin cơ bản**: name, slug, description, icon, color
- **Phân cấp**: parentCategory cho hierarchical structure
- **Metadata**: skillCount, learningPath, difficulty, relevance
- **UI**: sortOrder, isActive

### Tính năng đặc biệt

- Hierarchical category structure
- Learning path recommendations
- Market relevance tracking
- Auto-generated slugs

### Methods quan trọng

- `updateSkillCount()`, `getAllSubcategories()`, `getCategoryTree()`

---

## 8. SkillRoadmap Model

### Mục đích

Quản lý lộ trình học tập cá nhân cho từng ứng viên.

### Cấu trúc chính

- **Target**: targetJob với required skills
- **Analysis**: current skills vs required skills, skill gaps
- **Roadmap**: milestones với skills, resources, exercises
- **Progress**: overall progress, skill progress, completed milestones
- **Mentorship**: mentor feedback system
- **Status**: planning, active, completed, paused

### Tính năng đặc biệt

- AI-powered skill gap analysis
- Personalized learning path
- Progress tracking với milestones
- Mentor feedback integration

---

## 9. Notification Model

### Mục đích

Quản lý hệ thống thông báo đa kênh với delivery tracking.

### Cấu trúc chính

- **Thông tin cơ bản**: recipient, sender, type, title, message
- **Data**: jobId, applicationId, interviewTime, url
- **Status**: isRead, isSent, priority, channel
- **Delivery**: sentAt, deliveredAt, readAt, archivedAt
- **Advanced**: actionRequired, dedupeKey, templateKey, error handling

### Tính năng đặc biệt

- Multi-channel delivery (in-app, email, push)
- Deduplication với dedupeKey
- Error handling và retry mechanism
- Template-based notifications

---

## 10. AIAnalysis Model

### Mục đích

Lưu trữ kết quả phân tích AI cho CV, job descriptions và skill assessments.

### Cấu trúc chính

- **Source**: sourceType (cv/job/skill_assessment), sourceId
- **Content**: originalText, processedText, language
- **NLP Results**: entities, skills, keywords, categories, summary
- **Matching Analysis**: overallScore, skillMatch, recommendations
- **Metadata**: processingTime, modelVersion, timestamp

### Tính năng đặc biệt

- Multi-source analysis support
- Detailed NLP results với confidence scores
- Matching analysis với recommendations
- Performance tracking

---

## 11. CandidateRecommendation Model

### Mục đích

Lưu trữ AI recommendations cho nhà tuyển dụng về ứng viên phù hợp.

### Cấu trúc chính

- **Job Reference**: jobId
- **Recommendations**: candidateId, score, rank, matchDetails
- **Analysis**: technicalFit, experienceFit, educationFit, culturalFit
- **Insights**: strengths, concerns, interviewQuestions
- **Lifecycle**: generatedAt, expiresAt, isStale

### Tính năng đặc biệt

- TTL index tự động xóa sau 24h
- Detailed match analysis
- Interview question suggestions
- Stale detection

---

## 12. JobRecommendation Model

### Mục đích

Lưu trữ AI recommendations cho ứng viên về việc làm phù hợp.

### Cấu trúc chính

- **Candidate Reference**: candidateId
- **Recommendations**: jobId, score, reason, matchDetails
- **Analysis**: skillsMatch, experienceMatch, educationMatch, locationMatch
- **Insights**: whyGoodFit, concerns
- **Filters**: skills, locations, industries, salaryRange

### Tính năng đặc biệt

- Personalized job matching
- Filter-based recommendations
- TTL management
- Detailed match reasoning

---

## 13. CareerPath Model

### Mục đích

Định nghĩa các lộ trình nghề nghiệp với levels và milestones.

### Cấu trúc chính

- **Thông tin cơ bản**: name, slug, description
- **Target**: targetRoles, industries
- **Levels**: required skills, estimated duration, milestones
- **Resources**: learning resources với metadata
- **Success Stories**: testimonials từ candidates
- **Popularity**: tracking và ranking

### Tính năng đặc biệt

- Structured career progression
- Learning resource recommendations
- Success story integration
- Auto-generated slugs

---

## 14. Chatbot Model

### Mục đích

Quản lý conversations với AI chatbot cho career guidance.

### Cấu trúc chính

- **Session**: userId, sessionId, context
- **Type**: cv_review, job_search, career_guidance, skill_development
- **Conversation**: role, content, timestamp, intent, entities
- **NLP Analysis**: keywords, sentiment, topics
- **Recommendations**: type, content, confidence, metadata
- **Feedback**: helpful, rating, comments

### Tính năng đặc biệt

- Context-aware conversations
- Intent recognition và entity extraction
- Sentiment analysis
- Recommendation system

---

## 15. ResumeBuilder Model

### Mục đích

Quản lý việc tạo và tùy chỉnh CV với AI assistance.

### Cấu trúc chính

- **Content**: personalInfo, summary, experience, education, skills, projects
- **Customization**: targetJobId, targetRole, keywords
- **AI Generated**: summary, experienceBullets, suggestions
- **Version Control**: versions array với timestamps
- **Exports**: multiple formats (PDF, DOCX, HTML)
- **Status**: draft, completed, archived

### Tính năng đặc biệt

- AI-powered content generation
- Job-specific customization
- Version control system
- Multi-format export
- Completion percentage tracking

---

## 16. SkillLearningPath Model

### Mục đích

Định nghĩa lộ trình học tập chi tiết cho từng kỹ năng.

### Cấu trúc chính

- **Skill Reference**: skillId (unique)
- **Levels**: beginner, intermediate, advanced với criteria
- **Prerequisites**: required skills với levels
- **Resources**: videos, articles, exercises, projects
- **Milestones**: structured learning goals
- **Career Paths**: related career paths với relevance
- **Related Skills**: prerequisite, complementary, alternative
- **Market Data**: job demand, salary impact
- **Learning Stats**: completion time, success rate, difficulty

### Tính năng đặc biệt

- Comprehensive learning structure
- Market-driven content
- Career path integration
- Performance analytics
- Resource recommendations

---

## Mối Quan Hệ Giữa Các Model

### Core Relationships

1. **User** ↔ **EmployerProfile** (1:1)
2. **User** ↔ **CandidateProfile** (1:1)
3. **EmployerProfile** → **Job** (1:many)
4. **CandidateProfile** → **Application** (1:many)
5. **Job** → **Application** (1:many)

### AI & Analytics Relationships

1. **AIAnalysis** → **CandidateProfile** (1:1)
2. **AIAnalysis** → **Job** (1:1)
3. **CandidateRecommendation** → **Job** (1:1)
4. **JobRecommendation** → **CandidateProfile** (1:1)

### Learning & Development

1. **Skill** → **SkillLearningPath** (1:1)
2. **SkillCategory** → **Skill** (1:many)
3. **SkillRoadmap** → **CandidateProfile** (1:many)
4. **CareerPath** → **SkillLearningPath** (many:many)

### Content & Communication

1. **ResumeBuilder** → **CandidateProfile** (1:many)
2. **Chatbot** → **User** (1:many)
3. **Notification** → **User** (1:many)

## Đặc Điểm Nổi Bật

### 1. AI Integration

- Vector embeddings cho semantic search
- NLP analysis cho content understanding
- Predictive matching algorithms
- Automated content generation

### 2. Performance Optimization

- Comprehensive indexing strategy
- TTL indexes cho temporary data
- Virtual fields cho computed values
- Efficient query patterns

### 3. Scalability

- Soft delete cho data retention
- Caching strategies cho recommendations
- Background processing cho AI analysis
- Modular schema design

### 4. User Experience

- Progress tracking systems
- Personalized recommendations
- Multi-channel notifications
- Version control cho content

### 5. Business Intelligence

- Detailed analytics và reporting
- Market trend analysis
- Performance metrics
- Success tracking

Hệ thống được thiết kế để hỗ trợ một nền tảng tuyển dụng thực tập sinh hiện đại với khả năng AI mạnh mẽ và trải nghiệm người dùng tối ưu.
