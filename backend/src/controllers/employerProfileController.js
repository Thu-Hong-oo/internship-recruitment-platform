const EmployerServices = require('../services/employers/employerServices');
const { logger } = require('../utils/logger');
const { uploadImage, deleteImage } = require('../services/imageUploadService');
const documentUploadService = require('../services/documentUploadService');
const asyncHandler = require('express-async-handler');
const {
  companySchema,
  businessInfoSchema,
  legalRepresentativeSchema,
} = require('../validationSchemas');
const validateProfileFields = require('../middleware/validateProfileFields');
const {
  getDocumentTypesForIndustry,
  validateDocumentType,
  validateDocumentMetadata,
  checkRequiredDocuments,
  getVerificationProgress,
} = require('../config/documentTypes');
const { otpCooldownService } = require('../config/initializeServices');
const { success, error } = require('../helpers/responseHelper');
/**
 * Lấy danh sách ứng viên apply vào job của employer
 * @route GET /api/employers/applications
 */
const getApplications = asyncHandler(async (req, res) => {
  try {
    const Application = require('../models/Application');
    const Job = require('../models/Job');
    const profile = await EmployerServices.getProfile(req.user.id);
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
      .populate('candidateId', 'userId')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    return success(res, 'Lấy danh sách ứng viên apply thành công', {
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: startIndex + limit < total,
        hasPrevPage: startIndex > 0,
      },
      data: applications,
    });
  } catch (err) {
    logger.error('Get applications failed:', {
      error: err.message,
      userId: req.user?.id,
      stack: err.stack,
    });
    return error(res, 'Lỗi lấy danh sách ứng viên apply', err);
  }
});

// Helpers: check user đã có employer profile chưa, nếu chưa thì tạo profile mặc định với các placeholders
// Use EmployerServices.getProfile instead of ensureEmployerProfile

/**
 * Lấy thông tin profile employer
 * @route GET /api/employers/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerServices.getProfile(req.user.id);
    return success(res, 'Lấy profile thành công', {
      _id: profile._id,
      company: profile.company,
      businessInfo: profile.businessInfo,
      legalRepresentative: profile.legalRepresentative,
      contact: profile.contact,
      position: profile.position,
      stats: profile.stats,
      status: profile.status,
      verification: profile.verification,
      companyMembers: profile.companyMembers,
      documents: profile.documents || [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (err) {
    return error(res, 'Lỗi lấy profile', err);
  }
});
/**
 * Public: Lấy thông tin công ty theo id (dùng cho trang công ty, job detail...)
 * @route GET /api/companies/:id
 * @access Public
 */
// GET /api/companies/:id
// Trả về thông tin công ty giới hạn cho public (an toàn, không nhạy cảm)
const getPublicCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const EmployerProfile = require('../models/EmployerProfile');
    const profile = await EmployerProfile.findById(req.params.id);
    if (!profile || !profile.company) {
      return res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy công ty' });
    }
    const c = profile.company;
    res.status(200).json({
      success: true,
      data: {
        _id: profile._id,
        name: c.name,
        logo: c.logo?.url,
        coverImage: c.coverImage?.url,
        industry: c.industry,
        size: c.size,
        description: c.description,
        website: c.website,
        foundedYear: c.foundedYear,
        employeesCount: c.employeesCount,
        officeAddress: c.officeAddress,
        stats: profile.stats,
        status: profile.status,
      },
    });
  } catch (err) {
    logger.error('Get public company info failed:', { error: err.message });
    res
      .status(500)
      .json({ success: false, message: 'Lỗi lấy thông tin công ty' });
  }
});
/**
 * Cập nhật thông tin cá nhân employer (position, contact)
 * @route PUT /api/employers/profile
 */
const updateProfile = [
  validateProfileFields,
  asyncHandler(async (req, res) => {
    try {
      const result = await EmployerServices.updateProfile(
        req.user.id,
        req.body
      );
      return success(res, 'Cập nhật thông tin cá nhân thành công', {
        profile: result.profile,
        updatedFields: result.updatedFields.profile,
      });
    } catch (err) {
      return error(res, 'Lỗi cập nhật thông tin cá nhân', err);
    }
  }),
];

