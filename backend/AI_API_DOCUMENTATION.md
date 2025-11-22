# 📚 AI API Documentation - Giải Thích Chi Tiết

## 📋 Tổng Quan

Postman Collection này chứa **11 API endpoints** liên quan đến AI features:
- **CV Analysis** (2 APIs)
- **Job Matching & Analysis** (3 APIs)
- **Skill Gap Analysis** (2 APIs)
- **Learning Roadmap Generation** (3 APIs)
- **AI Suggestions** (3 APIs)
- **Candidate Insights** (2 APIs)

**Base URL:** `http://localhost:5000`
**Authentication:** Tất cả APIs đều yêu cầu `Bearer Token` trong header

---

## 1️⃣ CV Analysis (Phân Tích CV)

### 1.1 POST `/api/ai/analyze-cv` - Analyze CV from File

**Mục đích:** Phân tích CV từ file upload (PDF, DOC, DOCX)

**Request:**
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body (Form Data):**
  - `cv` (file): File CV (PDF, DOC, DOCX)

**Ví dụ Request:**
```javascript
// Postman: Chọn file từ máy tính
Form Data:
  cv: [Select File] resume.pdf
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedSkills": ["JavaScript", "React", "Node.js", "MongoDB"],
    "experience": [
      {
        "position": "Software Engineer",
        "company": "Tech Company",
        "duration": "2021-2023",
        "description": "Developed web applications..."
      }
    ],
    "education": {
      "degree": "Bachelor of Computer Science",
      "period": "2017-2021"
    },
    "summary": "Experienced software engineer with 2+ years..."
  }
}
```

**Use Cases:**
- Upload CV để extract thông tin tự động
- Import skills và experience vào profile
- Phân tích CV để tối ưu hóa

---

### 1.2 POST `/api/ai/analyze-cv-text` - Analyze CV from Text

**Mục đích:** Phân tích CV từ raw text (không cần upload file)

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "rawCVText": "CURRICULUM VITAE\n\nName: John Doe\nEmail: john.doe@example.com\n\nSKILLS:\n- JavaScript, React, Node.js\n- HTML, CSS, Tailwind\n- MongoDB, PostgreSQL\n- Git, Docker\n\nEXPERIENCE:\nSoftware Engineer at Tech Company (2021-2023)\n- Developed web applications using React and Node.js\n- Implemented RESTful APIs\n- Collaborated with cross-functional teams\n\nEDUCATION:\nBachelor of Computer Science (2017-2021)"
}
```

**Response:** Tương tự như `/analyze-cv`

**Use Cases:**
- Copy-paste CV text để phân tích nhanh
- Không cần upload file
- Phù hợp cho mobile/web app

**So sánh với `/analyze-cv`:**
- `/analyze-cv`: Upload file → Hệ thống tự extract text
- `/analyze-cv-text`: User cung cấp text sẵn → Nhanh hơn, không cần file processing

---

## 2️⃣ Job Matching & Analysis (Phân Tích & Đề Xuất Công Việc)

### 2.1 POST `/api/ai/job-recommendations` - Get Job Recommendations

**Mục đích:** Lấy danh sách công việc được đề xuất dựa trên CV/profile của candidate

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "limit": 10,        // Số lượng jobs muốn nhận (default: 10)
  "minScore": 60      // Điểm matching tối thiểu (0-100, default: 60)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "jobId": "507f1f77bcf86cd799439011",
        "title": "Full Stack Developer",
        "company": "Tech Company",
        "matchScore": 85,
        "scoreBreakdown": {
          "skillsScore": 90,
          "experienceScore": 80,
          "educationScore": 75,
          "keywordScore": 85
        },
        "matchedSkills": ["React", "Node.js", "MongoDB"],
        "missingSkills": ["Docker", "Kubernetes"],
        "reason": "Strong match in core technologies"
      }
    ],
    "total": 25,
    "averageScore": 78
  }
}
```

