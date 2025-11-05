const mongoose = require('mongoose');

const LearningRoadmapSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    targetJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost' },
    targetJobTitle: String,
    currentSkills: [String],
    targetSkills: [String],
    skillGaps: [String],
    phases: [Object],
    progress: Number,
    estimatedDuration: Number,
  },
  {
    timestamps: true,
  }
);

LearningRoadmapSchema.methods.calculateProgress = function () {
  if (!this.phases || !this.phases.length) return 0;
  const completed = this.phases.filter(p => p.completed).length;
  return Math.round((completed / this.phases.length) * 100);
};

LearningRoadmapSchema.methods.markPhaseComplete = async function (phaseId) {
  const phase = this.phases.find(p => p._id == phaseId);
  if (phase) {
    phase.completed = true;
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('LearningRoadmap', LearningRoadmapSchema);