// DEPRECATED: submitVerification removed - use specific workflows instead
// - PUT /employers/company for company info + business info + legal representative
// - POST /employers/documents/business-license for business license upload
// - POST /employers/documents/tax-certificate for tax certificate upload
// GET /api/employers/verification-status
//trả về tiến độ hoàn thành xác thực
const getVerificationStatus = asyncHandler(async (req, res) => {
  const profile = await EmployerServices.getProfile(req.user.id);

  // Check if business info is actually complete
  const hasBusinessInfo =
    profile.businessInfo &&
    profile.businessInfo.registrationNumber &&
    profile.businessInfo.taxId;

  // Update businessInfo step if data exists but step is false
  if (hasBusinessInfo && !profile.verification.steps.businessInfo) {
    profile.verification.steps.businessInfo = true;
    await profile.save({ validateBeforeSave: false });
  }

  // Calculate verification progress
  const steps = profile.verification.steps;
  const completedSteps = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Check required documents
  const requiredDocuments = ['business-license', 'tax-certificate'];
  const uploadedDocs = profile.verification.documents || [];
  const verifiedDocs = uploadedDocs.filter(doc => doc.verified === true);
  const missingDocs = requiredDocuments.filter(
    docType => !uploadedDocs.some(doc => doc.documentType === docType)
  );

  // Determine next steps
  const nextSteps = [];
  if (!steps.businessInfo) {
    nextSteps.push({
      step: 'businessInfo',
      title: 'Cập nhật thông tin doanh nghiệp',
      description: 'Số ĐKKD, MST, địa chỉ trụ sở',
      endpoint: 'PUT /employers/company',
    });
  }

  if (missingDocs.length > 0) {
    missingDocs.forEach(docType => {
      if (docType === 'business-license') {
        nextSteps.push({
          step: 'upload-business-license',
          title: 'Upload giấy phép kinh doanh',
          description: 'File PDF hoặc hình ảnh + metadata',
          endpoint: 'POST /employers/documents/business-license',
        });
      }
      if (docType === 'tax-certificate') {
        nextSteps.push({
          step: 'upload-tax-certificate',
          title: 'Upload giấy chứng nhận đăng ký thuế',
          description: 'File PDF hoặc hình ảnh + metadata',
          endpoint: 'POST /employers/documents/tax-certificate',
        });
      }
    });
  }

  if (uploadedDocs.length > 0 && verifiedDocs.length === 0) {
    nextSteps.push({
      step: 'wait-verification',
      title: 'Chờ admin duyệt tài liệu',
      description: 'Tài liệu đã upload, chờ admin xác thực',
      endpoint: null,
    });
  }

  // Overall status
  let overallStatus = 'incomplete';
  if (steps.basicInfo && steps.businessInfo && uploadedDocs.length >= 2) {
    if (steps.adminApproved) {
      overallStatus = 'verified';
    } else if (verifiedDocs.length >= 2) {
      overallStatus = 'pending-approval';
    } else {
      overallStatus = 'pending-verification';
    }
  }

  res.status(200).json({
    success: true,
    data: {
      // Basic verification info
      isVerified: profile.verification.isVerified,
      status: profile.status,
      overallStatus,

      // Progress tracking
      progress: {
        percentage: progressPercentage,
        completedSteps,
        totalSteps,
        steps: {
          basicInfo: steps.basicInfo,
          businessInfo: steps.businessInfo,
          adminApproved: steps.adminApproved,
        },
      },

      // Documents info
      documents: {
        uploaded: uploadedDocs.length,
        verified: verifiedDocs.length,
        required: requiredDocuments.length,
        missing: missingDocs,
        list: uploadedDocs.map(doc => ({
          _id: doc._id,
          documentType: doc.documentType,
          url: doc.url,
          verified: doc.verified,
          uploadedAt: doc.uploadedAt,
          verifiedAt: doc.verifiedAt,
          rejectionReason: doc.rejectionReason,
        })),
      },

      // Next steps guidance
      nextSteps,

      // User-friendly messages
      message: getStatusMessage(overallStatus, nextSteps.length),
    },
  });
});