**Use Cases:**
- Dashboard hiển thị jobs phù hợp
- Personalized job feed
- Job discovery cho candidates

**Algorithm:**
- So sánh CV skills với job requirements
- Tính matching score dựa trên: Skills (45%), Experience (20%), Education (10%), Keywords (15%), Soft Skills (10%)
- Sắp xếp theo score giảm dần

---

### 2.2 POST `/api/ai/analyze-job-match` - Analyze Job Match

**Mục đích:** Phân tích chi tiết độ phù hợp giữa CV và một công việc cụ thể

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",  // Optional: Job ID từ database
  "targetJobDescription": "We are looking for a Full Stack Developer with 3+ years of experience in React, Node.js, and cloud technologies.",
  "targetJobTitle": "Full Stack Developer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 82,
    "scoreBreakdown": {
      "skillsScore": {
        "score": 85,
        "weight": 0.45,
        "matchedSkills": ["React", "Node.js", "JavaScript"],
        "missingSkills": ["AWS", "Docker"]
      },
      "experienceScore": {
        "score": 80,
        "weight": 0.20,
        "years": 2,
        "required": 3
      },
      "educationScore": {
        "score": 75,
        "weight": 0.10
      },
      "keywordScore": {
        "score": 90,
        "weight": 0.15
      },
      "softSkillsScore": {
        "score": 70,
        "weight": 0.10
      }
    },
    "strengths": [
      "Strong React and Node.js experience",
      "Good understanding of modern web development"
    ],
    "weaknesses": [
      "Missing cloud experience (AWS)",
      "Less than required years of experience"
    ],
    "recommendations": [
      "Consider learning AWS basics",
      "Highlight relevant projects in portfolio"
    ]
  }
}
```

**Use Cases:**
- Xem chi tiết tại sao match/không match với job
- Hiểu rõ strengths và weaknesses
- Nhận recommendations để cải thiện

**So sánh với `/job-recommendations`:**
- `/job-recommendations`: Trả về nhiều jobs (list)
- `/analyze-job-match`: Phân tích chi tiết 1 job cụ thể

---

### 2.3 POST `/api/ai/analyze-job-description` - Analyze Job Description

**Mục đích:** Phân tích job description để tối ưu hóa CV (cho Employers hoặc Candidates)

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
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

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedSkills": {
      "required": ["React", "Node.js", "TypeScript"],
      "preferred": ["Docker", "Kubernetes", "GraphQL"]
    },
    "experienceRequirements": {
      "minYears": 3,
      "level": "mid-senior"
    },
    "keyKeywords": ["scalable", "microservices", "CI/CD"],
    "cvOptimizationTips": [
      "Emphasize React and Node.js experience",
      "Highlight TypeScript projects",
      "Mention cloud platform experience"
    ],
    "skillPriorities": [
      { "skill": "React", "importance": "critical" },
      { "skill": "Node.js", "importance": "critical" },
      { "skill": "TypeScript", "importance": "high" }
    ]
  }
}
```

**Use Cases:**
- Employers: Tối ưu job posting
- Candidates: Hiểu job requirements và tối ưu CV
- Extract skills và keywords từ job description

---

## 3️⃣ Skill Gap Analysis (Phân Tích Khoảng Cách Kỹ Năng)

### 3.1 POST `/api/ai/skill-gap-analysis` (with Job Description)

