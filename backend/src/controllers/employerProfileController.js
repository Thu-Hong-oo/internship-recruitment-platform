const EmployerProfile = require('../models/EmployerProfile');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { uploadImage } = require('../services/imageUploadService');
const asyncHandler = require('express-async-handler');
const {
  validateVerificationData,
  isValidCompanyEmail,
  generateVerificationCode,
  sanitizeInput,
  crossCheckBusinessInfo,
} = require('../utils/verificationValidation');
const { getDocumentTypesForIndustry } = require('../config/documentTypes');
const { otpCooldownService } = require('../config/initializeServices');

// Helpers
const ensureEmployerProfile = async userId => {
  let profile = await EmployerProfile.findOne({ mainUserId: userId });
  if (!profile) {
    profile = await EmployerProfile.create({
      mainUserId: userId,
      company: { name: 'Chưa cập nhật', industry: 'unknown', size: 'small' },
      position: { title: 'representative', level: 'junior' },
    });
  }
  return profile;
};

// GET /api/employers/profile
const getProfile = asyncHandler(async (req, res) => {
  const profile = await ensureEmployerProfile(req.user.id);
  res.status(200).json({ success: true, data: profile });
});

// PUT /api/employers/profile
const updateProfile = asyncHandler(async (req, res) => {
  // Whitelist allowed fields for profile update
  const allowedFields = [
    'position',
    'contact',
    'preferences',
    'availability',
    'bio',
    'skills',
    'experience',
    'education',
  ];

  // Filter and sanitize input
  const sanitizedData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      sanitizedData[field] = sanitizeInput(req.body[field]);
    }
  }

  const updated = await EmployerProfile.findOneAndUpdate(
    { mainUserId: req.user.id },
    sanitizedData,
    { new: true, runValidators: true, upsert: true }
  );

  logger.info('Profile updated', {
    userId: req.user.id,
    updatedFields: Object.keys(sanitizedData),
  });

  res
    .status(200)
    .json({ success: true, message: 'Cập nhật thành công', data: updated });
});

// POST /api/employers/verify
const submitVerification = asyncHandler(async (req, res) => {
  try {
    const {
      businessInfo,
      legalRepresentative,
      companyEmail,
      documents = [],
    } = req.body;

    const profile = await ensureEmployerProfile(req.user.id);

    // Validate required fields
    const validationErrors = validateVerificationData({
      businessInfo,
      legalRepresentative,
      companyEmail,
      documents,
      industry: profile.company.industry,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu xác thực không hợp lệ',
        details: validationErrors,
      });
    }

    // Sanitize input data
    const sanitizedBusinessInfo = businessInfo
      ? sanitizeInput(businessInfo)
      : null;
    const sanitizedLegalRep = legalRepresentative
      ? sanitizeInput(legalRepresentative)
      : null;
    const sanitizedDocuments = documents.map(doc => ({
      ...doc,
      metadata: doc.metadata ? sanitizeInput(doc.metadata) : {},
    }));

    // Update business info
    if (sanitizedBusinessInfo) {
      profile.verification.businessInfo = {
        ...profile.verification.businessInfo,
        ...sanitizedBusinessInfo,
      };
      profile.verification.verificationSteps.businessInfoValidated = true;
    }

    // Update legal representative info
    if (sanitizedLegalRep) {
      profile.verification.legalRepresentative = {
        ...profile.verification.legalRepresentative,
        ...sanitizedLegalRep,
      };
      profile.verification.verificationSteps.legalRepresentativeVerified = true;
    }

    // Update company email
    if (companyEmail) {
      profile.verification.companyEmail = {
        ...profile.verification.companyEmail,
        email: companyEmail,
        verified: false,
      };
    }

    // Add or update documents with metadata
    for (const doc of sanitizedDocuments) {
      // Check if document of this type already exists
      const existingDocIndex = profile.verification.documents.findIndex(
        existingDoc => existingDoc.type === doc.type
      );

      const documentData = {
        type: doc.type,
        url: doc.url,
        filename: doc.filename,
        uploadedAt: new Date(),
        verified: false,
        metadata: doc.metadata || {},
      };

      if (existingDocIndex >= 0) {
        // Update existing document
        profile.verification.documents[existingDocIndex] = documentData;
        logger.info('Document updated', {
          userId: req.user.id,
          documentType: doc.type,
          action: 'updated',
        });
      } else {
        // Add new document
        profile.verification.documents.push(documentData);
        logger.info('Document added', {
          userId: req.user.id,
          documentType: doc.type,
          action: 'added',
        });
      }
    }

    // Update verification steps
    profile.verification.verificationSteps.documentsUploaded = true;

    // Check if all required steps are completed
    const steps = profile.verification.verificationSteps;
    const allStepsCompleted =
      steps.documentsUploaded &&
      steps.businessInfoValidated &&
      steps.legalRepresentativeVerified &&
      steps.companyEmailVerified;

    if (allStepsCompleted) {
      profile.verification.verificationSteps.crossCheckCompleted = true;
    }

    profile.status = 'pending';

    await profile.save();

    // Send verification email to company email if provided
    if (companyEmail) {
      const verificationCode = generateVerificationCode();
      profile.verification.companyEmail.verificationCode = verificationCode;
      profile.verification.companyEmail.sentAt = new Date();
      profile.verification.companyEmail.resendCount = 0;
      await profile.save();

      // TODO: Implement email service
      logger.info('Company email verification code generated', {
        userId: req.user.id,
        email: companyEmail,
        code: verificationCode,
      });
    }

    logger.info('Verification submitted', {
      userId: req.user.id,
      employerProfileId: profile._id,
      documentsCount: documents.length,
      hasBusinessInfo: !!businessInfo,
      hasLegalRep: !!legalRepresentative,
      hasCompanyEmail: !!companyEmail,
    });

    res.status(200).json({
      success: true,
      message:
        'Đã gửi hồ sơ xác thực. Vui lòng kiểm tra email công ty để xác thực.',
      data: {
        verification: profile.verification,
        nextSteps: [
          'Xác thực email công ty',
          'Chờ admin duyệt tài liệu',
          'Kiểm tra thông tin đối chiếu',
        ],
      },
    });
  } catch (error) {
    logger.error('Verification submission failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Gửi hồ sơ xác thực thất bại',
    });
  }
});

