const mongoose = require('mongoose');

const employerDocumentSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        'business-license',
        'tax-certificate',
        'legal-representative-id',
        'business-plan',
        'financial-statement',
        'other',
      ],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    rejectionReason: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
employerDocumentSchema.index({ employerId: 1, documentType: 1 });
employerDocumentSchema.index({ status: 1 });

const EmployerDocument = mongoose.model(
  'EmployerDocument',
  employerDocumentSchema
);

module.exports = EmployerDocument;
