# Admin Management & AI-Powered Features - Complete Guide

## 📋 Tổng quan

Hệ thống quản lý admin toàn diện với các tính năng AI mạnh mẽ để phân tích CV, đánh giá kỹ năng, và tạo lộ trình học tập cá nhân hóa.

## 🎯 Các chức năng chính

### 1. **Admin - Skills Management** ⚡
Quản lý toàn diện kỹ năng với phân tích xu hướng và thống kê

### 2. **Admin - Industries Management** 🏢
Quản lý ngành nghề theo cấu trúc phân cấp với analytics

### 3. **AI - CV Analysis & Learning Roadmap** 🤖
Phân tích CV bằng NLP, đánh giá kỹ năng, và tạo lộ trình học tập

---

## 📦 Cấu trúc Project

```
backend/
├── src/
│   ├── controllers/
│   │   └── admin/
│   │       ├── skillsAdminController.js       ✅ NEW
│   │       └── industriesAdminController.js   ✅ NEW
│   ├── routes/
│   │   └── admin/
│   │       ├── skillsAdmin.js                 ✅ NEW
│   │       └── industriesAdmin.js             ✅ UPDATED
│   └── models/
│       ├── Skill.js                           ✅ EXISTS
│       └── Industry.js                        ✅ EXISTS
└── postman/
    ├── Admin_Skills_Management.postman_collection.json          ✅ NEW
    ├── Admin_Industries_Management.postman_collection.json      ✅ NEW
    └── AI_CV_Analysis_Learning_Roadmap.postman_collection.json  ✅ NEW
```

---

## 🚀 1. Admin - Skills Management

### Endpoints Overview

#### **CRUD Operations**
- `GET    /api/admin/skills` - Get all skills with filters
- `GET    /api/admin/skills/:id` - Get skill details with analytics
- `POST   /api/admin/skills` - Create new skill
- `PUT    /api/admin/skills/:id` - Update skill
- `DELETE /api/admin/skills/:id` - Delete skill

#### **Bulk Operations**
- `POST   /api/admin/skills/bulk/create` - Bulk create skills
- `PATCH  /api/admin/skills/bulk/update` - Batch update skills
- `DELETE /api/admin/skills/bulk/delete` - Batch delete skills

#### **Categories**
- `GET /api/admin/skills/categories/list` - Get all categories with stats
- `GET /api/admin/skills/categories/:category` - Get skills by category
- `PUT /api/admin/skills/categories/:id` - Update skill category

#### **Analytics**
- `GET  /api/admin/skills/analytics/overview` - Skill analytics overview
- `GET  /api/admin/skills/analytics/trends` - Skill trends analysis
- `POST /api/admin/skills/analytics/sync` - Sync popularity from usage

#### **Relationships**
- `GET /api/admin/skills/:id/related` - Get related skills

#### **Export/Import**
- `GET  /api/admin/skills/export?format=json|csv` - Export skills
- `POST /api/admin/skills/import` - Import skills

### Sample Requests

#### Create Skill
```json
POST /api/admin/skills
{
  "name": "React",
  "category": "frontend",
  "description": "A JavaScript library for building user interfaces",
  "aliases": ["ReactJS", "React.js"],
  "demandLevel": "high",
  "trend": "growing",
  "isActive": true
}
```

#### Bulk Create Skills
```json
POST /api/admin/skills/bulk/create
{
  "skills": [
    {
      "name": "Vue.js",
      "category": "frontend",
      "demandLevel": "high",
      "trend": "growing"
    },
    {
      "name": "Docker",
      "category": "devops",
      "demandLevel": "critical",
      "trend": "stable"
    }
  ]
}
```

#### Get Skills with Filters
```
GET /api/admin/skills?page=1&limit=50&category=frontend&status=active&sortBy=popularity&sortOrder=desc
```

---

## 🏢 2. Admin - Industries Management

### Endpoints Overview

#### **CRUD Operations**
- `GET    /api/admin/industries` - Get all industries
- `GET    /api/admin/industries/hierarchy` - Get hierarchy tree
- `GET    /api/admin/industries/:code` - Get industry by code
- `POST   /api/admin/industries` - Create industry
- `PUT    /api/admin/industries/:code` - Update industry
- `DELETE /api/admin/industries/:code` - Delete industry

#### **Analytics**
- `GET  /api/admin/industries/analytics/overview` - Industry analytics
- `POST /api/admin/industries/analytics/sync` - Sync statistics

