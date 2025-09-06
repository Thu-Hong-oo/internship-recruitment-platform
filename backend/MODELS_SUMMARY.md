# 🗄️ Models Summary - InternBridge AI Platform

## 📋 **Tổng quan hệ thống**

Hệ thống đã được thiết kế với các model chính để hỗ trợ nền tảng tuyển dụng thực tập sinh tích hợp AI, với đầy đủ tính năng như TopCV.

---

## 🎯 **Core Models**

### **1. User Model** 👤
**File**: `backend/src/models/User.js`

#### **Chức năng chính**
- Quản lý authentication (local + Google OAuth)
- Role-based access control (student, employer, admin)
- Email verification system
- Profile management

#### **Tính năng nổi bật**
```javascript
// Authentication
authMethod: ['local', 'google', 'hybrid']
isEmailVerified: Boolean
googleProfile: { googleId, picture, locale }

// Profile Management
profile: {
  firstName, lastName, phone, avatar, bio,
  location: { city, district, country },
  student: { university, major, year, gpa }
}

// Role System
role: ['student', 'employer', 'admin']
candidateProfile: ObjectId
employerProfile: ObjectId
```

---

### **2. Job Model** 💼
**File**: `backend/src/models/Job.js`

#### **Chức năng chính**
- Quản lý thông tin công việc thực tập
- Tìm kiếm và lọc nâng cao
- AI integration cho matching
- SEO và URL friendly

#### **Tính năng nổi bật**
```javascript
// Job Information
jobType: ['internship', 'part-time', 'full-time', 'contract', 'freelance']
category: ['tech', 'business', 'marketing', 'design', 'data', 'finance', 'hr', 'sales', 'other']
slug: String // URL friendly

// Internship Details
internship: {
  type: ['summer', 'semester', 'year-round', 'project-based', 'remote', 'hybrid'],
  duration: Number, // 1-24 months
  stipend: { amount, currency, period, isNegotiable }
}

// Requirements
requirements: {
  education: { level, majors, minGpa, year },
  skills: [{ skillId, level, importance }],
  experience: { minMonths, experienceLevel },
  languages: [{ language, level }]
}

// Location & Salary
location: { type, city, district, coordinates }
salary: { type, min, max, currency, period, benefits }

// AI Integration
aiAnalysis: {
  skillsExtracted: [String],
  difficulty: ['beginner', 'intermediate', 'advanced'],
  category: String,
  embedding: [Number],
  matchingScore: Number
}

// Status & Visibility
status: ['draft', 'active', 'paused', 'closed', 'expired', 'filled']
isFeatured: Boolean
isUrgent: Boolean
isHot: Boolean
priority: Number // 1-10
```

#### **Search & Filter Methods**
```javascript
Job.findActive()
Job.findByLocation(city)
Job.findBySkills(skillIds)
Job.findByCategory(category)
Job.findFeatured()
Job.findUrgent()
Job.findHot()
Job.searchJobs(query, filters)
```

---

### **3. Company Model** 🏢
**File**: `backend/src/models/Company.js`

#### **Chức năng chính**
- Quản lý thông tin công ty
- Verification system
- Rating và review system
- Internship program management

#### **Tính năng nổi bật**
```javascript
// Company Information
industry: {
  primary: String, // Required
  secondary: [String],
  tags: [String]
}
size: ['startup', 'small', 'medium', 'large', 'enterprise']
employeeCount: { min, max }

// Digital Presence
website: String
logo: { url, filename, uploadedAt }
banner: { url, filename, uploadedAt }
socialMedia: { linkedin, facebook, twitter, instagram, youtube }

// Location
location: {
  type: ['onsite', 'remote', 'hybrid', 'multiple'],
  headquarters: { address, city, district, coordinates },
  offices: [{ name, address, city, isMain }]
}

// Culture & Benefits
culture: {
  values: [String],
  mission: String,
  vision: String,
  workStyle: [String],
  dressCode: String
}
benefits: [{
  name, description, category, icon, isHighlighted
}]

// Internship Program
internshipProgram: {
  hasProgram: Boolean,
  programName: String,
  description: String,
  duration: { min, max, unit },
  stipend: { hasStipend, amount, currency, period },
  benefits: [String],
  mentorship: Boolean,
  networking: Boolean,
  employmentOpportunity: Boolean
}

// Verification & Rating
verification: {
  isVerified: Boolean,
  verifiedAt: Date,
  verificationMethod: String,
  documents: [Object]
}
rating: {
  overall: Number, // 0-5
  count: Number,
  categories: {
    workLifeBalance, careerGrowth, compensation, management, culture
  }
}
```

