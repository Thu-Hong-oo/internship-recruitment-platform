const mongoose = require('mongoose');
const CompanySize = require('../../domain/recruitment/enums/CompanySize');

const CompanySchema = new mongoose.Schema(
  {
    companyId: { type: String, unique: true },
    companyName: String,
    taxCode: String,
    description: String,
    websiteUrl: String,
    logoUrl: String,
    companyHotline: String,
    companyEmail: String,
    foundedYear: Number,
    verificationStatus: String,
    companySize: { type: String, enum: Object.values(CompanySize) },
    name: String,
    legalName: String,
    industry: String,
    size: { type: String, enum: Object.values(CompanySize) },
    location: Object,
    contact: Object,
    socialMedia: Object,
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
  }
);

CompanySchema.methods.getJobCount = async function () {
  return await mongoose
    .model('JobPost')
    .countDocuments({ companyId: this._id });
};

CompanySchema.methods.isActive = function () {
  return this.isVerified;
};

module.exports = mongoose.model('Company', CompanySchema);
