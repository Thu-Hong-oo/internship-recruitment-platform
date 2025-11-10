const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    features: Object,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PlanSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Plan', PlanSchema);

