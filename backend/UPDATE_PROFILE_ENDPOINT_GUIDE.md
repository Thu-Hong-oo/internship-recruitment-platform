# 📝 Update Candidate Profile Endpoint Guide

## 🎯 Endpoint Overview

**Endpoint:** `PUT /api/candidates/profile`  
**Method:** PUT (not PATCH)  
**Authentication:** Required (JWT Token)  
**Authorization:** Candidate role only

## ❓ Tại sao dùng PUT thay vì PATCH?

### **PUT vs PATCH - The Difference**

#### **PUT (Replace/Update Entire Resource)**

```javascript
// PUT replaces the ENTIRE resource
// Missing fields → Reset to default/null
PUT /api/candidates/profile
{
  "personalInfo": {
    "fullName": "New Name"
    // ⚠️ Other fields will be RESET if not included
  }
}
```

#### **PATCH (Partial Update)**

```javascript
// PATCH only updates specified fields
// Missing fields → Keep current values
PATCH /api/candidates/profile
{
  "personalInfo": {
    "fullName": "New Name"
    // ✅ Other fields remain UNCHANGED
  }
}
```

### **Current Implementation: PUT with Partial Update Behavior**

Hiện tại code đang dùng **PUT** nhưng hoạt động giống **PATCH** (partial update):

```javascript
// CandidateRepository.update()
async update(id, candidateData) {
  return await CandidateProfile.findByIdAndUpdate(id, candidateData, {
    new: true,
  });
}
```

☝️ `findByIdAndUpdate()` mặc định chỉ cập nhật các fields được truyền vào, không reset fields khác.

### **Recommendation: Nên đổi sang PATCH** ✅

```javascript
// Route should be:
router.route('/profile').get(getProfile).patch(updateProfile); // ✅ PATCH
// Instead of:
router.route('/profile').get(getProfile).put(updateProfile); // ❌ PUT
```

**Lý do:**

1. ✅ **Semantically Correct** - PATCH đúng mục đích (partial update)
2. ✅ **RESTful Best Practice** - PUT nên replace toàn bộ resource
3. ✅ **Clearer Intent** - Frontend biết có thể gửi partial data
4. ✅ **Safer** - Tránh nhầm lẫn với PUT behavior chuẩn

## 📋 Request Body Structure

### **Full Request Body Schema**

```json
{
  // ============ PERSONAL INFO ============
  "personalInfo": {
    "fullName": "string", // Họ tên đầy đủ
    "dateOfBirth": "2000-01-15", // ISO date string
    "gender": "male|female|other", // Giới tính
    "phone": "+84912345678", // Số điện thoại
    "avatarUrl": "string", // Avatar URL (tự động từ upload endpoint)
    "address": {
      "street": "123 Main St",
      "city": "Ho Chi Minh",
      "country": "Vietnam"
    }
  },

  // ============ PROFESSIONAL INFO ============
  "professionalInfo": {
    "headline": "Full Stack Developer", // Tiêu đề nghề nghiệp
    "bio": "Passionate developer...", // Giới thiệu bản thân
    "portfolioUrl": "https://...", // Website cá nhân
    "linkedInUrl": "https://linkedin.com/in/...",
    "githubUrl": "https://github.com/..."
  },

  // ============ EDUCATION ============
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor",
      "fieldOfStudy": "Computer Science",
      "startDate": "2018-09-01",
      "endDate": "2022-06-30",
      "grade": "3.8/4.0"
    }
  ],

  // ============ EXPERIENCE ============
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Junior Developer",
      "startDate": "2022-07-01",
      "endDate": "2024-10-31", // null if current
      "description": "Developed web applications...",
      "isCurrent": false
    }
  ],

  // ============ SKILLS ============
  "skills": [
    {
      "name": "JavaScript",
      "level": "advanced" // beginner|intermediate|advanced|expert
    },
    {
      "name": "React",
      "level": "expert"
    }
  ],

  // ============ PREFERENCES ============
  "preferences": {
    "jobTypes": ["full-time", "remote"], // Loại công việc mong muốn
    "locations": ["Ho Chi Minh", "Ha Noi"], // Địa điểm mong muốn
    "salaryRange": {
      "min": 15000000,
      "max": 25000000,
      "currency": "VND"
    }
  },

  // ============ RESUME (Auto-managed) ============
  "resume": {
    "url": "string", // Set by upload CV endpoint
    "uploadedAt": "datetime" // Auto-generated
  },

  // ============ PROFILE SETTINGS ============
  "profileCompleteness": 0, // Auto-calculated (0-100)
  "visibility": "public" // public|private|restricted
}
```

