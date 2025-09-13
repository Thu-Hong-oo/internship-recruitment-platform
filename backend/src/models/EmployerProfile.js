const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants/common.constants');

const EmployerProfileSchema = new mongoose.Schema(
  {
    mainUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: {
            values: Object.values(USER_ROLES),
            message: 'Vai trò không hợp lệ',
          },
          default: USER_ROLES.RECRUITER,
        },
        permissions: {
          canPostJobs: { type: Boolean, default: false },
          canViewApplications: { type: Boolean, default: false },
          canEditProfile: { type: Boolean, default: false },
          canManageTeam: { type: Boolean, default: false },
          canVerifyDocuments: { type: Boolean, default: false },
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
        },
      },
    ],
    company: {
      name: {
        type: String,
        required: true,
      },
      industry: {
        type: String,
        required: true,
      },
      logo: {
        url: String,
        filename: String,
      },
      size: {
        type: String,
        enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
        required: true,
      },
      website: String,
      description: String,
      foundedYear: Number,
      headquarters: {
        city: String,
        country: String,
      },
      // Email công ty chính thức - BẮT BUỘC
      email: {
        type: String,
        required: true,
        lowercase: true,
        validate: {
          validator: function (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
          },
          message: 'Email không hợp lệ',
        },
      },
    },
    position: {
      title: {
        type: String,
        required: true,
      },
      department: String,
      level: {
        type: String,
        enum: [
          'junior',
          'mid-level',
          'senior',
          'manager',
          'director',
          'executive',
        ],
        required: true,
      },
      responsibilities: [String],
      hiringAuthority: {
        type: Boolean,
        default: false,
      },
    },
    contact: {
      name: {
        type: String,
        trim: true,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      linkedin: String,
      workEmail: String,
      availability: {
        type: String,
        enum: ['weekdays', 'weekends', 'flexible'],
        default: 'weekdays',
      },
    },
    preferences: {
      internshipTypes: [
        {
          type: String,
          enum: ['full-time', 'part-time', 'remote', 'hybrid'],
        },
      ],
      durations: [
        {
          type: String,
          enum: ['3-months', '6-months', '1-year', 'flexible'],
        },
      ],
      locations: [String],
      skills: [
        {
          skillId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Skill',
          },
          priority: {
            type: String,
            enum: ['required', 'preferred', 'bonus'],
            default: 'preferred',
          },
        },
      ],
      salaryRange: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'VND',
        },
      },
    },
    hiring: {
      totalPositions: {
        type: Number,
        default: 0,
      },
      activePositions: {
        type: Number,
        default: 0,
      },
      averageHiringTime: {
        type: Number, // days
        default: 30,
      },
      successRate: {
        type: Number, // percentage
        min: 0,
        max: 100,
        default: 0,
      },
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,

      // Thông tin doanh nghiệp - BẮT BUỘC
      businessInfo: {
        registrationNumber: {
          type: String,
          required: true,
        }, // Số đăng ký doanh nghiệp
        issueDate: {
          type: Date,
          required: true,
        }, // Ngày cấp
        issuePlace: {
          type: String,
          required: true,
        }, // Nơi cấp
        taxId: {
          type: String,
          required: true,
          unique: true,
        }, // Mã số thuế
        legalAddress: {
          // Địa chỉ trụ sở
          street: {
            type: String,
            required: true,
          },
          ward: {
            type: String,
            required: true,
          },
          district: {
            type: String,
            required: true,
          },
          city: {
            type: String,
            required: true,
          },
          country: { type: String, default: 'Vietnam' },
        },
      },

      // Thông tin người đại diện pháp luật - BẮT BUỘC cơ bản
      legalRepresentative: {
        fullName: {
          type: String,
          required: true,
        },
        position: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        // Không bắt buộc ngay, chỉ cần khi xác minh nâng cao
        idType: { type: String, enum: ['CMND', 'CCCD', 'Passport'] },
        idNumber: String,
        idIssueDate: Date,
        idIssuePlace: String,
      },

      // Xác thực email công ty
      companyEmail: {
        email: String,
        verified: { type: Boolean, default: false },
        verificationCode: String,
        codeExpiresAt: Date, // Thời gian hết hạn code
        sentAt: Date, // Thời điểm gửi code
        verifiedAt: Date, // Thời điểm xác thực thành công
        resendCount: {
          type: Number,
          default: 0,
          max: 5, // Giới hạn số lần gửi lại
        },
        lastResendAt: Date,
      },

      // Tài liệu chi tiết - Không bắt buộc ngay
      documents: [
        {
          type: {
            type: String,
            required: true,
            enum: [
              'business-license', // Giấy phép kinh doanh
              'tax-certificate', // Giấy chứng nhận thuế
              'legal-rep-id', // CCCD/CMND người đại diện
              'company-seal', // Con dấu công ty
              'authorization-letter', // Giấy ủy quyền (nếu cần)
              'other', // Khác
            ],
          },
          url: { type: String, required: true },
          filename: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
          verified: { type: Boolean, default: false },
          verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          verifiedAt: Date,
          rejectionReason: String,

          // Metadata cho từng loại tài liệu
          metadata: {
            documentNumber: String, // Số tài liệu
            issueDate: Date, // Ngày cấp
            issuePlace: String, // Nơi cấp
            expiryDate: Date, // Ngày hết hạn (nếu có)
            extractedText: String, // Text được trích xuất từ OCR
          },
        },
      ],

      // Trạng thái xác minh theo từng bước
      verificationSteps: {
        basicInfoCompleted: { type: Boolean, default: false }, // Thông tin cơ bản
        businessInfoValidated: { type: Boolean, default: false }, // MST, đăng ký KD
        companyEmailVerified: { type: Boolean, default: false }, // Email công ty
        documentsUploaded: { type: Boolean, default: false }, // Tài liệu (không bắt buộc ngay)
        legalRepresentativeVerified: { type: Boolean, default: false }, // Người đại diện (không bắt buộc ngay)
        adminReviewed: { type: Boolean, default: false }, // Admin duyệt cuối
      },

      // Ghi chú của admin
      adminNotes: [
        {
          note: String,
          addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          addedAt: { type: Date, default: Date.now },
        },
      ],
    },
    status: {
      type: String,
      enum: [
        'draft', // Đang nhập thông tin
        'pending_docs', // Chờ upload tài liệu
        'pending_review', // Chờ admin duyệt - có thể đăng tin hạn chế
        'verified', // Đã xác minh đầy đủ - đăng tin không hạn chế
        'rejected', // Bị từ chối
        'suspended', // Bị đình chỉ
        'inactive', // Không hoạt động
      ],
      default: 'draft',
    },
    // Giới hạn đăng tin cho từng mức xác minh
    postingLimits: {
      maxJobsPerMonth: {
        type: Number,
        default: function () {
          switch (this.status) {
            case 'pending_review':
              return 3; // Hạn chế khi chưa xác minh đầy đủ
            case 'verified':
              return 50; // Không hạn chế nhiều khi đã xác minh
            default:
              return 0; // Không được đăng
          }
        },
      },
      currentMonthPosts: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmployerProfileSchema.index({ mainUserId: 1 });
EmployerProfileSchema.index({ 'company.name': 1 });
EmployerProfileSchema.index({ 'company.industry': 1 });
EmployerProfileSchema.index({ 'company.size': 1 });
EmployerProfileSchema.index({ 'company.email': 1 });
EmployerProfileSchema.index({ 'position.level': 1 });
EmployerProfileSchema.index({ 'verification.isVerified': 1 });
EmployerProfileSchema.index(
  { 'verification.businessInfo.taxId': 1 },
  { unique: true }
);
EmployerProfileSchema.index({ 'verification.companyEmail.verified': 1 });
EmployerProfileSchema.index({ status: 1 });

// Virtuals
EmployerProfileSchema.virtual('isHiring').get(function () {
  return this.hiring.activePositions > 0;
});

EmployerProfileSchema.virtual('hiringRate').get(function () {
  if (this.hiring.totalPositions === 0) return 0;
  return Math.round(
    (this.hiring.successRate / 100) * this.hiring.totalPositions
  );
});

EmployerProfileSchema.virtual('verificationProgress').get(function () {
  const steps = this.verification.verificationSteps;
  const totalSteps = Object.keys(steps).length;
  const completedSteps = Object.values(steps).filter(Boolean).length;
  return Math.round((completedSteps / totalSteps) * 100);
});

// Methods
EmployerProfileSchema.methods.addDocument = function (type, url, filename) {
  this.verification.documents.push({
    type,
    url,
    filename,
    uploadedAt: new Date(),
  });

  // Cập nhật trạng thái upload documents
  this.verification.verificationSteps.documentsUploaded = true;
  return this.save();
};

EmployerProfileSchema.methods.verifyDocument = function (
  documentId,
  verifiedBy
) {
  const document = this.verification.documents.id(documentId);
  if (document) {
    document.verified = true;
    document.verifiedBy = verifiedBy;
    document.verifiedAt = new Date();
    return this.save();
  }
  throw new Error('Document not found');
};

EmployerProfileSchema.methods.updateHiringStats = function (
  totalPositions,
  activePositions,
  successRate
) {
  this.hiring.totalPositions = totalPositions;
  this.hiring.activePositions = activePositions;
  this.hiring.successRate = successRate;
  return this.save();
};

// Kiểm tra có thể đăng tin không
EmployerProfileSchema.methods.canPostJobs = function () {
  if (this.status === 'verified') return { canPost: true, reason: null };

  if (
    this.status === 'pending_review' &&
    this.verification.verificationSteps.basicInfoCompleted &&
    this.verification.verificationSteps.businessInfoValidated &&
    this.verification.verificationSteps.companyEmailVerified
  ) {
    // Kiểm tra giới hạn đăng tin
    this.resetMonthlyPostsIfNeeded();
    if (
      this.postingLimits.currentMonthPosts >= this.postingLimits.maxJobsPerMonth
    ) {
      return {
        canPost: false,
        reason: 'Đã đạt giới hạn đăng tin trong tháng',
        limit: this.postingLimits.maxJobsPerMonth,
        current: this.postingLimits.currentMonthPosts,
      };
    }

    return {
      canPost: true,
      reason: 'Tài khoản chưa xác minh đầy đủ - giới hạn đăng tin',
      isLimited: true,
      limit: this.postingLimits.maxJobsPerMonth,
      remaining:
        this.postingLimits.maxJobsPerMonth -
        this.postingLimits.currentMonthPosts,
    };
  }

  return {
    canPost: false,
    reason: 'Tài khoản chưa hoàn thành xác minh cơ bản',
  };
};

// Reset số lượng bài đăng hàng tháng
EmployerProfileSchema.methods.resetMonthlyPostsIfNeeded = function () {
  const now = new Date();
  const lastReset = new Date(this.postingLimits.lastResetDate);

  // Nếu đã sang tháng mới
  if (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    this.postingLimits.currentMonthPosts = 0;
    this.postingLimits.lastResetDate = now;
  }
};

// Tăng số lượng bài đăng
EmployerProfileSchema.methods.incrementPostCount = function () {
  this.resetMonthlyPostsIfNeeded();
  this.postingLimits.currentMonthPosts += 1;
  return this.save();
};

// Tạo mã xác thực email
EmployerProfileSchema.methods.generateEmailVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const expiresIn = 15 * 60 * 1000; // 15 minutes

  this.verification.companyEmail.verificationCode = code;
  this.verification.companyEmail.codeExpiresAt = new Date(
    Date.now() + expiresIn
  );
  this.verification.companyEmail.sentAt = new Date();
  this.verification.companyEmail.resendCount += 1;
  this.verification.companyEmail.lastResendAt = new Date();

  return this.save().then(() => code);
};

