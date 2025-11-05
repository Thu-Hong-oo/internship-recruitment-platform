const mongoose = require('mongoose');

const CVAnalysisSchema = new mongoose.Schema(
  {
    cvId: { type: mongoose.Schema.Types.ObjectId, ref: 'CV', required: true },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    extractedText: String,
    skills: [String],
    experience: [Object],
    education: [Object],
    embedding: [Number],
    summary: Object,
    confidenceScore: Number,
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

CVAnalysisSchema.methods.getSkillGaps = function (requiredSkills) {
  return requiredSkills.filter(skill => !this.skills.includes(skill));
};

CVAnalysisSchema.methods.calculateMatchScore = function (job) {
  let score = 0;
  if (job.skills && this.skills) {
    score = job.skills.filter(s => this.skills.includes(s)).length * 10;
  }
  return score;
};

module.exports = mongoose.model('CVAnalysis', CVAnalysisSchema);
