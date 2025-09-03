# 🗄️ Database Design - InternBridge AI Platform

## 📅 Cập nhật mới nhất: Authentication Fixes & Candidate Profile Structure

### 🎯 **Mục tiêu thiết kế**

- Hỗ trợ nền tảng tuyển dụng thực tập sinh tích hợp AI
- Mở rộng định nghĩa "intern" không chỉ giới hạn ở sinh viên
- Tối ưu hóa cấu trúc dữ liệu cho AI analysis và matching
- Đảm bảo tính nhất quán và hiệu suất cao

---

## 🏗️ **Cấu trúc Database**

### **1. Users Collection** 📊

#### **Schema: User**

```javascript
{
  _id: ObjectId,

  // Authentication
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: function() { return this.authMethod === 'local'; },
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },

  // Profile Information (Updated Structure)
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'Tên không được vượt quá 50 ký tự']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Họ không được vượt quá 50 ký tự']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio không được vượt quá 500 ký tự']
    },
    location: {
      city: String,
      district: String,
      country: {
        type: String,
        default: 'Vietnam'
      }
    },
    student: {
      university: String,
      major: String,
      year: Number,
      gpa: {
        type: Number,
        min: [0, 'GPA không thể âm'],
        max: [4, 'GPA không thể vượt quá 4']
      },
      graduationDate: Date,
      studentId: String
    }
  },

  // Role-based Access
  role: {
    type: String,
    enum: ['student', 'employer', 'admin'],
    default: 'student'
  },

  // Authentication Method
  authMethod: {
    type: String,
    enum: ['local', 'google', 'hybrid'],
    default: 'local'
  },

  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Google OAuth
  googleProfile: {
    googleId: String,
    picture: String,
    locale: String
  },

  // Profile References (Updated)
  candidateProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CandidateProfile'
  },
  employerProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployerProfile'
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### **Indexes**

```javascript
// Performance indexes
{ email: 1 } // Unique index
{ role: 1 }
{ 'profile.firstName': 1, 'profile.lastName': 1 }
{ isEmailVerified: 1 }
{ authMethod: 1 }
{ createdAt: -1 }
{ lastLogin: -1 }

// Compound indexes
{ role: 1, isActive: 1 }
{ email: 1, isEmailVerified: 1 }
{ 'profile.location.city': 1, role: 1 }
```

#### **Virtuals**

```javascript
// Full name virtual
UserSchema.virtual('fullName').get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.email;
});