#### **Search & Analytics Methods**
```javascript
Company.findByIndustry(industry)
Company.findByLocation(city)
Company.findTopRated(limit)
Company.searchCompanies(query, filters)
company.updateStats()
company.calculateRating()
```

---

### **4. CandidateProfile Model** 👨‍🎓
**File**: `backend/src/models/CandidateProfile.js`

#### **Chức năng chính**
- Quản lý hồ sơ ứng viên
- Skills và experience tracking
- AI analysis cho skill gaps
- Career transition support

#### **Tính năng nổi bật**
```javascript
// Education (Broad Definition)
education: {
  currentStatus: ['student', 'graduated', 'self-taught', 'career-changer'],
  university: String,
  major: String,
  degree: String,
  gpa: Number,
  certifications: [Object]
}

// Experience (Multiple Types)
experience: [{
  type: ['internship', 'project', 'volunteer', 'part-time', 'full-time'],
  title: String,
  company: String,
  description: String,
  skills: [String],
  achievements: [String],
  impact: String
}]

// Skills with Transfer Skills
skills: [{
  skillId: ObjectId,
  level: ['beginner', 'intermediate', 'advanced', 'expert'],
  experience: Number, // months
  isTransferSkill: Boolean,
  projects: [Object],
  certifications: [Object]
}]

// AI Analysis
aiAnalysis: {
  skillGaps: [{
    skillId: ObjectId,
    gapLevel: ['low', 'medium', 'high'],
    recommendedLevel: String,
    priority: Number // 1-10
  }],
  matchingScore: Number,
  careerPath: String,
  strengths: [String],
  weaknesses: [String],
  recommendations: [String]
}

// Career Transition
careerTransition: {
  fromIndustry: String,
  toIndustry: String,
  transitionReason: String,
  transferableSkills: [String],
  transitionTimeline: String,
  supportNeeded: [String]
}
```

---

### **5. EmployerProfile Model** 👔
**File**: `backend/src/models/EmployerProfile.js`

#### **Chức năng chính**
- Quản lý hồ sơ nhà tuyển dụng
- Company verification
- Hiring preferences
- Hiring statistics

#### **Tính năng nổi bật**
```javascript
// Company Information
company: {
  name: String,
  industry: String,
  size: String,
  website: String,
  description: String,
  foundedYear: Number,
  headquarters: Object,
  logo: Object,
  socialMedia: Object
}

// Position Details
position: {
  title: String,
  department: String,
  level: String,
  responsibilities: [String],
  hiringAuthority: Boolean,
  yearsInPosition: Number
}

// Hiring Preferences
preferences: {
  internshipTypes: [String],
  durations: [String],
  locations: [String],
  skills: [{ skillId, priority }],
  salaryRange: { min, max, currency },
  educationLevel: [String],
  experienceLevel: String
}

// Hiring Statistics
hiring: {
  totalPositions: Number,
  activePositions: Number,
  averageHiringTime: Number,
  successRate: Number,
  retentionRate: Number
}

// Verification System
verification: {
  isVerified: Boolean,
  verifiedAt: Date,
  documents: [Object]
}
```

---

### **6. Application Model** 📝
**File**: `backend/src/models/Application.js`

#### **Chức năng chính**
- Quản lý đơn ứng tuyển
- AI analysis cho matching
- Interview management
- Feedback system

