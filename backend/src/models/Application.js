const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'Job',
    required: [true, 'Application must belong to a job']
  },
  applicant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Application must have an applicant']
  },
  
  // Application Status
  status: {
    type: String,
    enum: [
      'pending',      // Vừa nộp, chờ xem xét
      'reviewing',    // Đang được review
      'shortlisted',  // Đã lọt vào danh sách ngắn
      'interview',    // Mời phỏng vấn
      'offered',      // Đã có offer
      'accepted',     // Đã chấp nhận offer
      'rejected',     // Bị từ chối
      'withdrawn'     // Ứng viên rút lui
    ],
    default: 'pending'
  },
  
  // Application Materials
  resume: {
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  coverLetter: {
    content: String,
    lastModified: {
      type: Date,
      default: Date.now
    }
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
    referenceContact: String,
    motivationLetter: String,
    questions: [{
      question: String,
      answer: String,
      required: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // AI Analysis Results
  aiAnalysis: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    skillsMatch: {
      matched: [String],
      missing: [String],
      additional: [String],
      score: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    experienceMatch: {
      relevantExperience: [String],
      experienceGap: [String],
      score: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    educationMatch: {
      relevantEducation: Boolean,
      educationLevel: String,
      score: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    strengthsWeaknesses: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String]
    },
    resumeQuality: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      feedback: [String],
      suggestions: [String]
    },
    fitScore: {
      cultural: Number,
      technical: Number,
      overall: Number
    },
    lastAnalyzed: {
      type: Date,
      default: Date.now
    },
    analysisVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  // Interview Process
  interviews: [{
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'final'],
      required: true
    },
    scheduledAt: Date,
    duration: {
      type: Number, // in minutes
      default: 60
    },
    interviewer: {
      name: String,
      email: String,
      role: String
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    feedback: {
      technical: {
        score: {
          type: Number,
          min: 1,
          max: 10
        },
        comments: String
      },
      communication: {
        score: {
          type: Number,
          min: 1,
          max: 10
        },
        comments: String
      },
      cultural: {
        score: {
          type: Number,
          min: 1,
          max: 10
        },
        comments: String
      },
      overall: {
        score: {
          type: Number,
          min: 1,
          max: 10
        },
        recommendation: {
          type: String,
          enum: ['strong-hire', 'hire', 'neutral', 'no-hire', 'strong-no-hire']
        },
        comments: String
      }
    },
    notes: String,
    recordingUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Feedback and Notes
  feedback: {
    fromEmployer: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      privateNotes: String,
      tags: [String]
    },
    fromApplicant: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      interviewExperience: String
    }
  },
  
  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'message', 'notification', 'system']
    },
    from: {
      type: String,
      enum: ['applicant', 'employer', 'system']
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
  
  // Timeline tracking
  timeline: [{
    action: {
      type: String,
      enum: [
        'applied',
        'viewed',
        'shortlisted',
        'interview_scheduled',
        'interview_completed',
        'offer_made',
        'offer_accepted',
        'offer_rejected',
        'application_rejected',
        'application_withdrawn'
      ]
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    actor: {
      type: String,
      enum: ['applicant', 'employer', 'system']
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Offer Details (if applicable)
  offer: {
    salary: {
      amount: Number,
      currency: String,
      period: String
    },
    benefits: [String],
    startDate: Date,
    duration: String,
    location: String,
    terms: String,
    expiryDate: Date,
    response: {
      decision: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'countered']
      },
      responseDate: Date,
      counterOffer: {
        salary: Number,
        terms: String,
        message: String
      },
      declineReason: String
    }
  },
  
  // System Fields
  source: {
    type: String,
    enum: ['direct', 'referral', 'social-media', 'job-board', 'career-fair'],
    default: 'direct'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  internalNotes: String,
  tags: [String],
  
  // Tracking
  viewedByEmployer: {
    type: Boolean,
    default: false
  },
  viewedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
ApplicationSchema.virtual('daysSinceApplication').get(function() {
  const today = new Date();
  const applied = new Date(this.createdAt);
  const diffTime = today - applied;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

ApplicationSchema.virtual('isActive').get(function() {
  return !['rejected', 'withdrawn', 'accepted'].includes(this.status);
});

ApplicationSchema.virtual('hasInterview').get(function() {
  return this.interviews && this.interviews.length > 0;
});

ApplicationSchema.virtual('latestInterview').get(function() {
  if (!this.interviews || this.interviews.length === 0) return null;
  return this.interviews[this.interviews.length - 1];
});

// Indexes
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true }); // Prevent duplicate applications
ApplicationSchema.index({ applicant: 1 });
ApplicationSchema.index({ job: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ createdAt: -1 });
ApplicationSchema.index({ 'aiAnalysis.overallScore': -1 });
ApplicationSchema.index({ lastActivity: -1 });
ApplicationSchema.index({ priority: 1, status: 1 });

// Compound indexes
ApplicationSchema.index({ job: 1, status: 1, 'aiAnalysis.overallScore': -1 });
ApplicationSchema.index({ applicant: 1, status: 1, createdAt: -1 });

// Middleware
ApplicationSchema.pre('save', function(next) {
  // Update lastActivity on any change
  this.lastActivity = new Date();
  
  // Add timeline entry for status changes
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      action: this.status === 'pending' ? 'applied' : this.status,
      description: `Application status changed to ${this.status}`,
      actor: 'system'
    });
  }
  
  next();
});

// Post save middleware to update job application count
ApplicationSchema.post('save', async function() {
  const Job = mongoose.model('Job');
  const job = await Job.findById(this.job);
  if (job) {
    await job.updateApplicationCount();
  }
});

// Static methods
ApplicationSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

ApplicationSchema.statics.findByScore = function(minScore) {
  return this.find({ 'aiAnalysis.overallScore': { $gte: minScore } });
};

ApplicationSchema.statics.getStatsByJob = async function(jobId) {
  return this.aggregate([
    { $match: { job: mongoose.Types.ObjectId(jobId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' }
      }
    }
  ]);
};

// Instance methods
ApplicationSchema.methods.addTimelineEntry = function(action, description, actor = 'system', metadata = {}) {
  this.timeline.push({
    action,
    description,
    actor,
    metadata,
    timestamp: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

ApplicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interviews.push(interviewData);
  return this.addTimelineEntry('interview_scheduled', 'Interview scheduled', 'employer');
};

ApplicationSchema.methods.updateStatus = function(newStatus, actor = 'system', description = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (!description) {
    description = `Status changed from ${oldStatus} to ${newStatus}`;
  }
  
  return this.addTimelineEntry(newStatus, description, actor);
};



module.exports = mongoose.model('Application', ApplicationSchema);