// Helper function for status messages
const getStatusMessage = (status, nextStepsCount) => {
  switch (status) {
    case 'verified':
      return 'Tài khoản đã được xác thực thành công! Bạn có thể bắt đầu đăng tuyển.';
    case 'pending-approval':
      return 'Tài liệu đã được xác thực, chờ admin phê duyệt cuối cùng.';
    case 'pending-verification':
      return 'Đã upload tài liệu, chờ admin xác thực.';
    case 'incomplete':
      return nextStepsCount > 0
        ? `Còn ${nextStepsCount} bước cần hoàn thành để xác thực tài khoản.`
        : 'Hồ sơ chưa đầy đủ thông tin.';
    default:
      return 'Đang xử lý xác thực tài khoản.';
  }
};

// GET /api/employers/document-types
//lấy ds loại giấy tờ cần cho ngành nghề của công ty. check cem thiếu/tồn tại
const getDocumentTypes = asyncHandler(async (req, res) => {
  try {
    const { industry } = req.query;
    const profile = await EmployerServices.getProfile(req.user.id);
    const documentTypes = getDocumentTypesForIndustry(
      industry || profile.company.industry || 'general'
    );

    // Get verification progress
    const progress = getVerificationProgress(
      profile.verification.documents,
      industry || profile.company.industry || 'general'
    );

    // Check required documents status
    const requiredCheck = checkRequiredDocuments(
      profile.verification.documents,
      industry || profile.company.industry || 'general'
    );

    res.status(200).json({
      success: true,
      data: {
        industry: industry || profile.company.industry || 'general',
        required: documentTypes.required,
        optional: documentTypes.optional,
        uploadedDocuments: profile.verification.documents,
        progress: {
          percentage: progress.percentage,
          uploadedRequired: progress.uploadedRequired,
          totalRequired: progress.totalRequired,
          missingRequired: progress.missingRequired,
        },
        requiredCheck,
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

// DEPRECATED: Generic addDocument removed - use specific endpoints instead
// Use uploadBusinessLicense or uploadTaxCertificate for document uploads

/**
 * Upload giấy phép kinh doanh cho employer
 * @route POST /api/employers/documents/business-license
 */
const uploadBusinessLicense = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return error(res, 'Không có file được upload', null, 400);
    const { documentNumber, issueDate, issuePlace, validUntil } = req.body;
    const profile = await EmployerServices.getProfile(req.user.id);
    const documentType = 'business-license';
    const metadata = { documentNumber, issueDate, issuePlace, validUntil };
    const metadataValidation = validateDocumentMetadata(documentType, metadata);
    if (!metadataValidation.valid) {
      return error(
        res,
        metadataValidation.error,
        metadataValidation.missingFields,
        400
      );
    }
    // Remove old document if exists
    const existingDoc = profile.verification.documents.find(
      doc => doc.documentType === documentType
    );
    let oldCloudinaryId = existingDoc?.metadata?.cloudinaryId || null;
    const uploadResult = await EmployerServices.uploadDocument(
      req.file,
      req.user.id,
      documentType,
      metadata,
      profile
    );
    if (oldCloudinaryId) {
      try {
        await EmployerServices.deleteDocument(oldCloudinaryId);
      } catch (deleteError) {
        logger.warn('Failed to delete old business license', {
          userId: req.user.id,
          oldCloudinaryId,
          error: deleteError.message,
        });
      }
    }
    logger.info('Business license uploaded successfully', {
      userId: req.user.id,
      employerProfileId: profile._id,
      cloudinaryId: uploadResult.publicId,
    });
    return success(res, 'Upload giấy phép kinh doanh thành công', {
      type: documentType,
      url: uploadResult.url,
      cloudinaryId: uploadResult.publicId,
      filename: uploadResult.originalName,
      metadata: {
        ...metadata,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
      },
    });
  } catch (err) {
    logger.error('Upload business license failed:', {
      error: err.message,
      userId: req.user.id,
      stack: err.stack,
    });
    return error(res, 'Upload giấy phép kinh doanh thất bại', err);
  }
});

// POST /api/employers/documents/tax-certificate
// Upload giấy chứng nhận đăng ký thuế (chỉ cần file + metadata)
const uploadTaxCertificate = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được upload',
      });
    }

    const { documentNumber, issueDate, validUntil } = req.body;
    const profile = await EmployerServices.getProfile(req.user.id);
    const documentType = 'tax-certificate';

    // Validate metadata cho tax certificate
    const metadata = { documentNumber, issueDate, validUntil };
    const metadataValidation = validateDocumentMetadata(documentType, metadata);
    if (!metadataValidation.valid) {
      logger.warn('Tax certificate metadata validation failed', {
        userId: req.user.id,
        missingFields: metadataValidation.missingFields,
        providedMetadata: metadata,
      });

      return res.status(400).json({
        success: false,
        error: metadataValidation.error,
        missingFields: metadataValidation.missingFields,
        hint: 'Cần có: documentNumber (số giấy chứng nhận), issueDate (ngày cấp)',
      });
    }

    // Kiểm tra document cũ để xóa
    const existingDoc = profile.verification.documents.find(
      doc => doc.documentType === documentType
    );

    let oldCloudinaryId = null;
    if (
      existingDoc &&
      existingDoc.metadata &&
      existingDoc.metadata.cloudinaryId
    ) {
      oldCloudinaryId = existingDoc.metadata.cloudinaryId;
    }

    // Duplicate inner function removed. Only main uploadTaxCertificate remains.
    res.status(200).json({
      success: true,
      message: 'Xóa tài liệu thành công',
      data: {
        uploadedDocuments: profile.verification.documents,
      },
    });
  } catch (error) {
    logger.error('Remove document failed:', {
      error: error.message,
      userId: req.user?.id,
      documentId: req.params.documentId,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Xóa tài liệu thất bại',
    });
  }
});

