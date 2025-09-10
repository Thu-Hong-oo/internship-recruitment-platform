const mongoose = require('mongoose');

const CrawlerLogSchema = new mongoose.Schema(
  {
    source: { type: String, required: true }, // InternBridge, vietnamworks, etc.
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: Number, // in milliseconds
    stats: {
      totalJobs: { type: Number, default: 0 },
      newJobs: { type: Number, default: 0 },
      updatedJobs: { type: Number, default: 0 },
      failedJobs: { type: Number, default: 0 },
      internJobs: { type: Number, default: 0 },
    },
    errors: [
      {
        message: String,
        timestamp: { type: Date, default: Date.now },
        jobUrl: String,
      },
    ],
    config: {
      maxPages: Number,
      delay: Number,
      userAgent: String,
      filters: mongoose.Schema.Types.Mixed,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexes
CrawlerLogSchema.index({ source: 1, startTime: -1 });
CrawlerLogSchema.index({ status: 1, startTime: -1 });
CrawlerLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
); // Auto delete after 30 days

module.exports = mongoose.model('CrawlerLog', CrawlerLogSchema);
