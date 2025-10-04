const mongoose = require('mongoose');

// Business Info Schema
const BusinessInfoSchema = new mongoose.Schema(
  {
    registrationNumber: { 
      type: String, 
      required: true,
      trim: true
    },
    taxId: { 
      type: String, 
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^\d{10}(-\d{3})?$/.test(v);
        },
        message: 'Mã số thuế phải có định dạng: 0123456789 hoặc 0123456789-001'
      }
    },
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
