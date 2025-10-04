const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema(
  {
    webhookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Webhook',
      index: true,
    },
    type: { type: String, required: true },
    payload: Object,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    lastError: String,
  },
  { timestamps: true }
);

WebhookEventSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
