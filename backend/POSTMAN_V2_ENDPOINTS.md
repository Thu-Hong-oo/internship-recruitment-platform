# CANDIDATE API V2 ENDPOINTS FOR POSTMAN TESTING

## Base URL

```
http://localhost:3001/api/v2/candidates
```

## Authentication Required

All endpoints require Bearer Token in Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. CORE PROFILE MANAGEMENT (2 endpoints)

### 1.1 GET Profile - Lấy thông tin hồ sơ

```
GET {{baseUrl}}/me
```

**Query Parameters (Optional):**

- `include` - Chọn thông tin trả về
  - No param: Basic info only
  - `all`: Full profile
  - `education,experience,skills`: Specific sections
  - `resume`: Include resume data

**Examples:**

```
GET {{baseUrl}}/me
GET {{baseUrl}}/me?include=all
GET {{baseUrl}}/me?include=education,experience,skills
GET {{baseUrl}}/me?include=resume
```

### 1.2 PATCH Profile - Cập nhật hồ sơ

```
PATCH {{baseUrl}}/me
Content-Type: application/json
```

**Body Examples:**

Update Profile Info:

```json
{
  "section": "profile",
  "data": {
    "personalInfo": {
      "fullName": "Nguyen Van A Updated",
      "phone": "0987654321",
      "address": {
        "city": "Ho Chi Minh",
        "district": "District 1"
      }
    },
    "bio": "Updated bio: Passionate software engineering student"
  }
}
```

Update Visibility:

```json
{
  "section": "visibility",
  "data": {
    "visibility": "public",
    "searchable": true
  }
}
```

Update Preferences:

```json
{
  "section": "preferences",
  "data": {
    "locations": ["Ho Chi Minh", "Da Nang"],
    "industries": ["Technology", "Finance"],
    "jobTypes": ["full-time", "internship"]
  }
}
```

---

## 2. PROFILE SECTIONS CRUD (4 endpoints pattern)

### 2.1 GET Section - Lấy dữ liệu 1 phần

```
GET {{baseUrl}}/me/{section}
```

**Sections:** `education`, `experience`, `skills`, `projects`, `certifications`

**Examples:**

```
GET {{baseUrl}}/me/education
GET {{baseUrl}}/me/experience
GET {{baseUrl}}/me/skills
```

### 2.2 POST Section - Thêm entry mới

```
POST {{baseUrl}}/me/{section}
Content-Type: application/json
```

**Body Examples:**

Add Education:

```json
{
  "type": "university",
  "institution": "University of Technology",
  "degree": "Bachelor of Computer Science",
  "major": "Software Engineering",
  "startDate": "2020-09-01",
  "endDate": "2024-06-30",
  "gpa": 8.5
}
```

Add Experience:

```json
{
  "type": "internship",
  "company": "ABC Tech Company",
  "position": "Software Engineer Intern",
  "description": "Developed web applications using React and Node.js",
  "startDate": "2023-06-01",
  "endDate": "2023-08-31",
  "technologies": ["React", "Node.js", "MongoDB"]
}
```

Add Skills:

```json
{
  "type": "technical",
  "name": "React.js",
  "level": "intermediate",
  "experience": "2 years"
}
```

### 2.3 PATCH Section Entry - Cập nhật entry

```
PATCH {{baseUrl}}/me/{section}/{id}
Content-Type: application/json
```

**Example:**

```
PATCH {{baseUrl}}/me/education/60f7b3b3b3b3b3b3b3b3b3b3
```

**Body:**

```json
{
  "gpa": 9.0,
  "degree": "Bachelor of Computer Science (Honors)"
}
```

### 2.4 DELETE Section Entry - Xóa entry

```
DELETE {{baseUrl}}/me/{section}/{id}
```

**Example:**

```
DELETE {{baseUrl}}/me/skills/60f7b3b3b3b3b3b3b3b3b3b3
```

---

## 3. RESUME MANAGEMENT (3 endpoints)

### 3.1 POST Resume - Upload/Parse/Generate CV

```
POST {{baseUrl}}/me/resume
```

**Upload Resume (Simple upload):**

```
Content-Type: multipart/form-data

Body (form-data):
- file: [CV_FILE.pdf]
- action: "upload"
```

**Parse Resume (Upload + AI Analysis):**

```
Content-Type: multipart/form-data

Body (form-data):
- file: [CV_FILE.pdf]
- action: "parse"
```

**Response for Parse Action:**

```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully",
  "data": {
    "upload": {
      "url": "https://...",
      "filename": "resume.pdf",
      "format": "pdf",
      "size": 221725
    },
    "parsing": {
      "extractedData": {
        "personalInfo": { "fullName": "...", "email": "...", "phone": "..." },
        "education": [...],
        "experience": [...],
        "skills": [...]
      },
      "suggestions": [...],
      "analyzedAt": "2025-10-03T02:32:21.981Z"
    }
  }
}
```

**Generate Resume:**

```
POST {{baseUrl}}/me/resume?action=generate
Content-Type: application/json
```

```json
{
  "template": "modern",
  "targetJob": "Software Engineer"
}
```

