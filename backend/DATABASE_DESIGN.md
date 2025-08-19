# 🗄️ THIẾT KẾ CƠ SỞ DỮ LIỆU MONGODB - INTERNBRIDGE

## 📋 TỔNG QUAN

Hệ thống InternBridge sử dụng MongoDB làm cơ sở dữ liệu chính với thiết kế schema tối ưu cho:
- Quản lý người dùng (employer/jobseeker)
- Quản lý công việc và ứng tuyển
- Hệ thống crawler và AI filtering
- Chatbot và notification
- Analytics và reporting

---

## 🏗️ DATABASE SCHEMA

### **1. User Collection**
Quản lý thông tin người dùng với role-based access control.

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['employer', 'jobseeker', 'admin']),
  
  // Profile information
  profile: {
    firstName: String (required),
    lastName: String (required),
    phone: String,
    avatar: String,
    bio: String,
    location: {
      city: String,
      district: String,
      country: String (default: 'VN')
    }
  },
  
  // Jobseeker specific data
  jobseeker: {
    education: [{
      school: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number
    }],
    experience: [{
      company: String,
      position: String,
      description: String,
      startDate: Date,
      endDate: Date,
      isCurrent: Boolean
    }],
    skills: [String],
    resume: String, // URL
    expectedSalary: {
      min: Number,
      max: Number,
      currency: String (default: 'VND')
    },
    preferredLocations: [String],
    preferredJobTypes: [String]
  },
  
  // Employer specific data
  employer: {
    companyId: ObjectId (ref: 'Company'),
    position: String,
    department: String
  },
  
  // System fields
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  lastLogin: Date,
  preferences: {
    emailNotifications: Boolean (default: true),
    pushNotifications: Boolean (default: true),
    language: String (default: 'vi')
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ email: 1 }` - Unique index
- `{ role: 1 }` - Role-based queries
- `{ 'profile.location.city': 1 }` - Location-based search
- `{ 'jobseeker.skills': 1 }` - Skill-based matching

---

### **2. Company Collection**
Quản lý thông tin công ty và doanh nghiệp.

```javascript
{
  _id: ObjectId,
  name: String (required),
  slug: String (unique),
  description: String,
  industry: [String],
  size: String (enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
  foundedYear: Number,
  website: String,
  logo: String,
  banner: String,
  
  location: {
    address: String,
    city: String,
    district: String,
    country: String (default: 'VN'),
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  contact: {
    email: String,
    phone: String,
    linkedin: String,
    facebook: String
  },
  
  benefits: [{
    name: String,
    description: String,
    icon: String
  }],
  
  // System fields
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  
  // Statistics
  rating: {
    average: Number (default: 0),
    count: Number (default: 0)
  },
  stats: {
    totalJobs: Number (default: 0),
    totalApplications: Number (default: 0),
    activeInternships: Number (default: 0)
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ name: 'text', description: 'text', industry: 'text' }` - Text search
- `{ slug: 1 }` - Unique slug
- `{ 'location.city': 1 }` - Location-based search
- `{ industry: 1 }` - Industry filtering

---

### **3. Job Collection**
Quản lý thông tin công việc từ cả crawler và employer posting.

```javascript
{
  _id: ObjectId,
  source: String (required), // 'crawler', 'employer', 'manual'
  externalId: String, // For crawled jobs
  title: String (required),
  company: String,
  companyId: ObjectId (ref: 'Company'),
  description: String,
  requirements: String,
  responsibilities: String,
  benefits: [String],
  skills: [String],
  tags: [String],
  
  location: {
    city: String,
    district: String,
    country: String (default: 'VN')
  },
  
  salary: {
    min: Number,
    max: Number,
    currency: String (default: 'VND'),
    unit: String (default: 'month') // month, year, hour
  },
  
  type: String (enum: ['intern', 'fulltime', 'parttime', 'contract']),
  level: String,
  experience: String, // Entry level, Mid level, etc.
  education: String, // Bachelor, Master, etc.
  
  url: String, // Original job URL
  logoUrl: String,
  postDate: Date,
  expireDate: Date,
  
  // System fields
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  
  // Statistics
  stats: {
    views: Number (default: 0),
    applications: Number (default: 0),
    saves: Number (default: 0)
  },
  
  // AI Analysis
  ai: {
    isIntern: Boolean (default: false),
    confidence: Number (default: 0),
    matchedKeywords: [String]
  },
  
  // Employer info
  postedBy: ObjectId (ref: 'User'),
  
  // Application settings
  applicationSettings: {
    requireCoverLetter: Boolean (default: false),
    requireResume: Boolean (default: true),
    allowDirectApply: Boolean (default: true),
    maxApplications: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ title: 'text', description: 'text', skills: 'text', tags: 'text' }` - Text search
- `{ type: 1, 'location.city': 1, 'salary.min': 1, postDate: -1 }` - Job search
- `{ source: 1, externalId: 1 }` - Unique constraint for crawled jobs
- `{ isActive: 1, type: 1, postDate: -1 }` - Active jobs listing

---

### **4. Application Collection**
Quản lý đơn ứng tuyển và quá trình tuyển dụng.

```javascript
{
  _id: ObjectId,
  jobId: ObjectId (ref: 'Job', required),
  jobseekerId: ObjectId (ref: 'User', required),
  employerId: ObjectId (ref: 'User', required),
  companyId: ObjectId (ref: 'Company', required),
  
  status: String (enum: ['pending', 'reviewing', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn']),
  
  coverLetter: String,
  resume: String, // URL
  portfolio: String, // URL
  
  expectedSalary: {
    min: Number,
    max: Number,
    currency: String (default: 'VND')
  },
  
  availability: {
    startDate: Date,
    duration: Number, // months
    fullTime: Boolean (default: false)
  },
  
  // AI matching score
  aiScore: {
    overall: Number (0-100),
    skills: Number (0-100),
    experience: Number (0-100),
    education: Number (0-100)
  },
  
  // Communication history
  messages: [{
    senderId: ObjectId (ref: 'User'),
    content: String,
    timestamp: Date,
    isRead: Boolean (default: false)
  }],
  
  // Interview scheduling
  interview: {
    scheduled: Boolean (default: false),
    date: Date,
    location: String,
    type: String (enum: ['online', 'onsite', 'phone']),
    notes: String
  },
  
  employerNotes: String,
  
  // Application tracking
  appliedAt: Date (default: Date.now),
  lastUpdated: Date (default: Date.now),
  isWithdrawn: Boolean (default: false),
  withdrawnAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ jobId: 1, jobseekerId: 1 }` - Unique constraint
- `{ jobseekerId: 1, status: 1 }` - Jobseeker applications
- `{ employerId: 1, status: 1 }` - Employer applications
- `{ companyId: 1, status: 1 }` - Company applications
- `{ status: 1, appliedAt: -1 }` - Application timeline
- `{ 'aiScore.overall': -1 }` - AI ranking

---

### **5. Notification Collection**
Hệ thống thông báo real-time và email.

```javascript
{
  _id: ObjectId,
  recipientId: ObjectId (ref: 'User', required),
  senderId: ObjectId (ref: 'User'),
  
  type: String (enum: ['job_application', 'application_status', 'new_message', 'interview_scheduled', 'job_recommendation', 'system_alert', 'company_update']),
  
  title: String (required),
  message: String (required),
  
  data: {
    jobId: ObjectId (ref: 'Job'),
    applicationId: ObjectId (ref: 'Application'),
    companyId: ObjectId (ref: 'Company'),
    url: String,
    metadata: Mixed
  },
  
  isRead: Boolean (default: false),
  isEmailSent: Boolean (default: false),
  isPushSent: Boolean (default: false),
  
  priority: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'),
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ recipientId: 1, isRead: 1, createdAt: -1 }` - User notifications
- `{ recipientId: 1, type: 1 }` - Notification types
- `{ expiresAt: 1 }` - TTL index (auto-delete expired)

---

### **6. SavedJob Collection**
Quản lý công việc được lưu bởi jobseeker.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  jobId: ObjectId (ref: 'Job', required),
  
  savedAt: Date (default: Date.now),
  notes: String,
  folder: String (default: 'default'),
  
  isApplied: Boolean (default: false),
  appliedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ userId: 1, jobId: 1 }` - Unique constraint
- `{ userId: 1, savedAt: -1 }` - User saved jobs
- `{ userId: 1, folder: 1 }` - Folder organization

---

### **7. Chatbot Collection**
Lưu trữ lịch sử chat và context.

```javascript
{
  _id: ObjectId,
  sessionId: String (required),
  userId: ObjectId (ref: 'User'),
  
  messages: [{
    role: String (enum: ['user', 'assistant', 'system']),
    content: String (required),
    timestamp: Date (default: Date.now),
    intent: String,
    confidence: Number,
    metadata: Mixed
  }],
  
  context: {
    currentTopic: String,
    userPreferences: Mixed,
    lastJobSearch: {
      keywords: [String],
      location: String,
      filters: Mixed
    }
  },
  
  isActive: Boolean (default: true),
  startedAt: Date (default: Date.now),
  lastActivity: Date (default: Date.now),
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ sessionId: 1 }` - Session lookup
- `{ userId: 1 }` - User sessions
- `{ isActive: 1, lastActivity: -1 }` - Active sessions

---

### **8. CrawlerLog Collection**
Theo dõi hoạt động crawler và performance.

```javascript
{
  _id: ObjectId,
  source: String (required), // topcv, vietnamworks, etc.
  status: String (enum: ['success', 'failed', 'partial']),
  
  startTime: Date (required),
  endTime: Date,
  duration: Number, // milliseconds
  
  stats: {
    totalJobs: Number (default: 0),
    newJobs: Number (default: 0),
    updatedJobs: Number (default: 0),
    failedJobs: Number (default: 0),
    internJobs: Number (default: 0)
  },
  
  errors: [{
    message: String,
    timestamp: Date (default: Date.now),
    jobUrl: String
  }],
  
  config: {
    maxPages: Number,
    delay: Number,
    userAgent: String,
    filters: Mixed
  },
  
  metadata: Mixed,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ source: 1, startTime: -1 }` - Source history
- `{ status: 1, startTime: -1 }` - Status tracking
- `{ createdAt: 1 }` - TTL index (auto-delete after 30 days)

---

## 🔍 QUERY PATTERNS & OPTIMIZATION

### **Job Search Queries**
```javascript
// Tìm kiếm công việc intern theo location và salary
db.jobs.find({
  type: 'intern',
  isActive: true,
  'location.city': 'Ho Chi Minh',
  'salary.min': { $gte: 5000000 }
}).sort({ postDate: -1 })

// Text search với AI filtering
db.jobs.find({
  $text: { $search: 'react javascript' },
  'ai.isIntern': true,
  'ai.confidence': { $gte: 0.8 }
})
```

### **Application Management**
```javascript
// Lấy applications cho employer
db.applications.find({
  employerId: ObjectId('...'),
  status: { $in: ['pending', 'reviewing'] }
}).populate('jobseekerId').sort({ appliedAt: -1 })

// Lấy applications cho jobseeker
db.applications.find({
  jobseekerId: ObjectId('...')
}).populate('jobId').sort({ appliedAt: -1 })
```

### **AI Recommendation**
```javascript
// Job matching dựa trên skills
db.jobs.find({
  type: 'intern',
  isActive: true,
  skills: { $in: userSkills },
  'ai.isIntern': true
}).sort({ 'ai.confidence': -1 })
```

---

## 📊 DATA RELATIONSHIPS

### **One-to-Many Relationships**
- User → Applications (jobseeker)
- User → Applications (employer)
- Company → Jobs
- Job → Applications
- User → SavedJobs

### **Many-to-Many Relationships**
- Users ↔ Jobs (through Applications)
- Users ↔ Jobs (through SavedJobs)

### **Referential Integrity**
- Sử dụng MongoDB references với `populate()`
- Cascade updates cho statistics
- Soft deletes cho data integrity

---

## 🚀 PERFORMANCE CONSIDERATIONS

### **Indexing Strategy**
- Compound indexes cho complex queries
- Text indexes cho search functionality
- TTL indexes cho temporary data
- Sparse indexes cho optional fields

### **Data Aggregation**
- Pre-calculated statistics trong documents
- Background jobs cho heavy computations
- Caching layer cho frequent queries

### **Sharding Strategy**
- Shard by user location (city)
- Shard by company for large enterprises
- Shard by date for historical data

---

## 🔒 SECURITY & VALIDATION

### **Data Validation**
- Mongoose schemas với validation rules
- Input sanitization
- Type checking và constraints

### **Access Control**
- Role-based permissions
- Field-level security
- API rate limiting

### **Data Protection**
- Password hashing với bcrypt
- JWT tokens cho authentication
- Encrypted sensitive data

---

## 📈 SCALABILITY PLANS

### **Horizontal Scaling**
- MongoDB replica sets
- Load balancing cho API
- CDN cho static assets

### **Vertical Scaling**
- Database optimization
- Query optimization
- Caching strategies

### **Monitoring**
- Database performance metrics
- Query analysis
- Error tracking và alerting
