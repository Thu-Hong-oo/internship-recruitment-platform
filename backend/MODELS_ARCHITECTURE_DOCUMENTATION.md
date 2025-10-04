# 📚 **MODELS ARCHITECTURE DOCUMENTATION**

## _Internship Recruitment Platform Backend_

---

## 🏗️ **TỔNG QUAN KIẾN TRÚC**

### **Main Models (5 Core Entities)**

```
User ←→ CandidateProfile / EmployerProfile
      ↓
    Job ←→ Application
```

### **AI/Recommendation System (4 Models)**

- `JobRecommendation` - Cache gợi ý job cho candidates
- `CandidateRecommendation` - Cache gợi ý candidate cho employers
- `AIAnalysis` - Phân tích AI cho CV, job, skill assessment
- `ResumeBuilder` - Công cụ tạo CV với AI

### **Skills Ecosystem (4 Models)**

- `Skill` - Kỹ năng cơ bản
- `SkillCategory` - Phân loại kỹ năng theo hierarchy
- `SkillLearningPath` - Lộ trình học kỹ năng chi tiết
- `SkillRoadmap` - Roadmap cá nhân hóa cho từng intern

### **Career Development (1 Model)**

- `CareerPath` - Lộ trình phát triển nghề nghiệp

### **Communication & Support (2 Models)**

- `Notification` - Hệ thống thông báo đa kênh
- `Chatbot` - AI c---

_Xin lỗi vì đã đếm thiếu! Thực tế có **19 models/schemas** như bạn đã chỉ ra. Documentation này đã được cập nhật để phản ánh chính xác kiến trúc hoàn chỉnh của hệ thống._

## 📋 **MODELS MISSING FROM INITIAL COUNT**

### **SKILL ROADMAP MODEL** _(Personalized intern development paths)_

```javascript
{
  internId: ObjectId → CandidateProfile (required),
  targetJob: {
    jobId: ObjectId → Job,
    title: String,
    requiredSkills: [{ name, level }]
  },
  analysis: {
    currentSkills: [{ name, level, proficiency }],
    skillGaps: [{ skillName, currentLevel, requiredLevel, gap, priority }]
  },
  roadmap: {
    startDate: Date,
    endDate: Date,
    milestones: [{ title, skills, estimatedCompletion, status }]
  },
  progress: {
    overallProgress: Number, // 0-100%
    completedMilestones: Number,
    skillsAcquired: [String],
    timeSpent: Number,
    lastUpdated: Date
  },
  status: 'draft' | 'active' | 'paused' | 'completed'
}
```

### **CHATBOT MODEL** _(AI conversation system)_

```javascript
{
  userId: ObjectId → User,
  sessionId: String,
  type: 'cv_review' | 'job_search' | 'career_guidance' | 'skill_development',
  conversation: [{
    role: 'user' | 'assistant' | 'system',
    content: String,
    timestamp: Date,
    intent: String,
    entities: [{ type, value, confidence }]
  }],
  nlpAnalysis: {
    keywords: [String],
    sentiment: { score: Number, label: String },
    topics: [String]
  },
  isActive: Boolean
}
```

### **ENHANCED SCHEMA DETAILS**

#### **CompanyInfoSchema** _(Complete company profile)_

- Company details, contact info, social media
- Address, industry classification, size
- Culture, benefits, tech stack information

#### **BusinessInfoSchema** _(Legal business data)_

- Registration number, tax ID validation
- Business type, scope, registered capital
- Legal representative information
- Bank account details

#### **VerificationSchema** _(Document verification workflow)_

- Multi-document upload system
- AI-powered document analysis
- Admin review workflow with notes
- Status tracking and rejection handling

---

*This documentation provides a comprehensive overview of the entire model architecture, designed for scalable AI-powered recruitment platform with **19 total models/schemas**.*atbot hỗ trợ tương tác

### **Schema Components (3 Sub-schemas)**

- `CompanyInfoSchema` - Thông tin công ty chi tiết
- `BusinessInfoSchema` - Thông tin pháp lý kinh doanh
- `VerificationSchema` - Workflow xác minh tài liệu

### **📊 TỔNG CỘNG: 19 MODELS/SCHEMAS**