## ✅ Valid Update Examples

### **Example 1: Update Personal Info Only**

```json
PUT /api/candidates/profile
{
  "personalInfo": {
    "fullName": "Nguyen Van A",
    "phone": "+84912345678",
    "address": {
      "city": "Ho Chi Minh",
      "country": "Vietnam"
    }
  }
}
```

### **Example 2: Add New Education Entry**

```json
PUT /api/candidates/profile
{
  "education": [
    {
      "institution": "FPT University",
      "degree": "Bachelor of Science",
      "fieldOfStudy": "Software Engineering",
      "startDate": "2020-09-01",
      "endDate": "2024-06-30",
      "grade": "3.9/4.0"
    }
  ]
}
```

### **Example 3: Update Professional Info**

```json
PUT /api/candidates/profile
{
  "professionalInfo": {
    "headline": "Senior Full Stack Developer",
    "bio": "5+ years of experience in web development...",
    "linkedInUrl": "https://linkedin.com/in/johndoe"
  }
}
```

### **Example 4: Add Multiple Skills**

```json
PUT /api/candidates/profile
{
  "skills": [
    { "name": "JavaScript", "level": "expert" },
    { "name": "TypeScript", "level": "advanced" },
    { "name": "React", "level": "expert" },
    { "name": "Node.js", "level": "advanced" }
  ]
}
```

### **Example 5: Update Job Preferences**

```json
PUT /api/candidates/profile
{
  "preferences": {
    "jobTypes": ["full-time", "remote"],
    "locations": ["Ho Chi Minh", "Da Nang"],
    "salaryRange": {
      "min": 20000000,
      "max": 30000000,
      "currency": "VND"
    }
  }
}
```

### **Example 6: Complete Profile Update**

```json
PUT /api/candidates/profile
{
  "personalInfo": {
    "fullName": "Tran Thi B",
    "dateOfBirth": "1998-05-20",
    "gender": "female",
    "phone": "+84987654321"
  },
  "professionalInfo": {
    "headline": "Frontend Developer",
    "bio": "Passionate about creating beautiful UIs"
  },
  "skills": [
    { "name": "React", "level": "advanced" },
    { "name": "CSS", "level": "expert" }
  ],
  "preferences": {
    "jobTypes": ["full-time"],
    "locations": ["Remote"],
    "salaryRange": {
      "min": 15000000,
      "max": 25000000,
      "currency": "VND"
    }
  }
}
```

## 📤 Success Response (200 OK)

```json
{
  "success": true,
  "message": "Hồ sơ ứng viên đã được cập nhật thành công",
  "data": {
    "id": "69045ac6212c3becbbc42375",
    "userId": "69045ac6212c3becbbc42372",
    "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
    "personalInfo": {
      "fullName": "Nguyen Van A",
      "phone": "+84912345678",
      "address": {
        "city": "Ho Chi Minh",
        "country": "Vietnam"
      }
    },
    "professionalInfo": { ... },
    "education": [ ... ],
    "experience": [ ... ],
    "skills": [ ... ],
    "preferences": { ... },
    "profileCompleteness": 65,
    "isOpenToWork": true,
    "lastUpdated": "2025-11-05T14:30:00.000Z",
    "createdAt": "2025-10-31T06:44:22.180Z",
    "updatedAt": "2025-11-05T14:30:00.000Z"
  }
}
```

