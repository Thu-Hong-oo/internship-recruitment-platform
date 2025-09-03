# 📋 Cấu trúc API - InternBridge AI Platform

## 🏗️ Tổng quan kiến trúc

```
Base URL: http://localhost:3000
API URL: http://localhost:3000/api
Documentation: http://localhost:3000/api-docs
WebSocket: ws://localhost:3000
```

## 🔐 Authentication & Authorization

### **Base URL**: `/api/auth`

| Method | Endpoint               | Description                 | Auth Required | Role Required |
| ------ | ---------------------- | --------------------------- | ------------- | ------------- |
| `POST` | `/register`            | Đăng ký user mới            | ❌            | -             |
| `POST` | `/login`               | Đăng nhập                   | ❌            | -             |
| `POST` | `/verify-email`        | Xác thực email bằng OTP     | ❌            | -             |
| `POST` | `/resend-verification` | Gửi lại email xác thực      | ❌            | -             |
| `POST` | `/forgot-password`     | Quên mật khẩu               | ❌            | -             |
| `POST` | `/reset-password`      | Reset mật khẩu bằng OTP     | ❌            | -             |
| `POST` | `/refresh-token`       | Refresh access token        | ✅            | -             |
| `POST` | `/logout`              | Đăng xuất                   | ✅            | -             |
| `GET`  | `/me`                  | Lấy thông tin user hiện tại | ✅            | -             |
| `POST` | `/google`              | Đăng nhập bằng Google       | ❌            | -             |

---

## 👥 User Management

### **Base URL**: `/api/users`

| Method | Endpoint         | Description              | Auth Required | Role Required |
| ------ | ---------------- | ------------------------ | ------------- | ------------- |
| `GET`  | `/:id`           | Lấy chi tiết user        | ✅            | -             |
| `PUT`  | `/profile`       | Cập nhật profile cá nhân | ✅            | -             |
| `PUT`  | `/password`      | Đổi mật khẩu             | ✅            | -             |
| `POST` | `/upload-avatar` | Upload avatar            | ✅            | -             |

### **Candidate Profile Management**

| Method   | Endpoint                     | Description               | Auth Required | Role Required |
| -------- | ---------------------------- | ------------------------- | ------------- | ------------- |
| `GET`    | `/candidate/profile`         | Lấy profile ứng viên      | ✅            | student       |
| `POST`   | `/candidate/profile`         | Tạo profile ứng viên      | ✅            | student       |
| `PUT`    | `/candidate/profile`         | Cập nhật profile ứng viên | ✅            | student       |
| `POST`   | `/candidate/resume`          | Upload CV/Resume          | ✅            | student       |
| `DELETE` | `/candidate/resume`          | Xóa CV/Resume             | ✅            | student       |
| `GET`    | `/candidate/skills`          | Lấy skills của ứng viên   | ✅            | student       |
| `POST`   | `/candidate/skills`          | Thêm skills               | ✅            | student       |
| `PUT`    | `/candidate/skills/:skillId` | Cập nhật skill level      | ✅            | student       |
| `DELETE` | `/candidate/skills/:skillId` | Xóa skill                 | ✅            | student       |

### **Employer Profile Management**

| Method | Endpoint            | Description                     | Auth Required | Role Required |
| ------ | ------------------- | ------------------------------- | ------------- | ------------- |
| `GET`  | `/employer/profile` | Lấy profile nhà tuyển dụng      | ✅            | employer      |
| `POST` | `/employer/profile` | Tạo profile nhà tuyển dụng      | ✅            | employer      |
| `PUT`  | `/employer/profile` | Cập nhật profile nhà tuyển dụng | ✅            | employer      |

---

## 🔧 Admin Management

### **Base URL**: `/api/admin`