// Xác thực email với code
EmployerProfileSchema.methods.verifyEmailCode = function (inputCode) {
  const emailVerification = this.verification.companyEmail;

  if (!emailVerification.verificationCode) {
    throw new Error('Không có mã xác thực');
  }

  if (new Date() > emailVerification.codeExpiresAt) {
    throw new Error('Mã xác thực đã hết hạn');
  }

  if (emailVerification.verificationCode !== inputCode) {
    throw new Error('Mã xác thực không đúng');
  }

  // Xác thực thành công
  emailVerification.verified = true;
  emailVerification.verifiedAt = new Date();
  emailVerification.verificationCode = undefined;
  emailVerification.codeExpiresAt = undefined;

  // Cập nhật trạng thái xác minh
  this.verification.verificationSteps.companyEmailVerified = true;

  return this.save();
};

// Methods for team management
EmployerProfileSchema.methods.addTeamMember = function (
  userId,
  role,
  permissions
) {
  const member = {
    userId,
    role,
    permissions,
    addedBy: this.mainUserId,
    addedAt: new Date(),
  };
  this.companyMembers.push(member);
  return this.save();
};

EmployerProfileSchema.methods.updateMemberPermissions = function (
  userId,
  newPermissions
) {
  const member = this.companyMembers.find(m => m.userId.equals(userId));
  if (member) {
    member.permissions = { ...member.permissions, ...newPermissions };
    return this.save();
  }
  throw new Error('Member not found');
};

