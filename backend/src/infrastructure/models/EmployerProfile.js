const mongoose = require('mongoose');

const EmployerProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company: {
      name: { type: String, required: true },
      industry: { type: String },
      size: {
        type: String,
        enum: [
          'startup_1_10',
          'small_11_50',
          'medium_51_200',
          'large_201_1000',
          'enterprise_1000_plus',
        ],
      },
      email: { type: String },
      website: { type: String },
      description: { type: String },
      logo: { type: String },
      address: {
        street: { type: String },
        ward: { type: String },
        district: { type: String },
        city: { type: String },
        country: { type: String },
      },
    },
    position: {
      title: { type: String, required: true },
      level: {
        type: String,
        enum: ['junior', 'mid', 'senior', 'lead', 'executive'],
      },
      department: { type: String },
    },
    contact: {
      name: { type: String, required: true },
      phone: { type: String },
      email: { type: String, required: true },
    },
    legalRepresentative: {
      fullName: { type: String, required: true },
      position: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    businessInfo: {
      registrationNumber: { type: String },
      taxId: { type: String, required: true },
      issueDate: { type: Date, required: true },
      issuePlace: { type: String, required: true },
      address: {
        street: { type: String, required: true },
        ward: { type: String, required: true },
        district: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
      },
    },
    verification: {
      isVerified: { type: Boolean, default: false },
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

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