### 3.2 GET Resume - Lấy thông tin CV

```
GET {{baseUrl}}/me/resume
```

**Query Parameters:**

- `version=all` - Get current + history
- `id=xxx&action=download` - Download specific resume

**Examples:**

```
GET {{baseUrl}}/me/resume
GET {{baseUrl}}/me/resume?version=all
GET {{baseUrl}}/me/resume?id=60f7b3b3b3b3b3b3b3b3b3b3&action=download
```

### 3.3 DELETE Resume - Xóa CV

```
DELETE {{baseUrl}}/me/resume/{id}
```

---

## 4. APPLICATIONS MANAGEMENT (3 endpoints)

### 4.1 GET Applications - Lấy danh sách đơn ứng tuyển

```
GET {{baseUrl}}/applications
```

**Query Parameters:**

- `status` - Filter by status: `pending`, `reviewing`, `hired`, `rejected`, `withdrawn`
- `job_id` - Filter by job ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `id` - Get specific application detail

**Examples:**

```
GET {{baseUrl}}/applications
GET {{baseUrl}}/applications?status=pending
GET {{baseUrl}}/applications?job_id=60f7b3b3b3b3b3b3b3b3b3b3
GET {{baseUrl}}/applications?page=2&limit=5
GET {{baseUrl}}/applications?id=60f7b3b3b3b3b3b3b3b3b3b3
```

### 4.2 POST Applications - Ứng tuyển công việc

```
POST {{baseUrl}}/applications
Content-Type: application/json
```

**Body:**

```json
{
  "job_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "resume_id": 1,
  "cover_letter": "I am very interested in this position...",
  "answers": [
    {
      "question": "Why do you want to work here?",
      "answer": "Because..."
    }
  ]
}
```

### 4.3 PATCH Application - Rút đơn ứng tuyển

```
PATCH {{baseUrl}}/applications/{id}
Content-Type: application/json
```

**Body:**

```json
{
  "action": "withdraw"
}
```

---

## 5. JOBS & COMPANIES (4 endpoints)

### 5.1 GET Jobs - Tìm kiếm công việc

```
GET {{baseUrl}}/jobs
```

**Query Parameters:**

- `type` - Job type: `search` (default), `saved`, `following`
- `keyword` - Search keyword
- `location` - Location filter
- `industry` - Industry filter
- `skills` - Skills filter (comma-separated)
- `jobType` - Job type filter
- `salaryMin` - Minimum salary
- `salaryMax` - Maximum salary
- `page` - Page number
- `limit` - Items per page

**Examples:**

```
GET {{baseUrl}}/jobs
GET {{baseUrl}}/jobs?type=search&keyword=developer
GET {{baseUrl}}/jobs?type=saved
GET {{baseUrl}}/jobs?type=following
GET {{baseUrl}}/jobs?keyword=react&location=ho chi minh&skills=javascript,react
```

### 5.2 POST Job Action - Lưu/Bỏ lưu/Ứng tuyển công việc

```
POST {{baseUrl}}/jobs/{id}/action
Content-Type: application/json
```

**Body Examples:**

Save Job:

```json
{
  "action": "save"
}
```

Unsave Job:

```json
{
  "action": "unsave"
}
```

Apply Job:

```json
{
  "action": "apply",
  "cover_letter": "I am interested...",
  "answers": []
}
```

### 5.3 POST Company Action - Follow/Unfollow công ty

```
POST {{baseUrl}}/companies/{id}/action
Content-Type: application/json
```

**Body Examples:**

Follow Company:

```json
{
  "action": "follow"
}
```

Unfollow Company:

```json
{
  "action": "unfollow"
}
```

### 5.4 GET Companies - Lấy thông tin công ty

```
GET {{baseUrl}}/companies
```

**Query Parameters:**

- `type=following` - Get followed companies list
- `id=xxx` - Get company detail

**Examples:**

```
GET {{baseUrl}}/companies?type=following
GET {{baseUrl}}/companies?id=60f7b3b3b3b3b3b3b3b3b3b3
```

---

## POSTMAN ENVIRONMENT VARIABLES

Create environment with these variables:

```json
{
  "baseUrl": "http://localhost:3001/api/v2/candidates",
  "authToken": "YOUR_JWT_TOKEN_HERE",
  "testJobId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "testCompanyId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "testApplicationId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

## COMMON RESPONSE FORMAT

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## TEST FLOW RECOMMENDATION

1. **Setup:** Get auth token from login
2. **Profile:** Test GET profile → PATCH profile
3. **Sections:** Test GET section → POST add → PATCH update → DELETE
4. **Resume:** Test upload → get → delete
5. **Jobs:** Test search → save job → apply job
6. **Applications:** Test get applications → withdraw application
7. **Companies:** Test follow → get followed companies

## NOTES

- Replace `{id}` with actual MongoDB ObjectId
- Replace `{section}` with: `education`, `experience`, `skills`, `projects`, `certifications`
- All timestamps should be in ISO 8601 format
- File uploads use `multipart/form-data`
- Other requests use `application/json`
