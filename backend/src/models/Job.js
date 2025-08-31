const mongoose = require('mongoose');



const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Job title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a job description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  companyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: [true, 'Please add a company']
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  location: {
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    state: String,
    country: {
      type: String,
      default: 'Vietnam'
    },
    remote: {
      type: Boolean,
      default: false
    }
  },
  employmentType: {
    type: String,
    enum: ['internship', 'part-time', 'full-time', 'contract', 'freelance'],
    required: [true, 'Please add employment type']
  },
  salaryRange: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    }
  },
  requirements: {
    education: {
      level: {
        type: String,
        enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'any'],
        default: 'any'
      },
      field: [String]
    },
    experience: {
      years: {
        type: Number,
        min: 0,
        default: 0
      },
      level: {
        type: String,
        enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'any'],
        default: 'entry'
      }
    },
    skills: {
      required: [{
        name: String,
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced'],
          default: 'beginner'
        },
        priority: {
          type: String,
          enum: ['must-have', 'nice-to-have'],
          default: 'must-have'
        }
      }],
      preferred: [String]
    },
    languages: [{
      name: String,
      level: {
        type: String,
        enum: ['basic', 'conversational', 'fluent', 'native'],
        default: 'basic'
      }
    }]
  },
  benefits: [String],
  applicationDeadline: {
    type: Date,
    required: [true, 'Please add application deadline']
  },
  startDate: {
    type: Date
  },
  duration: {
    months: Number,
    description: String
  },
  contactInfo: {
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: String,
    website: String
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'cancelled'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  
  // AI Analysis Fields
  aiAnalysis: {
    skillsExtracted: [String],
    difficultyLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior'],
      default: 'entry'
    },
    matchingScore: {
      type: Number,
      min: 0,
      max: 100
    },
    embedding: [Number], // Vector embedding for similarity search
    lastAnalyzed: Date,
    keywords: [String],
    category: String,
    estimatedApplications: Number
  },
  
  // SEO and Search
  slug: String,
  
  // Internal tracking
  internalNotes: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
JobSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.applicationDeadline > new Date();
});

JobSchema.virtual('daysLeft').get(function() {
  const today = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'job',
  justOne: false
});

// Indexes for better search performance
JobSchema.index({ title: 'text', description: 'text', company: 'text' });
JobSchema.index({ 'location.city': 1, 'location.country': 1 });
JobSchema.index({ employmentType: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ applicationDeadline: 1 });
JobSchema.index({ postedBy: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ 'requirements.skills.required.name': 1 });
JobSchema.index({ 'aiAnalysis.category': 1 });
JobSchema.index({ 'aiAnalysis.difficultyLevel': 1 });

// Compound indexes
JobSchema.index({ status: 1, applicationDeadline: 1 });
JobSchema.index({ employmentType: 1, 'location.city': 1 });
JobSchema.index({ 'requirements.experience.level': 1, employmentType: 1 });

// Create slug before saving
JobSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Update application count when applications change
JobSchema.methods.updateApplicationCount = async function() {
  const Application = mongoose.model('Application');
  const count = await Application.countDocuments({ job: this._id });
  this.applicationCount = count;
  await this.save();
};

// Static methods
JobSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    applicationDeadline: { $gt: new Date() }
  });
};

JobSchema.statics.findBySkills = function(skills) {
  return this.find({
    'requirements.skills.required.name': { $in: skills }
  });
};

JobSchema.statics.findByLocation = function(city, country = 'Vietnam') {
  return this.find({
    $or: [
      { 'location.city': new RegExp(city, 'i') },
      { 'location.remote': true }
    ],
    'location.country': country
  });
};

module.exports = mongoose.model('Job', JobSchema);

