# 📋 Cấu trúc API - Internship AI Platform

## 🏗️ Tổng quan kiến trúc

```
Base URL: http://localhost:3000
API URL: http://localhost:3000/api
Documentation: http://localhost:3000/api-docs
```

## 🔐 Authentication

### **Base URL**: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/register` | Đăng ký user mới | ❌ |
| `POST` | `/login` | Đăng nhập | ❌ |
| `GET` | `/me` | Lấy thông tin user hiện tại | ✅ |
| `PUT` | `/profile` | Cập nhật profile | ✅ |
| `PUT` | `/password` | Đổi mật khẩu | ✅ |
| `POST` | `/forgot-password` | Quên mật khẩu | ❌ |
| `PUT` | `/reset-password` | Reset mật khẩu | ❌ |
| `POST` | `/logout` | Đăng xuất | ✅ |

## 🤖 AI Services

### **Base URL**: `/api/ai`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/analyze-cv` | Phân tích CV | ✅ |
| `POST` | `/job-recommendations` | Gợi ý việc làm | ✅ |
| `POST` | `/skill-roadmap` | Tạo roadmap kỹ năng | ✅ |
| `POST` | `/analyze-job/:id` | Phân tích job posting | ✅ |
| `POST` | `/application-match/:id` | Phân tích match application | ✅ |
| `GET` | `/insights` | AI insights cho dashboard | ✅ |

## 💼 Job Management

### **Base URL**: `/api/jobs`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `GET` | `/` | Lấy danh sách jobs | ❌ | - |
| `GET` | `/:id` | Lấy chi tiết job | ❌ | - |
| `POST` | `/` | Tạo job mới | ✅ | employer/admin |
| `PUT` | `/:id` | Cập nhật job | ✅ | employer/admin |
| `DELETE` | `/:id` | Xóa job | ✅ | employer/admin |

## 📝 Application Management

### **Base URL**: `/api/applications`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `GET` | `/` | Lấy danh sách applications | ✅ | - |
| `GET` | `/:id` | Lấy chi tiết application | ✅ | - |
| `POST` | `/` | Nộp application | ✅ | student |
| `PUT` | `/:id` | Cập nhật application | ✅ | - |
| `DELETE` | `/:id` | Xóa application | ✅ | - |

## 👥 User Management

### **Base URL**: `/api/users`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `GET` | `/` | Lấy danh sách users | ✅ | admin |
| `GET` | `/:id` | Lấy chi tiết user | ✅ | - |
| `POST` | `/` | Tạo user mới | ✅ | admin |
| `PUT` | `/:id` | Cập nhật user | ✅ | admin |
| `DELETE` | `/:id` | Xóa user | ✅ | admin |

## 📊 Analytics

### **Base URL**: `/api/analytics`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| `GET` | `/dashboard` | Dashboard analytics | ✅ | - |
| `GET` | `/applications` | Application statistics | ✅ | - |
| `GET` | `/jobs` | Job statistics | ✅ | - |
| `GET` | `/users` | User statistics | ✅ | admin |

## 🗺️ Skill Roadmaps

### **Base URL**: `/api/roadmaps`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Lấy danh sách roadmaps | ✅ |
| `GET` | `/:id` | Lấy chi tiết roadmap | ✅ |
| `POST` | `/` | Tạo roadmap mới | ✅ |
| `PUT` | `/:id` | Cập nhật roadmap | ✅ |
| `DELETE` | `/:id` | Xóa roadmap | ✅ |

## 🔧 System Endpoints

### **Base URL**: `/`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check | ❌ |

## 📋 Request/Response Examples

### **1. Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "123456",
  "firstName": "Nguyen Van",
  "lastName": "A",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "student@example.com",
    "firstName": "Nguyen Van",
    "lastName": "A",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **2. Analyze CV**
```http
POST /api/ai/analyze-cv
Authorization: Bearer <token>
Content-Type: application/json

{
  "cvText": "Nguyen Van A\nComputer Science Student\nSkills: JavaScript, React, Node.js",
  "jobId": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "name": "javascript",
        "level": "intermediate",
        "confidence": 0.9
      },
      {
        "name": "react",
        "level": "beginner",
        "confidence": 0.8
      }
    ],
    "matchScore": {
      "skills": 0.85,
      "experience": 0.7,
      "education": 0.9,
      "keywords": 0.8,
      "overall": 0.81
    },
    "skillGaps": [
      {
        "skill": "Docker",
        "required": true,
        "level": "beginner",
        "importance": 0.9
      }
    ]
  }
}
```

### **3. Create Job**
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Frontend Developer Intern",
  "company": "Tech Solutions Inc.",
  "description": "We are looking for a talented Frontend Developer Intern...",
  "requirements": "- Knowledge of JavaScript, HTML, CSS\n- Basic understanding of React",
  "location": "Ho Chi Minh City",
  "type": "internship",
  "salary": {
    "min": 5000000,
    "max": 8000000,
    "currency": "VND",
    "period": "monthly"
  },
  "skills": [
    {
      "name": "JavaScript",
      "required": true,
      "level": "intermediate"
    }
  ],
  "categories": ["technology"],
  "status": "active"
}
```

## 🔐 Authentication

### **JWT Token**
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 30 days (configurable)

### **User Roles**
- `student`: Sinh viên/ứng viên
- `employer`: Nhà tuyển dụng
- `admin`: Quản trị viên

## 📊 Response Format

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack trace (development only)"
}
```

### **Paginated Response**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## 🔍 Query Parameters

### **Common Parameters**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (e.g., "createdAt", "-createdAt")
- `search`: Search term

### **Job Filters**
- `status`: Job status (draft, active, paused, closed, expired)
- `type`: Job type (full-time, part-time, internship, contract)
- `location`: Job location
- `categories`: Job categories (technology, business, marketing, etc.)
- `isRemote`: Remote work (true/false)

### **Application Filters**
- `status`: Application status (pending, reviewing, shortlisted, etc.)
- `job`: Job ID
- `applicant`: Applicant ID

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource not found |
| `409` | Conflict - Resource already exists |
| `422` | Unprocessable Entity - Validation error |
| `500` | Internal Server Error - Server error |

## 📈 Performance Metrics

### **Response Times**
- Health Check: < 100ms
- Authentication: < 200ms
- CRUD Operations: < 500ms
- AI Analysis: < 10 seconds
- File Upload: < 30 seconds

### **Rate Limiting**
- 100 requests per 15 minutes per IP
- 1000 requests per hour per user

## 🔧 Environment Variables

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/internship-ai-platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

## 📚 Documentation

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`
- **Postman Collection**: `postman_collection.json`
- **Environment**: `postman_environment.json`

---

**Tổng cộng: 25+ API endpoints** 🚀
