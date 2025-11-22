const mongoose = require('mongoose');

// Verification Schema
const VerificationSchema = new mongoose.Schema(
  {
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,

    documents: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        url: { type: String, required: true },
        cloudinaryId: { type: String, required: true },
        documentType: {
          type: String,
          required: true,
          enum: [
            'business-license',
            'tax-certificate',
            'legal-representative-id',
            'business-plan',
            'financial-statement',
            'medical-license',
            'education-license',
            'other'
          ]
        },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        rejectionReason: String,
        metadata: {
          filename: String,
          fileSize: Number,
          mimeType: String,
          expiryDate: Date
        }
      },
    ],

    steps: {
      basicInfo: { type: Boolean, default: false },
      businessInfo: { type: Boolean, default: false },
      adminApproved: { type: Boolean, default: false },
    },

    pendingReview: { type: Boolean, default: false },
    lastDocumentUpdate: Date,
    reviewDeadline: Date,
    gracePeriodDays: { type: Number, default: 30 },

    adminNotes: [
      {
        note: { type: String, required: true },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);
module.exports = VerificationSchema;
