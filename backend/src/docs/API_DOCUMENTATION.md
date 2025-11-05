# Tai lieu API

## Tong quan

API cua Internship Recruitment Platform su dung RESTful design voi JSON responses. Tat ca endpoints deu yeu cau authentication tru khi co ghi chu khac.

## Authentication

### JWT Token

Tat ca API calls (tru login/register) can bao gom JWT token trong header:

```
Authorization: Bearer <your-jwt-token>
```

### Login de lay token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "CANDIDATE"
    },
    "token": "jwt-token-here"
  }
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    /* additional error info */
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    /* array of items */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## API Endpoints

## Authentication APIs

### POST /api/auth/register

Dang ky tai khoan moi

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123@",
  "fullName": "John Doe",
  "role": "CANDIDATE" // CANDIDATE | EMPLOYER
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "CANDIDATE"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/auth/login

Dang nhap

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123@"
}
```

### POST /api/auth/forgot-password

Quen mat khau

**Request:**

```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password

Dat lai mat khau

**Request:**

```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123@"
}
```

## Job APIs

### GET /api/jobs

Lay danh sach jobs

**Query Parameters:**

- `page` (number): Trang (default: 1)
- `limit` (number): So item/trang (default: 10)
- `search` (string): Tu khoa tim kiem
- `location` (string): Dia diem
- `salary_min` (number): Luong toi thieu
- `salary_max` (number): Luong toi da

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "job-id",
      "title": "Software Engineer",
      "description": "Job description...",
      "company": {
        "id": "company-id",
        "name": "Tech Company",
        "logo": "logo-url"
      },
      "location": "Ho Chi Minh City",
      "salary": {
        "min": 1000,
        "max": 2000,
        "currency": "USD"
      },
      "requirements": ["JavaScript", "React", "Node.js"],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### GET /api/jobs/:id

Lay chi tiet job

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "job-id",
    "title": "Software Engineer",
    "description": "Detailed job description...",
    "company": {
      "id": "company-id",
      "name": "Tech Company",
      "description": "Company description...",
      "website": "https://company.com",
      "location": "Ho Chi Minh City"
    },
    "location": "Ho Chi Minh City",
    "type": "FULL_TIME",
    "experience": "2-3 years",
    "salary": {
      "min": 1000,
      "max": 2000,
      "currency": "USD"
    },
    "requirements": ["JavaScript", "React", "Node.js"],
    "benefits": ["Health insurance", "Flexible hours"],
    "applicationDeadline": "2025-12-31T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### POST /api/jobs

Tao job moi (EMPLOYER only)

**Request:**

```json
{
  "title": "Software Engineer",
  "description": "Job description...",
  "location": "Ho Chi Minh City",
  "type": "FULL_TIME",
  "experience": "2-3 years",
  "salary": {
    "min": 1000,
    "max": 2000,
    "currency": "USD"
  },
  "requirements": ["JavaScript", "React", "Node.js"],
  "benefits": ["Health insurance", "Flexible hours"],
  "applicationDeadline": "2025-12-31"
}
```

### PUT /api/jobs/:id

Cap nhat job (EMPLOYER only)

### DELETE /api/jobs/:id

Xoa job (EMPLOYER only)

## Application APIs

### GET /api/applications

Lay danh sach applications (EMPLOYER: cua cong ty, CANDIDATE: cua minh)

**Query Parameters:**