// GET /api/employers/verification-status
const getVerificationStatus = asyncHandler(async (req, res) => {
  const profile = await ensureEmployerProfile(req.user.id);

  // Calculate verification progress
  const steps = profile.verification.verificationSteps;
  const completedSteps = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  res.status(200).json({
    success: true,
    data: {
      ...profile.verification.toObject(),
      progress: {
        percentage: progressPercentage,
        completedSteps,
        totalSteps,
        steps,
      },
    },
  });
});

// GET /api/employers/document-types
const getDocumentTypes = asyncHandler(async (req, res) => {
  try {
    const { industry } = req.query;
    const documentTypes = getDocumentTypesForIndustry(industry || 'general');

    res.status(200).json({
      success: true,
      data: {
        industry: industry || 'general',
        required: documentTypes.required,
        optional: documentTypes.optional,
      },
    });
  } catch (error) {
    logger.error('Get document types failed:', {
      error: error.message,
      industry: req.query.industry,
    });
    res.status(500).json({
      success: false,
      error: 'Lấy danh sách loại tài liệu thất bại',
    });
  }
});

// PUT /api/employers/verification/business-info
const updateBusinessInfo = asyncHandler(async (req, res) => {
  try {
    const { businessInfo } = req.body;
    const profile = await ensureEmployerProfile(req.user.id);

    // Validate business info
    const validationErrors = validateVerificationData({
      businessInfo,
      industry: profile.company.industry,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Thông tin doanh nghiệp không hợp lệ',
        details: validationErrors,
      });
    }

    // Sanitize and update
    const sanitizedBusinessInfo = sanitizeInput(businessInfo);
    profile.verification.businessInfo = {
      ...profile.verification.businessInfo,
      ...sanitizedBusinessInfo,
    };
    profile.verification.verificationSteps.businessInfoValidated = true;

    await profile.save();

    logger.info('Business info updated', {
      userId: req.user.id,
      employerProfileId: profile._id,
      updatedFields: Object.keys(sanitizedBusinessInfo),
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin doanh nghiệp thành công',
      data: profile.verification.businessInfo,
    });
  } catch (error) {
    logger.error('Business info update failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Cập nhật thông tin doanh nghiệp thất bại',
    });
  }
});

