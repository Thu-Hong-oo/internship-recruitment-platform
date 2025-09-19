const mongoose = require('mongoose');


const JobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployerProfile', required: true }, // công ty
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // nhân viên đăng job
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 5000 },
  skills: [{ type: String, trim: true }],
  requirements: { type: String },
  education: { type: String },
  experience: { type: String },
  salary: { type: String },
  location: { type: String },
  positions: { type: Number },
  deadline: { type: Date },
  status: { type: String, enum: ['draft', 'open', 'closed'], default: 'draft' },
  views: { type: Number, default: 0 },
  ai: {
    keywords: [String],
    embedding: [Number],
    suggestedCandidates: [{
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile' },
      score: Number,
      matchingSkills: [String],
    }],
    analyzedAt: Date,
  }
}, { timestamps: true });

// Indexes
JobSchema.index({ title: 'text', description: 'text', skills: 1, location: 1 });



module.exports = mongoose.model('Job', JobSchema);