EmployerProfileSchema.methods.removeMember = function (userId) {
  this.companyMembers = this.companyMembers.filter(
    m => !m.userId.equals(userId)
  );
  return this.save();
};

EmployerProfileSchema.methods.getMemberRole = function (userId) {
  const member = this.companyMembers.find(m => m.userId.equals(userId));
  return member ? member.role : null;
};

// Statics
EmployerProfileSchema.statics.findVerified = function () {
  return this.find({ 'verification.isVerified': true, status: 'verified' });
};

EmployerProfileSchema.statics.findByIndustry = function (industry) {
  return this.find({ 'company.industry': { $regex: industry, $options: 'i' } });
};

EmployerProfileSchema.statics.findHiring = function () {
  return this.find({ 'hiring.activePositions': { $gt: 0 } });
};

EmployerProfileSchema.statics.findByLocation = function (location) {
  return this.find({
    'preferences.locations': { $regex: location, $options: 'i' },
  });
};

EmployerProfileSchema.statics.findCanPostJobs = function () {
  return this.find({
    $or: [
      { status: 'verified' },
      {
        status: 'pending_review',
        'verification.verificationSteps.basicInfoCompleted': true,
        'verification.verificationSteps.businessInfoValidated': true,
        'verification.verificationSteps.companyEmailVerified': true,
      },
    ],
  });
};