**Mục đích:** Phân tích skill gaps giữa CV hiện tại và job requirements

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "targetJobDescription": "We are looking for a Senior Full Stack Developer with expertise in:\n- React, Next.js, TypeScript\n- Node.js, Express, NestJS\n- MongoDB, PostgreSQL, Redis\n- AWS services (EC2, S3, Lambda)\n- Docker, Kubernetes\n- Microservices architecture\n- GraphQL and REST APIs\n- CI/CD pipelines\n- Agile methodologies",
  "targetJobTitle": "Senior Full Stack Developer",
  "industry": "technology"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "skillGaps": [
      {
        "skill": "Kubernetes",
        "currentLevel": "none",
        "targetLevel": "intermediate",
        "gap": "high",
        "priority": "critical",
        "importance": 0.9,
        "recommendation": "Start with Docker basics, then learn Kubernetes fundamentals"
      },
      {
        "skill": "AWS",
        "currentLevel": "beginner",
        "targetLevel": "intermediate",
        "gap": "medium",
        "priority": "high",
        "importance": 0.8
      }
    ],
    "matchedSkills": [
      {
        "skill": "React",
        "currentLevel": "intermediate",
        "targetLevel": "advanced",
        "gap": "low",
        "recommendation": "Focus on advanced patterns and optimization"
      }
    ],
    "summary": {
      "totalGaps": 5,
      "criticalGaps": 2,
      "highPriorityGaps": 2,
      "mediumPriorityGaps": 1
    },
    "learningPath": {
      "estimatedTime": "16 weeks",
      "difficulty": "intermediate",
      "suggestedOrder": ["Docker", "AWS Basics", "Kubernetes", "CI/CD"]
    }
  }
}
```

**Use Cases:**
- Xác định skills cần học để apply job
- Tạo learning roadmap dựa trên gaps
- Đánh giá readiness cho job position

---

### 3.2 POST `/api/ai/skill-gap-analysis` (with Job ID)

**Mục đích:** Tương tự như trên nhưng sử dụng Job ID từ database

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011"
}
```

**Response:** Tương tự như trên

**Use Cases:**
- Khi đã có job ID từ database
- Phân tích skill gaps cho job đã lưu
- Tích hợp với job application flow

**So sánh 2 cách:**
- **With Job Description:** Linh hoạt, không cần job trong DB
- **With Job ID:** Sử dụng job data từ DB, có thể có thêm metadata

---

## 4️⃣ Learning Roadmap Generation (Tạo Lộ Trình Học Tập)

### 4.1 POST `/api/ai/skill-roadmap` (Basic)

**Mục đích:** Tạo learning roadmap cơ bản dựa trên target role và skills

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "targetRole": "Full Stack Developer",
  "targetSkills": [
    "React",
    "Node.js",
    "TypeScript",
    "MongoDB",
    "Docker"
  ],
  "timeframe": 12,              // Số tuần (weeks)
  "currentLevel": "intermediate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roadmap": {
      "targetRole": "Full Stack Developer",
      "totalDuration": "12 weeks",
      "estimatedHours": 240,
      "phases": [
        {
          "phaseNumber": 1,
          "title": "Foundation Building",
          "duration": "4 weeks",
          "weeks": [
            {
              "weekNumber": 1,
              "focus": "React Fundamentals",
              "learningObjectives": [
                "Understand React components and props",
                "Learn JSX syntax",
                "Practice state management"
              ],
              "resources": [
                {
                  "type": "course",
                  "title": "React - The Complete Guide",
                  "url": "https://udemy.com/react-complete",
                  "provider": "Udemy",
                  "duration": "40 hours",
                  "difficulty": "beginner",
                  "isFree": false,
                  "rating": 4.7,
                  "credibility": 0.85
                }
              ],
              "projects": [
                {
                  "title": "Todo App with React",
                  "description": "Build a simple todo application",
                  "difficulty": "beginner",
                  "estimatedTime": "8 hours"
                }
              ]
            }
          ]
        }
      ],
      "milestones": [
        {
          "weekNumber": 4,
          "title": "Complete Foundation Phase",
          "description": "Master React and Node.js basics"
        }
      ]
    }
  }
}
```

**Use Cases:**
- Tạo roadmap đơn giản cho beginners
- Learning path cho career transition
- Structured learning plan

---

### 4.2 POST `/api/ai/skill-roadmap` (Advanced with Job)

**Mục đích:** Tạo roadmap nâng cao với skill gaps và learning preferences

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "targetJobTitle": "Senior Full Stack Developer",
  "targetJobDescription": "We need a developer with strong skills in React, Node.js, cloud technologies (AWS), database management, and DevOps practices.",
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
    "focus": "practical",           // practical | theoretical | balanced
    "pace": "intensive",            // intensive | moderate | relaxed
    "learningStyle": "project-based", // project-based | structured | self-paced
    "budget": "moderate"            // free | moderate | premium
  }
}
```