---

## 👤 **USER MODEL**

_Central authentication and profile management_

### **Core Fields**

```javascript
{
  // Authentication
  email: String (unique, required),
  password: String (hashed, conditional),
  authMethod: 'local' | 'google' | 'hybrid',
  googleId: String (unique, sparse),

  // Profile
  role: 'candidate' | 'employer' | 'admin',
  fullName: String (required),
  avatar: String,

  // References to profile models
  candidateProfile: ObjectId → CandidateProfile,
  employerProfile: ObjectId → EmployerProfile,

  // Account status
  status: 'active' | 'inactive' | 'suspended' | 'banned',
  isEmailVerified: Boolean,
  lastLogin: Date
}
```

### **Features**

- **Multi-auth support**: Local password + Google OAuth
- **Role-based access**: Automatic profile creation based on role
- **Account management**: Status tracking, email verification
- **Security**: Password hashing, JWT generation

### **Key Methods**

- `getSignedJwtToken()` - Generate JWT tokens
- `matchPassword(password)` - Verify passwords
- `updateStatus(status, reason, adminId)` - Admin status management

---

## 👨‍🎓 **CANDIDATE PROFILE MODEL**

_Comprehensive candidate information and job-seeking features_

### **Core Structure**

```javascript
{
  userId: ObjectId → User (unique),

  // Personal Information (NEW)
  personalInfo: {
    fullName: String,
    givenName: String,
    familyName: String,
    dateOfBirth: Date,
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say',
    phone: String,
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      country: String (default: 'Vietnam')
    },
    bio: String (max: 500)
  },

  // Education
  education: {
    university: {
      name, major, degree, graduationYear, gpa,
      courses: [String],
      achievements: [String]
    },
    certifications: [{
      name, issuer, issueDate, expiryDate, credentialUrl
    }]
  },

  // Skills with verification
  skills: {
    technical: [{
      name: String,
      level: 'beginner' | 'intermediate' | 'advanced',
      verified: Boolean,
      endorsements: Number,
      projects: [{ name, description, url }]
    }],
    soft: [{ name, self_assessment: Number }],
    languages: [{ name, level, certificate }]
  },

  // Experience
  experience: {
    internships: [{
      company, position, startDate, endDate,
      description, skills: [String],
      projects: [{ name, description, technologies }]
    }],
    projects: [{
      name, description, role, technologies,
      url, startDate, endDate
    }]
  },

  // Job preferences
  preferences: {
    locations: [String],
    internshipTypes: ['full-time' | 'part-time' | 'remote'],
    industries: [String],
    minSalary: Number,
    availableFrom: Date,
    duration: { min, max, unit }
  },

  // Resume management
  resume: {
    current: {
      url, updatedAt, filename, displayName,
      format, size,
      aiAnalysis: {
        skills: [{ name, confidence, context }],
        suggestions: [String],
        analyzedAt: Date
      }
    },
    history: [{ url, uploadedAt, filename, ... }]
  },

  // Progress tracking
  progress: {
    profileCompletion: Number (0-100),
    skillVerification: { completed, total },
    activeRoadmaps: [{
      roadmapId: ObjectId → SkillRoadmap,
      progress: Number,
      startedAt: Date
    }]
  },

  // Analytics
  analytics: {
    viewCount: Number,
    applicationStats: {
      total, pending, approved, rejected,
      interviewsScheduled, offersReceived
    },
    skillTrends: [{ skill, trend, period }],
    lastActive: Date
  }
}
```

### **Virtual Fields**

- `skillsCount` - Total technical skills
- `isProfileComplete` - Profile completion >= 80%
- `topSkills` - Advanced level skills (top 5)
- `experienceYears` - Calculated from internships

### **Key Features**

- **Comprehensive profiling**: Personal info, education, skills, experience
- **AI-enhanced resume analysis**: Automatic skill extraction and suggestions
- **Progress tracking**: Profile completion, skill verification
- **Job preferences**: Location, type, salary requirements
- **Analytics**: View tracking, application statistics

---

## 🏢 **EMPLOYER PROFILE MODEL**

_Company information and recruitment management_

### **Core Structure**

