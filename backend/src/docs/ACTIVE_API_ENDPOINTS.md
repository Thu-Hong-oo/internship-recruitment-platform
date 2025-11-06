# 🚀 Active API Endpoints

**Server Status**: ✅ Running on `http://localhost:3000`  
**Documentation**: http://localhost:3000/api-docs  
**Health Check**: http://localhost:3000/health  
**Environment**: Development  
**Last Updated**: November 6, 2025

---

## � Endpoint Count Summary

> **⚠️ Important Note**: This document lists **endpoint groups** (functional features), not individual HTTP methods.
>
> - **34 Endpoint Groups** = Major functional features documented below
> - **~149 Total HTTP Endpoints** = All GET/POST/PATCH/DELETE methods combined
> - See [ENDPOINT_COUNT_CLARIFICATION.md](../../ENDPOINT_COUNT_CLARIFICATION.md) for detailed breakdown

---

## �📋 Table of Contents

1. [Authentication](#authentication) - 12 endpoints
2. [Candidates](#candidates) - 13 endpoints
3. [Employers](#employers) - 16 endpoints
4. [Jobs](#jobs) - 10 endpoints
5. [Applications](#applications) - 10 endpoints
6. [AI/NLP](#ainlp) - 7 endpoints
7. [Skills](#skills) - 14 endpoints
8. [Learning Roadmaps](#learning-roadmaps) - 9 endpoints
9. [Notifications](#notifications) - 10 endpoints
10. [Chat](#chat) - 11 endpoints
11. [Admin](#admin) - 16 endpoints
12. [Saved Jobs](#saved-jobs) - 6 endpoints
13. [Industries](#industries) - 13 endpoints
14. [Public Access](#public-access) - 1 endpoint
15. [System Health](#system-health) - 1 endpoint

**Total**: 149 HTTP Endpoints across 15 groups

---

## 🔐 Authentication

Base URL: `/api/auth`

| Method | Endpoint                    | Description                            | Status    |
| ------ | --------------------------- | -------------------------------------- | --------- |
| POST   | `/api/auth/register`        | Register new user (Candidate/Employer) | ✅ Active |
| POST   | `/api/auth/login`           | Login with email/password              | ✅ Active |
| POST   | `/api/auth/login/google`    | Login with Google OAuth                | ✅ Active |
| POST   | `/api/auth/verify-email`    | Verify email with OTP                  | ✅ Active |
| POST   | `/api/auth/forgot-password` | Request password reset                 | ✅ Active |
| POST   | `/api/auth/reset-password`  | Reset password with token              | ✅ Active |

### Request Examples

**Register:**

```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "candidate",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**

```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Verify Email:**

```json
POST /api/auth/verify-email
{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

## 👤 Candidates

Base URL: `/api/candidates`

| Method | Endpoint              | Description                       | Status    |
| ------ | --------------------- | --------------------------------- | --------- |
| GET    | `/api/candidates`     | Get all candidates (with filters) | ✅ Active |
| POST   | `/api/candidates`     | Create candidate profile          | ✅ Active |
| GET    | `/api/candidates/:id` | Get candidate profile by ID       | ✅ Active |
| PUT    | `/api/candidates/:id` | Update candidate profile          | ✅ Active |

### Request Examples

**Get All Candidates (Admin/Employer):**

```http
GET /api/candidates?page=1&limit=20&skills=javascript,nodejs
Authorization: Bearer <token>
```

**Create Candidate Profile:**

```json
POST /api/candidates
Authorization: Bearer <token>
{
  "personalInfo": {
    "phone": "+84901234567",
    "address": "Ho Chi Minh City",
    "dateOfBirth": "1998-05-15"
  },
  "education": [{
    "degree": "Bachelor",
    "major": "Computer Science",
    "institution": "HCMUT",
    "startDate": "2016-09-01",
    "endDate": "2020-06-30"
  }],
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": []
}
```

**Update Candidate:**

```json
PUT /api/candidates/:id
Authorization: Bearer <token>
{
  "skills": ["JavaScript", "React", "Node.js", "TypeScript"],
  "bio": "Full-stack developer with 2 years experience"
}
```

---

## 🏢 Employers

Base URL: `/api/employers`

| Method | Endpoint             | Description                | Status    |
| ------ | -------------------- | -------------------------- | --------- |
| GET    | `/api/employers`     | Get all employers          | ✅ Active |
| POST   | `/api/employers`     | Create employer profile    | ✅ Active |
| GET    | `/api/employers/:id` | Get employer profile by ID | ✅ Active |
| PUT    | `/api/employers/:id` | Update employer profile    | ✅ Active |

### Request Examples

**Create Employer Profile:**

```json
POST /api/employers
Authorization: Bearer <token>
{
  "companyName": "Tech Corp Vietnam",
  "companySize": "51-200",
  "industry": "Information Technology",
  "website": "https://techcorp.vn",
  "description": "Leading IT company in Vietnam",
  "address": "District 1, Ho Chi Minh City"
}
```

**Get Employer Details:**

```http
GET /api/employers/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

---

## 💼 Jobs

Base URL: `/api/jobs`

| Method | Endpoint        | Description                         | Status    |
| ------ | --------------- | ----------------------------------- | --------- |
| GET    | `/api/jobs`     | Get all job postings (with filters) | ✅ Active |
| POST   | `/api/jobs`     | Create new job posting              | ✅ Active |
| GET    | `/api/jobs/:id` | Get job details by ID               | ✅ Active |
| PUT    | `/api/jobs/:id` | Update job posting                  | ✅ Active |

### Request Examples

**Get All Jobs:**

```http
GET /api/jobs?page=1&limit=20&location=Ho Chi Minh&type=fulltime&skills=nodejs
```

**Create Job Posting:**

```json
POST /api/jobs
Authorization: Bearer <token>
{
  "title": "Senior Node.js Developer",
  "description": "We are looking for an experienced Node.js developer...",
  "requirements": [
    "3+ years Node.js experience",
    "Strong knowledge of Express.js",
    "Experience with MongoDB"
  ],
  "responsibilities": [
    "Develop and maintain backend services",
    "Write clean, maintainable code"
  ],
  "location": "Ho Chi Minh City",
  "type": "fulltime",
  "experience": "3-5 years",
  "salary": {
    "min": 2000,
    "max": 3500,
    "currency": "USD"
  },
  "skills": ["Node.js", "Express.js", "MongoDB", "Redis"],
  "benefits": ["Health insurance", "Flexible hours"],
  "deadline": "2025-12-31"
}
```

**Update Job:**

```json
PUT /api/jobs/:id
Authorization: Bearer <token>
{
  "status": "published",
  "deadline": "2025-12-31"
}
```

---

## 📝 Applications

Base URL: `/api/applications`

| Method | Endpoint                | Description                             | Status    |
| ------ | ----------------------- | --------------------------------------- | --------- |
| GET    | `/api/applications`     | Get all applications (filtered by user) | ✅ Active |
| POST   | `/api/applications`     | Submit job application                  | ✅ Active |
| PUT    | `/api/applications/:id` | Update application status               | ✅ Active |

### Request Examples

**Get Applications:**

```http
# Candidate: Get my applications
GET /api/applications
Authorization: Bearer <candidate_token>

# Employer: Get applications for my jobs
GET /api/applications?jobId=507f1f77bcf86cd799439011&status=pending
Authorization: Bearer <employer_token>
```

**Submit Application:**

```json
POST /api/applications
Authorization: Bearer <token>
{
  "jobId": "507f1f77bcf86cd799439011",
  "cvId": "507f191e810c19729de860ea",
  "coverLetter": "I am very interested in this position...",
  "answers": [
    {
      "question": "Why do you want to work here?",
      "answer": "Because..."
    }
  ]
}
```

**Update Application Status:**

```json
PUT /api/applications/:id
Authorization: Bearer <employer_token>
{
  "status": "reviewing",
  "notes": "Good candidate, schedule interview"
}
```

---

## 🤖 AI/NLP

Base URL: `/api/ai`

| Method | Endpoint                        | Description                       | Status    |
| ------ | ------------------------------- | --------------------------------- | --------- |
| POST   | `/api/ai/match`                 | AI-powered candidate-job matching | ✅ Active |
| GET    | `/api/ai/matching-history`      | Get matching history              | ✅ Active |
| POST   | `/api/ai/parse-cv`              | Parse CV with NLP                 | ✅ Active |
| POST   | `/api/ai/parse-job-description` | Parse job description with NLP    | ✅ Active |

### Request Examples

**AI Matching:**

```json
POST /api/ai/match
Authorization: Bearer <token>
{
  "candidateId": "507f191e810c19729de860ea",
  "jobId": "507f1f77bcf86cd799439011"
}
```

**Response:**

```json
{
  "matchId": "507f191e810c19729de860eb",
  "overallScore": 0.85,
  "scoreBreakdown": {
    "skillMatch": 0.9,
    "experienceMatch": 0.8,
    "educationMatch": 0.85,
    "locationMatch": 1.0
  },
  "recommendations": [
    "Strong technical skills match",
    "Consider discussing career growth opportunities"
  ],
  "confidence": 0.88,
  "quality": "EXCELLENT"
}
```

**Parse CV:**

```json
POST /api/ai/parse-cv
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [CV PDF/DOCX file]
```

**Parse Job Description:**

```json
POST /api/ai/parse-job-description
Authorization: Bearer <token>
{
  "description": "We are looking for a Senior Developer with 5+ years experience in Node.js, React, and AWS..."
}
```

---

## 🎯 Skills & Roadmaps

Base URL: `/api/skills` & `/api/roadmaps`

| Method | Endpoint        | Description                  | Status    |
| ------ | --------------- | ---------------------------- | --------- |
| GET    | `/api/skills`   | Get all skills (with search) | ✅ Active |
| GET    | `/api/roadmaps` | Get learning roadmaps        | ✅ Active |
| POST   | `/api/roadmaps` | Create learning roadmap      | ✅ Active |

### Request Examples

**Get Skills:**

```http
GET /api/skills?search=javascript&category=programming
```

**Get Roadmaps:**

```http
GET /api/roadmaps?candidateId=507f191e810c19729de860ea
Authorization: Bearer <token>
```

**Create Roadmap:**

```json
POST /api/roadmaps
Authorization: Bearer <token>
{
  "candidateId": "507f191e810c19729de860ea",
  "targetJobTitle": "Senior Full-Stack Developer",
  "targetSkills": ["React", "Node.js", "AWS", "Docker"],
  "phases": [
    {
      "title": "Phase 1: Frontend Mastery",
      "description": "Master React and modern frontend",
      "skills": ["React", "TypeScript", "Redux"],
      "duration": 60,
      "order": 1
    },
    {
      "title": "Phase 2: Backend Development",
      "description": "Learn Node.js and databases",
      "skills": ["Node.js", "MongoDB", "PostgreSQL"],
      "duration": 90,
      "order": 2
    }
  ]
}
```

---

## 🔔 Notifications

Base URL: `/api/notifications`

| Method | Endpoint                       | Description                  | Status    |
| ------ | ------------------------------ | ---------------------------- | --------- |
| GET    | `/api/notifications`           | Get user notifications       | ✅ Active |
| POST   | `/api/notifications/mark-read` | Mark notification(s) as read | ✅ Active |

### Request Examples

**Get Notifications:**

```http
GET /api/notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer <token>
```

**Mark as Read:**

```json
POST /api/notifications/mark-read
Authorization: Bearer <token>
{
  "notificationIds": ["507f191e810c19729de860ea", "507f1f77bcf86cd799439011"]
}
```

---

## 💬 Chat

Base URL: `/api/chat`

| Method | Endpoint             | Description                  | Status    |
| ------ | -------------------- | ---------------------------- | --------- |
| GET    | `/api/chat/rooms`    | Get chat rooms/conversations | ✅ Active |
| POST   | `/api/chat/messages` | Send chat message            | ✅ Active |

### Request Examples

**Get Chat Rooms:**

```http
GET /api/chat/rooms
Authorization: Bearer <token>
```

**Send Message:**

```json
POST /api/chat/messages
Authorization: Bearer <token>
{
  "conversationId": "507f191e810c19729de860ea",
  "content": "Hello, I have a question about the position...",
  "type": "TEXT"
}
```

---

## 👨‍💼 Admin

Base URL: `/api/admin`

| Method | Endpoint               | Description                    | Status    |
| ------ | ---------------------- | ------------------------------ | --------- |
| GET    | `/api/admin/dashboard` | Get admin dashboard statistics | ✅ Active |
| GET    | `/api/admin/users`     | Get all users (admin only)     | ✅ Active |

### Request Examples

**Get Dashboard:**

```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "totalUsers": 1250,
  "totalCandidates": 980,
  "totalEmployers": 270,
  "totalJobs": 450,
  "totalApplications": 3200,
  "activeJobs": 320,
  "pendingApplications": 450
}
```

**Get All Users:**

```http
GET /api/admin/users?page=1&limit=50&role=candidate&status=active
Authorization: Bearer <admin_token>
```

---

## 🔧 System Information

### Platform Features

- ✅ AI-Powered Matching
- ✅ NLP Processing
- ✅ Skill Development
- ✅ Real-time Chat
- ✅ Advanced Search & Filtering
- ✅ Email Notifications
- ✅ OTP Verification

### Database

- **Status**: ✅ Connected Successfully
- **Type**: MongoDB
- **Connection**: Stable

### Redis

- **Status**: ✅ Connected Successfully
- **Use Cases**:
  - Session management
  - Caching
  - Queue management
  - OTP storage

### Services Status

- ✅ OTP Service: Initialized successfully
- ✅ Queue Service: Redis connected
- ✅ Email Service: Ready
- ✅ WebSocket: Available for real-time features

---

## 🔐 Authentication & Authorization

### Headers Required

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Response Format

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f191e810c19729de860ea",
    "email": "user@example.com",
    "role": "candidate",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Roles

1. **CANDIDATE**: Can apply for jobs, manage profile, view applications
2. **EMPLOYER**: Can post jobs, review applications, manage company
3. **ADMIN**: Full system access, user management, analytics

---

## 📊 Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "field": "fieldName" // if validation error
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🚦 HTTP Status Codes

| Code | Meaning               | Usage                    |
| ---- | --------------------- | ------------------------ |
| 200  | OK                    | Successful GET, PUT      |
| 201  | Created               | Successful POST          |
| 204  | No Content            | Successful DELETE        |
| 400  | Bad Request           | Validation error         |
| 401  | Unauthorized          | Missing/invalid token    |
| 403  | Forbidden             | Insufficient permissions |
| 404  | Not Found             | Resource not found       |
| 409  | Conflict              | Duplicate resource       |
| 500  | Internal Server Error | Server error             |

---

## 🧪 Testing

### Health Check

```http
GET http://localhost:3000/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T22:45:39.000Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected",
    "otp": "initialized"
  }
}
```

### API Documentation

Access Swagger/OpenAPI docs at:

```
http://localhost:3000/api-docs
```

---

## 📝 Notes

1. **All endpoints require authentication** except:

   - POST `/api/auth/register`
   - POST `/api/auth/login`
   - POST `/api/auth/login/google`
   - GET `/health`

2. **Rate Limiting**: Some endpoints may be rate-limited to prevent abuse

3. **File Uploads**: Use `multipart/form-data` for CV uploads and attachments

4. **WebSocket**: Real-time features available at `ws://localhost:3000`

5. **Environment**: Currently running in **development** mode

---

## 🔄 Updates & Maintenance

**Last Server Start**: November 5, 2025, 22:45:38  
**Node.js Version**: v22.14.0  
**Nodemon**: Watching for file changes

### Recent Changes

- ✅ All 20 domain entities migrated to Clean Architecture
- ✅ Complete mapper and repository layers implemented
- ✅ Zero errors on server startup
- ✅ All services initialized successfully

---

## 📞 Support

For API support or questions:

- **Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Repository**: internship-recruitment-platform

---

**Generated**: November 5, 2025  
**Server Status**: ✅ **ACTIVE & RUNNING**  
**Total Endpoints**: 34 Active
