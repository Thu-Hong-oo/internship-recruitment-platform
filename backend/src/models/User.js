const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  USER_ROLES,
  USER_STATUS,
  USER_STATUS_LABELS,
} = require('../constants/common.constants');

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
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Vai trò không hợp lệ',
      },
      default: USER_ROLES.CANDIDATE,
    },

    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
      maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
    },
    avatar: {
      type: String,
      default: 'default-avatar',
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
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: 'Trạng thái tài khoản không hợp lệ',
      },
      default: USER_STATUS.ACTIVE,
    },
    statusReason: {
      type: String,
      maxlength: [500, 'Lý do trạng thái không được vượt quá 500 ký tự'],
    },
    statusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    statusChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual cho hiển thị tên đầy đủ từ các nguồn khác nhau
UserSchema.virtual('displayFullName').get(function () {
  // Ưu tiên lấy từ fullName
  if (this.fullName) return this.fullName;

  // Nếu không có displayName, lấy từ profile tương ứng
  if (
    this.populated &&
    this.populated('candidateProfile') &&
    this.candidateProfile
  ) {
    const pi = this.candidateProfile.personalInfo || {};
    return (
      (
        pi.fullName || `${pi.givenName || ''} ${pi.familyName || ''}`.trim()
      ).trim() || 'Chưa cập nhật'
    );
  }
  if (
    this.populated &&
    this.populated('employerProfile') &&
    this.employerProfile
  ) {
    const company = this.employerProfile.company || {};
    const contact = this.employerProfile.contact || {};
    return (contact.name || company.name || '').trim() || 'Chưa cập nhật';
  }

  return 'Chưa cập nhật';
});

// Tạo chỉ mục text cho tìm kiếm
UserSchema.index({
  fullName: 'text',
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

// Kiểm tra trạng thái tài khoản có hoạt động được không
UserSchema.methods.isAccountActive = function () {
  return this.isActive && this.status === USER_STATUS.ACTIVE;
};

// Kiểm tra tài khoản có bị khóa không
UserSchema.methods.isAccountLocked = function () {
  return (
    this.status === USER_STATUS.SUSPENDED || this.status === USER_STATUS.BANNED
  );
};

// Cập nhật trạng thái tài khoản
UserSchema.methods.updateStatus = function (
  newStatus,
  reason = null,
  adminId = null
) {
  this.status = newStatus;
  this.statusReason = reason;
  this.statusChangedBy = adminId;
  this.statusChangedAt = new Date();

  // Đồng bộ với isActive
  if (newStatus === USER_STATUS.ACTIVE) {
    this.isActive = true;
  } else if (
    [USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.INACTIVE].includes(
      newStatus
    )
  ) {
    this.isActive = false;
  }
};

// Virtual để hiển thị trạng thái đầy đủ
UserSchema.virtual('statusDisplay').get(function () {
  return USER_STATUS_LABELS[this.status] || this.status;
});

module.exports = mongoose.model('User', UserSchema);