| Method   | Endpoint             | Description                    | Auth Required | Role Required |
| -------- | -------------------- | ------------------------------ | ------------- | ------------- |
| `GET`    | `/users`             | Lấy danh sách users với filter | ✅            | admin         |
| `GET`    | `/users/:id`         | Lấy chi tiết user              | ✅            | admin         |
| `POST`   | `/users`             | Tạo user mới                   | ✅            | admin         |
| `PUT`    | `/users/:id`         | Cập nhật user                  | ✅            | admin         |
| `DELETE` | `/users/:id`         | Xóa user                       | ✅            | admin         |
| `PUT`    | `/users/:id/status`  | Cập nhật trạng thái user       | ✅            | admin         |
| `GET`    | `/dashboard`         | Dashboard stats                | ✅            | admin         |
| `GET`    | `/analytics/users`   | User analytics                 | ✅            | admin         |
| `GET`    | `/verifications`     | Pending employer verifications | ✅            | admin         |
| `PUT`    | `/verifications/:id` | Verify employer                | ✅            | admin         |
| `GET`    | `/system/health`     | System health check            | ✅            | admin         |
| `GET`    | `/system/logs`       | System logs                    | ✅            | admin         |

---

## 🏢 Company Management

### **Base URL**: `/api/companies`

| Method   | Endpoint      | Description             | Auth Required | Role Required  |
| -------- | ------------- | ----------------------- | ------------- | -------------- |
| `GET`    | `/`           | Lấy danh sách companies | ❌            | -              |
| `GET`    | `/:id`        | Lấy chi tiết company    | ❌            | -              |
| `POST`   | `/`           | Tạo company mới         | ✅            | employer/admin |
| `PUT`    | `/:id`        | Cập nhật company        | ✅            | employer/admin |
| `DELETE` | `/:id`        | Xóa company             | ✅            | admin          |
| `POST`   | `/:id/logo`   | Upload logo company     | ✅            | employer/admin |
| `POST`   | `/:id/verify` | Verify company (admin)  | ✅            | admin          |
| `GET`    | `/search`     | Tìm kiếm companies      | ❌            | -              |

---

## 💼 Job Management

### **Base URL**: `/api/jobs`

| Method   | Endpoint         | Description                  | Auth Required | Role Required  |
| -------- | ---------------- | ---------------------------- | ------------- | -------------- |
| `GET`    | `/`              | Lấy danh sách internships    | ❌            | -              |
| `GET`    | `/:id`           | Lấy chi tiết internship      | ❌            | -              |
| `POST`   | `/`              | Tạo internship mới           | ✅            | employer/admin |
| `PUT`    | `/:id`           | Cập nhật internship          | ✅            | employer/admin |
| `DELETE` | `/:id`           | Xóa internship               | ✅            | employer/admin |
| `POST`   | `/:id/duplicate` | Duplicate internship         | ✅            | employer/admin |
| `PUT`    | `/:id/status`    | Cập nhật trạng thái          | ✅            | employer/admin |
| `POST`   | `/:id/feature`   | Feature/Unfeature internship | ✅            | admin          |
| `GET`    | `/search`        | Tìm kiếm internships         | ❌            | -              |
| `GET`    | `/recommended`   | Internships được gợi ý       | ✅            | student        |
| `GET`    | `/similar/:id`   | Internships tương tự         | ❌            | -              |
| `POST`   | `/:id/save`      | Lưu internship               | ✅            | student        |
| `DELETE` | `/:id/save`      | Bỏ lưu internship            | ✅            | student        |
| `GET`    | `/saved`         | Internships đã lưu           | ✅            | student        |

### **Job Analytics (Employer)**

| Method | Endpoint                  | Description              | Auth Required | Role Required |
| ------ | ------------------------- | ------------------------ | ------------- | ------------- |
| `GET`  | `/analytics/overview`     | Tổng quan analytics      | ✅            | employer      |
| `GET`  | `/analytics/:jobId`       | Analytics cho job cụ thể | ✅            | employer      |
| `GET`  | `/analytics/applications` | Thống kê applications    | ✅            | employer      |

---

## 📝 Application Management

### **Base URL**: `/api/applications`

| Method   | Endpoint           | Description                | Auth Required | Role Required  |
| -------- | ------------------ | -------------------------- | ------------- | -------------- |
| `GET`    | `/`                | Lấy danh sách applications | ✅            | -              |
| `GET`    | `/:id`             | Lấy chi tiết application   | ✅            | -              |
| `POST`   | `/`                | Nộp application            | ✅            | student        |
| `PUT`    | `/:id`             | Cập nhật application       | ✅            | -              |
| `DELETE` | `/:id`             | Rút application            | ✅            | student        |
| `PUT`    | `/:id/status`      | Cập nhật trạng thái        | ✅            | employer/admin |
| `POST`   | `/:id/interview`   | Lên lịch phỏng vấn         | ✅            | employer       |
| `PUT`    | `/:id/interview`   | Cập nhật lịch phỏng vấn    | ✅            | employer       |
| `POST`   | `/:id/feedback`    | Thêm feedback              | ✅            | employer       |
| `GET`    | `/my-applications` | Applications của tôi       | ✅            | student        |
| `GET`    | `/job/:jobId`      | Applications cho job       | ✅            | employer       |

