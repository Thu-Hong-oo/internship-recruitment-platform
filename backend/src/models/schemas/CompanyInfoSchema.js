const mongoose = require('mongoose');

// Schema riêng cho thông tin công ty
const CompanyInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    industry: { type: String, required: true },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Email không hợp lệ',
      },
    },
    website: String,
    description: String,
    employeesCount: { type: Number, min: 0 },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    // Images
    logo: {
      url: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
    },
    coverImage: {
      url: String,
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
    },
    // Address
    officeAddress: {
      street: String,
      ward: String,
      district: String,
      city: String,
      country: { type: String, default: 'Vietnam' },
    },
  },
  { _id: false }
);

module.exports = CompanyInfoSchema;
