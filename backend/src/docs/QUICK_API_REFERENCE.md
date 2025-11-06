# 🔥 Quick API Reference

**Quick reference for developers - Most commonly used endpoints**

---

## 🔐 Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "candidate",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Response

```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f...",
    "email": "user@example.com",
    "role": "candidate"
  }
}
```

---

## 💼 Jobs

### Get All Jobs

```http
GET /api/jobs?page=1&limit=20
```

### Get Job Details

```http
GET /api/jobs/:id
```

### Create Job (Employer)

```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Developer",
  "location": "Ho Chi Minh",
  "type": "fulltime",
  "salary": { "min": 2000, "max": 3000, "currency": "USD" },
  "skills": ["Node.js", "React"],
  "deadline": "2025-12-31"
}
```

---

## 📝 Applications

### Apply for Job

```http
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "507f1f77bcf86cd799439011",
  "cvId": "507f191e810c19729de860ea",
  "coverLetter": "I am interested..."
}
```

### Get My Applications

```http
GET /api/applications
Authorization: Bearer <token>
```

---

## 🤖 AI Features

### AI Match Candidate to Job

```http
POST /api/ai/match
Authorization: Bearer <token>
Content-Type: application/json

{
  "candidateId": "507f191e810c19729de860ea",
  "jobId": "507f1f77bcf86cd799439011"
}
```

### Parse CV

```http
POST /api/ai/parse-cv
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [CV_FILE.pdf]
```

---

## 👤 Profile

### Get My Profile

```http
GET /api/candidates/:id
Authorization: Bearer <token>
```

### Update Profile

```http
PUT /api/candidates/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "skills": ["JavaScript", "TypeScript", "React"],
  "bio": "Experienced developer..."
}
```

---

## 🔔 Notifications

### Get Notifications

```http
GET /api/notifications
Authorization: Bearer <token>
```

### Mark as Read

```http
POST /api/notifications/mark-read
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationIds": ["507f..."]
}
```

---

## 💬 Chat

### Get Conversations

```http
GET /api/chat/rooms
Authorization: Bearer <token>
```

### Send Message

```http
POST /api/chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "507f...",
  "content": "Hello!",
  "type": "TEXT"
}
```

---

## 🎯 Skills & Roadmaps

### Get Skills

```http
GET /api/skills?search=javascript
```

### Create Learning Roadmap

```http
POST /api/roadmaps
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetJobTitle": "Full-Stack Developer",
  "targetSkills": ["React", "Node.js"],
  "phases": [...]
}
```

---

## ⚠️ Important Notes

1. **All authenticated endpoints require**:

   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. **Token expires in**: 24 hours (configurable)

3. **Base URL**: `http://localhost:3000`

4. **Content-Type**: Usually `application/json`

5. **File uploads**: Use `multipart/form-data`

---

## 🚦 Response Status Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## 📊 Common Query Parameters

### Pagination

```
?page=1&limit=20
```

### Filtering

```
?status=active&location=HCM&type=fulltime
```

### Sorting

```
?sortBy=createdAt&order=desc
```

### Search

```
?search=developer&skills=javascript,nodejs
```

---

## 🔧 Testing Tools

### cURL

```bash
curl -X GET http://localhost:3000/api/jobs \
  -H "Authorization: Bearer eyJhbG..."
```

### HTTPie

```bash
http GET localhost:3000/api/jobs \
  Authorization:"Bearer eyJhbG..."
```

### Postman

Import collections from `/postman` directory

---

**Quick Ref Version**: 1.0  
**Last Updated**: Nov 5, 2025  
**Full Docs**: [ACTIVE_API_ENDPOINTS.md](./ACTIVE_API_ENDPOINTS.md)