// DEPRECATED: updateBusinessInfo removed - use updateCompanyInfo instead

// DEPRECATED: Email verification endpoints moved to User model

// GET /api/employers/jobs
const getPostedJobs = asyncHandler(async (req, res) => {
  const Job = require('../models/Job');
  const profile = await EmployerServices.getProfile(req.user.id);
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

/**
 * Xóa tài liệu khỏi employer profile
 * @route DELETE /api/employers/documents/:documentId
 */
const removeDocument = asyncHandler(async (req, res) => {
  try {
    const { documentId } = req.params;
    const profile = await EmployerServices.getProfile(req.user.id);
    const document = profile.verification.documents.find(
      doc => doc._id.toString() === documentId
    );
    if (!document) return error(res, 'Không tìm thấy tài liệu', null, 404);
    let cloudinaryId = document.cloudinaryId || document.metadata?.cloudinaryId;
    if (cloudinaryId) {
      try {
        await EmployerServices.deleteDocument(cloudinaryId);
        logger.info('Document deleted from Cloudinary', {
          userId: req.user.id,
          documentId,
          cloudinaryId,
        });
      } catch (cloudinaryError) {
        logger.error('Failed to delete document from Cloudinary:', {
          error: cloudinaryError.message,
          cloudinaryId,
        });
      }
    }
    await EmployerServices.removeDocument(profile, documentId);
    logger.info('Document removed from employer profile', {
      userId: req.user.id,
      documentId,
      employerProfileId: profile._id,
    });

    return success(res, 'Xóa tài liệu thành công', {
      uploadedDocuments: profile.verification.documents,
    });
  } catch (err) {
    logger.error('Remove document failed:', {
      error: err.message,
      userId: req.user?.id,
      documentId: req.params.documentId,
      stack: err.stack,
    });
    return error(res, 'Xóa tài liệu thất bại', err);
  }
});

// GET /api/employers/analytics (combined dashboard stats)
const getAnalytics = asyncHandler(async (req, res) => {
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const profile = await EmployerServices.getProfile(req.user.id);

  const totalJobs = await Job.countDocuments({ employer: profile._id });
  const activeJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'active',
  });
  const totalApplications = await Application.countDocuments({
    jobId: { $in: await Job.find({ employer: profile._id }).distinct('_id') },
  });

  // Enhanced analytics with more details
  const draftJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'draft',
  });
  const closedJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'closed',
  });

  return success(res, 'Thống kê tổng hợp thành công', {
    jobs: {
      total: totalJobs,
      active: activeJobs,
      draft: draftJobs,
      closed: closedJobs,
    },
    applications: {
      total: totalApplications,
    },
    summary: {
      totalJobs,
      activeJobs,
      totalApplications,
    },
  });
});

// DEPRECATED: Use getAnalytics instead

/**
 * Cập nhật thông tin công ty employer (company, businessInfo, legalRepresentative, documents)
 * @route PUT /api/employers/company
 */
