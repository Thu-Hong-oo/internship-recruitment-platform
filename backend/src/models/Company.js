const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    description: String,
    industry: [{ type: String }],
    size: { 
      type: String, 
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] 
    },
    foundedYear: Number,
    website: String,
    logo: String,
    banner: String,
    location: {
      address: String,
      city: String,
      district: String,
      country: { type: String, default: 'VN' },
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    contact: {
      email: String,
      phone: String,
      linkedin: String,
      facebook: String
    },
    benefits: [{
      name: String,
      description: String,
      icon: String
    }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    stats: {
      totalJobs: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      activeInternships: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Indexes
CompanySchema.index({ name: 'text', description: 'text', industry: 'text' });
CompanySchema.index({ slug: 1 });
CompanySchema.index({ 'location.city': 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ isVerified: 1, isActive: 1 });

module.exports = mongoose.model('Company', CompanySchema);
