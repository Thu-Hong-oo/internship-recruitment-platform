const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
      index: true,
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    items: [Object],
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String, index: true },
    dueDate: Date,
    paidAt: Date,
    metadata: Object,
  },
  { timestamps: true }
);

InvoiceSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