const updateCompanyInfo = asyncHandler(async (req, res) => {
  try {
    // Validate input bằng Joi
    if (req.body.company) {
      const { error } = companySchema.validate(req.body.company);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin công ty không hợp lệ',
          error: error.details || error.message || error,
        });
      }
    }
    if (req.body.businessInfo) {
      const { error } = businessInfoSchema.validate(req.body.businessInfo);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin đăng ký kinh doanh không hợp lệ',
          error: error.details || error.message || error,
        });
      }
    }
    if (req.body.legalRepresentative) {
      const { error } = legalRepresentativeSchema.validate(
        req.body.legalRepresentative
      );
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin người đại diện pháp luật không hợp lệ',
          error: error.details || error.message || error,
        });
      }
    }
    // Validate documents nếu có
    if (req.body.documents && Array.isArray(req.body.documents)) {
      for (const doc of req.body.documents) {
        const docValidation = validateDocumentType(
          doc.type,
          req.body.company?.industry
        );
        if (!docValidation) {
          return res.status(400).json({
            success: false,
            message: `Document type không hợp lệ: ${doc.type}`,
            error: null,
          });
        }
      }
    }
    // Gọi service để cập nhật
    const result = await EmployerServices.updateCompanyInfo(
      req.user.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin công ty thành công',
      data: {
        profile: result.profile,
        updatedFields: result.updatedFields.profile,
      },
    });
  } catch (err) {
    // Nếu lỗi trùng mã số thuế thì trả về 409
    if (err.message && err.message.includes('Mã số thuế đã tồn tại')) {
      return res.status(409).json({
        success: false,
        message: 'Lỗi cập nhật thông tin công ty',
        error: err.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin công ty',
      error: err.message || err,
    });
  }
});

// Helper function to get next verification steps
const getNextVerificationSteps = profile => {
  const steps = [];
  const verificationSteps = profile.verification?.steps || {};

  if (!verificationSteps.businessInfo) {
    steps.push({
      step: 'businessInfo',
      title: 'Cập nhật thông tin đăng ký kinh doanh',
      description: 'Số ĐKKD, MST, địa chỉ trụ sở',
      endpoint: 'PUT /employers/verification/business-info',
    });
  }

  if (!verificationSteps.legalRepresentative) {
    steps.push({
      step: 'legalRepresentative',
      title: 'Thông tin người đại diện pháp luật',
      description: 'Họ tên, chức vụ, CCCD/CMND',
      endpoint: 'POST /employers/verify',
    });
  }

  if (!verificationSteps.documents) {
    const requiredDocs = getDocumentTypesForIndustry(profile.company.industry);
    steps.push({
      step: 'documents',
      title: 'Upload giấy tờ chứng minh',
      description: `Cần có: ${
        requiredDocs.required?.map(d => d.name).join(', ') ||
        'Giấy tờ chứng minh'
      }`,
      endpoint: 'POST /employers/documents',
    });
  }

  return steps;
};

// POST /api/employers/upload-logo
const uploadCompanyLogo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file nào được upload',
      });
    }
    const result = await EmployerServices.uploadLogo(req.user.id, req.file);
    logger.info('Company logo upload successful', {
      userId: req.user.id,
      originalName: req.file.originalname,
      publicId: result.publicId,
      employerProfileId: result.employerProfileId,
    });
    res.status(200).json({
      success: true,
      message: 'Upload logo công ty thành công',
      data: { logo: result.logo },
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

// POST /api/employers/upload-cover-image
const uploadCoverImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file nào được upload',
      });
    }
    const result = await EmployerServices.uploadCoverImage(
      req.user.id,
      req.file
    );
    logger.info('Company cover image upload successful', {
      userId: req.user.id,
      originalName: req.file.originalname,
      publicId: result.publicId,
      employerProfileId: result.employerProfileId,
    });
    res.status(200).json({
      success: true,
      message: 'Upload ảnh bìa công ty thành công',
      data: { coverImage: result.coverImage },
    });
  } catch (error) {
    logger.error('Company cover image upload failed:', {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Upload ảnh bìa công ty thất bại',
    });
  }
});