**Response:** Tương tự như Basic nhưng:
- Resources được filter theo `learningPreferences`
- Skill gaps được ưu tiên trong roadmap
- Resources có credibility score và recommendation score

**Use Cases:**
- Personalized roadmap dựa trên skill gaps
- Career change roadmap
- Advanced learning với preferences

**Features:**
- **RAG-based Resource Recommendation:** Resources được recommend từ vector database
- **Credibility Assessment:** Đánh giá độ tin cậy của resources
- **Level-based Matching:** Resources phù hợp với current level
- **Asymmetric Penalty:** Tránh resources quá khó

---

### 4.3 POST `/api/ai/skill-roadmap` (Career Change)

**Mục đích:** Tạo roadmap cho career change (ví dụ: Frontend → DevOps)

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "targetJobTitle": "DevOps Engineer",
  "targetJobDescription": "Seeking a DevOps Engineer to manage cloud infrastructure, implement CI/CD pipelines, and ensure system reliability.",
  "timeframe": 24,
  "currentLevel": "beginner",
  "learningPreferences": {
    "focus": "comprehensive",
    "pace": "moderate",
    "learningStyle": "structured",
    "certifications": true
  }
}
```

**Response:** Tương tự như Advanced

**Use Cases:**
- Career transition
- Learning new domain từ đầu
- Comprehensive learning path

---

## 5️⃣ AI Suggestions (Gợi Ý AI)

### 5.1 POST `/api/ai/suggestions` (Career Objective)

**Mục đích:** AI gợi ý career objective dựa trên context

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "stepType": "careerObjective",
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

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "Seeking a Full Stack Developer position to leverage 3 years of experience in web development and contribute to innovative projects.",
      "Aspiring Full Stack Developer with a strong foundation in Computer Science, eager to apply technical skills in a dynamic technology environment.",
      "Motivated software engineer looking to transition into Full Stack Development, bringing 3 years of hands-on experience and a passion for building scalable applications."
    ],
    "keywords": ["Full Stack Developer", "web development", "scalable applications"],
    "tone": "professional"
  }
}
```

**Use Cases:**
- Auto-fill career objective trong CV builder
- Gợi ý khi user không biết viết gì
- Cải thiện career objective

---

### 5.2 POST `/api/ai/suggestions` (Skills)

**Mục đích:** AI gợi ý skills dựa trên target job

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "stepType": "skills",
  "currentData": {},
  "context": {
    "targetJob": "Backend Developer",
    "experience": "2 years as Frontend Developer"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "skill": "Node.js",
        "reason": "Essential for Backend Development",
        "priority": "high",
        "relatedSkills": ["Express.js", "REST API"]
      },
      {
        "skill": "MongoDB",
        "reason": "Commonly used in backend development",
        "priority": "medium"
      },
      {
        "skill": "PostgreSQL",
        "reason": "Relational database knowledge is important",
        "priority": "medium"
      }
    ],
    "skillCategories": {
      "required": ["Node.js", "Express.js", "REST API"],
      "recommended": ["MongoDB", "PostgreSQL", "Docker"]
    }
  }
}
```

**Use Cases:**
- Auto-suggest skills khi tạo profile
- Gợi ý skills khi apply job
- Skill discovery

---

### 5.3 POST `/api/ai/suggestions` (Experience)

**Mục đích:** AI enhance experience description

**Request:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`
- **Body:**
```json
{
  "stepType": "experience",
  "currentData": {
    "position": "Software Developer",
    "company": "Tech Solutions",
    "description": "Worked on web applications and fixed bugs"
  },
  "context": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enhancedDescription": "Developed and maintained web applications using modern technologies, identified and resolved software bugs to improve application performance and user experience. Collaborated with cross-functional teams to deliver high-quality software solutions.",
    "improvements": [
      "Added action verbs (Developed, Maintained, Identified)",
      "Included impact (improve performance, user experience)",
      "Mentioned collaboration"
    ],
    "keywords": ["developed", "maintained", "collaborated", "performance"],
    "originalLength": 45,
    "enhancedLength": 180
  }
}
```

