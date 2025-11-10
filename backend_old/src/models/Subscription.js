const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      unique: true,
      index: true,
      required: true,
    },
    planCode: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'paused'],
      default: 'active',
    },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: true },
    usage: Object,
    paymentMethod: String,
  },
  { timestamps: true }
);

SubscriptionSchema.index({ status: 1, endDate: -1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);