```javascript
{
  owner: ObjectId → User (unique),

  // Company information (uses CompanyInfoSchema)
  company: {
    name: String (required),
    description: String,
    industry: String,
    size: '1-10' | '11-50' | '51-200' | '201-500' | '500+',
    website: String,
    logo: String,
    founded: Number,
    headquarters: String,
    officeAddress: String,
    socialMedia: {
      linkedin, facebook, twitter, instagram
    }
  },

  // Business information (uses BusinessInfoSchema)
  businessInfo: {
    businessLicense: {
      number: String (required),
      issueDate: Date,
      issuePlace: String,
      type: 'enterprise' | 'household' | 'cooperative'
    },
    taxCode: String (required),
    registrationAddress: String,
    businessScope: [String],
    bankAccount: {
      bankName, accountNumber, accountName
    }
  },

  // Legal representative
  legalRepresentative: {
    fullName: String (required),
    position: String (required),
    phone: String (required),
    email: String (required),
    identification: {
      type: 'CMND' | 'CCCD' | 'Passport',
      number, issueDate, issuePlace
    }
  },

  // Contact person
  contact: {
    name: String (required),
    phone: String (required),
    email: String (required),
    position: String
  },

  // HR Team management
  members: [{
    user: ObjectId → User,
    role: 'owner' | 'hr_manager' | 'hr_staff' | 'recruiter',
    permissions: {
      canPostJobs: Boolean,
      canReviewApplications: Boolean,
      canScheduleInterviews: Boolean,
      canMakeOffers: Boolean,
      canManageTeam: Boolean
    },
    joinedAt: Date,
    invitedBy: ObjectId → User,
    status: 'active' | 'inactive' | 'pending'
  }],

  // Document verification (uses VerificationSchema)
  verification: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected',
    documents: [{
      type: 'business_license' | 'tax_certificate' | 'legal_rep_id',
      filename, originalName, uploadedAt,
      verificationStatus: 'pending' | 'approved' | 'rejected',
      rejectionReason: String,
      verifiedAt: Date,
      verifiedBy: ObjectId → User
    }],
    isVerified: Boolean,
    verifiedAt: Date,
    rejectionReason: String,
    reviewedBy: ObjectId → User
  },

  // Company statistics
  stats: {
    jobsPosted: Number,
    activeJobs: Number,
    totalApplications: Number,
    hiredCandidates: Number,
    averageTimeToHire: Number,
    responseRate: Number
  },

  // Subscription and limits
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise',
    limits: {
      jobPosts: Number,
      applications: Number,
      teamMembers: Number
    },
    features: [String],
    expiresAt: Date
  }
}
```

### **Key Features**

- **Complete company profiling**: Business info, legal details, contact
- **Document verification system**: Upload and admin verification
- **Team management**: Multi-user HR teams with role-based permissions
- **Subscription system**: Plan limits and feature access
- **Statistics tracking**: Hiring metrics and performance

---

## 💼 **JOB MODEL**

_Job postings with AI-enhanced matching_

### **Core Structure**

```javascript
{
  employer: ObjectId → EmployerProfile (required),
  postedBy: ObjectId → User (required),

  // Basic job information
  title: String (required, max: 100),
  slug: String (unique, indexed),
  description: String (required, max: 5000),
  requirements: String,
  benefits: String,

  // Classification
  skills: [String],
  tags: [String],
  category: String,
  industry: String,
  level: 'Intern' | 'Fresher' | 'Junior' | 'Senior' | 'Manager' | 'Director',
  jobType: 'Fulltime' | 'Parttime' | 'Intern' | 'Freelance' | 'Remote' | 'Hybrid',
  workingMode: 'Onsite' | 'Remote' | 'Hybrid',

  // Location and compensation
  address: String,
  location: String,
  salaryMin: Number,
  salaryMax: Number,
  currency: String (default: 'VND'),

  // Requirements
  experience: String,
  education: String,
  deadline: Date,
  positions: Number,

  // Status and metrics
  status: 'draft' | 'pending' | 'active' | 'paused' | 'closed' | 'filled' | 'rejected' | 'deleted',
  views: Number,
  stats: {
    applications: Number,
    interviews: Number,
    offers: Number
  },

  // AI Enhancement (ENHANCED)
  ai: {
    keywords: [String],
    embedding: [Number], // Vector for semantic search

    // NEW: Extracted skills with importance
    extractedSkills: [{
      name: String,
      importance: 'required' | 'preferred' | 'nice-to-have',
      level: String,
      confidence: Number
    }],

    // NEW: Job categorization
    jobCategory: {
      primary: String,
      secondary: [String],
      confidence: Number
    },

    // NEW: Matching pool for performance
    matchingPool: [{
      candidateId: ObjectId → CandidateProfile,
      matchScore: Number,
      matchReasons: [String],
      updatedAt: Date
    }],

    // Enhanced candidate suggestions
    suggestedCandidates: [{
      candidateId: ObjectId → CandidateProfile,
      score: Number,
      matchingSkills: [String],
      strengthsMatch: [String],
      weaknessesMatch: [String],
      recommendations: [String]
    }],

    analyzedAt: Date,
    needsReanalysis: Boolean
  },

  // Soft delete
  deletedAt: Date,
  deletedBy: ObjectId → User
}
```

