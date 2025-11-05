const mongoose = require('mongoose');
const UserRole = require('../../domain/identity/enums/UserRole');
const UserStatus = require('../../domain/identity/enums/UserStatus');
const AuthProvider = require('../../domain/identity/enums/AuthProvider');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true },
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    avatarUrl: { type: String },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING_VERIFICATION,
    },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.EMAIL,
    },
    role: { type: String, enum: Object.values(UserRole), required: true },
    password: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    authMethod: { type: String },
    avatar: { type: String },
    googleProfile: {
      googleId: String,
      profilePicture: String,
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastLogin: { type: Date },
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
    },
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
    },
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt tự động
    toJSON: { virtuals: true }, // Enable virtual fields in JSON
    toObject: { virtuals: true }, // Enable virtual fields in Object
  }
);

UserSchema.methods.comparePassword = async function (password) {
  // Handle case where password is undefined (legacy users)
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.matchPassword = UserSchema.methods.comparePassword; // Alias

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, userId: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

UserSchema.methods.getSignedJwtToken = UserSchema.methods.generateAuthToken; // Alias

UserSchema.methods.getSignedRefreshToken = function () {
  return jwt.sign(
    { id: this._id, userId: this._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

UserSchema.methods.canUsePassword = function () {
  return this.provider === AuthProvider.EMAIL;
};

UserSchema.methods.isActive = function () {
  return this.status === UserStatus.ACTIVE;
};

// // Virtual field for display full name
// UserSchema.virtual('displayFullName').get(function () {
//   return this.fullName || (this.email ? this.email.split('@')[0] : 'Unknown');
// });

module.exports = mongoose.model('User', UserSchema);
