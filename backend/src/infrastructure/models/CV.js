const mongoose = require('mongoose');
const ANALYSIS_STATUS = require('../../domain/ai-matching/enums/AnalysisStatus');

const CVSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    originalName: String,
    cloudinaryPublicId: String,
    cloudinaryUrl: String,
    fileSize: Number,
    mimeType: String,
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    analysisStatus: {
      type: String,
      enum: Object.values(ANALYSIS_STATUS),
      default: ANALYSIS_STATUS.PENDING,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
  }
);

CVSchema.methods.getDownloadUrl = function () {
  return this.cloudinaryUrl;
};

CVSchema.methods.getPreviewUrl = function () {
  return this.cloudinaryUrl;
};

CVSchema.methods.canBeAnalyzed = function () {
  return this.analysisStatus === ANALYSIS_STATUS.PENDING;
};

CVSchema.methods.setAsDefault = async function () {
  // Remove default flag from other CVs of the same candidate
  await this.constructor.updateMany(
    { candidateId: this.candidateId, _id: { $ne: this._id } },
    { isDefault: false }
  );

  // Set this CV as default
  this.isDefault = true;
  await this.save();

  // Update candidate's defaultCV reference
  await mongoose
    .model('Candidate')
    .findByIdAndUpdate(this.candidateId, { defaultCV: this._id });

  return this;
};

module.exports = mongoose.model('CV', CVSchema);