### **Virtual Fields**

- `isExpired` - Check if past deadline
- `daysUntilDeadline` - Days remaining
- `isUrgent` - Deadline within 7 days
- `applicationRate` - Applications/views percentage
- `isHot` - High AI hot score

### **Key Features**

- **AI-powered matching**: Skill extraction, candidate suggestions
- **Comprehensive classification**: Skills, categories, levels
- **Performance tracking**: Views, applications, conversion rates
- **Smart recommendations**: ML-based candidate matching
- **Soft delete**: Data preservation for analytics

---

## 📄 **APPLICATION MODEL**

_Job applications with AI-powered scoring_

### **Core Structure**

```javascript
{
  candidateId: ObjectId → CandidateProfile (required),
  jobId: ObjectId → Job (required),

  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'hired' | 'rejected',

  // Application content
  coverLetter: String (max: 1000),
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  resume: {
    url: String,
    version: Number,
    uploadedAt: Date
  },

  // Matching analysis
  matchingScore: {
    overall: Number,
    skills: [{
      name: String,
      score: Number,
      required: Boolean
    }],
    experience: Number,
    education: Number
  },

  // Interview process
  interviews: [{
    scheduledAt: Date,
    duration: Number,
    type: String,
    location: String,
    interviewer: ObjectId → User,
    feedback: {
      strengths: [String],
      weaknesses: [String],
      notes: String,
      decision: String
    }
  }],

  // Status timeline
  timeline: [{
    status: String,
    note: String,
    createdAt: Date,
    createdBy: ObjectId → User
  }],

  // Employer feedback
  feedback: {
    rating: Number,
    strengths: [String],
    improvements: [String],
    notes: String,
    createdAt: Date,
    updatedAt: Date
  },

  // AI Analysis (NEW)
  aiAnalysis: {
    resumeScore: {
      overall: Number,
      sections: {
        format: Number,
        content: Number,
        keywords: Number,
        experience: Number
      }
    },

    matchAnalysis: {
      overallFit: Number,
      technicalFit: Number,
      experienceFit: Number,
      educationFit: Number,
      culturalFit: Number,

      strengths: [String],
      concerns: [String],
      recommendations: [String]
    },

    predictedSuccess: {
      probability: Number,
      factors: [{
        factor: String,
        impact: Number,
        explanation: String
      }]
    },

    analyzedAt: Date
  }
}
```

### **Key Features**

- **AI-powered scoring**: Resume analysis, fit assessment
- **Complete application lifecycle**: From submission to hiring
- **Interview management**: Scheduling, feedback, decisions
- **Predictive analytics**: Success probability, factors
- **Timeline tracking**: Status changes with notes

---

## 🎯 **SKILLS ECOSYSTEM**

### **SKILL MODEL** _(Simplified)_

```javascript
{
  name: String (unique, required),
  category: String, // slug format
  aliases: [String],
  description: String,

  // AI embeddings for semantic search
  embedding: [Number],

  // Simple metadata
  popularity: Number,
  isActive: Boolean,

  // Market information
  demandLevel: 'low' | 'medium' | 'high' | 'critical',
  trend: 'declining' | 'stable' | 'growing' | 'emerging'
}
```