#### **Bulk Operations**
- `POST /api/admin/industries/bulk` - Bulk create industries
- `PUT  /api/admin/industries/sort-order` - Update sort order

### Sample Requests

#### Create Industry
```json
POST /api/admin/industries
{
  "code": "technology",
  "parentCode": null,
  "name": {
    "vi": "Công nghệ thông tin",
    "en": "Information Technology"
  },
  "description": {
    "vi": "Ngành công nghệ thông tin và phần mềm",
    "en": "Information technology and software industry"
  },
  "color": "#3b82f6",
  "icon": "laptop",
  "keywords": ["IT", "Software", "Tech"],
  "visible": true,
  "sortOrder": 1
}
```

#### Create Sub-Industry
```json
POST /api/admin/industries
{
  "code": "software-dev",
  "parentCode": "technology",
  "name": {
    "vi": "Phát triển phần mềm",
    "en": "Software Development"
  },
  "visible": true
}
```

#### Bulk Create Industries
```json
POST /api/admin/industries/bulk
{
  "industries": [
    {
      "code": "finance",
      "name": {
        "vi": "Tài chính - Ngân hàng",
        "en": "Finance & Banking"
      },
      "visible": true,
      "sortOrder": 2
    },
    {
      "code": "healthcare",
      "name": {
        "vi": "Y tế",
        "en": "Healthcare"
      },
      "visible": true,
      "sortOrder": 3
    }
  ]
}
```

---

## 🤖 3. AI - CV Analysis & Learning Roadmap

### Endpoints Overview

#### **CV Analysis**
- `POST /api/ai/analyze-cv` - Analyze CV from file
- `POST /api/ai/analyze-cv-text` - Analyze CV from text

#### **Job Matching**
- `POST /api/ai/job-recommendations` - Get job recommendations
- `POST /api/ai/analyze-job-match` - Analyze job match score
- `POST /api/ai/analyze-job-description` - Analyze job description

#### **Skill Gap Analysis**
- `POST /api/ai/skill-gap-analysis` - Analyze skill gaps

#### **Learning Roadmap**
- `POST /api/ai/skill-roadmap` - Generate personalized roadmap

#### **AI Suggestions**
- `POST /api/ai/suggestions` - Get AI suggestions for CV sections

#### **Insights**
- `GET /api/ai/candidate-insights` - Get candidate insights
- `GET /api/ai/insights` - Get AI insights

### Sample Requests

#### Analyze CV from Text
```json
POST /api/ai/analyze-cv-text
{
  "rawCVText": "CURRICULUM VITAE\n\nName: John Doe\nEmail: john@example.com\n\nSKILLS:\n- JavaScript, React, Node.js\n- HTML, CSS, MongoDB\n- Git, Docker\n\nEXPERIENCE:\nSoftware Engineer at Tech Company (2021-2023)\n- Developed web applications\n- Implemented RESTful APIs"
}
```

#### Skill Gap Analysis
```json
POST /api/ai/skill-gap-analysis
{
  "targetJobDescription": "We need a Senior Full Stack Developer with:\n- React, Next.js, TypeScript\n- Node.js, Express, NestJS\n- MongoDB, PostgreSQL\n- AWS (EC2, S3, Lambda)\n- Docker, Kubernetes\n- Microservices architecture",
  "targetJobTitle": "Senior Full Stack Developer",
  "industry": "technology"
}
```

#### Generate Learning Roadmap
```json
POST /api/ai/skill-roadmap
{
  "targetJobTitle": "Senior Full Stack Developer",
  "targetJobDescription": "Full stack developer with cloud expertise",
  "skillGaps": [
    {
      "skill": "TypeScript",
      "currentLevel": "beginner",
      "targetLevel": "advanced",
      "priority": "high"
    },
    {
      "skill": "AWS",
      "currentLevel": "none",
      "targetLevel": "intermediate",
      "priority": "critical"
    },
    {
      "skill": "Kubernetes",
      "currentLevel": "none",
      "targetLevel": "intermediate",
      "priority": "high"
    }
  ],
  "timeframe": 16,
  "learningPreferences": {
    "focus": "practical",
    "pace": "intensive",
    "learningStyle": "project-based"
  }
}
```

