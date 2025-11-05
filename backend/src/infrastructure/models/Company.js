const mongoose = require('mongoose');
const CompanySize = require('../../domain/recruitment/enums/CompanySize');

const CompanySchema = new mongoose.Schema(
  {
    // Owner của công ty (người tạo đầu tiên)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Basic info
    name: { type: String, required: true },
    legalName: { type: String },
    industry: { type: String },
    size: {
      type: String,
      enum: Object.values(CompanySize),
    },
    description: { type: String },
    website: { type: String },
    email: { type: String },
    phone: { type: String },
    logo: { type: String },
    foundedYear: { type: Number },

    // Address
    address: {
      street: { type: String },
      ward: { type: String },
      district: { type: String },
      city: { type: String },
      country: { type: String, default: 'Việt Nam' },
    },

    // Business registration info
    businessInfo: {
      registrationNumber: { type: String },
      taxId: { type: String, required: true },
      issueDate: { type: Date, required: true },
      issuePlace: { type: String, required: true },
    },

    // Legal representative
    legalRepresentative: {
      fullName: { type: String, required: true },
      position: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },

    // Social media
    socialMedia: {
      linkedin: { type: String },
      facebook: { type: String },
      twitter: { type: String },
    },

    // Verification
    verification: {
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      steps: {
        businessInfo: { type: Boolean, default: false },
        documents: { type: Boolean, default: false },
      },
      documents: [
        {
          type: { type: String },
          url: { type: String },
          uploadedAt: { type: Date },
          verifiedAt: { type: Date },
        },
      ],
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
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