### **SKILL LEARNING PATH MODEL** _(Separated)_

```javascript
{
  skillId: ObjectId → Skill (unique),

  levels: [{
    name: 'beginner' | 'intermediate' | 'advanced',
    description: String,
    criteria: [String],
    assessment: 'self' | 'test' | 'project' | 'interview',
    estimatedDuration: { value: Number, unit: String }
  }],

  prerequisites: [{
    skillId: ObjectId → Skill,
    level: String,
    required: Boolean
  }],

  resources: [{
    type: 'video' | 'article' | 'exercise' | 'project' | 'quiz' | 'course',
    title: String,
    url: String,
    provider: String,
    duration: Number,
    difficulty: String,
    cost: 'free' | 'paid' | 'freemium',
    rating: Number
  }],

  milestones: [{
    name: String,
    description: String,
    level: String,
    tasks: [String],
    projects: [{ title, description, difficulty, technologies }]
  }],

  careerPaths: [{
    pathId: ObjectId → CareerPath,
    relevance: Number,
    requiredLevel: String
  }],

  marketData: {
    jobDemand: { level, trend, lastUpdated },
    salaryImpact: { percentage, confidence, lastUpdated }
  },

  learningStats: {
    averageCompletionTime: Number,
    successRate: Number,
    difficultyRating: Number,
    popularityScore: Number
  }
}
```

### **CAREER PATH MODEL**

```javascript
{
  name: String (required),
  slug: String (unique),
  description: String,

  targetRoles: [String],
  industries: [String],

  levels: [{
    name: String, // 'Intern', 'Junior', 'Mid', 'Senior'
    order: Number,
    requiredSkills: [{
      skillId: ObjectId → Skill,
      level: String,
      importance: Number
    }],
    estimatedDuration: { min, max, unit },
    milestones: [{ title, description, criteria }]
  }],

  learningResources: [{
    type: String,
    title: String,
    url: String,
    provider: String,
    duration: Number,
    difficulty: String,
    relevantLevel: String
  }],

  successStories: [{
    candidateId: ObjectId → CandidateProfile,
    currentLevel: String,
    timeSpent: Number,
    testimonial: String
  }],

  popularity: Number,
  isActive: Boolean
}
```

---

## 🤖 **AI/RECOMMENDATION SYSTEM**

### **JOB RECOMMENDATION MODEL** _(Cache for Candidates)_

```javascript
{
  candidateId: ObjectId → CandidateProfile (indexed),

  recommendations: [{
    jobId: ObjectId → Job,
    score: Number,
    reason: String,
    matchDetails: {
      skillsMatch: Number,
      experienceMatch: Number,
      educationMatch: Number,
      locationMatch: Number,
      salaryMatch: Number
    },
    whyGoodFit: [String],
    concerns: [String]
  }],

  filters: {
    skills: [String],
    locations: [String],
    industries: [String],
    salaryRange: { min, max }
  },

  generatedAt: Date,
  expiresAt: Date (TTL: 24h),
  isStale: Boolean
}
```

### **CANDIDATE RECOMMENDATION MODEL** _(Cache for Employers)_

```javascript
{
  jobId: ObjectId → Job (indexed),

  recommendations: [{
    candidateId: ObjectId → CandidateProfile,
    score: Number,
    rank: Number,
    matchDetails: {
      technicalFit: Number,
      experienceFit: Number,
      educationFit: Number,
      culturalFit: Number,
      growthPotential: Number
    },
    strengths: [String],
    concerns: [String],
    interviewQuestions: [String]
  }],

  generatedAt: Date,
  expiresAt: Date (TTL: 24h),
  isStale: Boolean
}
```

---

## 📄 **RESUME BUILDER MODEL**

_AI-powered resume creation and management_

