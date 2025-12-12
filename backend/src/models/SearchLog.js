const mongoose = require('mongoose');

/**
 * SearchLog
 * Lưu truy vấn tìm kiếm job để phục vụ gợi ý phổ biến và cá nhân hóa.
 */
const searchLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile' },

    keyword: { type: String, index: true },

    filters: {
      location: String,
      industry: String,
      jobType: String,
      skills: [String],
      salaryMin: Number,
      salaryMax: Number,
    },

    source: { type: String, default: 'candidate' }, // candidate | employer | guest
    userAgent: String,
    ip: String,
  },
  { timestamps: true }
);

searchLogSchema.index({ createdAt: -1 });
searchLogSchema.index({ keyword: 1, createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);

