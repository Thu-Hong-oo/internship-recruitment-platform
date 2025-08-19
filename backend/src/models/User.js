const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['employer', 'jobseeker', 'admin'], 
      default: 'jobseeker' 
    },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: String,
      avatar: String,
      bio: String,
      location: {
        city: String,
        district: String,
        country: { type: String, default: 'VN' }
      }
    },
    // Cho jobseeker
    jobseeker: {
      education: [{
        school: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date,
        gpa: Number
      }],
      experience: [{
        company: String,
        position: String,
        description: String,
        startDate: Date,
        endDate: Date,
        isCurrent: { type: Boolean, default: false }
      }],
      skills: [{ type: String }],
      resume: String, // URL to resume file
      expectedSalary: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'VND' }
      },
      preferredLocations: [{ type: String }],
      preferredJobTypes: [{ type: String }] // intern, fulltime, parttime
    },
    // Cho employer
    employer: {
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
      position: String, // HR Manager, Recruiter, etc.
      department: String
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      language: { type: String, default: 'vi' }
    }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.location.city': 1 });
UserSchema.index({ 'jobseeker.skills': 1 });

module.exports = mongoose.model('User', UserSchema);
