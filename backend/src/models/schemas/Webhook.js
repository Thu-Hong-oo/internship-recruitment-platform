const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    secret: { type: String },
    isActive: { type: Boolean, default: true },
    types: [String],
  },
  { timestamps: true }
);

WebhookSchema.index({ isActive: 1 });

module.exports = mongoose.model('Webhook', WebhookSchema);