### **Application Analytics**

| Method | Endpoint              | Description            | Auth Required | Role Required |
| ------ | --------------------- | ---------------------- | ------------- | ------------- |
| `GET`  | `/analytics/student`  | Analytics cho student  | ✅            | student       |
| `GET`  | `/analytics/employer` | Analytics cho employer | ✅            | employer      |

---

## 🤖 AI Services

### **Base URL**: `/api/ai`

| Method | Endpoint                      | Description                | Auth Required | Role Required |
| ------ | ----------------------------- | -------------------------- | ------------- | ------------- |
| `POST` | `/analyze-cv`                 | Phân tích CV/Resume        | ✅            | student       |
| `POST` | `/analyze-job`                | Phân tích Job Description  | ✅            | employer      |
| `POST` | `/job-matching`               | Matching job với candidate | ✅            | student       |
| `POST` | `/candidate-matching`         | Matching candidate với job | ✅            | employer      |
| `POST` | `/skill-extraction`           | Trích xuất skills từ text  | ✅            | -             |
| `POST` | `/skill-normalization`        | Chuẩn hóa skill names      | ✅            | -             |
| `GET`  | `/recommendations/jobs`       | Job recommendations        | ✅            | student       |
| `GET`  | `/recommendations/candidates` | Candidate recommendations  | ✅            | employer      |
| `GET`  | `/insights/dashboard`         | AI insights cho dashboard  | ✅            | -             |

---

## 🗺️ Skill Roadmap

### **Base URL**: `/api/roadmaps`

| Method   | Endpoint                               | Description            | Auth Required | Role Required |
| -------- | -------------------------------------- | ---------------------- | ------------- | ------------- |
| `GET`    | `/`                                    | Lấy danh sách roadmaps | ✅            | student       |
| `GET`    | `/:id`                                 | Lấy chi tiết roadmap   | ✅            | student       |
| `POST`   | `/`                                    | Tạo roadmap mới        | ✅            | student       |
| `PUT`    | `/:id`                                 | Cập nhật roadmap       | ✅            | student       |
| `DELETE` | `/:id`                                 | Xóa roadmap            | ✅            | student       |
| `POST`   | `/:id/generate`                        | Tạo roadmap từ job     | ✅            | student       |
| `PUT`    | `/:id/progress`                        | Cập nhật tiến độ       | ✅            | student       |
| `POST`   | `/:id/milestone/:milestoneId/complete` | Hoàn thành milestone   | ✅            | student       |
| `GET`    | `/analytics`                           | Analytics roadmaps     | ✅            | student       |

---

## 🎯 Skills Management

### **Base URL**: `/api/skills`

| Method   | Endpoint            | Description                   | Auth Required | Role Required |
| -------- | ------------------- | ----------------------------- | ------------- | ------------- |
| `GET`    | `/`                 | Lấy danh sách skills          | ❌            | -             |
| `GET`    | `/:id`              | Lấy chi tiết skill            | ❌            | -             |
| `POST`   | `/`                 | Tạo skill mới (admin)         | ✅            | admin         |
| `PUT`    | `/:id`              | Cập nhật skill (admin)        | ✅            | admin         |
| `DELETE` | `/:id`              | Xóa skill (admin)             | ✅            | admin         |
| `GET`    | `/categories`       | Lấy danh sách categories      | ❌            | -             |
| `GET`    | `/popular`          | Skills phổ biến               | ❌            | -             |
| `GET`    | `/search`           | Tìm kiếm skills               | ❌            | -             |
| `GET`    | `/related/:skillId` | Skills liên quan              | ❌            | -             |
| `POST`   | `/bulk-import`      | Import skills từ file (admin) | ✅            | admin         |

---

## 📊 Analytics & Dashboard

### **Base URL**: `/api/analytics`

