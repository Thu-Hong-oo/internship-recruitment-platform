# Database Schema

## Tong quan

He thong su dung MongoDB voi Mongoose ODM. Tat ca schemas deu co timestamps va validation rules.

## Core Collections

### users

Collection chinh chua thong tin nguoi dung.

```javascript
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ['CANDIDATE', 'EMPLOYER', 'ADMIN'],
      default: 'CANDIDATE',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'PENDING_VERIFICATION',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
```

### jobs

Collection chua thong tin job postings.

```javascript
const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'],
      default: 'FULL_TIME',
    },
    experience: {
      type: String,
      enum: ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXPERT'],
      default: 'ENTRY',
    },
    salary: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        enum: ['USD', 'VND', 'EUR'],
        default: 'USD',
      },
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'FILLED', 'DRAFT'],
      default: 'DRAFT',
    },
    applicationDeadline: {
      type: Date,
      validate: {
        validator: function (v) {
          return v > this.createdAt;
        },
        message: 'Application deadline must be after creation date',
      },
    },
    views: {
      type: Number,
      default: 0,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ company: 1 });
JobSchema.index({ location: 1 });
JobSchema.index({ type: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
JobSchema.index({ applicationDeadline: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ tags: 1 });
```

### companies

Collection chua thong tin cong ty.

```javascript
const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    website: {
      type: String,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid website URL',
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      enum: ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
      default: 'STARTUP',
    },
    logo: {
      url: String,
      publicId: String, // For Cloudinary
    },
    verified: {
      type: Boolean,
      default: false,
    },
    founded: Number,
    employees: Number,
    socialLinks: {
      linkedin: String,
      facebook: String,
      twitter: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CompanySchema.index({ name: 1 }, { unique: true });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ size: 1 });
CompanySchema.index({ verified: 1 });
```

### applications

Collection chua thong tin job applications.

```javascript
const ApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
    },
    coverLetter: {
      type: String,
      maxlength: 2000,
    },
    cv: {
      filename: String,
      url: String,
      publicId: String,
      size: Number,
      mimeType: String,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    feedback: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
ApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
ApplicationSchema.index({ candidate: 1 });
ApplicationSchema.index({ job: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ appliedAt: -1 });
```

## Profile Collections

### candidate_profiles

Extended profile cho candidates.

```javascript
const CandidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\+?[\d\s\-\(\)]+$/.test(v);
        },
        message: 'Invalid phone number format',
      },
    },
    location: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    experience: {
      type: String,
      enum: ['LESS_THAN_1', '1-2', '3-5', '6-10', 'MORE_THAN_10'],
    },
    skills: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        level: {
          type: String,
          enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
          default: 'BEGINNER',
        },
      },
    ],
    education: [
      {
        degree: {
          type: String,
          required: true,
          enum: [
            'HIGH_SCHOOL',
            'ASSOCIATE',
            'BACHELOR',
            'MASTER',
            'DOCTORATE',
            'OTHER',
          ],
        },
        field: {
          type: String,
          required: true,
        },
        school: {
          type: String,
          required: true,
        },
        year: {
          type: Number,
          min: 1950,
          max: new Date().getFullYear() + 10,
        },
        gpa: {
          type: Number,
          min: 0,
          max: 4,
        },
      },
    ],
    cv: {
      filename: String,
      url: String,
      publicId: String,
      uploadedAt: Date,
    },
    portfolio: String,
    linkedin: String,
    github: String,
    expectedSalary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        enum: ['USD', 'VND', 'EUR'],
        default: 'USD',
      },
    },
    availability: {
      type: String,
      enum: ['IMMEDIATELY', '2_WEEKS', '1_MONTH', '2_MONTHS', '3_MONTHS'],
      default: 'IMMEDIATELY',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CandidateProfileSchema.index({ user: 1 }, { unique: true });
CandidateProfileSchema.index({ 'skills.name': 1 });
CandidateProfileSchema.index({ location: 1 });
```

### employer_profiles

Extended profile cho employers.

```javascript
const EmployerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: String,
    phone: String,
    permissions: {
      canCreateJobs: {
        type: Boolean,
        default: true,
      },
      canViewApplications: {
        type: Boolean,
        default: true,
      },
      canManageCompany: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmployerProfileSchema.index({ user: 1 }, { unique: true });
EmployerProfileSchema.index({ company: 1 });
```

## Supporting Collections

### notifications

Collection chua thong bao.