// POST /api/employers/verify-company-email
const verifyCompanyEmail = asyncHandler(async (req, res) => {
  try {
    const { verificationCode } = req.body;
    const profile = await ensureEmployerProfile(req.user.id);

    if (!profile.verification.companyEmail.email) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có email công ty để xác thực',
      });
    }

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập mã xác thực',
      });
    }

    if (
      profile.verification.companyEmail.verificationCode !== verificationCode
    ) {
      return res.status(400).json({
        success: false,
        error: 'Mã xác thực không đúng',
      });
    }

    // Check if code is expired (15 minutes)
    const codeAge =
      Date.now() - new Date(profile.verification.companyEmail.sentAt).getTime();
    if (codeAge > 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.',
      });
    }

    profile.verification.companyEmail.verified = true;
    profile.verification.companyEmail.verifiedAt = new Date();
    profile.verification.verificationSteps.companyEmailVerified = true;

    await profile.save();

    logger.info('Company email verified successfully', {
      userId: req.user.id,
      email: profile.verification.companyEmail.email,
      employerProfileId: profile._id,
    });

    res.status(200).json({
      success: true,
      message: 'Xác thực email công ty thành công',
      data: profile.verification,
    });
  } catch (error) {
    logger.error('Company email verification failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Xác thực email công ty thất bại',
    });
  }
});

// POST /api/employers/resend-verification-email
const resendVerificationEmail = asyncHandler(async (req, res) => {
  try {
    const profile = await ensureEmployerProfile(req.user.id);

    if (!profile.verification.companyEmail.email) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có email công ty để xác thực',
      });
    }

    if (profile.verification.companyEmail.verified) {
      return res.status(400).json({
        success: false,
        error: 'Email công ty đã được xác thực',
      });
    }

    // Check cooldown period
    const isInCooldown = await otpCooldownService.isInCooldown(
      'resend_verification',
      req.user.id
    );

    if (isInCooldown) {
      const remainingTime = await otpCooldownService.getRemainingCooldown(
        'resend_verification',
        req.user.id
      );
      return res.status(429).json({
        success: false,
        error: `Vui lòng chờ ${remainingTime} giây trước khi gửi lại mã`,
        retryAfter: remainingTime,
      });
    }

    // Check daily resend limit (max 5 times per day)
    const today = new Date().toDateString();
    const lastResendDate = profile.verification.companyEmail.lastResendAt
      ? new Date(profile.verification.companyEmail.lastResendAt).toDateString()
      : null;

    if (
      lastResendDate === today &&
      profile.verification.companyEmail.resendCount >= 5
    ) {
      return res.status(429).json({
        success: false,
        error: 'Đã gửi quá 5 lần trong ngày. Vui lòng thử lại vào ngày mai.',
      });
    }

    // Reset count if new day
    if (lastResendDate !== today) {
      profile.verification.companyEmail.resendCount = 0;
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    profile.verification.companyEmail.verificationCode = verificationCode;
    profile.verification.companyEmail.sentAt = new Date();
    profile.verification.companyEmail.lastResendAt = new Date();
    profile.verification.companyEmail.resendCount += 1;

    await profile.save();

    // Set cooldown
    await otpCooldownService.setCooldown('resend_verification', req.user.id);

    // TODO: Implement email service
    logger.info('Verification email resent', {
      userId: req.user.id,
      email: profile.verification.companyEmail.email,
      code: verificationCode,
      resendCount: profile.verification.companyEmail.resendCount,
    });

    res.status(200).json({
      success: true,
      message: 'Đã gửi lại mã xác thực email công ty',
      data: {
        resendCount: profile.verification.companyEmail.resendCount,
        remainingResends: 5 - profile.verification.companyEmail.resendCount,
      },
    });
  } catch (error) {
    logger.error('Resend verification email failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Gửi lại email xác thực thất bại',
    });
  }
});

// GET /api/employers/jobs
const getPostedJobs = asyncHandler(async (req, res) => {
  const Job = require('../models/Job');
  const profile = await ensureEmployerProfile(req.user.id);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = { employer: profile._id };
  if (req.query.status) filter.status = req.query.status;

  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: startIndex + limit < total,
      hasPrevPage: startIndex > 0,
    },
    data: jobs,
  });
});