| Method | Endpoint          | Description                     | Auth Required | Role Required  |
| ------ | ----------------- | ------------------------------- | ------------- | -------------- |
| `GET`  | `/dashboard`      | Dashboard tổng quan             | ✅            | -              |
| `GET`  | `/jobs`           | Thống kê jobs                   | ✅            | employer/admin |
| `GET`  | `/applications`   | Thống kê applications           | ✅            | -              |
| `GET`  | `/users`          | Thống kê users (admin)          | ✅            | admin          |
| `GET`  | `/skills`         | Thống kê skills                 | ✅            | -              |
| `GET`  | `/ai-performance` | Thống kê AI performance (admin) | ✅            | admin          |
| `GET`  | `/trends`         | Xu hướng thị trường             | ✅            | -              |

---

## 🔔 Notifications

### **Base URL**: `/api/notifications`

| Method   | Endpoint     | Description                    | Auth Required | Role Required |
| -------- | ------------ | ------------------------------ | ------------- | ------------- |
| `GET`    | `/`          | Lấy danh sách notifications    | ✅            | -             |
| `GET`    | `/unread`    | Notifications chưa đọc         | ✅            | -             |
| `PUT`    | `/:id/read`  | Đánh dấu đã đọc                | ✅            | -             |
| `PUT`    | `/read-all`  | Đánh dấu tất cả đã đọc         | ✅            | -             |
| `DELETE` | `/:id`       | Xóa notification               | ✅            | -             |
| `DELETE` | `/clear-all` | Xóa tất cả notifications       | ✅            | -             |
| `PUT`    | `/settings`  | Cập nhật notification settings | ✅            | -             |

---

## 💬 Messaging

### **Base URL**: `/api/messages`

| Method   | Endpoint                    | Description                     | Auth Required | Role Required |
| -------- | --------------------------- | ------------------------------- | ------------- | ------------- |
| `GET`    | `/conversations`            | Lấy danh sách conversations     | ✅            | -             |
| `GET`    | `/conversations/:id`        | Lấy messages trong conversation | ✅            | -             |
| `POST`   | `/conversations/:id`        | Gửi message                     | ✅            | -             |
| `PUT`    | `/:id/read`                 | Đánh dấu message đã đọc         | ✅            | -             |
| `DELETE` | `/:id`                      | Xóa message                     | ✅            | -             |
| `POST`   | `/conversations/:id/typing` | Typing indicator                | ✅            | -             |

---

## 📁 File Management

### **Base URL**: `/api/files`

| Method   | Endpoint               | Description         | Auth Required | Role Required |
| -------- | ---------------------- | ------------------- | ------------- | ------------- |
| `POST`   | `/upload`              | Upload file         | ✅            | -             |
| `POST`   | `/upload/resume`       | Upload resume       | ✅            | student       |
| `POST`   | `/upload/avatar`       | Upload avatar       | ✅            | -             |
| `POST`   | `/upload/company-logo` | Upload company logo | ✅            | employer      |
| `DELETE` | `/:id`                 | Xóa file            | ✅            | -             |
| `GET`    | `/:id`                 | Download file       | ✅            | -             |

---

## 🔧 Admin Management

### **Base URL**: `/api/admin`

| Method | Endpoint                | Description              | Auth Required | Role Required |
| ------ | ----------------------- | ------------------------ | ------------- | ------------- |
| `GET`  | `/dashboard`            | Admin dashboard          | ✅            | admin         |
| `GET`  | `/users`                | Quản lý users            | ✅            | admin         |
| `PUT`  | `/users/:id/status`     | Cập nhật trạng thái user | ✅            | admin         |
| `GET`  | `/companies`            | Quản lý companies        | ✅            | admin         |
| `PUT`  | `/companies/:id/verify` | Verify company           | ✅            | admin         |
| `GET`  | `/jobs`                 | Quản lý jobs             | ✅            | admin         |
| `PUT`  | `/jobs/:id/feature`     | Feature/unfeature job    | ✅            | admin         |
| `GET`  | `/applications`         | Quản lý applications     | ✅            | admin         |
| `GET`  | `/ai-logs`              | AI processing logs       | ✅            | admin         |
| `GET`  | `/system-stats`         | System statistics        | ✅            | admin         |
| `POST` | `/backup`               | Tạo backup database      | ✅            | admin         |
| `POST` | `/send-email`           | Gửi email thông báo      | ✅            | admin         |

---