## ❌ Error Responses

### **404 - Profile Not Found**

```json
{
  "success": false,
  "error": "Không tìm thấy hồ sơ ứng viên"
}
```

### **401 - Unauthorized**

```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### **400 - Validation Error**

```json
{
  "success": false,
  "error": "Invalid data provided"
}
```

## 🔒 Security & Validation

### **Current Implementation:**

- ✅ JWT authentication required
- ✅ Candidate role authorization
- ✅ User can only update their own profile
- ⚠️ **No input validation** - Should add validation middleware

### **Recommended Improvements:**

1. **Add Input Validation Middleware**

```javascript
const { body, validationResult } = require('express-validator');

const validateProfileUpdate = [
  body('personalInfo.fullName').optional().isString().trim(),
  body('personalInfo.phone').optional().isMobilePhone('vi-VN'),
  body('personalInfo.dateOfBirth').optional().isISO8601(),
  body('skills.*.level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  // ... more validations
];

router
  .route('/profile')
  .get(getProfile)
  .put(validateProfileUpdate, updateProfile);
```

2. **Sanitize Input Data**

```javascript
// Remove sensitive fields that shouldn't be updated directly
const sanitizeProfileData = data => {
  const { profileCompleteness, createdAt, updatedAt, ...safeData } = data;
  return safeData;
};
```

## 🎯 Best Practices

### **1. Partial Updates (Current Behavior)**

```javascript
// ✅ Good - Only send what you want to update
PUT /api/candidates/profile
{
  "personalInfo": {
    "phone": "+84912345678"
  }
}
// Other fields remain unchanged
```

### **2. Array Updates**

```javascript
// ⚠️ Arrays are REPLACED, not merged
PUT /api/candidates/profile
{
  "skills": [
    { "name": "New Skill", "level": "beginner" }
  ]
}
// This REPLACES all existing skills!

// To add to existing skills:
// 1. GET profile first
// 2. Merge new skills with existing
// 3. PUT with complete array
```

### **3. Nested Object Updates**

```javascript
// ✅ Mongoose merges nested objects
PUT /api/candidates/profile
{
  "personalInfo": {
    "phone": "+84912345678"
    // fullName, address, etc. remain unchanged
  }
}
```

## 🔄 Recommended Changes

### **Change 1: Use PATCH instead of PUT**

```javascript
// File: src/presentation/routes/candidate.js
router.route('/profile').get(getProfile).patch(updateProfile); // ✅ Changed from .put() to .patch()
```

### **Change 2: Add Validation Middleware**

```javascript
// File: src/presentation/middlewares/validation.js
// Create validation middleware for profile updates

// File: src/presentation/routes/candidate.js
const { validateProfileUpdate } = require('../middlewares/validation');
router
  .route('/profile')
  .get(getProfile)
  .patch(validateProfileUpdate, updateProfile);
```

### **Change 3: Populate userId in Response**

```javascript
// File: src/infrastructure/repositories/CandidateRepository.js
async update(id, candidateData) {
  return await CandidateProfile.findByIdAndUpdate(id, candidateData, {
    new: true,
  }).populate('userId', 'avatarUrl avatar googleProfile'); // ✅ Add populate
}
```

## 📚 Summary

| Aspect              | Current          | Recommended        |
| ------------------- | ---------------- | ------------------ |
| **HTTP Method**     | PUT              | ✅ Change to PATCH |
| **Behavior**        | Partial update   | ✅ Keep (correct)  |
| **Validation**      | None             | ❌ Add middleware  |
| **Auth**            | JWT + Role       | ✅ Good            |
| **Response**        | Complete profile | ✅ Good            |
| **Populate userId** | Yes (in repo)    | ✅ Good            |

---

**Created:** November 5, 2025  
**Status:** PUT method works but should be changed to PATCH for semantic correctness  
**Body:** Accepts partial updates, all fields are optional