**Use Cases:**
- Enhance experience descriptions
- Improve CV quality
- Add impact và metrics

---

## 6️⃣ Candidate Insights (Thông Tin Chi Tiết Ứng Viên)

### 6.1 GET `/api/ai/candidate-insights` - Get Candidate Insights

**Mục đích:** Lấy insights chi tiết cho candidate (profile strength, skill gaps, etc.)

**Request:**
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`

**Response:**
```json
{
  "success": true,
  "data": {
    "profileStrength": {
      "overall": 75,
      "skills": 80,
      "experience": 70,
      "education": 75,
      "completeness": 85
    },
    "skillGaps": [
      {
        "skill": "Docker",
        "currentLevel": "none",
        "recommendedLevel": "intermediate",
        "priority": "high",
        "marketDemand": "high"
      }
    ],
    "marketPosition": {
      "percentile": 65,
      "competitiveSkills": ["React", "Node.js"],
      "missingSkills": ["Docker", "Kubernetes"]
    },
    "recommendations": [
      "Complete your profile to increase visibility",
      "Learn Docker to improve job match rate",
      "Add more projects to showcase skills"
    ],
    "jobMatchStats": {
      "averageMatchScore": 72,
      "highMatchJobs": 15,
      "totalApplications": 8
    }
  }
}
```

**Use Cases:**
- Dashboard insights
- Profile strength indicator
- Personalized recommendations

---

### 6.2 GET `/api/ai/insights` - Get AI Insights (Auto-detect Role)

**Mục đích:** Lấy insights tự động dựa trên user role (candidate/employer/admin)

**Request:**
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer {{auth_token}}`

**Response:**
```json
{
  "success": true,
  "data": {
    "userRole": "candidate",
    "insights": {
      // Nếu là candidate: tương tự candidate-insights
      // Nếu là employer: job performance, applicant analytics
      // Nếu là admin: system analytics
    }
  }
}
```

**Use Cases:**
- Universal insights endpoint
- Auto-detect role và trả về insights phù hợp
- Dashboard widget

---

## 📊 Tổng Kết

### API Categories:

| Category | APIs | Mục Đích |
|----------|------|----------|
| **CV Analysis** | 2 | Extract và phân tích CV |
| **Job Matching** | 3 | Đề xuất và phân tích jobs |
| **Skill Gap Analysis** | 2 | Xác định skill gaps |
| **Learning Roadmap** | 3 | Tạo lộ trình học tập |
| **AI Suggestions** | 3 | Gợi ý cho CV/profile |
| **Insights** | 2 | Insights và analytics |

### Authentication:
- ✅ Tất cả APIs đều yêu cầu `Bearer Token`
- ✅ Rate limiting được áp dụng

### Response Format:
```json
{
  "success": true/false,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🔗 Related APIs

### Advanced NLP APIs (`/api/nlp`):
- `POST /api/nlp/matching-score` - Advanced matching score calculation
- `POST /api/nlp/learning-roadmap` - Generate learning roadmap (alternative)
- `GET /api/nlp/best-matches` - Get best job matches

### Roadmap APIs (`/api/roadmaps`):
- `GET /api/roadmaps` - Get all roadmaps
- `POST /api/roadmaps` - Create roadmap
- `GET /api/roadmaps/:id` - Get roadmap by ID

---

**Last Updated:** 2024
**Version:** 1.0.0

