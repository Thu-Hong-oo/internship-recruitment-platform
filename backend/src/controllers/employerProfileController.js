const EmployerProfile = require('../models/EmployerProfile');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { uploadImage, deleteImage } = require('../services/imageUploadService');
const documentUploadService = require('../services/documentUploadService');
const asyncHandler = require('express-async-handler');
const EmployerProfileHelpers = require('../helpers/EmployerProfileHelpers');
const {
  validateBusinessInfo,
  validateLegalRepresentative,
  isValidCompanyEmail,
  validateTaxId,
  crossCheckBusinessInfo,
  sanitizeInput,
} = require('../utils/verificationValidation');
const {
  getDocumentTypesForIndustry,
  validateDocumentType,
  validateDocumentMetadata,
  checkRequiredDocuments,
  getVerificationProgress,
} = require('../config/documentTypes');
const { otpCooldownService } = require('../config/initializeServices');

// Helpers: check user đã có employer profile chưa, nếu chưa thì tạo profile mặc định với các placeholders
const ensureEmployerProfile = async userId => {
  let profile = await EmployerProfile.findOne({ mainUserId: userId });
  if (!profile) {
    profile = await EmployerProfile.create({
      mainUserId: userId,
      company: {
        name: 'Chưa cập nhật',
        industry: 'unknown',
        size: 'small',
        email: 'temp@example.com',
      },
      position: {
        title: 'Chưa cập nhật',
        level: 'junior',
        department: 'Chưa cập nhật',
      },
      contact: {
        name: 'Chưa cập nhật',
        phone: 'Chưa cập nhật',
        email: 'temp@example.com',
      },
      officeAddress: {
        street: 'Chưa cập nhật',
        ward: 'Chưa cập nhật',
        district: 'Chưa cập nhật',
        city: 'Chưa cập nhật',
        country: 'Vietnam',
        postalCode: '000000',
      },
      legalRepresentative: {
        fullName: 'Chưa cập nhật',
        position: 'Chưa cập nhật',
        phone: 'Chưa cập nhật',
        email: 'temp@example.com',
      },
      businessInfo: {
        registrationNumber: 'temp',
        taxId: `temp_${userId}_${Date.now()}`,
        issueDate: new Date(),
        issuePlace: 'Chưa cập nhật',
        address: {
          street: 'Chưa cập nhật',
          ward: 'Chưa cập nhật',
          district: 'Chưa cập nhật',
          city: 'Chưa cập nhật',
          country: 'Vietnam',
        },
      },
    });

    // Update User reference
    await User.findByIdAndUpdate(userId, { employerProfile: profile._id });
  }

  // Ensure all nested objects exist even for existing profiles
  if (!profile.company) profile.company = {};
  if (!profile.position) profile.position = {};
  if (!profile.contact) profile.contact = {};
  if (!profile.officeAddress) profile.officeAddress = {};

  return profile;
};

// GET /api/employers/profile
const getProfile = asyncHandler(async (req, res) => {
  const profile = await ensureEmployerProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: {
      company: profile.company,
      businessInfo: profile.businessInfo,
      legalRepresentative: profile.legalRepresentative,
      contact: profile.contact,
      position: profile.position,
      officeAddress: profile.officeAddress,
      stats: profile.stats,
      status: profile.status,
      verification: profile.verification,
      companyMembers: profile.companyMembers,
      documents: profile.documents || [],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      // Thêm các trường khác nếu cần
    }
  });
});