// Profile URL virtual
UserSchema.virtual('profileUrl').get(function () {
  return `/api/users/${this._id}`;
});
```

---

### **2. CandidateProfiles Collection** 👨‍🎓

#### **Schema: CandidateProfile**

```javascript
{
  _id: ObjectId,

  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Personal Information
  personalInfo: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    phone: String,
    address: {
      city: String,
      district: String,
      fullAddress: String,
      country: {
        type: String,
        default: 'Vietnam'
      }
    },
    linkedin: {
      type: String,
      match: [/^https:\/\/linkedin\.com\/in\/.+/, 'LinkedIn URL không hợp lệ']
    },
    github: {
      type: String,
      match: [/^https:\/\/github\.com\/.+/, 'GitHub URL không hợp lệ']
    },
    portfolio: {
      type: String,
      match: [/^https?:\/\/.+/, 'Portfolio URL không hợp lệ']
    }
  },

  // Education (Broad Definition)
  education: {
    currentStatus: {
      type: String,
      enum: ['student', 'graduated', 'self-taught', 'career-changer'],
      required: true
    },
    university: String,
    major: String,
    degree: {
      type: String,
      enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Self-taught']
    },
    graduationYear: Number,
    gpa: {
      type: Number,
      min: [0, 'GPA không thể âm'],
      max: [4, 'GPA không thể vượt quá 4']
    },
    yearsSinceGraduation: Number, // For graduated candidates
    expectedGraduation: Date, // For current students
    currentSemester: Number, // For current students
    academicAchievements: [String],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String,
      url: String
    }]
  },

  // Experience (Multiple Types)
  experience: [{
    type: {
      type: String,
      enum: ['internship', 'project', 'volunteer', 'part-time', 'full-time', 'freelance', 'research', 'competition']
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
    },
    company: String,
    description: {
      type: String,
      maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isCurrent: {
      type: Boolean,
      default: false
    },
    skills: [String],
    achievements: [String],
    technologies: [String],
    projectUrl: String,
    teamSize: Number,
    role: String,
    impact: {
      type: String,
      maxlength: [500, 'Tác động không được vượt quá 500 ký tự']
    }
  }],

  // Skills with Transfer Skills
  skills: [{
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    experience: {
      type: Number, // months
      min: [0, 'Kinh nghiệm không thể âm']
    },
    isTransferSkill: {
      type: Boolean,
      default: false
    },
    projects: [{
      name: String,
      description: String,
      url: String,
      technologies: [String]
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      credentialId: String
    }]
  }],

  // Resume Management
  resume: {
    url: String,
    filename: String,
    uploadedAt: Date,
    lastModified: Date,
    version: {
      type: Number,
      default: 1
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },

  // Preferences
  preferences: {
    internshipType: [{
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'hybrid', 'project-based']
    }],
    duration: {
      type: String,
      enum: ['1-month', '2-months', '3-months', '6-months', '1-year', 'flexible']
    },
    location: [String],
    industries: [String],
    salaryExpectation: {
      min: {
        type: Number,
        min: [0, 'Lương tối thiểu không thể âm']
      },
      max: Number,
      currency: {
        type: String,
        default: 'VND'
      }
    },
    careerGoals: [String],
    preferredRoles: [String],
    workStyle: [{
      type: String,
      enum: ['collaborative', 'independent', 'leadership', 'supportive']
    }],
    learningGoals: [String]
  },

  // AI Analysis
  aiAnalysis: {
    skillGaps: [{
      skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      },
      gapLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      recommendedLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      },
      priority: {
        type: Number,
        min: [1, 'Priority phải từ 1-10'],
        max: [10, 'Priority phải từ 1-10']
      }
    }],
    matchingScore: {
      type: Number,
      min: [0, 'Score không thể âm'],
      max: [100, 'Score không thể vượt quá 100']
    },
    careerPath: String,
    lastAnalyzed: Date,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  },

  // Career Transition (for career changers)
  careerTransition: {
    fromIndustry: String,
    toIndustry: String,
    transitionReason: String,
    transferableSkills: [String],
    transitionTimeline: {
      type: String,
      enum: ['immediate', '3-months', '6-months', '1-year', 'flexible']
    },
    supportNeeded: [String]
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'seeking', 'employed', 'graduated'],
    default: 'active'
  },

  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### **Indexes**

```javascript
// Performance indexes
{ userId: 1 } // Unique index
{ 'education.currentStatus': 1 }
{ 'education.university': 1 }
{ 'education.major': 1 }
{ 'skills.skillId': 1 }
{ 'preferences.location': 1 }
{ 'preferences.industries': 1 }
{ status: 1 }
{ createdAt: -1 }

// Compound indexes
{ 'education.currentStatus': 1, status: 1 }
{ 'skills.skillId': 1, 'skills.level': 1 }
{ 'preferences.location': 1, 'preferences.internshipType': 1 }
{ 'aiAnalysis.matchingScore': -1, status: 1 }
```

---

### **3. EmployerProfiles Collection** 🏢

#### **Schema: EmployerProfile**

