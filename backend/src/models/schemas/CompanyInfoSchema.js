const mongoose = require('mongoose');
const {
  USER_ROLES,
  EMPLOYER_PROFILE_STATUS,
} = require('../../constants/common.constants');
// ============================================
// SUB-SCHEMAS
// ============================================

// Company Info Schema
const CompanyInfoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
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
      validate: [
        {
          validator: function (email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          },
          message: 'Email không hợp lệ',
        },
        {
          validator: function (email) {
            const freeEmailDomains = [
              'gmail.com',
              'yahoo.com',
              'hotmail.com',
              'outlook.com',
              'ymail.com',
              'protonmail.com',
              'icloud.com',
            ];
            const domain = email.split('@')[1]?.toLowerCase();
            return !freeEmailDomains.includes(domain);
          },
          message:
            'Vui lòng sử dụng email công ty (không chấp nhận Gmail, Yahoo, Hotmail...)',
        },
      ],
    },
    website: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Website phải bắt đầu với http:// hoặc https://',
      },
    },
    description: { type: String, maxlength: 2000 },
    employeesCount: { type: Number, min: 0 },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    // Images
    logo: {
      url: String,
      cloudinaryId: String,
      filename: String,
      originalName: String,
      size: Number,
      mimeType: String,
      uploadedAt: { type: Date, default: Date.now },
    },
    coverImage: {
      url: String,
      cloudinaryId: String,
      filename: String,
      originalName: String,
      size: Number,
      mimeType: String,
      uploadedAt: { type: Date, default: Date.now },
    },

    media: {
      photos: [
        {
          url: String,
          cloudinaryId: String,
          filename: String,
          originalName: String,
          size: Number,
          mimeType: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },

    // Address
    officeAddress: {
      street: String,
      ward: String,
      district: String,
      city: String,
      country: { type: String, default: 'Vietnam' },
    },

    // Social links
    socialLinks: {
      linkedin: String,
      facebook: String,
      twitter: String,
      youtube: String,
    },
  },
  { _id: false }
);

module.exports = CompanyInfoSchema;