## 🔍 Search & Discovery

### **Base URL**: `/api/search`

| Method | Endpoint       | Description                    | Auth Required | Role Required |
| ------ | -------------- | ------------------------------ | ------------- | ------------- |
| `GET`  | `/jobs`        | Tìm kiếm jobs                  | ❌            | -             |
| `GET`  | `/companies`   | Tìm kiếm companies             | ❌            | -             |
| `GET`  | `/skills`      | Tìm kiếm skills                | ❌            | -             |
| `GET`  | `/candidates`  | Tìm kiếm candidates (employer) | ✅            | employer      |
| `GET`  | `/suggestions` | Gợi ý tìm kiếm                 | ❌            | -             |

---

## 📋 Request/Response Examples

### **1. Register Student**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "Nguyen Van",
  "lastName": "A",
  "role": "student",
  "profile": {
    "student": {
      "university": "FPT University",
      "major": "Computer Science",
      "year": 3,
      "gpa": 3.2
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "student@example.com",
    "profile": {
      "firstName": "Nguyen Van",
      "lastName": "A",
      "student": {
        "university": "FPT University",
        "major": "Computer Science",
        "year": 3,
        "gpa": 3.2
      }
    },
    "role": "student",
    "isEmailVerified": false
  }
}
```

### **2. Create Internship**

```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Frontend Developer Intern",
  "companyId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "internship": {
    "type": "summer",
    "duration": 3,
    "startDate": "2024-06-01",
    "isPaid": true,
    "stipend": {
      "amount": 5000000,
      "currency": "VND",
      "period": "month"
    },
    "remoteOption": true
  },
  "requirements": {
    "education": {
      "level": "Bachelor",
      "majors": ["Computer Science", "Information Technology"],
      "year": [2, 3, 4],
      "minGpa": 3.0
    },
    "skills": [
      {
        "skillId": "64f8a1b2c3d4e5f6a7b8c9d2",
        "level": "required",
        "importance": 9
      }
    ],
    "experience": {
      "minMonths": 0,
      "projectBased": true
    }
  },
  "description": "We are looking for a talented Frontend Developer Intern...",
  "responsibilities": [
    "Develop responsive web applications",
    "Collaborate with design team"
  ],
  "benefits": [
    "Mentorship from senior developers",
    "Real-world project experience"
  ],
  "learningOutcomes": [
    "Master React.js framework",
    "Learn modern web development practices"
  ],
  "location": {
    "city": "Ho Chi Minh",
    "remote": true,
    "hybrid": true
  }
}
```

### **3. AI Job Matching**

```http
POST /api/ai/job-matching
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "includeRoadmap": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "breakdown": {
      "skills": {
        "score": 90,
        "matchedSkills": [
          {
            "skillId": "64f8a1b2c3d4e5f6a7b8c9d2",
            "name": "React",
            "userLevel": "intermediate",
            "requiredLevel": "beginner",
            "match": 95
          }
        ],
        "missingSkills": [
          {
            "skillId": "64f8a1b2c3d4e5f6a7b8c9d4",
            "name": "TypeScript",
            "priority": 8,
            "estimatedTime": 4
          }
        ]
      },
      "experience": {
        "score": 75,
        "analysis": "Có kinh nghiệm project-based phù hợp"
      },
      "education": {
        "score": 95,
        "analysis": "Chuyên ngành và GPA phù hợp"
      }
    },
    "roadmap": {
      "duration": 8,
      "skillGaps": [
        {
          "skillId": "64f8a1b2c3d4e5f6a7b8c9d4",
          "name": "TypeScript",
          "currentLevel": "none",
          "targetLevel": "beginner",
          "priority": 8,
          "estimatedTime": 4
        }
      ],
      "milestones": [
        {
          "week": 1,
          "title": "Học TypeScript cơ bản",
          "skills": ["64f8a1b2c3d4e5f6a7b8c9d4"],
          "resources": [
            {
              "type": "course",
              "title": "TypeScript Fundamentals",
              "url": "https://example.com/course",
              "duration": 10
            }
          ]
        }
      ]
    }
  }
}
```

### **4. Create Skill Roadmap**

```http
POST /api/roadmaps
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetJobId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "name": "Frontend Developer Roadmap"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "targetJobId": "64f8a1b2c3d4e5f6a7b8c9d3",
    "name": "Frontend Developer Roadmap",
    "duration": 8,
    "skillGaps": [...],
    "roadmap": {
      "milestones": [...]
    },
    "progress": {
      "currentWeek": 1,
      "overallProgress": 12,
      "completedMilestones": []
    }
  }
}
```

---

## 🔐 Authentication & Authorization

### **JWT Token Structure**

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "student|employer|admin",
  "iat": 1640995200,
  "exp": 1643587200
}
```

