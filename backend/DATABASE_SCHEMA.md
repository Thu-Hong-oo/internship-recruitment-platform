# SƠ ĐỒ CƠ SỞ DỮ LIỆU MONGODB

## Tổng quan
Hệ thống sử dụng MongoDB (NoSQL) với cấu trúc document-oriented, bao gồm các collections chính và các embedded documents để tối ưu hóa truy vấn.

---

## 1. COLLECTION: Users

**Mô tả**: Lưu trữ thông tin tài khoản người dùng trong hệ thống

```json
{
  "_id": "ObjectId",
  "email": "String (unique, required)",
  "passwordHash": "String (required)",
  "role": "String (enum: ['ADMIN', 'RECRUITER', 'CANDIDATE'])",
  "name": "String",
  "phone": "String",
  "avatar": "String (URL)",
  "isActive": "Boolean (default: true)",
  "emailVerified": "Boolean (default: false)",
  "lastLogin": "DateTime",
  "createdAt": "DateTime",
  "updatedAt": "DateTime",
  
  // Reference IDs
  "candidateProfile": "ObjectId (ref: Candidate)",
  "employerProfile": "ObjectId (ref: Employer)",
  
  // Embedded subdocuments
  "userRoles": {
    "isAdmin": "Boolean",
    "isRecruiter": "Boolean",
    "isCandidate": "Boolean"
  },
  
  "preferences": {
    "notificationEnabled": "Boolean",
    "language": "String (default: 'vi')",
    "theme": "String"
  }
}
```

**Indexes**:
- `email`: unique
- `role`: non-unique
- `isActive`: non-unique

---

## 2. COLLECTION: Candidate

**Mô tả**: Lưu trữ thông tin hồ sơ chi tiết của ứng viên

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users, required)",
  
  // Basic Information
  "fullName": "String",
  "dateOfBirth": "Date",
  "gender": "String (enum: ['MALE', 'FEMALE', 'OTHER'])",
  "phoneNumber": "String",
  "email": "String",
  
  // Address Information
  "address": {
    "street": "String",
    "city": "String",
    "district": "String",
    "ward": "String",
    "country": "String (default: 'Vietnam')"
  },
  
  // Professional Information
  "headline": "String",
  "summary": "String (Text)",
  "yearsOfExperience": "Number",
  "currentJobTitle": "String",
  "expectedSalary": "Number",
  "jobSearchStatus": "String (enum: ['ACTIVE', 'PASSIVE', 'NOT_LOOKING'])",
  
  // CV Information
  "cv": {
    "fileName": "String",
    "filePath": "String (Cloudinary URL)",
    "fileSize": "Number",
    "uploadedAt": "DateTime",
    "cloudinaryId": "String"
  },
  
  // Skills Array (Embedded)
  "skills": [
    {
      "skillId": "ObjectId (ref: Skill)",
      "skillName": "String",
      "proficiencyLevel": "String (enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])",
      "yearsOfExperience": "Number",
      "lastUsed": "Date"
    }
  ],
  
  // Work Experience Array (Embedded)
  "workExperience": [
    {
      "jobTitle": "String",
      "companyName": "String",
      "location": "String",
      "startDate": "Date",
      "endDate": "Date",
      "isCurrent": "Boolean",
      "description": "String (Text)",
      "responsibilities": ["String"],
      "achievements": ["String"]
    }
  ],
  
  // Education Array (Embedded)
  "education": [
    {
      "degree": "String",
      "major": "String",
      "institution": "String",
      "startDate": "Date",
      "endDate": "Date",
      "gpa": "Number",
      "description": "String"
    }
  ],
  
  // Certifications Array (Embedded)
  "certifications": [
    {
      "name": "String",
      "issuingOrganization": "String",
      "issueDate": "Date",
      "expiryDate": "Date",
      "credentialId": "String",
      "credentialUrl": "String"
    }
  ],
  
  // Projects Array (Embedded)
  "projects": [
    {
      "title": "String",
      "description": "String (Text)",
      "role": "String",
      "technologies": ["String"],
      "startDate": "Date",
      "endDate": "Date",
      "projectUrl": "String",
      "achievements": ["String"]
    }
  ],
  
  // Social Links
  "socialLinks": {
    "linkedin": "String (URL)",
    "github": "String (URL)",
    "portfolio": "String (URL)",
    "other": ["String"]
  },
  
  // Profile Status
  "profileCompleteness": "Number (0-100)",
  "isProfilePublic": "Boolean (default: true)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `userId`: unique
