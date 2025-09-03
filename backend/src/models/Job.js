const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề công việc là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Công ty là bắt buộc']
  },
  
  // Thông tin thực tập
  internship: {
    type: {
      type: String,
      enum: ['summer', 'semester', 'year-round', 'project-based'],
      required: [true, 'Loại thực tập là bắt buộc']
    },
    duration: {
      type: Number,
      min: 1,
      max: 12,
      required: [true, 'Thời gian thực tập là bắt buộc']
    }, // months
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc']
    },
    endDate: Date,
    isPaid: {
      type: Boolean,
      default: false
    },
    stipend: {
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'VND'
      },
      period: {
        type: String,
        enum: ['month', 'week', 'hour'],
        default: 'month'
      }
    },
    academicCredit: {
      type: Boolean,
      default: false
    },
    remoteOption: {
      type: Boolean,
      default: false
    }
  },
  
  // Requirements
  requirements: {
    education: {
      level: {
        type: String,
        enum: ['Bachelor', 'Master', 'PhD'],
        default: 'Bachelor'
      },
      majors: [String],
      minGpa: {
        type: Number,
        min: 0,
        max: 4
      },
      year: [{
        type: Number,
        min: 1,
        max: 4,
        validate: {
          validator: Number.isInteger,
          message: 'Năm học phải là số nguyên'
        }
      }] // [2, 3, 4]
    },
    skills: [{
      skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true
      },
      level: {
        type: String,
        enum: ['required', 'preferred', 'nice-to-have'],
        default: 'required'
      },
      importance: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      }
    }],
    experience: {
      minMonths: {
        type: Number,
        min: 0,
        default: 0
      },
      projectBased: {
        type: Boolean,
        default: true
      }
    }
  },
  
  description: {
    type: String,
    required: [true, 'Mô tả công việc là bắt buộc'],
    maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự']
  },
  responsibilities: [{
    type: String,
    maxlength: [500, 'Trách nhiệm không được vượt quá 500 ký tự']
  }],
  benefits: [{
    type: String,
    maxlength: [200, 'Lợi ích không được vượt quá 200 ký tự']
  }],
  learningOutcomes: [{
    type: String,
    maxlength: [300, 'Kết quả học tập không được vượt quá 300 ký tự']
  }],
  
  location: {
    city: {
      type: String,
      required: [true, 'Thành phố là bắt buộc']
    },
    district: String,
    country: {
      type: String,
      default: 'VN'
    },
    remote: {
      type: Boolean,
      default: false
    },
    hybrid: {
      type: Boolean,
      default: false
    }
  },
  
  // AI Analysis
  aiAnalysis: {
    skillsExtracted: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    category: {
      type: String,
      enum: ['tech', 'business', 'marketing', 'design', 'data', 'other'],
      default: 'tech'
    },
    embedding: [{
      type: Number
    }], // Vector embedding
    lastAnalyzedAt: Date
  },
  
  // Application settings
  applicationSettings: {
    requireCoverLetter: {
      type: Boolean,
      default: false
    },
    requireResume: {
      type: Boolean,
      default: true
    },
    requirePortfolio: {
      type: Boolean,
      default: false
    },
    maxApplications: {
      type: Number,
      min: 1,
      default: 100
    },
    deadline: Date,
    rollingBasis: {
      type: Boolean,
      default: true
    }
  },
  
  status: {
    type: String,
    enum: ['active', 'closed', 'draft', 'expired'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  stats: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    saves: {
      type: Number,
      default: 0
    }
  },
  
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ 'internship.type': 1, 'location.city': 1, 'internship.duration': 1 });
JobSchema.index({ status: 1, isActive: 1, createdAt: -1 });
JobSchema.index({ companyId: 1, status: 1 });
JobSchema.index({ 'requirements.skills.skillId': 1 });
JobSchema.index({ 'aiAnalysis.difficulty': 1, 'aiAnalysis.category': 1 });
JobSchema.index({ 'aiAnalysis.lastAnalyzedAt': -1 });

// Virtual để lấy thông tin company
JobSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

// Virtual để lấy thông tin postedBy
JobSchema.virtual('poster', {
  ref: 'User',
  localField: 'postedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual để lấy skills chi tiết
JobSchema.virtual('skillDetails', {
  ref: 'Skill',
  localField: 'requirements.skills.skillId',
  foreignField: '_id'
});

// Virtual để lấy applications
JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId'
});

// Method để lấy required skills
JobSchema.methods.getRequiredSkills = function() {
  return this.requirements.skills.filter(skill => skill.level === 'required');
};

// Method để lấy preferred skills
JobSchema.methods.getPreferredSkills = function() {
  return this.requirements.skills.filter(skill => skill.level === 'preferred');
};

// Method để update stats
JobSchema.methods.updateStats = async function() {
  const applicationCount = await this.model('Application').countDocuments({
    jobId: this._id
  });
  
  this.stats.applications = applicationCount;
  return this.save();
};

// Method để check if job is expired
JobSchema.methods.isExpired = function() {
  if (!this.applicationSettings.deadline) return false;
  return new Date() > this.applicationSettings.deadline;
};

// Method để check if job is full
JobSchema.methods.isFull = function() {
  return this.stats.applications >= this.applicationSettings.maxApplications;
};

// Static method để tìm active internships
JobSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    $or: [
      { 'applicationSettings.deadline': { $gt: new Date() } },
      { 'applicationSettings.rollingBasis': true }
    ]
  }).sort({ createdAt: -1 });
};

// Static method để tìm internships theo location
JobSchema.statics.findByLocation = function(city) {
  return this.find({
    status: 'active',
    'location.city': city
  }).sort({ createdAt: -1 });
};

// Static method để tìm internships theo skills
JobSchema.statics.findBySkills = function(skillIds) {
  return this.find({
    status: 'active',
    'requirements.skills.skillId': { $in: skillIds }
  }).sort({ createdAt: -1 });
};

// Pre-save middleware
JobSchema.pre('save', function(next) {
  // Auto-set endDate if not provided
  if (!this.internship.endDate && this.internship.startDate && this.internship.duration) {
    const endDate = new Date(this.internship.startDate);
    endDate.setMonth(endDate.getMonth() + this.internship.duration);
    this.internship.endDate = endDate;
  }
  
  // Validate deadline is after startDate
  if (this.applicationSettings.deadline && this.internship.startDate) {
    if (this.applicationSettings.deadline < this.internship.startDate) {
      return next(new Error('Deadline phải sau ngày bắt đầu thực tập'));
    }
  }
  
  // Validate at least one skill is required
  if (this.requirements.skills.length === 0) {
    return next(new Error('Ít nhất một kỹ năng là bắt buộc'));
  }
  
  next();
});

module.exports = mongoose.model('Job', JobSchema);

