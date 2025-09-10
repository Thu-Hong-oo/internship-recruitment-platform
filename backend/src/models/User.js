const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Vui lòng nhập một email hợp lệ',
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authMethod === 'local' || this.authMethod === 'hybrid';
      },
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false,
    },
    authMethod: {
      type: String,
      enum: ['local', 'google', 'hybrid'],
      default: 'local',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleEmail: {
      type: String,
      lowercase: true,
    },
    googleProfile: {
      picture: String,
      locale: String,
      verified_email: Boolean,
    },
    role: {
      type: String,
      enum: ['student', 'employer', 'admin'],
      default: 'student',
    },

    // Basic profile information
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, 'Tên không được vượt quá 50 ký tự'],
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Họ không được vượt quá 50 ký tự'],
      },
      phone: {
        type: String,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Vui lòng nhập số điện thoại hợp lệ'],
      },
      avatar: {
        type: String,
        default: '',
      },
      bio: {
        type: String,
        maxlength: [500, 'Giới thiệu không được vượt quá 500 ký tự'],
      },
      location: {
        city: String,
        district: String,
        country: {
          type: String,
          default: 'VN',
        },
      },
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
      },
    },

    // Profile references
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
    },
    employerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerProfile',
    },

    // User preferences
    preferences: {
      privacySettings: {
        profileVisibility: {
          type: String,
          enum: ['public', 'private', 'connections'],
          default: 'public',
        },
        showEmail: {
          type: Boolean,
          default: false,
        },
        showPhone: {
          type: Boolean,
          default: false,
        },
      },
      notifications: {
        emailNotifications: {
          type: Boolean,
          default: true,
        },
        pushNotifications: {
          type: Boolean,
          default: true,
        },
        jobAlerts: {
          type: Boolean,
          default: true,
        },
        applicationUpdates: {
          type: Boolean,
          default: true,
        },
      },
      language: {
        type: String,
        default: 'vi',
        enum: ['vi', 'en'],
      },
      timezone: {
        type: String,
        default: 'Asia/Ho_Chi_Minh',
      },
    },

    // System fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    
    // Email delivery tracking
    emailStatus: {
      type: String,
      enum: ['unknown', 'delivered', 'bounced', 'invalid'],
      default: 'unknown',
    },
    emailDeliveredAt: Date,
    emailBounceAt: Date,
    emailBounceReason: String,
    emailVerificationOtp: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordOtp: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual cho tên đầy đủ
UserSchema.virtual('fullName').get(function () {
  const firstName = this.profile?.firstName || '';
  const lastName = this.profile?.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'Chưa cập nhật';
});

// Tạo chỉ mục text cho tìm kiếm
UserSchema.index({
  'profile.firstName': 'text',
  'profile.lastName': 'text',
  email: 'text',
});

// Mã hoá mật khẩu bằng bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Tạo JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
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