- `skills.skillId`: non-unique
- `jobSearchStatus`: non-unique
- `email`: unique

---

## 3. COLLECTION: Employer

**Mô tả**: Lưu trữ thông tin công ty/nhà tuyển dụng

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users, required)",
  "companyId": "ObjectId (ref: Company, required)",
  
  // Employer Information
  "position": "String",
  "department": "String",
  "isVerified": "Boolean (default: false)",
  "verificationDocument": "String (URL)",
  
  // Permissions
  "permissions": {
    "canPostJobs": "Boolean (default: true)",
    "canViewCandidates": "Boolean (default: true)",
    "canContactCandidates": "Boolean (default: true)"
  },
  
  // Member Status
  "memberStatus": "String (enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REMOVED'])",
  "joinedAt": "DateTime",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `userId`: unique
- `companyId`: non-unique

---

## 4. COLLECTION: Company

**Mô tả**: Lưu trữ thông tin chi tiết về công ty

```json
{
  "_id": "ObjectId",
  
  // Basic Information
  "name": "String (required)",
  "slug": "String (unique)",
  "logo": "String (URL)",
  "coverImage": "String (URL)",
  "website": "String (URL)",
  "email": "String",
  "phone": "String",
  
  // Company Details
  "industry": "ObjectId (ref: Industry)",
  "companySize": "String (enum: ['SMALL_1_50', 'MEDIUM_51_200', 'LARGE_201_500', 'ENTERPRISE_500_PLUS'])",
  "foundedYear": "Number",
  "taxCode": "String",
  
  // Address
  "address": {
    "street": "String",
    "city": "String",
    "district": "String",
    "ward": "String",
    "country": "String (default: 'Vietnam')"
  },
  
  // Description
  "description": "String (Text)",
  "mission": "String (Text)",
  "vision": "String (Text)",
  "benefits": ["String"],
  "workingEnvironment": "String (Text)",
  
  // Social Links
  "socialLinks": {
    "facebook": "String (URL)",
    "linkedin": "String (URL)",
    "twitter": "String (URL)"
  },
  
  // Status
  "isVerified": "Boolean (default: false)",
  "isActive": "Boolean (default: true)",
  "verificationDocuments": ["String (URLs)"],
  
  // Statistics (denormalized for performance)
  "stats": {
    "totalJobs": "Number (default: 0)",
    "activeJobs": "Number (default: 0)",
    "totalEmployees": "Number (default: 0)"
  },
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `name`: text index
- `slug`: unique
- `industry`: non-unique
- `isActive`: non-unique

---

## 5. COLLECTION: Industry

**Mô tả**: Danh mục ngành nghề

```json
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "code": "String (unique)",
  "description": "String (Text)",
  "icon": "String (URL)",
  "isActive": "Boolean (default: true)",
  "order": "Number",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `name`: unique
- `code`: unique

---

## 6. COLLECTION: Skill

**Mô tả**: Danh mục kỹ năng

