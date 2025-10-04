const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    pros: String,
    cons: String,
    isAnonymous: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ReviewSchema.index({ companyId: 1, rating: -1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);