```javascript
const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'APPLICATION_STATUS_UPDATE',
        'JOB_RECOMMENDATION',
        'COMPANY_UPDATE',
        'SYSTEM_ANNOUNCEMENT',
        'INTERVIEW_INVITATION',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 });
```

### saved_jobs

Collection chua jobs da luu boi candidates.

```javascript
const SavedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SavedJobSchema.index({ user: 1, job: 1 }, { unique: true });
SavedJobSchema.index({ user: 1, savedAt: -1 });
```

### skills

Collection chua danh sach skills.

```javascript
const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ['TECHNICAL', 'SOFT', 'LANGUAGE', 'OTHER'],
      default: 'TECHNICAL',
    },
    description: String,
    aliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    popularity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SkillSchema.index({ name: 1 }, { unique: true });
SkillSchema.index({ category: 1 });
SkillSchema.index({ aliases: 1 });
SkillSchema.index({ popularity: -1 });
```

## AI & Analytics Collections

### ai_matching_history

Collection chua lich su AI matching.

```javascript
const AiMatchingHistorySchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    skillMatch: {
      score: Number,
      matchedSkills: [String],
      missingSkills: [String],
    },
    experienceMatch: {
      score: Number,
      required: String,
      candidate: String,
    },
    recommendations: [
      {
        type: String,
        maxlength: 500,
      },
    ],
    matchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AiMatchingHistorySchema.index({ candidate: 1, matchedAt: -1 });
AiMatchingHistorySchema.index({ job: 1 });
AiMatchingHistorySchema.index({ matchScore: -1 });
```

### learning_roadmaps

Collection chua learning roadmaps cho candidates.

```javascript
const LearningRoadmapSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    targetJobTitle: String,
    currentSkills: [String],
    targetSkills: [String],
    skillGaps: [String],
    phases: [
      {
        title: String,
        description: String,
        duration: Number, // days
        skills: [String],
        resources: [
          {
            type: {
              type: String,
              enum: ['COURSE', 'BOOK', 'VIDEO', 'ARTICLE', 'PROJECT'],
            },
            title: String,
            url: String,
            provider: String,
            cost: String,
          },
        ],
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    estimatedDuration: Number, // days
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'ABANDONED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LearningRoadmapSchema.index({ candidate: 1 });
LearningRoadmapSchema.index({ targetJob: 1 });
LearningRoadmapSchema.index({ status: 1 });
```

## Admin & System Collections

### admin_logs

Collection chua logs cho admin actions.

```javascript
const AdminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_SUSPEND',
        'USER_ACTIVATE',
        'COMPANY_VERIFY',
        'JOB_DELETE',
        'SYSTEM_CONFIG_UPDATE',
      ],
    },
    targetType: {
      type: String,
      enum: ['USER', 'COMPANY', 'JOB', 'SYSTEM'],
    },
    targetId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
AdminLogSchema.index({ admin: 1, createdAt: -1 });
AdminLogSchema.index({ action: 1 });
AdminLogSchema.index({ targetType: 1, targetId: 1 });
```

## Database Configuration

### Connection Settings

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/internship_platform
MONGODB_TEST_URI=mongodb://localhost:27017/internship_platform_test

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d
```

## Data Migration Scripts

### Migration Example

```javascript
const mongoose = require('mongoose');

const migrateJobStatuses = async () => {
  try {
    // Update old status values to new enum values
    await mongoose.connection
      .collection('jobs')
      .updateMany({ status: 'OPEN' }, { $set: { status: 'ACTIVE' } });

    await mongoose.connection
      .collection('jobs')
      .updateMany({ status: 'CLOSED' }, { $set: { status: 'FILLED' } });

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

## Performance Optimization

### Indexing Strategy

- Single field indexes cho cac truong thuong query
- Compound indexes cho cac query phuc tap
- Text indexes cho search functionality
- TTL indexes cho data tam thoi

### Query Optimization

```javascript
// Good: Use select to limit fields
const users = await User.find().select('name email');

// Good: Use lean() for read-only
const jobs = await Job.find().lean();

// Good: Use pagination
const jobs = await Job.find()
  .sort({ createdAt: -1 })
  .limit(10)
  .skip((page - 1) * 10);
```

### Aggregation Pipeline

```javascript
// Get job statistics
const jobStats = await Job.aggregate([
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgSalary: { $avg: '$salary.max' },
    },
  },
  {
    $sort: { count: -1 },
  },
]);
```

---

_Generated on: October 30, 2025_