```json
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "category": "String (enum: ['TECHNICAL', 'SOFT_SKILL', 'LANGUAGE', 'TOOL', 'FRAMEWORK', 'OTHER'])",
  "description": "String (Text)",
  "aliases": ["String"],
  "relatedSkills": ["ObjectId (ref: Skill)"],
  "isActive": "Boolean (default: true)",
  "popularityScore": "Number (default: 0)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `name`: text index, unique
- `category`: non-unique
- `popularityScore`: descending

---

## 7. COLLECTION: Job

**Mô tả**: Lưu trữ thông tin tin tuyển dụng

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId (ref: Company, required)",
  "employerId": "ObjectId (ref: Employer, required)",
  
  // Job Basic Information
  "title": "String (required)",
  "slug": "String (unique)",
  "description": "String (Text, required)",
  "responsibilities": ["String"],
  "requirements": ["String"],
  "benefits": ["String"],
  
  // Job Details
  "jobType": "String (enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])",
  "jobLevel": "String (enum: ['INTERN', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEADER', 'MANAGER'])",
  "experienceRequired": "Number (years)",
  
  // Salary Information
  "salary": {
    "min": "Number",
    "max": "Number",
    "currency": "String (default: 'VND')",
    "negotiable": "Boolean",
    "isPublic": "Boolean"
  },
  
  // Location
  "locations": [
    {
      "city": "String",
      "district": "String",
      "address": "String",
      "isRemote": "Boolean"
    }
  ],
  
  // Skills Required (Embedded)
  "requiredSkills": [
    {
      "skillId": "ObjectId (ref: Skill)",
      "skillName": "String",
      "proficiencyLevel": "String (enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])",
      "isRequired": "Boolean (default: true)"
    }
  ],
  
  // Industry
  "industry": "ObjectId (ref: Industry)",
  
  // Job Status
  "status": "String (enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'EXPIRED'])",
  "publishedAt": "DateTime",
  "expiryDate": "DateTime",
  "vacancies": "Number (default: 1)",
  
  // Statistics (denormalized)
  "stats": {
    "totalApplications": "Number (default: 0)",
    "totalViews": "Number (default: 0)",
    "totalSaved": "Number (default: 0)"
  },
  
  // Contact Information
  "contactInfo": {
    "contactPerson": "String",
    "contactEmail": "String",
    "contactPhone": "String"
  },
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `companyId`: non-unique
- `status`: non-unique
- `title`: text index
- `requiredSkills.skillId`: non-unique
- `expiryDate`: non-unique

---

## 8. COLLECTION: JobApplication

**Mô tả**: Lưu trữ thông tin đơn ứng tuyển

```json
{
  "_id": "ObjectId",
  "jobId": "ObjectId (ref: Job, required)",
  "candidateId": "ObjectId (ref: Candidate, required)",
  
  // Application Information
  "coverLetter": "String (Text)",
  "resumeUsed": {
    "fileName": "String",
    "filePath": "String (URL)",
    "uploadedAt": "DateTime"
  },
  
  // Application Status
  "status": "String (enum: ['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])",
  "appliedAt": "DateTime (default: now)",
  
  // AI Analysis Result (Embedded)
  "aiAnalysis": {
    "matchingScore": "Number (0-100)",
    "skillsMatched": ["String"],
    "skillsGap": ["String"],
    "strengths": ["String"],
    "weaknesses": ["String"],
    "recommendation": "String",
    "analyzedAt": "DateTime"
  },
  
  // Recruiter Actions
  "recruiterNotes": "String (Text)",
  "reviewedBy": "ObjectId (ref: Employer)",
  "reviewedAt": "DateTime",
  
  // Interview Schedule (Embedded)
  "interviews": [
    {
      "round": "Number",
      "scheduledDate": "DateTime",
      "interviewType": "String (enum: ['PHONE', 'VIDEO', 'ONSITE'])",
      "interviewers": ["String"],
      "location": "String",
      "notes": "String",
      "result": "String (enum: ['PASSED', 'FAILED', 'PENDING'])"
    }
  ],
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `jobId`: non-unique
- `candidateId`: non-unique
- `status`: non-unique
- Compound: `{jobId: 1, candidateId: 1}` unique

---

## 9. COLLECTION: SavedJob

**Mô tả**: Lưu trữ danh sách công việc đã lưu của ứng viên

```json
{
  "_id": "ObjectId",
  "candidateId": "ObjectId (ref: Candidate, required)",
  "jobId": "ObjectId (ref: Job, required)",
  "savedAt": "DateTime (default: now)",
  "notes": "String (Text)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- Compound: `{candidateId: 1, jobId: 1}` unique
- `candidateId`: non-unique

---

## 10. COLLECTION: Notification

**Mô tả**: Lưu trữ thông báo cho người dùng

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users, required)",
  
  // Notification Content
  "type": "String (enum: ['APPLICATION_UPDATE', 'NEW_JOB_MATCH', 'MESSAGE', 'SYSTEM_ANNOUNCEMENT', 'PROFILE_VIEW'])",
  "title": "String",
  "content": "String (Text)",
  "actionUrl": "String (URL)",
  
  // Related Objects
  "relatedJob": "ObjectId (ref: Job)",
  "relatedApplication": "ObjectId (ref: JobApplication)",
  "relatedUser": "ObjectId (ref: Users)",
  
  // Status
  "isRead": "Boolean (default: false)",
  "readAt": "DateTime",
  "sentAt": "DateTime (default: now)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `userId`: non-unique
- `isRead`: non-unique
- Compound: `{userId: 1, createdAt: -1}`

---

## 11. COLLECTION: RoleSkipAnalysis

**Mô tả**: Lưu trữ kết quả phân tích CV và kỹ năng bằng AI

```json
{
  "_id": "ObjectId",
  "candidateId": "ObjectId (ref: Candidate, required)",
  "analysisType": "String (enum: ['CV_ANALYSIS', 'SKILL_GAP', 'JOB_MATCH'])",
  
  // Analysis Results
  "analyzedData": {
    "rawText": "String (Text)",
    "extractedSkills": ["String"],
    "experienceLevel": "String",
    "educationLevel": "String",
    "certifications": ["String"]
  },
  
  // Skill Assessment
  "skillLevels": [
    {
      "skillId": "ObjectId (ref: Skill)",
      "skillName": "String",
      "currentLevel": "String (enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])",
      "requiredLevel": "String",
      "gap": "String"
    }
  ],
  
  // Overall Assessment
  "overallScore": "Number (0-100)",
  "strengths": ["String"],
  "weaknesses": ["String"],
  "recommendations": ["String"],
  
  // AI Model Information
  "aiModel": "String",
  "confidence": "Number (0-1)",
  "analyzedAt": "DateTime (default: now)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `candidateId`: non-unique
- `analysisType`: non-unique
- `analyzedAt`: descending

---

## 12. COLLECTION: LearningResource

**Mô tả**: Lưu trữ tài nguyên học tập (khóa học, bài viết, video)

```json
{
  "_id": "ObjectId",
  
  // Resource Information
  "title": "String (required)",
  "description": "String (Text)",
  "type": "String (enum: ['COURSE', 'VIDEO', 'ARTICLE', 'BOOK', 'TUTORIAL', 'DOCUMENTATION'])",
  "url": "String (URL, required)",
  "thumbnailUrl": "String (URL)",
  
  // Content Details
  "provider": "String",
  "author": "String",
  "duration": "Number (minutes)",
  "level": "String (enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])",
  "language": "String (default: 'vi')",
  
  // Related Skills
  "relatedSkills": [
    {
      "skillId": "ObjectId (ref: Skill)",
      "skillName": "String",
      "relevanceScore": "Number (0-100)"
    }
  ],
  
  // Cost Information
  "isFree": "Boolean",
  "price": "Number",
  "currency": "String",
  
  // Quality Metrics
  "rating": "Number (0-5)",
  "totalReviews": "Number (default: 0)",
  "qualityScore": "Number (0-100)",
  
  // Status
  "isActive": "Boolean (default: true)",
  "isVerified": "Boolean (default: false)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `title`: text index
- `type`: non-unique
- `relatedSkills.skillId`: non-unique
- `qualityScore`: descending

---

## 13. COLLECTION: LearningRoadmap

**Mô tả**: Lưu trữ lộ trình học tập được tạo cho ứng viên

```json
{
  "_id": "ObjectId",
  "candidateId": "ObjectId (ref: Candidate, required)",
  "targetJobId": "ObjectId (ref: Job)",
  
  // Roadmap Information
  "title": "String (required)",
  "description": "String (Text)",
  "totalDuration": "Number (weeks)",
  "difficultyLevel": "String (enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])",
  
  // Skills to Learn
  "targetSkills": [
    {
      "skillId": "ObjectId (ref: Skill)",
      "skillName": "String",
      "currentLevel": "String",
      "targetLevel": "String",
      "priority": "Number (1-5)"
    }
  ],
  
  // Learning Phases (Embedded)
  "phases": [
    {
      "phaseNumber": "Number",
      "title": "String",
      "description": "String (Text)",
      "duration": "Number (weeks)",
      "skills": ["String"],
      
      // Learning Steps
      "steps": [
        {
          "stepNumber": "Number",
          "title": "String",
          "description": "String (Text)",
          "estimatedTime": "Number (hours)",
          "resources": [
            {
              "resourceId": "ObjectId (ref: LearningResource)",
              "resourceTitle": "String",
              "resourceType": "String",
              "resourceUrl": "String"
            }
          ],
          "isCompleted": "Boolean (default: false)",
          "completedAt": "DateTime"
        }
      ]
    }
  ],
  
  // Progress Tracking
  "progress": {
    "completedSteps": "Number (default: 0)",
    "totalSteps": "Number",
    "completionPercentage": "Number (0-100)",
    "currentPhase": "Number",
    "startedAt": "DateTime",
    "lastAccessedAt": "DateTime"
  },
  
  // AI Generation Info
  "generatedBy": "String (AI Model)",
  "generatedAt": "DateTime",
  "isCustomized": "Boolean (default: false)",
  
  // Status
  "status": "String (enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'])",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `candidateId`: non-unique
- `status`: non-unique
- Compound: `{candidateId: 1, createdAt: -1}`

---

## 14. COLLECTION: CompanyReview

**Mô tả**: Lưu trữ đánh giá của nhân viên về công ty

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId (ref: Company, required)",
  "userId": "ObjectId (ref: Users, required)",
  
  // Review Content
  "rating": "Number (1-5, required)",
  "title": "String",
  "pros": "String (Text)",
  "cons": "String (Text)",
  "advice": "String (Text)",
  
  // Detailed Ratings
  "ratings": {
    "workLifeBalance": "Number (1-5)",
    "compensation": "Number (1-5)",
    "culture": "Number (1-5)",
    "management": "Number (1-5)",
    "careerGrowth": "Number (1-5)"
  },
  
  // Reviewer Information
  "jobTitle": "String",
  "employmentStatus": "String (enum: ['CURRENT', 'FORMER'])",
  "yearsWorked": "Number",
  
  // Status
  "isVerified": "Boolean (default: false)",
  "isApproved": "Boolean (default: false)",
  "isAnonymous": "Boolean (default: true)",
  
  // Timestamps
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```

**Indexes**:
- `companyId`: non-unique
- `userId`: non-unique
- `isApproved`: non-unique

---

## RELATIONSHIPS (References)

### One-to-One
- `Users` ↔ `Candidate` (userId)
- `Users` ↔ `Employer` (userId)

### One-to-Many
- `Company` → `Employer` (companyId)
- `Company` → `Job` (companyId)
- `Company` → `CompanyReview` (companyId)
- `Candidate` → `JobApplication` (candidateId)
- `Candidate` → `SavedJob` (candidateId)
- `Candidate` → `LearningRoadmap` (candidateId)
- `Candidate` → `RoleSkipAnalysis` (candidateId)
- `Job` → `JobApplication` (jobId)
- `Users` → `Notification` (userId)

### Many-to-Many (through references)
- `Candidate` ↔ `Skill` (embedded in skills array)
- `Job` ↔ `Skill` (embedded in requiredSkills array)
- `LearningResource` ↔ `Skill` (embedded in relatedSkills array)

---

## EMBEDDED DOCUMENTS VS REFERENCES

### Sử dụng Embedded (Nhúng):
- **Skills trong Candidate**: Thông tin kỹ năng được nhúng để tránh join nhiều
- **Work Experience, Education, Certifications**: Dữ liệu liên quan chặt chẽ với candidate
- **Phases và Steps trong LearningRoadmap**: Cấu trúc phân cấp phức tạp
- **Address**: Thông tin địa chỉ được nhúng trong nhiều collections

### Sử dụng References (Tham chiếu):
- **userId trong Candidate/Employer**: Quan hệ 1-1 giữa các collections lớn
- **companyId trong Job**: Nhiều job thuộc về một company
- **Skill, Industry**: Dữ liệu master data được tham chiếu

---

## INDEXES STRATEGY

### Compound Indexes:
```javascript
// Job search optimization
db.job.createIndex({ status: 1, expiryDate: 1 })
db.job.createIndex({ "requiredSkills.skillId": 1, status: 1 })

// Application tracking
db.jobApplication.createIndex({ jobId: 1, candidateId: 1 }, { unique: true })
db.jobApplication.createIndex({ candidateId: 1, status: 1 })

// Notification feed
db.notification.createIndex({ userId: 1, createdAt: -1 })
db.notification.createIndex({ userId: 1, isRead: 1 })
```

### Text Indexes:
```javascript
db.job.createIndex({ title: "text", description: "text" })
db.skill.createIndex({ name: "text", aliases: "text" })
db.learningResource.createIndex({ title: "text", description: "text" })
```

---

## DATA VALIDATION RULES

MongoDB schema validation có thể được áp dụng để đảm bảo tính toàn vẹn dữ liệu:

```javascript
// Example: Job collection validation
db.createCollection("job", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["companyId", "employerId", "title", "description", "status"],
      properties: {
        status: {
          enum: ["DRAFT", "PUBLISHED", "CLOSED", "EXPIRED"]
        },
        salary: {
          bsonType: "object",
          properties: {
            min: { bsonType: "number", minimum: 0 },
            max: { bsonType: "number", minimum: 0 }
          }
        }
      }
    }
  }
})
```

---

## DENORMALIZATION STRATEGY

Để tối ưu performance, một số dữ liệu được denormalize (lưu trữ trùng lặp):

1. **skillName trong các embedded arrays**: Tránh join với Skill collection
2. **stats trong Job và Company**: Cache các số liệu thống kê
3. **userName, companyName trong Notification**: Hiển thị nhanh không cần join

---

*Sơ đồ này phản ánh đầy đủ cấu trúc database của hệ thống tuyển dụng thực nghiệm với MongoDB, tối ưu hóa cho các truy vấn AI và học máy.*