// PUT /api/employers/profile
// Update Personal Profile (position, contact, office address only)
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const profile = await ensureEmployerProfile(req.user.id);

    // Initialize nested objects if they don't exist
    if (!profile.position) profile.position = {};
    if (!profile.contact) profile.contact = {};
    if (!profile.officeAddress) profile.officeAddress = {};

    // Validate input - only allow personal fields
    const allowedFields = ['position', 'contact', 'officeAddress'];
    const invalidFields = Object.keys(req.body).filter(
      field => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint này chỉ cho phép cập nhật thông tin cá nhân',
        message: `Các trường không được phép: ${invalidFields.join(', ')}`,
        allowedFields: allowedFields,
        note: 'Để cập nhật thông tin công ty, sử dụng PUT /employers/company',
      });
    }

    let hasUpdates = false;

    // Update position info if provided
    if (req.body.position) {
      const positionFields = ['title', 'level', 'department'];
      const positionData = {};

      for (const field of positionFields) {
        if (req.body.position[field] !== undefined) {
          positionData[field] = sanitizeInput(req.body.position[field]);
        }
      }

      if (Object.keys(positionData).length > 0) {
        Object.assign(profile.position, positionData);
        hasUpdates = true;
      }
    }

    // Update contact info if provided
    if (req.body.contact) {
      const contactFields = ['name', 'phone', 'email'];
      const contactData = {};

      for (const field of contactFields) {
        if (req.body.contact[field] !== undefined) {
          contactData[field] = sanitizeInput(req.body.contact[field]);
        }
      }

      if (Object.keys(contactData).length > 0) {
        Object.assign(profile.contact, contactData);
      }
    }

    // Update office address if provided
    if (req.body.officeAddress) {
      const addressFields = [
        'street',
        'ward',
        'district',
        'city',
        'country',
        'postalCode',
      ];
      const addressData = {};

      for (const field of addressFields) {
        if (req.body.officeAddress[field] !== undefined) {
          addressData[field] = sanitizeInput(req.body.officeAddress[field]);
        }
      }

      if (Object.keys(addressData).length > 0) {
        Object.assign(profile.officeAddress, addressData);
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        error: 'Không có dữ liệu hợp lệ để cập nhật',
        allowedFields: ['position', 'contact', 'officeAddress'],
      });
    }

    // Save with validation disabled to avoid required field errors for incomplete profile
    await profile.save({ validateBeforeSave: false });

    // Update User model if contact info changed
    if (req.body.contact?.name || req.body.contact?.phone) {
      const userUpdates = {};
      if (req.body.contact.name) userUpdates.fullName = req.body.contact.name;
      if (req.body.contact.phone) userUpdates.phone = req.body.contact.phone;

      await User.findByIdAndUpdate(req.user.id, userUpdates);
    }

    logger.info('Personal profile updated', {
      userId: req.user.id,
      updatedSections: Object.keys(req.body),
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: {
        position: profile.position,
        contact: profile.contact,
        officeAddress: profile.officeAddress,
        updatedFields: Object.keys(req.body),
      },
    });
  } catch (error) {
    logger.error('Profile update failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        err => err.message
      );
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Cập nhật hồ sơ thất bại',
    });
  }
});