```javascript
{
  candidateId: ObjectId → CandidateProfile (required),

  templateId: String,

  content: {
    personalInfo: Object,
    summary: String,
    experience: [Object],
    education: [Object],
    skills: [Object],
    projects: [Object],
    certifications: [Object]
  },

  customization: {
    targetJobId: ObjectId → Job,
    targetRole: String,
    tailoredFor: String,
    keywords: [String]
  },

  aiGenerated: {
    summary: Boolean,
    experienceBullets: [Number], // indexes of AI-generated content
    suggestions: [String]
  },

  versions: [{
    content: Object,
    createdAt: Date,
    note: String
  }],

  exports: [{
    format: 'pdf' | 'docx' | 'html',
    url: String,
    generatedAt: Date
  }],

  isDefault: Boolean,
  status: 'draft' | 'completed' | 'archived'
}
```

---

## 🔗 **SUPPORTING MODELS**

### **NOTIFICATION MODEL**

```javascript
{
  recipient: ObjectId → User,
  type: 'application' | 'interview' | 'job_match' | 'system',
  title: String,
  message: String,
  data: Object, // Additional context data
  isRead: Boolean,
  readAt: Date,
  priority: 'low' | 'medium' | 'high',
  actionUrl: String
}
```

### **SKILL CATEGORY MODEL**

```javascript
{
  name: String (required),
  slug: String (unique),
  description: String,
  icon: String,
  color: String,
  parentCategory: ObjectId → SkillCategory,
  isActive: Boolean,
  sortOrder: Number
}
```

### **AI ANALYSIS MODEL**

```javascript
{
  type: 'resume' | 'job' | 'matching',
  targetId: ObjectId, // Can reference any model
  analysisData: Object,
  confidence: Number,
  version: String,
  processedAt: Date,
  processingTime: Number
}
```

---

## 📊 **DATABASE INDEXES**

### **Performance Critical Indexes**

```javascript
// CandidateProfile
{ 'skills.technical.name': 1, 'skills.technical.level': 1 }
{ 'preferences.locations': 1, 'preferences.industries': 1 }
{ 'resume.current.aiAnalysis.skills.name': 1 }

// Job
{ 'ai.embedding': 1 } // Vector search
{ skills: 1, location: 1, status: 1 }
{ 'ai.suggestedCandidates.score': -1 }
{ status: 1, createdAt: -1 }

// Application
{ jobId: 1, 'matchingScore.overall': -1 }
{ candidateId: 1, status: 1, createdAt: -1 }
{ 'aiAnalysis.matchAnalysis.overallFit': -1 }

// Recommendations (TTL)
{ expiresAt: 1 } // Auto-expire after 24h
```

---

## 🎯 **KEY FEATURES SUMMARY**

### **AI/ML Integration**

- ✅ **Vector embeddings** for semantic search
- ✅ **Skill extraction** from job descriptions
- ✅ **Resume analysis** with confidence scores
- ✅ **Matching algorithms** with explainable results
- ✅ **Recommendation caching** with TTL

### **Performance Optimization**

- ✅ **Strategic indexing** for fast queries
- ✅ **Virtual fields** for calculated properties
- ✅ **Soft delete** for data preservation
- ✅ **Caching layers** for recommendations
- ✅ **Pagination support** across all listings

### **Business Logic**

- ✅ **Role-based access** control
- ✅ **Document verification** workflows
- ✅ **Team management** for employers
- ✅ **Subscription limits** enforcement
- ✅ **Analytics tracking** throughout

### **Data Integrity**

- ✅ **Comprehensive validation** rules
- ✅ **Referential integrity** via ObjectIds
- ✅ **Status workflows** with timeline tracking
- ✅ **Audit trails** for admin actions
- ✅ **Backup-friendly** soft deletes

---

## 📈 **NEXT DEVELOPMENT PRIORITIES**

1. **AI Services Integration**

   - Implement vector search with embeddings
   - Add ML-based skill extraction
   - Build recommendation engines

2. **Performance Monitoring**

   - Add query performance tracking
   - Implement caching strategies
   - Monitor index effectiveness

3. **Advanced Features**

   - Real-time notifications
   - Advanced search filters
   - Career path recommendations
   - Interview scheduling system

4. **Analytics & Reporting**
   - Admin dashboards
   - Employer analytics
   - Candidate insights
   - Market trends

---

_This documentation provides a comprehensive overview of the entire model architecture, designed for scalable AI-powered recruitment platform._
