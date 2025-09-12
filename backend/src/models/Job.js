const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Vui lòng nhập tiêu đề công việc'],
      trim: true,
      maxlength: [100, 'Tiêu đề không được vượt quá 100 ký tự'],
    },

    description: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả công việc'],
      maxlength: [5000, 'Mô tả không được vượt quá 5000 ký tự'],
    },

    requirements: {
      skills: [
        {
          name: String,
          level: String,
          required: Boolean,
          weight: {
            type: Number,
            default: 1,
          },
        },
      ],
      education: {
        level: String,
        majors: [String],
        required: Boolean,
      },
      experience: {
        years: Number,
        description: String,
      },
      languages: [
        {
          name: String,
          level: String,
        },
      ],
      other: [String],
    },

    benefits: {
      salary: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'VND',
        },
        negotiable: Boolean,
      },
      perks: [String],
      training: String,
      opportunities: [String],
    },

    details: {
      type: {
        type: String,
        enum: ['full-time', 'part-time', 'remote', 'hybrid'],
        required: true,
      },
      duration: {
        value: Number,
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months'],
          default: 'months',
        },
      },
      startDate: Date,
      locations: [
        {
          city: String,
          district: String,
          address: String,
        },
      ],
      positions: Number,
      applicationDeadline: Date,
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'expired'],
      default: 'draft',
    },

    statistics: {
      views: {
        type: Number,
        default: 0,
      },
      applications: {
        total: {
          type: Number,
          default: 0,
        },
        pending: {
          type: Number,
          default: 0,
        },
        reviewing: {
          type: Number,
          default: 0,
        },
        shortlisted: {
          type: Number,
          default: 0,
        },
        interviewed: {
          type: Number,
          default: 0,
        },
        offered: {
          type: Number,
          default: 0,
        },
        accepted: {
          type: Number,
          default: 0,
        },
        rejected: {
          type: Number,
          default: 0,
        },
      },
    },

    nlpAnalysis: {
      keywords: [String],
      requiredSkills: [
        {
          name: String,
          confidence: Number,
          context: String,
        },
      ],
      suggestedCandidates: [
        {
          internId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CandidateProfile',
          },
          score: Number,
          matchingSkills: [String],
        },
      ],
      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ employer: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ 'details.locations.city': 1 });
JobSchema.index({ 'requirements.skills.name': 1 });
JobSchema.index({ createdAt: -1 });

// Virtual field for remaining days until deadline
JobSchema.virtual('remainingDays').get(function () {
  if (!this.details.applicationDeadline) return null;
  const now = new Date();
  const deadline = new Date(this.details.applicationDeadline);
  const diffTime = deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods
JobSchema.methods.updateStatistics = async function () {
  const Application = mongoose.model('Application');

  const stats = await Application.aggregate([
    { $match: { jobId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  stats.forEach(stat => {
    this.statistics.applications[stat._id] = stat.count;
  });

  this.statistics.applications.total = stats.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  return this.save();
};

JobSchema.methods.incrementViews = async function () {
  this.statistics.views += 1;
  return this.save();
};

module.exports = mongoose.model('Job', JobSchema);
