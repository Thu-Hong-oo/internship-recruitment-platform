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
  // Force download với fl_attachment - dùng raw/upload cho file types khác image
  if (!this.cloudinaryPublicId) return this.cloudinaryUrl;

  // Get file extension
  let extension = '';
  if (this.originalName) {
    const parts = this.originalName.split('.');
    extension = parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }
  if (!extension && this.mimeType) {
    if (this.mimeType.includes('pdf')) extension = '.pdf';
    else if (this.mimeType.includes('word')) extension = '.docx';
  }

  const baseUrl = 'https://res.cloudinary.com/du10thaqs/raw/upload';
  return `${baseUrl}/fl_attachment/${this.cloudinaryPublicId}${extension}`;
};

CVSchema.methods.getPreviewUrl = function () {
  // Xem trực tiếp trong browser - dùng raw/upload
  if (!this.cloudinaryPublicId) return this.cloudinaryUrl;

  // Get file extension
  let extension = '';
  if (this.originalName) {
    const parts = this.originalName.split('.');
    extension = parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }
  if (!extension && this.mimeType) {
    if (this.mimeType.includes('pdf')) extension = '.pdf';
    else if (this.mimeType.includes('word')) extension = '.docx';
  }

  const baseUrl = 'https://res.cloudinary.com/du10thaqs/raw/upload';
  return `${baseUrl}/${this.cloudinaryPublicId}${extension}`;
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

// Format CV for API response
CVSchema.methods.toClientJSON = function () {
  return {
    id: this._id,
    fileName: this.originalName,
    fileUrl: this.cloudinaryUrl,
    downloadUrl: this.getDownloadUrl(),
    previewUrl: this.getPreviewUrl(),
    fileSize: this.fileSize,
    mimeType: this.mimeType,
    isDefault: this.isDefault,
    analysisStatus: this.analysisStatus,
    uploadedAt: this.uploadedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('CV', CVSchema);