const removeCoverImage = asyncHandler(async (req, res) => {
  try {
    const result = await EmployerServices.removeCoverImage(req.user.id);
    logger.info('Company cover image removed', {
      userId: req.user.id,
      employerProfileId: result.employerProfileId,
    });
    res.status(200).json({
      success: true,
      message: 'Xóa ảnh bìa thành công',
    });
  } catch (error) {
    logger.error('Remove cover image failed:', {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Xóa ảnh bìa thất bại',
    });
  }
});

// DELETE /api/employers/logo
const removeLogo = asyncHandler(async (req, res) => {
  try {
    const result = await EmployerServices.removeLogo(req.user.id);
    logger.info('Company logo removed', {
      userId: req.user.id,
      employerProfileId: result.employerProfileId,
    });
    res.status(200).json({
      success: true,
      message: 'Xóa logo thành công',
    });
  } catch (error) {
    logger.error('Remove logo failed:', {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'Xóa logo thất bại',
    });
  }
});

// GET /api/employers/company
// GET /api/employers/company
// Trả về đầy đủ thông tin công ty cho employer (nội bộ)
const getCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const profile = await EmployerServices.getProfile(req.user.id);
    const c = profile.company || {};
    res.status(200).json({
      success: true,
      data: {
        _id: profile._id,
        name: c.name,
        logo: c.logo?.url,
        coverImage: c.coverImage?.url,
        industry: c.industry,
        size: c.size,
        description: c.description,
        website: c.website,
        email: c.email,
        foundedYear: c.foundedYear,
        employeesCount: c.employeesCount,
        officeAddress: c.officeAddress,
        businessInfo: profile.businessInfo,
        legalRepresentative: profile.legalRepresentative,
        stats: profile.stats,
        hiring: profile.hiring,
        preferences: profile.preferences,
        status: profile.status,
        verification: profile.verification,
        companyMembers: profile.companyMembers,
        documents: profile.documents || [],
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (err) {
    logger.error('Get company info failed:', { error: err.message });
    res
      .status(500)
      .json({ success: false, message: 'Lỗi lấy thông tin công ty' });
  }
});

// Remove the duplicated code at the end and fix getRecommendedCandidates export
const getRecommendedCandidates = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'Chưa triển khai' });
});

module.exports = {
  // === PROFILE MANAGEMENT ===
  getProfile, // GET /employers/profile - Lấy toàn bộ thông tin employer profile
  updateProfile, // PUT /employers/profile - Cập nhật thông tin cá nhân (position, contact, officeAddress)
  getCompanyInfo, // GET /employers/company - Lấy thông tin công ty (company, stats, hiring, preferences)
  updateCompanyInfo, // PUT /employers/company - Cập nhật thông tin công ty và xác thực

  // === COMPANY VERIFICATION SYSTEM ===
  getVerificationStatus, // GET /employers/verification-status - Xem tiến độ xác thực
  getDocumentTypes, // GET /employers/document-types - Lấy danh sách loại giấy tờ cần thiết theo ngành

  // === DOCUMENT UPLOAD (CLEANED UP) ===
  uploadBusinessLicense, // POST /employers/documents/business-license - Upload giấy phép kinh doanh
  uploadTaxCertificate, // POST /employers/documents/tax-certificate - Upload giấy chứng nhận đăng ký thuế
  removeDocument, // DELETE /employers/documents/:documentId - Xóa tài liệu

  // === JOB & APPLICATION MANAGEMENT ===
  getPostedJobs, // GET /employers/jobs - Lấy danh sách job đã đăng
  getApplications, // GET /employers/applications - Lấy danh sách ứng viên apply

  // === ANALYTICS (MERGED) ===
  getAnalytics, // GET /employers/analytics - Thống kê tổng hợp (jobs, applications, dashboard)

  getRecommendedCandidates, // GET /employers/recommended-candidates - Gợi ý ứng viên (STUB)

  // === MEDIA UPLOAD ===
  uploadCompanyLogo, // POST /employers/upload-logo - Upload logo công ty
  uploadCoverImage, // POST /employers/upload-cover-image - Upload ảnh bìa
  removeLogo, // DELETE /employers/logo - Xóa logo
  removeCoverImage, // DELETE /employers/cover-image - Xóa ảnh bìa

  // === PUBLIC API ===
  getPublicCompanyInfo, // GET /api/companies/:id - Public lấy thông tin công ty
};