```javascript
{
  _id: ObjectId,

  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Company Information
  company: {
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Tên công ty không được vượt quá 100 ký tự']
    },
    industry: {
      type: String,
      required: true
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      required: true
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Website URL không hợp lệ']
    },
    description: {
      type: String,
      maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
    },
    foundedYear: Number,
    headquarters: {
      city: String,
      country: {
        type: String,
        default: 'Vietnam'
      }
    },
    logo: {
      url: String,
      filename: String,
      uploadedAt: Date
    },
    socialMedia: {
      linkedin: String,
      facebook: String,
      twitter: String
    }
  },

  // Position Details
  position: {
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Chức danh không được vượt quá 100 ký tự']
    },
    department: String,
    level: {
      type: String,
      enum: ['junior', 'mid-level', 'senior', 'manager', 'director', 'executive']
    },
    responsibilities: [String],
    hiringAuthority: {
      type: Boolean,
      default: false
    },
    yearsInPosition: Number
  },

  // Contact Information
  contact: {
    phone: String,
    linkedin: String,
    workEmail: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    availability: {
      type: String,
      enum: ['weekdays', 'weekends', 'flexible', 'by-appointment']
    }
  },

  // Hiring Preferences
  preferences: {
    internshipTypes: [{
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'hybrid', 'project-based']
    }],
    durations: [{
      type: String,
      enum: ['1-month', '2-months', '3-months', '6-months', '1-year', 'flexible']
    }],
    locations: [String],
    skills: [{
      skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      },
      priority: {
        type: String,
        enum: ['required', 'preferred', 'nice-to-have']
      }
    }],
    salaryRange: {
      min: {
        type: Number,
        min: [0, 'Lương tối thiểu không thể âm']
      },
      max: Number,
      currency: {
        type: String,
        default: 'VND'
      }
    },
    educationLevel: [{
      type: String,
      enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD']
    }],
    experienceLevel: {
      type: String,
      enum: ['no-experience', 'beginner', 'intermediate', 'advanced']
    }
  },

  // Hiring Statistics
  hiring: {
    totalPositions: {
      type: Number,
      default: 0
    },
    activePositions: {
      type: Number,
      default: 0
    },
    averageHiringTime: Number, // days
    successRate: {
      type: Number,
      min: [0, 'Tỷ lệ thành công không thể âm'],
      max: [100, 'Tỷ lệ thành công không thể vượt quá 100']
    },
    retentionRate: {
      type: Number,
      min: [0, 'Tỷ lệ giữ chân không thể âm'],
      max: [100, 'Tỷ lệ giữ chân không thể vượt quá 100']
    }
  },

  // Verification System
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: {
        type: String,
        enum: ['business-license', 'tax-certificate', 'company-registration', 'other']
      },
      url: String,
      filename: String,
      uploadedAt: Date,
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### **Indexes**

```javascript
// Performance indexes
{ userId: 1 } // Unique index
{ 'company.name': 1 }
{ 'company.industry': 1 }
{ 'company.size': 1 }
{ 'position.title': 1 }
{ 'verification.isVerified': 1 }
{ createdAt: -1 }

// Compound indexes
{ 'company.industry': 1, 'verification.isVerified': 1 }
{ 'preferences.locations': 1, 'verification.isVerified': 1 }
{ 'hiring.activePositions': -1, 'verification.isVerified': 1 }
```

---

### **4. Skills Collection** 🎯

#### **Schema: Skill**

```javascript
{
  _id: ObjectId,

  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: [100, 'Tên skill không được vượt quá 100 ký tự']
  },
  category: {
    type: String,
    enum: ['programming', 'design', 'business', 'soft-skills', 'marketing', 'data', 'devops', 'mobile', 'web', 'other'],
    required: true
  },
  aliases: [String], // Alternative names for the skill
  description: {
    type: String,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },

  // Skill Levels
  level: {
    beginner: {
      description: String,
      timeToLearn: Number, // hours
      resources: [String]
    },
    intermediate: {
      description: String,
      timeToLearn: Number, // hours
      resources: [String]
    },
    advanced: {
      description: String,
      timeToLearn: Number, // hours
      resources: [String]
    }
  },

  // Related Skills
  relatedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],

  // Popularity and Demand
  popularity: {
    type: Number,
    default: 0,
    min: [0, 'Popularity không thể âm']
  },
  demandScore: {
    type: Number,
    default: 0,
    min: [0, 'Demand score không thể âm'],
    max: [100, 'Demand score không thể vượt quá 100']
  },

  // AI Integration
  embedding: [Number], // Vector embedding for semantic search
  keywords: [String], // Keywords for matching

  // Metadata
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    learningTime: Number, // hours
    resources: [{
      type: String,
      enum: ['course', 'video', 'book', 'project', 'tutorial', 'documentation']
    }],
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    industryRelevance: [String],
    jobRoles: [String]
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### **Indexes**

```javascript
// Performance indexes
{ name: 1 } // Unique index
{ category: 1 }
{ popularity: -1 }
{ demandScore: -1 }
{ isActive: 1 }
{ createdAt: -1 }

// Compound indexes
{ category: 1, popularity: -1 }
{ category: 1, demandScore: -1 }
{ 'metadata.difficulty': 1, popularity: -1 }
```

#### **Virtuals**

