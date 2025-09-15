const mongoose = require('mongoose');

// Schema riêng cho thông tin pháp lý
const BusinessInfoSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true },
    taxId: { type: String, required: true },
    issueDate: { type: Date, required: true },
    issuePlace: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      ward: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, default: 'Vietnam' },
    },
  },
  { _id: false }
);

module.exports = BusinessInfoSchema;
