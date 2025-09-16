const mongoose = require('mongoose');

// Schema riêng cho verification
const VerificationSchema = new mongoose.Schema(
  {
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,

    // Documents - simplified
    documents: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        url: { type: String, required: true },
        cloudinaryId: { type: String, required: true },
        documentType: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        rejectionReason: String,
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],

    steps: {
      basicInfo: { type: Boolean, default: false },
      businessInfo: { type: Boolean, default: false },
      adminApproved: { type: Boolean, default: false },
    },

    // Admin notes for verification process
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