```javascript
// Virtual để lấy số lượng users có skill này
SkillSchema.virtual('userCount', {
  ref: 'CandidateProfile',
  localField: '_id',
  foreignField: 'skills.skillId',
  count: true,
});

// Method để tính user count
SkillSchema.methods.getUserCount = async function () {
  const userCount = await this.model('CandidateProfile').countDocuments({
    'skills.skillId': this._id,
  });
  return userCount;
};
```

---

### **5. Jobs Collection** 💼

#### **Schema: Job**

```javascript
{
  _id: ObjectId,

  // Basic Information
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    required: true,
    maxlength: [5000, 'Mô tả không được vượt quá 5000 ký tự']
  },

  // Company Reference
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Employer Reference
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Internship Specific
  internship: {
    type: {
      type: String,
      enum: ['summer', 'semester', 'year-round', 'project-based'],
      required: true
    },
    duration: {
      type: Number, // months
      required: true,
      min: [1, 'Thời gian thực tập phải ít nhất 1 tháng']
    },
    startDate: Date,
    endDate: Date,
    isPaid: {
      type: Boolean,
      default: false
    },
    stipend: {
      amount: Number,
      currency: {
        type: String,
        default: 'VND'
      },
      period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly']
      }
    },
    academicCredit: {
      type: Boolean,
      default: false
    },
    remoteOption: {
      type: Boolean,
      default: false
    },
    flexibleHours: {
      type: Boolean,
      default: false
    }
  },

  // Requirements
  requirements: {
    education: {
      level: {
        type: String,
        enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD']
      },
      majors: [String],
      minGpa: {
        type: Number,
        min: [0, 'GPA tối thiểu không thể âm'],
        max: [4, 'GPA tối thiểu không thể vượt quá 4']
      },
      year: [Number] // [2, 3, 4] for university years
    },
    skills: [{
      skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      },
      level: {
        type: String,
        enum: ['required', 'preferred', 'nice-to-have']
      },
      importance: {
        type: Number,
        min: [1, 'Importance phải từ 1-10'],
        max: [10, 'Importance phải từ 1-10']
      }
    }],
    experience: {
      minMonths: {
        type: Number,
        min: [0, 'Kinh nghiệm tối thiểu không thể âm']
      },
      projectBased: {
        type: Boolean,
        default: false
      }
    },
    languages: [{
      language: String,
      level: {
        type: String,
        enum: ['basic', 'intermediate', 'fluent', 'native']
      }
    }]
  },

  // Location
  location: {
    type: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      required: true
    },
    address: {
      city: String,
      district: String,
      fullAddress: String,
      country: {
        type: String,
        default: 'Vietnam'
      }
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Benefits
  benefits: {
    stipend: {
      type: Boolean,
      default: false
    },
    transportation: {
      type: Boolean,
      default: false
    },
    meals: {
      type: Boolean,
      default: false
    },
    accommodation: {
      type: Boolean,
      default: false
    },
    healthInsurance: {
      type: Boolean,
      default: false
    },
    learningOpportunities: [String],
    mentorship: {
      type: Boolean,
      default: false
    },
    networkingEvents: {
      type: Boolean,
      default: false
    },
    potentialEmployment: {
      type: Boolean,
      default: false
    }
  },

  // Application Settings
  applicationSettings: {
    deadline: Date,
    maxApplications: {
      type: Number,
      default: 100
    },
    currentApplications: {
      type: Number,
      default: 0
    },
    requireCoverLetter: {
      type: Boolean,
      default: false
    },
    requirePortfolio: {
      type: Boolean,
      default: false
    },
    requireReferences: {
      type: Boolean,
      default: false
    },
    questions: [{
      question: String,
      required: Boolean,
      type: {
        type: String,
        enum: ['text', 'textarea', 'multiple-choice', 'file']
      },
      options: [String] // For multiple choice questions
    }]
  },

  // AI Analysis
  aiAnalysis: {
    skillsExtracted: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    category: {
      type: String,
      enum: ['tech', 'business', 'marketing', 'design', 'data', 'other']
    },
    embedding: [Number], // Vector embedding
    lastAnalyzedAt: Date,
    matchingCandidates: [{
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CandidateProfile'
      },
      score: Number,
      matchedSkills: [String],
      skillGaps: [String]
    }]
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'expired'],
    default: 'draft'
  },

  // System Fields
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### **Indexes**

```javascript
// Performance indexes
{ company: 1 }
{ employer: 1 }
{ status: 1 }
{ 'internship.type': 1 }
{ 'location.type': 1 }
{ 'location.address.city': 1 }
{ createdAt: -1 }
{ views: -1 }