// DEPRECATED: submitVerification removed - use specific workflows instead
// - PUT /employers/company for company info + business info + legal representative
// - POST /employers/documents/business-license for business license upload
// - POST /employers/documents/tax-certificate for tax certificate upload
// GET /api/employers/verification-status
//trả về tiến độ hoàn thành xác thực
const getVerificationStatus = asyncHandler(async (req, res) => {
  const profile = await ensureEmployerProfile(req.user.id);

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
    const profile = await ensureEmployerProfile(req.user.id);
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

// POST /api/employers/documents/business-license
// Upload giấy phép kinh doanh (chỉ cần file + metadata)
const uploadBusinessLicense = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được upload',
      });
    }

    const { documentNumber, issueDate, issuePlace, validUntil } = req.body;
    const profile = await ensureEmployerProfile(req.user.id);
    const documentType = 'business-license';

    // Validate metadata cho business license
    const metadata = { documentNumber, issueDate, issuePlace, validUntil };
    const metadataValidation = validateDocumentMetadata(documentType, metadata);
    if (!metadataValidation.valid) {
      logger.warn('Business license metadata validation failed', {
        userId: req.user.id,
        missingFields: metadataValidation.missingFields,
        providedMetadata: metadata,
      });

      return res.status(400).json({
        success: false,
        error: metadataValidation.error,
        missingFields: metadataValidation.missingFields,
        hint: 'Cần có: documentNumber (số giấy phép), issueDate (ngày cấp), issuePlace (nơi cấp)',
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

    // Upload file
    const uploadResult = await documentUploadService.uploadDocument(
      req.file,
      req.user.id,
      documentType
    );

    // Add document - Fixed signature: (url, cloudinaryId, documentType, metadata)
    await EmployerProfileHelpers.addDocument(
      profile,
      uploadResult.url,
      uploadResult.publicId,
      documentType,
      {
        ...metadata,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
      }
    ); // Xóa file cũ
    if (oldCloudinaryId) {
      try {
        await documentUploadService.deleteDocument(oldCloudinaryId);
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

    res.status(200).json({
      success: true,
      message: 'Upload giấy phép kinh doanh thành công',
      data: {
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
      },
    });
  } catch (error) {
    logger.error('Upload business license failed:', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Upload giấy phép kinh doanh thất bại',
    });
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
    const profile = await ensureEmployerProfile(req.user.id);
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

    // Upload file
    const uploadResult = await documentUploadService.uploadDocument(
      req.file,
      req.user.id,
      documentType
    );

    // Add document - Fixed signature: (url, cloudinaryId, documentType, metadata)
    await EmployerProfileHelpers.addDocument(
      profile,
      uploadResult.url,
      uploadResult.publicId,
      documentType,
      {
        ...metadata,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
      }
    ); // Xóa file cũ
    if (oldCloudinaryId) {
      try {
        await documentUploadService.deleteDocument(oldCloudinaryId);
      } catch (deleteError) {
        logger.warn('Failed to delete old tax certificate', {
          userId: req.user.id,
          oldCloudinaryId,
          error: deleteError.message,
        });
      }
    }

    logger.info('Tax certificate uploaded successfully', {
      userId: req.user.id,
      employerProfileId: profile._id,
      cloudinaryId: uploadResult.publicId,
    });

    res.status(200).json({
      success: true,
      message: 'Upload giấy chứng nhận đăng ký thuế thành công',
      data: {
        type: documentType,
        url: uploadResult.url,
        filename: uploadResult.originalName,
        metadata: {
          ...metadata,
          originalName: uploadResult.originalName,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
          cloudinaryId: uploadResult.publicId,
        },
      },
    });
  } catch (error) {
    logger.error('Upload tax certificate failed:', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Upload giấy chứng nhận đăng ký thuế thất bại',
    });
  }
});

// DELETE /api/employers/documents/:documentId
const removeDocument = asyncHandler(async (req, res) => {
  try {
    const { documentId } = req.params;
    const profile = await ensureEmployerProfile(req.user.id);

    // Find the document to get cloudinary ID before deletion
    const document = profile.verification.documents.find(
      doc => doc._id.toString() === documentId
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu',
      });
    }

    // Delete from Cloudinary if cloudinaryId exists (support both old and new structure)
    let cloudinaryId = document.cloudinaryId || document.metadata?.cloudinaryId;

    if (cloudinaryId) {
      try {
        await documentUploadService.deleteDocument(cloudinaryId);
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
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Remove from database using helper method
    await EmployerProfileHelpers.removeDocument(profile, documentId);

    logger.info('Document removed from employer profile', {
      userId: req.user.id,
      documentId,
      employerProfileId: profile._id,
    });

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

// GET /api/employers/analytics (combined dashboard stats)
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

  // Enhanced analytics with more details
  const draftJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'draft',
  });
  const closedJobs = await Job.countDocuments({
    employer: profile._id,
    status: 'closed',
  });

  res.status(200).json({
    success: true,
    data: {
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
    },
  });
});

// DEPRECATED: Use getAnalytics instead