#### **Tính năng nổi bật**
```javascript
// Application Status
status: ['pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn']

// Application Materials
resume: { url, filename, uploadedAt }
coverLetter: { content, lastModified }
portfolio: { url, description }

// AI Analysis
aiAnalysis: {
  overallScore: Number, // 0-100
  skillsMatch: Number,
  experienceMatch: Number,
  educationMatch: Number,
  strengthsWeaknesses: { strengths: [String], weaknesses: [String] },
  resumeQuality: Number,
  fitScore: Number
}

// Interview Management
interviews: [{
  type: ['phone', 'video', 'onsite', 'technical', 'final'],
  scheduledAt: Date,
  duration: Number,
  interviewer: Object,
  status: String,
  feedback: Object
}]

// Feedback System
feedback: {
  fromEmployer: { rating, comments, strengths, areas },
  fromApplicant: { rating, comments, experience, suggestions }
}

// Offer Management
offer: {
  salary: { amount, currency, period },
  benefits: [String],
  startDate: Date,
  duration: Number,
  terms: String,
  response: String,
  counterOffer: Object
}
```

---

### **7. SavedJob Model** 🔖
**File**: `backend/src/models/SavedJob.js`

#### **Chức năng chính**
- Bookmark system cho jobs
- Status tracking
- Reminder system
- Organization với tags

#### **Tính năng nổi bật**
```javascript
// Bookmark Information
userId: ObjectId
jobId: ObjectId
savedAt: Date
notes: String
tags: [String]

// Status Tracking
status: ['saved', 'applied', 'interviewed', 'offered', 'rejected', 'withdrawn']
priority: ['low', 'medium', 'high']

// Reminder System
reminder: {
  enabled: Boolean,
  date: Date,
  message: String
}
```

#### **Methods**
```javascript
savedJob.updateStatus('applied')
savedJob.addTag('tech')
savedJob.setReminder(date, message)
SavedJob.findByUser(userId, options)
SavedJob.getUserStats(userId)
SavedJob.getPopularJobs(limit)
```

---

### **8. SkillRoadmap Model** 🗺️
**File**: `backend/src/models/SkillRoadmap.js`

#### **Chức năng chính**
- AI-generated skill development roadmaps
- Progress tracking
- Personalized learning paths
- Milestone management

#### **Tính năng nổi bật**
```javascript
// Roadmap Information
userId: ObjectId
jobId: ObjectId
title: String
description: String

// Target Skills
targetSkills: [{
  skillId: ObjectId,
  currentLevel: String,
  targetLevel: String,
  priority: Number
}]

// Weekly Structure
weeks: [{
  focus: String,
  objectives: [String],
  resources: [String],
  exercises: [String],
  milestone: String,
  completion: {
    status: String,
    completedAt: Date,
    notes: String
  }
}]

// Progress Tracking
progress: {
  currentWeek: Number,
  completedWeeks: Number,
  completedObjectives: Number,
  percentage: Number
}

// AI Metadata
aiGenerated: Boolean
metadata: {
  skillGaps: [Object],
  userProfile: Object,
  targetJob: Object
}
```

---

### **9. Skill Model** 🎯
**File**: `backend/src/models/Skill.js`

#### **Chức năng chính**
- Skill catalog management
- Skill levels và learning paths
- Popularity và demand tracking
- AI integration cho semantic search

#### **Tính năng nổi bật**
```javascript
// Skill Information
name: String
category: ['programming', 'design', 'business', 'soft-skills', 'marketing', 'data', 'devops', 'mobile', 'web', 'other']
aliases: [String]
description: String

// Skill Levels
level: {
  beginner: { description, timeToLearn, resources },
  intermediate: { description, timeToLearn, resources },
  advanced: { description, timeToLearn, resources }
}

// Related Skills
relatedSkills: [ObjectId]
prerequisites: [ObjectId]

// Popularity & Demand
popularity: Number
demandScore: Number // 0-100

// AI Integration
embedding: [Number] // Vector embedding
keywords: [String]

// Metadata
metadata: {
  difficulty: ['easy', 'medium', 'hard'],
  learningTime: Number,
  resources: [String],
  industryRelevance: [String],
  jobRoles: [String]
}
```

---

## 🔧 **Performance Optimizations**

### **1. Index Strategy**
- **Text Search**: Full-text search trên title, description, skills
- **Compound Indexes**: Tối ưu cho complex queries
- **Status-based**: Phân loại theo trạng thái
- **Location-based**: Tìm kiếm theo khu vực
- **Category-based**: Phân loại theo ngành nghề