// Compound indexes
{ status: 1, createdAt: -1 }
{ 'location.address.city': 1, status: 1 }
{ 'internship.type': 1, status: 1 }
{ 'requirements.skills.skillId': 1, status: 1 }
{ 'aiAnalysis.category': 1, status: 1 }
```

---

### **6. Applications Collection** 📝

#### **Schema: Application**

```javascript
{
  _id: ObjectId,

  // References
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },

  // Application Materials
  resume: {
    url: String,
    filename: String,
    uploadedAt: Date
  },
  coverLetter: {
    content: String,
    lastModified: Date
  },
  portfolio: {
    url: String,
    description: String
  },

  // Additional Information
  additionalInfo: {
    availableStartDate: Date,
    expectedSalary: {
      amount: Number,
      currency: {
        type: String,
        default: 'VND'
      }
    },
    workPreference: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid', 'flexible']
    },
    referenceContact: {
      name: String,
      position: String,
      email: String,
      phone: String
    },
    motivationLetter: String,
    questions: [{
      question: String,
      answer: String
    }]
  },

  // AI Analysis
  aiAnalysis: {
    overallScore: {
      type: Number,
      min: [0, 'Score không thể âm'],
      max: [100, 'Score không thể vượt quá 100']
    },
    skillsMatch: {
      type: Number,
      min: [0, 'Skills match không thể âm'],
      max: [100, 'Skills match không thể vượt quá 100']
    },
    experienceMatch: {
      type: Number,
      min: [0, 'Experience match không thể âm'],
      max: [100, 'Experience match không thể vượt quá 100']
    },
    educationMatch: {
      type: Number,
      min: [0, 'Education match không thể âm'],
      max: [100, 'Education match không thể vượt quá 100']
    },
    strengthsWeaknesses: {
      strengths: [String],
      weaknesses: [String]
    },
    resumeQuality: {
      type: Number,
      min: [0, 'Resume quality không thể âm'],
      max: [100, 'Resume quality không thể vượt quá 100']
    },
    fitScore: {
      type: Number,
      min: [0, 'Fit score không thể âm'],
      max: [100, 'Fit score không thể vượt quá 100']
    }
  },

  // Interview Management
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'final']
    },
    scheduledAt: Date,
    duration: Number, // minutes
    interviewer: {
      name: String,
      position: String,
      email: String
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
    },
    feedback: {
      rating: {
        type: Number,
        min: [1, 'Rating phải từ 1-5'],
        max: [5, 'Rating phải từ 1-5']
      },
      comments: String,
      strengths: [String],
      areas: [String],
      recommendation: {
        type: String,
        enum: ['strong-yes', 'yes', 'maybe', 'no', 'strong-no']
      }
    },
    notes: String
  }],

  // Feedback
  feedback: {
    fromEmployer: {
      rating: {
        type: Number,
        min: [1, 'Rating phải từ 1-5'],
        max: [5, 'Rating phải từ 1-5']
      },
      comments: String,
      strengths: [String],
      areas: [String]
    },
    fromApplicant: {
      rating: {
        type: Number,
        min: [1, 'Rating phải từ 1-5'],
        max: [5, 'Rating phải từ 1-5']
      },
      comments: String,
      experience: String,
      suggestions: [String]
    }
  },

  // Communications
  communications: [{
    type: {
      type: String,
      enum: ['email', 'message', 'notification', 'call']
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    subject: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    },
    important: {
      type: Boolean,
      default: false
    }
  }],

  // Timeline
  timeline: [{
    action: {
      type: String,
      enum: ['applied', 'viewed', 'shortlisted', 'interview-scheduled', 'interview-completed', 'offered', 'accepted', 'rejected', 'withdrawn']
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],

  // Offer
  offer: {
    salary: {
      amount: Number,
      currency: {
        type: String,
        default: 'VND'
      },
      period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly']
      }
    },
    benefits: [String],
    startDate: Date,
    duration: Number, // months
    location: String,
    terms: String,
    expiryDate: Date,
    response: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'counter-offer']
    },
    counterOffer: {
      salary: {
        amount: Number,
        currency: String
      },
      terms: String,
      submittedAt: Date
    }
  },

  // System Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### **Indexes**