- `status` (string): PENDING | ACCEPTED | REJECTED | WITHDRAWN

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "application-id",
      "job": {
        "id": "job-id",
        "title": "Software Engineer",
        "company": {
          "name": "Tech Company"
        }
      },
      "candidate": {
        "id": "candidate-id",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "status": "PENDING",
      "appliedAt": "2025-01-01T00:00:00.000Z",
      "coverLetter": "Cover letter text...",
      "cv": {
        "filename": "cv.pdf",
        "url": "cv-url"
      }
    }
  ]
}
```

### POST /api/applications

Ung tuyen job (CANDIDATE only)

**Request:**

```json
{
  "jobId": "job-id",
  "coverLetter": "Why I'm suitable for this position...",
  "cv": "cv-file" // File upload
}
```

### PUT /api/applications/:id/status

Cap nhat trang thai application (EMPLOYER only)

**Request:**

```json
{
  "status": "ACCEPTED", // ACCEPTED | REJECTED
  "feedback": "We'd like to schedule an interview..."
}
```

## Company APIs

### GET /api/companies

Lay danh sach companies

### GET /api/companies/:id

Lay chi tiet company

### POST /api/companies

Tao company moi (EMPLOYER only)

**Request:**

```json
{
  "name": "Tech Company",
  "description": "Company description...",
  "website": "https://company.com",
  "location": "Ho Chi Minh City",
  "industry": "Technology",
  "size": "50-100 employees",
  "logo": "logo-file" // File upload
}
```

### PUT /api/companies/:id

Cap nhat company (EMPLOYER only)

## Candidate APIs

### GET /api/candidates/profile

Lay profile cua candidate

### PUT /api/candidates/profile

Cap nhat profile candidate

**Request:**

```json
{
  "fullName": "John Doe",
  "phone": "+84 123 456 789",
  "location": "Ho Chi Minh City",
  "experience": "2 years",
  "skills": ["JavaScript", "React", "Node.js"],
  "education": [
    {
      "degree": "Bachelor",
      "field": "Computer Science",
      "school": "University of Technology",
      "year": 2020
    }
  ],
  "cv": "cv-file" // File upload
}
```

## AI Matching APIs

### POST /api/ai/match

AI matching candidate voi job

**Request:**

```json
{
  "candidateId": "candidate-id",
  "jobId": "job-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matchScore": 85,
    "skillMatch": {
      "score": 90,
      "matchedSkills": ["JavaScript", "React"],
      "missingSkills": ["TypeScript"]
    },
    "experienceMatch": {
      "score": 80,
      "required": "2-3 years",
      "candidate": "2 years"
    },
    "recommendations": [
      "Consider learning TypeScript",
      "Your React experience is a great match"
    ]
  }
}
```

### GET /api/ai/matching-history

Lay lich su matching

## Notification APIs

### GET /api/notifications

Lay danh sach thong bao

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notification-id",
      "type": "APPLICATION_STATUS_CHANGED",
      "title": "Application Update",
      "message": "Your application for Software Engineer has been accepted",
      "isRead": false,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "data": {
        "applicationId": "application-id",
        "jobId": "job-id"
      }
    }
  ]
}
```

### POST /api/notifications/mark-read

Danh dau thong bao da doc

**Request:**

```json
{
  "notificationIds": ["notification-id-1", "notification-id-2"]
}
```

## Saved Jobs APIs

### GET /api/saved-jobs

Lay danh sach jobs da luu (CANDIDATE only)

### POST /api/saved-jobs

Luu job (CANDIDATE only)

**Request:**

```json
{
  "jobId": "job-id"
}
```

### DELETE /api/saved-jobs/:jobId

Bo luu job (CANDIDATE only)

## Skills APIs

### GET /api/skills

Lay danh sach skills

### GET /api/skills/:id

Lay chi tiet skill

### POST /api/skills

Tao skill moi (ADMIN only)

## Admin APIs

### GET /api/admin/dashboard

Lay thong tin dashboard (ADMIN only)

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1000,
      "totalJobs": 50,
      "totalApplications": 200,
      "totalCompanies": 25
    },
    "recentApplications": [
      /* ... */
    ],
    "popularSkills": [
      /* ... */
    ]
  }
}
```

### GET /api/admin/users

Lay danh sach users (ADMIN only)

### PUT /api/admin/users/:id/status

Cap nhat trang thai user (ADMIN only)

## Error Codes

### 4xx Client Errors

- `400 Bad Request`: Du lieu khong hop le
- `401 Unauthorized`: Chua dang nhap
- `403 Forbidden`: Khong co quyen truy cap
- `404 Not Found`: Khong tim thay resource
- `409 Conflict`: Xung dot du lieu
- `422 Unprocessable Entity`: Validation failed

### 5xx Server Errors

- `500 Internal Server Error`: Loi server
- `502 Bad Gateway`: Loi gateway
- `503 Service Unavailable`: Service khong kha dung

## Rate Limiting

API co rate limiting:

- **Authenticated users**: 1000 requests/hour
- **Unauthenticated users**: 100 requests/hour

Khi vuot qua gioi han:

```json
{
  "success": false,
  "error": "Too many requests",
  "retryAfter": 3600
}
```

## File Upload

### Supported Formats

- CV: PDF, DOC, DOCX (max 5MB)
- Company Logo: PNG, JPG, JPEG (max 2MB)

### Upload Example

```javascript
const formData = new FormData();
formData.append('cv', file);

fetch('/api/candidates/profile', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

## WebSocket Events

He thong su dung WebSocket cho real-time notifications:

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000', {
  auth: { token: 'jwt-token' },
});

// Listen for notifications
socket.on('notification', notification => {
  console.log('New notification:', notification);
});

// Listen for application updates
socket.on('application-update', update => {
  console.log('Application update:', update);
});
```

---

_Generated on: October 30, 2025_