// GET /api/employers/applications
const getApplications = asyncHandler(async (req, res) => {
  const Application = require('../models/Application');
  const Job = require('../models/Job');
  const profile = await ensureEmployerProfile(req.user.id);

  const jobs = await Job.find({ employer: profile._id }).select('_id');
  const jobIds = jobs.map(j => j._id);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = { jobId: { $in: jobIds } };
  if (req.query.status) filter.status = req.query.status;

  const total = await Application.countDocuments(filter);
  const applications = await Application.find(filter)
    .populate('jobId', 'title status')
    .populate('internId', 'userId')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: startIndex + limit < total,
      hasPrevPage: startIndex > 0,
    },
    data: applications,
  });
});

// GET /api/employers/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const profile = await ensureEmployerProfile(req.user.id);

  const totalJobs = await Job.countDocuments({ employer: profile._id });
  const activeJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'active',
  });
  const totalApplications = await Application.countDocuments({
    jobId: { $in: await Job.find({ employer: profile._id }).distinct('_id') },
  });

  res.status(200).json({
    success: true,
    data: { totalJobs, activeJobs, totalApplications },
  });
});

// PUT /api/employers/company
const updateCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const profile = await ensureEmployerProfile(req.user.id);

    // Whitelist allowed fields for company update
    const allowedFields = [
      'name',
      'industry',
      'size',
      'website',
      'description',
      'foundedYear',
      'headquarters',
      'address',
      'phone',
      'email',
    ];

    // Filter and sanitize input
    const sanitizedData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sanitizedData[field] = sanitizeInput(req.body[field]);
      }
    }

    profile.company = { ...profile.company.toObject(), ...sanitizedData };

    // If industry changed, update verification steps
    if (
      sanitizedData.industry &&
      sanitizedData.industry !== profile.company.industry
    ) {
      profile.verification.verificationSteps.businessInfoValidated = false;
    }

    await profile.save();

    logger.info('Company info updated', {
      userId: req.user.id,
      employerProfileId: profile._id,
      updatedFields: Object.keys(sanitizedData),
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật công ty thành công',
      data: profile.company,
    });
  } catch (error) {
    logger.error('Company info update failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Cập nhật thông tin công ty thất bại',
    });
  }
});

// Stubs for reviews
const getCompanyReviews = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'Chưa triển khai' });
});
const respondToReview = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Chưa triển khai' });
});

// GET /api/employers/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const profile = await ensureEmployerProfile(req.user.id);

  const totalJobs = await Job.countDocuments({ employer: profile._id });
  const activeJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'active',
  });
  const totalApplications = await Application.countDocuments({
    jobId: { $in: await Job.find({ employer: profile._id }).distinct('_id') },
  });

  res.status(200).json({
    success: true,
    data: { totalJobs, activeJobs, totalApplications },
  });
});

// PUT /api/employers/preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const profile = await ensureEmployerProfile(req.user.id);
  profile.preferences = { ...profile.preferences.toObject(), ...req.body };
  await profile.save();
  res.status(200).json({
    success: true,
    message: 'Cập nhật preferences thành công',
    data: profile.preferences,
  });
});

// GET /api/employers/recommended-candidates
const getRecommendedCandidates = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'Chưa triển khai' });
});

// POST /api/employers/upload-logo
const uploadCompanyLogo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'Không có file nào được upload' });
    }
    const result = await uploadImage('logo', req.file.buffer);
    const profile = await ensureEmployerProfile(req.user.id);
    profile.company.logo = { url: result.url, filename: result.publicId };
    await profile.save();

    logger.info('Company logo upload successful', {
      userId: req.user.id,
      originalName: req.file.originalname,
      publicId: result.publicId,
      employerProfileId: profile._id,
    });

    res.status(200).json({
      success: true,
      message: 'Upload logo công ty thành công',
      data: { logo: profile.company.logo },
    });
  } catch (error) {
    logger.error('Company logo upload failed:', {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Upload logo công ty thất bại',
    });
  }
});

module.exports = {
  getProfile,
  updateProfile,
  submitVerification,
  getVerificationStatus,
  getDocumentTypes,
  updateBusinessInfo,
  verifyCompanyEmail,
  resendVerificationEmail,
  getPostedJobs,
  getApplications,
  getAnalytics,
  updateCompanyInfo,
  getCompanyReviews,
  respondToReview,
  getDashboardStats,
  updatePreferences,
  getRecommendedCandidates,
  uploadCompanyLogo,
};