```javascript
// Performance indexes
{ job: 1 }
{ applicant: 1 }
{ status: 1 }
{ createdAt: -1 }
{ 'aiAnalysis.overallScore': -1 }

// Compound indexes
{ job: 1, applicant: 1 } // Unique compound index
{ status: 1, createdAt: -1 }
{ applicant: 1, status: 1 }
{ job: 1, status: 1 }
{ 'aiAnalysis.overallScore': -1, status: 1 }
```

---

## 🔧 **Authentication Fixes Summary**

### **1. User Model Updates**

- ✅ **Bỏ required validation** cho `firstName` và `lastName` trong `profile`
- ✅ **Cấu trúc profile object** đúng format
- ✅ **References** từ `studentProfile` → `candidateProfile`

### **2. AuthController Fixes**

- ✅ **User creation** sử dụng `profile` object
- ✅ **Response structure** sử dụng `user.profile.firstName`
- ✅ **Consistent error handling**

### **3. UserController Fixes**

- ✅ **Profile management** sử dụng `profile` object paths
- ✅ **Avatar upload** sử dụng `'profile.avatar'`
- ✅ **Google account linking** consistent profile access

---

## 🚀 **Benefits của Database Design**

### **1. Broader Intern Definition**

- ✅ Hỗ trợ sinh viên, người đã tốt nghiệp, tự học, chuyển ngành
- ✅ Career transition tracking
- ✅ Transferable skills recognition

### **2. AI-Ready Structure**

- ✅ Vector embeddings cho semantic search
- ✅ Skill gap analysis
- ✅ Matching score calculation
- ✅ Career path recommendations

### **3. Enhanced User Experience**

- ✅ Flexible authentication (local + Google)
- ✅ Proper email verification flow
- ✅ Role-based access control
- ✅ Comprehensive profile management

### **4. Scalable Architecture**

- ✅ Modular profile system
- ✅ Efficient indexing
- ✅ Proper data relationships
- ✅ Audit trails và timeline tracking

---

## 📋 **Migration Checklist**

### **Database Changes**

- [x] Update User model structure
- [x] Create CandidateProfile model
- [x] Create EmployerProfile model
- [x] Update Skill model references
- [x] Update Job model for internship focus
- [x] Create comprehensive Application model

### **Authentication Fixes**

- [x] Fix user creation in authController
- [x] Fix response structures
- [x] Update profile access patterns
- [x] Remove required validation for firstName/lastName

### **Documentation Updates**

- [x] Update API_STRUCTURE.md
- [x] Update DATABASE_DESIGN.md
- [x] Create CANDIDATE_PROFILE_UPDATE.md
- [x] Update Postman collection
- [x] Update environment variables

---

## 🔍 **Testing Requirements**

### **Authentication Testing**

- [ ] Register new user (no token returned)
- [ ] Email verification flow
- [ ] Login with verified email
- [ ] Resend verification email
- [ ] Password reset flow

### **Profile Management Testing**

- [ ] Create candidate profile
- [ ] Update candidate profile
- [ ] Upload resume
- [ ] Manage skills
- [ ] Create employer profile
- [ ] Upload verification documents

### **Database Integration Testing**

- [ ] All models working correctly
- [ ] Indexes performing well
- [ ] Relationships functioning
- [ ] Data validation working

---

## 📊 **Performance Metrics**

### **Database Performance**

- ✅ Optimized indexes for common queries
- ✅ Efficient data relationships
- ✅ Proper data validation
- ✅ Scalable structure

### **Query Performance**

- ✅ Fast user lookups
- ✅ Efficient skill matching
- ✅ Quick job searches
- ✅ Fast application processing

---

## 🎯 **Next Steps**

1. **Test Authentication Flow**: Đăng ký → Verify email → Login
2. **Test Profile Creation**: Candidate và Employer profiles
3. **Test File Uploads**: Resume, avatar, company documents
4. **Test AI Integration**: Skill analysis, job matching
5. **Performance Testing**: Load testing với sample data
6. **Security Audit**: Review authentication và authorization

---

**📅 Last Updated**: December 2024  
**🔄 Version**: 2.0 - AI-Powered Internship Platform  
**👥 Contributors**: Development Team  
**📧 Support**: tech@internbridge.ai
