const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên công ty là bắt buộc'],
    trim: true,
    unique: true
  },

  profile: {
    description: String,
    industry: [String],
    founded: Number,
    size: {
      type: String,
      enum: ['1-50', '51-200', '201-500', '501-1000', '1000+']
    },
    website: String,
    logo: {
      url: String,
      publicId: String
    },
    socialLinks: {
      linkedin: String,
      facebook: String,
      twitter: String
    }
  },

  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      district: String,
      city: String,
      country: {
        type: String,
        default: 'Việt Nam'
      },
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },

  culture: {
    values: [String],
    benefits: [String],
    workEnvironment: String,
    technologies: [String],
    developmentOpportunities: [String]
  },

  internshipProgram: {
    overview: String,
    benefits: [String],
    mentorship: String,
    duration: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['weeks', 'months']
      }
    },
    rotationProgram: Boolean,
    trainingProvided: Boolean
  },

  recruitmentStats: {
    activeJobs: {
      type: Number,
      default: 0
    },
    totalInterns: {
      type: Number,
      default: 0
    },
    averageAcceptanceRate: {
      type: Number,
      default: 0
    },
    retentionRate: {
      type: Number,
      default: 0
    }
  },

  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: String,
      url: String,
      verifiedAt: Date
    }],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  },

  analytics: {
    profileViews: {
      type: Number,
      default: 0
    },
    applicationReceived: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number,
    popularPositions: [{
      title: String,
      applications: Number
    }]
  },

  reviews: [{
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternProfile'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    title: String,
    content: String,
    pros: [String],
    cons: [String],
    isAnonymous: Boolean,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
CompanySchema.index({ name: 'text', 'profile.description': 'text' });
CompanySchema.index({ 'profile.industry': 1 });
CompanySchema.index({ 'contact.address.city': 1 });
CompanySchema.index({ 'verificationStatus.isVerified': 1 });
CompanySchema.index({ status: 1 });

// Virtual for average rating
CompanySchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) return null;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});

// Methods
CompanySchema.methods.updateRecruitmentStats = async function() {
  const Job = mongoose.model('Job');
  const Application = mongoose.model('Application');

  // Update active jobs count
  this.recruitmentStats.activeJobs = await Job.countDocuments({
    employer: this._id,
    status: 'active'
  });

  // Update application stats
  const applications = await Application.find({
    'job.employer': this._id
  });

  this.recruitmentStats.totalInterns = applications.filter(app => 
    app.status === 'accepted'
  ).length;

  const acceptedCount = applications.filter(app => 
    ['accepted', 'completed'].includes(app.status)
  ).length;

  this.recruitmentStats.averageAcceptanceRate = applications.length > 0
    ? (acceptedCount / applications.length * 100).toFixed(2)
    : 0;

  return this.save();
};

CompanySchema.methods.incrementViews = async function() {
  this.analytics.profileViews += 1;
  return this.save();
};

module.exports = mongoose.model('Company', CompanySchema);