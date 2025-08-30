const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập một email hợp lệ'
    ]
  },
  password: {
    type: String,
    required: function () {
      return this.authMethod === 'local' || this.authMethod === 'hybrid';
    },
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  authMethod: {
    type: String,
    enum: ['local', 'google', 'hybrid'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleEmail: {
    type: String,
    lowercase: true
  },
  googleProfile: {
    picture: String,
    locale: String,
    verified_email: Boolean
  },
  firstName: {
    type: String,
    required: [true, 'Vui lòng nhập tên'],
    trim: true,
    maxlength: [50, 'Tên không được vượt quá 50 ký tự']
  },
  lastName: {
    type: String,
    required: [true, 'Vui lòng nhập họ'],
    trim: true,
    maxlength: [50, 'Họ không được vượt quá 50 ký tự']
  },
  role: {
    type: String,
    enum: ['student', 'employer', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Vui lòng nhập số điện thoại hợp lệ']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  education: {
    school: String,
    degree: String,
    fieldOfStudy: String,
    graduationYear: Number,
    gpa: Number
  },
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    yearsOfExperience: Number
  }],
  experience: [{
    title: String,
    company: String,
    location: String,
    from: Date,
    to: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  resume: {
    url: String,
    filename: String,
    uploadedAt: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationOtp: String, // Store the original OTP for verification
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordOtp: String, // Store the original OTP for password reset
  resetPasswordExpire: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    jobAlerts: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tên đầy đủ
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Tạo chỉ mục text cho tìm kiếm
UserSchema.index({
  firstName: 'text',
  lastName: 'text',
  email: 'text',
  'education.school': 'text',
  'education.fieldOfStudy': 'text',
  'skills.name': 'text',
  'experience.title': 'text',
  'experience.company': 'text'
});

// Mã hoá mật khẩu bằng bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Tạo JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// So khớp mật khẩu
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Kiểm tra nếu người dùng có thể dùng đăng nhập bằng mật khẩu
UserSchema.methods.canUsePassword = function () {
  return this.authMethod === 'local' || this.authMethod === 'hybrid';
};


module.exports = mongoose.model('User', UserSchema);