// Update Company Information & Verification Data
const updateCompanyInfo = asyncHandler(async (req, res) => {
  try {
    const profile = await ensureEmployerProfile(req.user.id);

    // Initialize nested objects if they don't exist
    if (!profile.company) profile.company = {};
    if (!profile.businessInfo) profile.businessInfo = {};
    if (!profile.legalRepresentative) profile.legalRepresentative = {};

    // Validate input - only allow company verification fields
    const allowedSections = [
      'company',
      'businessInfo',
      'legalRepresentative',
      'documents',
    ];
    const invalidFields = Object.keys(req.body).filter(
      field => !allowedSections.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          'Endpoint này chỉ cho phép cập nhật thông tin công ty và xác thực',
        message: `Các trường không được phép: ${invalidFields.join(', ')}`,
        allowedSections: allowedSections,
        note: 'Để cập nhật thông tin cá nhân, sử dụng PUT /employers/profile',
      });
    }

    let hasUpdates = false;

    // Update company basic info if provided
    if (req.body.company) {
      const companyFields = [
        'name',
        'industry',
        'size',
        'email',
        'website',
        'description',
        'employeesCount',
        'foundedYear',
      ];
      const companyData = {};

      for (const field of companyFields) {
        if (req.body.company[field] !== undefined) {
          companyData[field] = sanitizeInput(req.body.company[field]);
        }
      }

      if (Object.keys(companyData).length > 0) {
        // Validate company email if provided
        if (companyData.email && !isValidCompanyEmail(companyData.email)) {
          return res.status(400).json({
            success: false,
            error: 'Email công ty không hợp lệ',
            message:
              'Email phải thuộc tên miền công ty, không được sử dụng email cá nhân (gmail, yahoo, etc.)',
          });
        }

        Object.assign(profile.company, companyData);
        hasUpdates = true;
      }
    }

    // Update business info if provided
    if (req.body.businessInfo) {
      const businessFields = [
        'registrationNumber',
        'taxId',
        'address',
        'establishedDate',
        'registrationDate',
      ];
      const businessData = {};

      for (const field of businessFields) {
        if (req.body.businessInfo[field] !== undefined) {
          businessData[field] = sanitizeInput(req.body.businessInfo[field]);
        }
      }

      if (Object.keys(businessData).length > 0) {
        // Validate business info
        const businessValidation = validateBusinessInfo(businessData);
        if (businessValidation.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Thông tin đăng ký kinh doanh không hợp lệ',
            details: businessValidation,
          });
        }

        Object.assign(profile.businessInfo, businessData);
        profile.verification.steps.businessInfo = true; // Mark business info as completed
        hasUpdates = true;
      }
    }

    // Update legal representative if provided
    if (req.body.legalRepresentative) {
      const legalFields = [
        'fullName',
        'position',
        'phone',
        'email',
        'identityCard',
        'address',
      ];
      const legalData = {};

      for (const field of legalFields) {
        if (req.body.legalRepresentative[field] !== undefined) {
          legalData[field] = sanitizeInput(req.body.legalRepresentative[field]);
        }
      }

      if (Object.keys(legalData).length > 0) {
        // Validate legal representative info
        const legalValidation = validateLegalRepresentative(legalData);
        if (legalValidation.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Thông tin người đại diện pháp luật không hợp lệ',
            details: legalValidation,
          });
        }

        Object.assign(profile.legalRepresentative, legalData);
        hasUpdates = true;
      }
    }

    // Handle documents update if provided
    if (req.body.documents && Array.isArray(req.body.documents)) {
      // Validate document types
      for (const doc of req.body.documents) {
        const docValidation = validateDocumentType(
          doc.type,
          profile.company.industry
        );
        if (!docValidation) {
          return res.status(400).json({
            success: false,
            error: `Document type không hợp lệ: ${doc.type}`,
            details: [
              `Document type "${doc.type}" không được hỗ trợ cho ngành ${profile.company.industry}`,
            ],
          });
        }
      }

      profile.documents = req.body.documents;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        error: 'Không có dữ liệu hợp lệ để cập nhật',
        allowedSections: [
          'company',
          'businessInfo',
          'legalRepresentative',
          'documents',
        ],
      });
    }

    // Save with validation disabled for partial updates
    await profile.save({ validateBeforeSave: false });

    // Update User model company name if changed
    if (req.body.company?.name) {
      await User.findByIdAndUpdate(req.user.id, {
        companyName: req.body.company.name,
      });
    }

    logger.info('Company info updated', {
      userId: req.user.id,
      employerProfileId: profile._id,
      updatedSections: Object.keys(req.body),
    });

    // Check verification progress
    const verificationProgress = getVerificationProgress(
      profile.verification?.documents || [],
      profile.company.industry
    );
    const nextSteps = getNextVerificationSteps(profile);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin công ty thành công',
      data: {
        company: {
          name: profile.company.name,
          industry: profile.company.industry,
          size: profile.company.size,
          email: profile.company.email,
          website: profile.company.website,
          description: profile.company.description,
          foundedYear: profile.company.foundedYear,
          employeesCount: profile.company.employeesCount,
          ...(profile.company.logo?.url && {
            logo: { url: profile.company.logo.url },
          }),
          ...(profile.company.coverImage?.url && {
            coverImage: { url: profile.company.coverImage.url },
          }),
        },
        ...(profile.businessInfo &&
          Object.keys(profile.businessInfo.toObject()).length > 0 && {
            businessInfo: {
              registrationNumber: profile.businessInfo.registrationNumber,
              taxId: profile.businessInfo.taxId,
              issueDate: profile.businessInfo.issueDate,
              issuePlace: profile.businessInfo.issuePlace,
              ...(profile.businessInfo.address && {
                address: profile.businessInfo.address,
              }),
            },
          }),
        ...(profile.legalRepresentative &&
          Object.keys(profile.legalRepresentative.toObject()).length > 0 && {
            legalRepresentative: {
              fullName: profile.legalRepresentative.fullName,
              position: profile.legalRepresentative.position,
              phone: profile.legalRepresentative.phone,
              email: profile.legalRepresentative.email,
            },
          }),
        verification: {
          progress: verificationProgress,
          status: profile.verification?.status || 'pending',
          nextSteps: nextSteps,
          requiredDocuments: getDocumentTypesForIndustry(
            profile.company.industry
          ),
        },
      },
    });
  } catch (error) {
    logger.error('Company info update failed:', {
      error: error.message,
      userId: req.user?.id,
      stack: error.stack,
    });

    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        err => err.message
      );
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Cập nhật thông tin công ty thất bại',
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

    const result = await uploadImage('logo', req.file.buffer);
    const profile = await ensureEmployerProfile(req.user.id);

    // Update logo directly without triggering validation
    profile.company.logo = {
      url: result.url,
      filename: result.publicId,
      uploadedAt: new Date(),
    };

    await profile.save({ validateBeforeSave: false });

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

