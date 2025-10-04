const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(
        require('../constants/common.constants').APPLICATION_STATUS
      ),
      default: require('../constants/common.constants').APPLICATION_STATUS
        .PENDING,
    },

    coverLetter: {
      type: String,
      maxlength: [1000, 'Thư xin việc không được quá 1000 ký tự'],
    },

    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],

    resume: {
      url: String,
      version: Number,
      uploadedAt: Date,
    },

    matchingScore: {
      overall: Number,
      skills: [
        {
          name: String,
          score: Number,
          required: Boolean,
        },
      ],
      experience: Number,
      education: Number,
    },

    interviews: [
      {
        scheduledAt: Date,
        duration: Number,
        type: {
          type: String,
        },
        location: String,
        interviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        feedback: {
          strengths: [String],
          weaknesses: [String],
          notes: String,
          decision: {
            type: String,
          },
        },
      },
    ],

    timeline: [
      {
        status: String,
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    feedback: {
      rating: Number,
      strengths: [String],
      improvements: [String],
      notes: String,
      createdAt: Date,
      updatedAt: Date,
    },

    // THÊM: AI Analysis cho Application
    aiAnalysis: {
      resumeScore: {
        overall: Number,
        sections: {
          format: Number,
          content: Number,
          keywords: Number,
          experience: Number,
        },
      },

      matchAnalysis: {
        overallFit: Number,
        technicalFit: Number,
        experienceFit: Number,
        educationFit: Number,
        culturalFit: Number,

        strengths: [String],
        concerns: [String],
        recommendations: [String],
      },

      predictedSuccess: {
        probability: Number,
        factors: [
          {
            factor: String,
            impact: Number,
            explanation: String,
          },
        ],
      },

      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ 'matchingScore.overall': -1 });
ApplicationSchema.index({ createdAt: -1 });

// THÊM: Indexes cho AI analysis và performance
ApplicationSchema.index({ jobId: 1, 'matchingScore.overall': -1 });
ApplicationSchema.index({ candidateId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ 'aiAnalysis.matchAnalysis.overallFit': -1 });
ApplicationSchema.index({ 'aiAnalysis.predictedSuccess.probability': -1 });

// Pre-save middleware
ApplicationSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.timeline.push({
      status: 'completed',
      note: 'Đơn ứng tuyển được tạo',
    });
  }
  next();
});

// Methods
ApplicationSchema.methods.updateStatus = async function (status, note, userId) {
  this.status = status;
  this.timeline.push({
    status,
    note,
    createdBy: userId,
  });
  return this.save();
};

ApplicationSchema.methods.scheduleInterview = async function (interviewData) {
  this.interviews.push(interviewData);
  await this.updateStatus('interview', 'Lịch phỏng vấn đã được đặt');
  return this.save();
};

ApplicationSchema.methods.addFeedback = async function (feedbackData) {
  this.feedback = {
    ...feedbackData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return this.save();
};

module.exports = mongoose.model('Application', ApplicationSchema);