### **2. Query Optimization**
```javascript
// Efficient pagination với populate
const jobs = await Job.find(query)
  .populate('companyId', 'name logo industry')
  .populate('requirements.skills.skillId', 'name category')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
```

### **3. Virtual Properties**
- **Computed fields**: fullLocation, salaryRange, deadlineText
- **Relationship populate**: company, skills, applications
- **Dynamic calculations**: age, employeeRange

---

## 🚀 **AI Integration Points**

### **1. Job Matching**
```javascript
// AI Analysis trong Job model
aiAnalysis: {
  skillsExtracted: [String],
  difficulty: String,
  category: String,
  embedding: [Number],
  matchingScore: Number
}
```

### **2. Skill Gap Analysis**
```javascript
// AI Analysis trong CandidateProfile
aiAnalysis: {
  skillGaps: [{
    skillId: ObjectId,
    gapLevel: String,
    recommendedLevel: String,
    priority: Number
  }],
  matchingScore: Number,
  careerPath: String
}
```

### **3. Roadmap Generation**
```javascript
// AI-generated roadmaps
aiGenerated: Boolean
metadata: {
  skillGaps: [Object],
  userProfile: Object,
  targetJob: Object
}
```

---

## 📊 **Data Relationships**

### **1. User Relationships**
```
User (1) → (1) CandidateProfile
User (1) → (1) EmployerProfile
User (1) → (N) SavedJob
User (1) → (N) Application
User (1) → (N) SkillRoadmap
```

### **2. Job Relationships**
```
Job (N) → (1) Company
Job (N) → (1) User (postedBy)
Job (1) → (N) Application
Job (1) → (N) SavedJob
Job (N) → (N) Skill (through requirements.skills)
```

### **3. Company Relationships**
```
Company (1) → (N) Job
Company (1) → (N) User (employers)
Company (1) → (N) Review
```

---

## 🎯 **Benefits của Model Design**

### **1. Scalability**
- ✅ **Efficient indexing**: Compound indexes cho complex queries
- ✅ **Modular design**: Tách biệt concerns
- ✅ **Performance optimization**: Virtual properties và methods
- ✅ **Caching ready**: Structure ready for Redis caching

### **2. User Experience**
- ✅ **Flexible search**: Multiple filter options
- ✅ **Personalization**: AI-powered recommendations
- ✅ **Progress tracking**: Skill roadmap progress
- ✅ **Bookmark system**: Saved jobs management

### **3. Business Features**
- ✅ **Analytics**: Comprehensive statistics tracking
- ✅ **Verification**: Company và user verification
- ✅ **Rating system**: Company và job ratings
- ✅ **Interview management**: Complete interview workflow

### **4. AI Integration**
- ✅ **Vector search**: Embedding support
- ✅ **Skill matching**: Advanced skill requirements
- ✅ **Matching score**: AI-powered job matching
- ✅ **Roadmap generation**: Personalized learning paths

---

## 📋 **Migration Checklist**

### **Database Changes**
- [x] Update Job schema với new fields
- [x] Enhance Company model
- [x] Create SavedJob model
- [x] Update SkillRoadmap model
- [x] Add new indexes cho performance

### **API Updates**
- [x] Update job controller với new methods
- [x] Add search endpoints
- [x] Add saved jobs endpoints
- [x] Update response structure

### **Frontend Integration**
- [ ] Update job listing components
- [ ] Add advanced search filters
- [ ] Implement saved jobs feature
- [ ] Add job bookmark functionality

---

## 🎯 **Next Steps**

1. **Test Performance**: Load testing với large dataset
2. **Implement Caching**: Redis cache cho popular queries
3. **Add Analytics**: Track user behavior và job performance
4. **Mobile Optimization**: Responsive design cho mobile
5. **SEO Implementation**: Meta tags và structured data

---

**📅 Last Updated**: December 2024  
**🔄 Version**: 3.0 - Comprehensive Model System  
**👥 Contributors**: Development Team  
**📧 Support**: tech@internbridge.ai