// POST /api/employers/upload-cover-image
const uploadCoverImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file nào được upload',
      });
    }

    const result = await uploadImage('cover', req.file.buffer);
    const profile = await ensureEmployerProfile(req.user.id);

    // Update cover image directly without triggering validation
    profile.company.coverImage = {
      url: result.url,
      filename: result.publicId,
      uploadedAt: new Date(),
    };

    await profile.save({ validateBeforeSave: false });

    logger.info('Company cover image upload successful', {
      userId: req.user.id,
      originalName: req.file.originalname,
      publicId: result.publicId,
      employerProfileId: profile._id,
    });

    res.status(200).json({
      success: true,
      message: 'Upload ảnh bìa công ty thành công',
      data: { coverImage: profile.company.coverImage },
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
    const profile = await ensureEmployerProfile(req.user.id);

    if (profile.company.coverImage && profile.company.coverImage.filename) {
      // Delete from Cloudinary first
      await deleteImage(profile.company.coverImage.filename);

      // Remove from database directly without triggering validation
      profile.company.coverImage = undefined;
      await profile.save({ validateBeforeSave: false });
    }

    logger.info('Company cover image removed', {
      userId: req.user.id,
      employerProfileId: profile._id,
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
    const profile = await ensureEmployerProfile(req.user.id);

    if (profile.company.logo && profile.company.logo.filename) {
      // Delete from Cloudinary first
      await deleteImage(profile.company.logo.filename);

      // Remove from database directly without triggering validation
      profile.company.logo = undefined;
      await profile.save({ validateBeforeSave: false });
    }

    logger.info('Company logo removed', {
      userId: req.user.id,
      employerProfileId: profile._id,
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
// Chỉ trả về thông tin công ty (không bao gồm verification, businessInfo...)
const getCompanyInfo = asyncHandler(async (req, res) => {
  const profile = await ensureEmployerProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      company: profile.company,
      stats: profile.stats,
      hiring: profile.hiring,
      preferences: profile.preferences,
      status: profile.status,
    },
  });
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

  // === COMPANY VERIFICATION SYSTEM ===
  getVerificationStatus, // GET /employers/verification-status - Xem tiến độ xác thực
  getDocumentTypes, // GET /employers/document-types - Lấy danh sách loại giấy tờ cần thiết theo ngành
  updateCompanyInfo, // PUT /employers/company - Cập nhật thông tin công ty và xác thực

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
};