### **Role Permissions**

#### **Student**

- Xem và apply jobs
- Quản lý profile và skills
- Tạo và theo dõi roadmaps
- Nhận AI recommendations
- Quản lý applications

#### **Employer**

- Quản lý company profile
- Tạo và quản lý jobs
- Xem và quản lý applications
- Nhận candidate recommendations
- Analytics cho jobs

#### **Admin**

- Quản lý toàn bộ hệ thống
- Verify companies và users
- Feature/unfeature jobs
- Xem system analytics
- Quản lý AI logs

---

## 📊 Response Format

### **Success Response**

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### **Error Response**

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "details": {
    // Additional error details
  }
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
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🔍 Query Parameters

### **Common Parameters**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (e.g., "createdAt", "-createdAt")
- `search`: Search term
- `filter`: JSON filter object

### **Job Filters**

- `status`: active, closed, draft, expired
- `type`: summer, semester, year-round, project-based
- `location`: City name
- `remote`: true/false
- `paid`: true/false
- `duration`: min-max months
- `skills`: Array of skill IDs

### **Application Filters**

- `status`: pending, reviewing, shortlisted, interview, accepted, rejected
- `jobId`: Job ID
- `dateRange`: startDate-endDate

---

## 🚨 Error Codes

| Code  | Description           | Example                  |
| ----- | --------------------- | ------------------------ |
| `400` | Bad Request           | Invalid input data       |
| `401` | Unauthorized          | Missing or invalid token |
| `403` | Forbidden             | Insufficient permissions |
| `404` | Not Found             | Resource not found       |
| `409` | Conflict              | Resource already exists  |
| `422` | Unprocessable Entity  | Validation error         |
| `429` | Too Many Requests     | Rate limit exceeded      |
| `500` | Internal Server Error | Server error             |

### **Custom Error Codes**

- `EMAIL_NOT_VERIFIED`: Email chưa xác thực
- `INSUFFICIENT_PERMISSIONS`: Không đủ quyền
- `RESOURCE_NOT_FOUND`: Tài nguyên không tồn tại
- `VALIDATION_ERROR`: Lỗi validation
- `AI_PROCESSING_ERROR`: Lỗi xử lý AI

---

## 📈 Performance Metrics

### **Response Times**

- Health Check: < 100ms
- Authentication: < 200ms
- CRUD Operations: < 500ms
- AI Analysis: < 10 seconds
- File Upload: < 30 seconds
- Search Operations: < 1 second

### **Rate Limiting**

- Public endpoints: 100 requests/15min per IP
- Authenticated endpoints: 1000 requests/hour per user
- AI endpoints: 50 requests/hour per user
- File upload: 10 files/hour per user

---

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000/api

# Database
MONGO_URI=mongodb://localhost:27017/internbridge-ai
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=90d

# AI Services
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-3-large

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

---

## 📚 Documentation & Testing

### **API Documentation**

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI Spec**: `http://localhost:3000/api-docs.json`
- **Postman Collection**: `postman_collection.json`
- **Postman Environment**: `postman_environment.json`

### **Testing**

- **Health Check**: `http://localhost:3000/health`
- **API Status**: `http://localhost:3000/api/status`
- **Test Endpoints**: `/api/test/*`

---

## 🚀 Deployment

### **Production Checklist**

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] AI models deployed
- [ ] File storage configured

---

**Tổng cộng: 80+ API endpoints** 🚀

**Coverage:**

- ✅ Authentication & Authorization
- ✅ User Management (Student/Employer/Admin)
- ✅ Company Management
- ✅ Job Management
- ✅ Application Management
- ✅ AI Services
- ✅ Skill Roadmap
- ✅ Skills Management
- ✅ Analytics & Dashboard
- ✅ Notifications
- ✅ Messaging
- ✅ File Management
- ✅ Admin Management
- ✅ Search & Discovery