// Pre-save middleware
EmployerProfileSchema.pre('save', function (next) {
  // Tự động cập nhật trạng thái dựa trên tiến độ
  const steps = this.verification.verificationSteps;

  // Kiểm tra thông tin cơ bản đã đầy đủ
  if (
    this.company.name &&
    this.company.industry &&
    this.company.size &&
    this.contact.name &&
    this.contact.phone &&
    this.position.title &&
    this.position.level
  ) {
    steps.basicInfoCompleted = true;
  }

  // Kiểm tra thông tin doanh nghiệp đã đầy đủ
  if (
    this.verification.businessInfo.registrationNumber &&
    this.verification.businessInfo.taxId &&
    this.verification.businessInfo.issueDate &&
    this.verification.businessInfo.issuePlace
  ) {
    steps.businessInfoValidated = true;
  }

  // Cập nhật trạng thái chung
  if (
    steps.basicInfoCompleted &&
    steps.businessInfoValidated &&
    steps.companyEmailVerified
  ) {
    if (this.status === 'draft') {
      this.status = 'pending_review'; // Có thể đăng tin với hạn chế
    }
  }

  // Nếu admin đã review và approve
  if (steps.adminReviewed && this.verification.isVerified) {
    this.status = 'verified';
  }

  // Cập nhật email xác thực từ company email
  if (this.company.email && !this.verification.companyEmail.email) {
    this.verification.companyEmail.email = this.company.email;
  }

  next();
});

// Post-save middleware để log các thay đổi quan trọng
EmployerProfileSchema.post('save', function (doc) {
  if (doc.isModified('status')) {
    console.log(
      `Employer ${doc.company.name} status changed to: ${doc.status}`
    );
  }
});

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