#### Get AI Suggestions for Career Objective
```json
POST /api/ai/suggestions
{
  "stepType": "careerObjective",
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

## 🔧 Installation & Setup

### 1. Import Postman Collections
```bash
# Import các file sau vào Postman:
- Admin_Skills_Management.postman_collection.json
- Admin_Industries_Management.postman_collection.json
- AI_CV_Analysis_Learning_Roadmap.postman_collection.json
```

### 2. Configure Environment
Tạo environment trong Postman với các biến:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:5000` | Backend URL |
| `admin_token` | `` | Admin JWT token |
| `auth_token` | `` | User JWT token |
| `skill_id` | `` | Skill ID for testing |
| `industry_code` | `` | Industry code for testing |
| `job_id` | `` | Job ID for testing |

### 3. Authentication Flow
1. Login as Admin → Get `admin_token`
2. Login as Candidate → Get `auth_token`
3. Use appropriate token for each collection

---

## 📊 Use Cases

### Use Case 1: Quản lý Skills cho hệ thống
1. Admin tạo các skills categories (frontend, backend, devops...)
2. Bulk import skills từ CSV/JSON
3. Sync popularity từ jobs và candidate profiles
4. Phân tích trends và demand

### Use Case 2: Quản lý Industries theo phân cấp
1. Tạo root industries (Technology, Finance, Healthcare...)
2. Tạo sub-industries (Software Dev, Web Dev dưới Technology)
3. Sync stats từ jobs và candidates
4. Export hierarchy tree

### Use Case 3: Phân tích CV và tạo lộ trình học tập
1. Candidate upload CV → AI analyze và extract skills
2. Candidate apply job → AI analyze skill gaps
3. System generate personalized learning roadmap
4. Candidate theo dõi progress và recommendations

### Use Case 4: Job Matching thông minh
1. Admin tạo job với skills và industry
2. AI analyze job description → extract required skills
3. AI match với candidate profiles
4. Generate match score và recommendations

---

## 🔑 Key Features

### Skills Management
✅ CRUD với validation đầy đủ
✅ Bulk operations (create, update, delete)
✅ Category management
✅ Analytics và trends
✅ Popularity tracking
✅ Related skills discovery
✅ Export/Import

### Industries Management
✅ Hierarchical structure
✅ Multilingual support (vi/en)
✅ Statistics tracking
✅ Bulk operations
✅ Sort order management
✅ Visual customization (color, icon)

### AI Features
✅ CV parsing (file và text)
✅ Skill extraction với NLP
✅ Job matching với scoring
✅ Skill gap analysis
✅ Personalized learning roadmap
✅ AI suggestions cho CV sections
✅ Candidate insights

---

## 🎯 Testing Workflow

### For Admin
1. **Setup Skills & Industries**
   - Import initial data
   - Configure categories
   - Set up hierarchy

2. **Manage Data**
   - CRUD operations
   - Bulk updates
   - Analytics monitoring

3. **Maintenance**
   - Sync popularity
   - Update trends
   - Export reports

### For Candidates
1. **Upload CV**
   - AI analyzes và extracts skills
   - Profile được update tự động

2. **Browse Jobs**
   - AI recommends matching jobs
   - View match scores

3. **Skill Development**
   - Analyze skill gaps
   - Generate learning roadmap
   - Track progress

---

## 📝 Notes

- Tất cả admin endpoints yêu cầu `admin` role
- AI endpoints yêu cầu authentication
- Rate limiting được áp dụng
- Các operations nguy hiểm (delete, force actions) cần `?force=true`
- Bulk operations trả về detailed results (success/failed)

---

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**
- Kiểm tra token có đúng không
- Token đã expire chưa
- Role có phù hợp không

**404 Not Found**
- Kiểm tra ID/code có tồn tại không
- Route có đúng không

**400 Bad Request**
- Validation lỗi: kiểm tra required fields
- Duplicate: skill/industry đã tồn tại
- In use: không thể delete do đang được sử dụng

**500 Internal Server Error**
- Check server logs
- Database connection
- AI service availability

---

## 📚 Additional Resources

- [API Documentation](./API_V2_DOCUMENTATION.md)
- [Models Documentation](./MODELS_DOCUMENTATION.md)
- [AI Service Guide](./CV_PREVIEW_GENERATOR_DOCS.md)

---

## 👨‍💻 Development

### Adding New Skills
```javascript
// Via API
POST /api/admin/skills
{
  "name": "New Skill",
  "category": "category-slug",
  "demandLevel": "high|medium|low|critical",
  "trend": "growing|stable|declining|emerging"
}
```

### Adding New Industry
```javascript
// Via API
POST /api/admin/industries
{
  "code": "unique-code",
  "parentCode": "parent-code-or-null",
  "name": { "vi": "Tên VN", "en": "English Name" }
}
```

---

Chúc bạn test thành công! 🎉
