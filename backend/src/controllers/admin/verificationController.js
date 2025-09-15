const EmployerProfile = require('../../models/EmployerProfile');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');
const mongoose = require('mongoose');
const { EMPLOYER_PROFILE_STATUS } = require('../../constants/common.constants');

// ========================================
// EMPLOYER VERIFICATION
// ========================================

// @desc    Get all pending verifications
// @route   GET /api/admin/verifications
// @access  Private (Admin only)
const getPendingVerifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  // Build filter
  const filter = { status: 'pending' };

  if (req.query.industry) {
    filter['company.industry'] = { $regex: req.query.industry, $options: 'i' };
  }

  if (req.query.hasDocuments === 'true') {
    filter['verification.documents.0'] = { $exists: true };
  }

  if (req.query.verified === 'false') {
    filter['verification.isVerified'] = false;
  }

  // Search by company name or email
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [{ 'company.name': searchRegex }];
  }

  const total = await EmployerProfile.countDocuments(filter);
  const verifications = await EmployerProfile.find(filter)
    .populate('mainUserId', 'email fullName phone createdAt')
    .select('company verification status createdAt updatedAt')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Enhanced data processing
  const processedData = verifications.map(profile => {
    const documents = profile.verification?.documents || [];
    const verifiedDocs = documents.filter(doc => doc.verified === true);
    const steps = profile.verification?.steps || {};

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const progressPercentage = Math.round((completedSteps / 3) * 100);

    return {
      _id: profile._id,
      user: profile.mainUserId,
      company: {
        name: profile.company?.name || 'Chưa cập nhật',
        industry: profile.company?.industry || 'unknown',
        email: profile.company?.email,
      },
      status: profile.status,
      verification: {
        progress: progressPercentage,
        completedSteps,
        totalSteps: 3,
        documentsCount: documents.length,
        verifiedDocsCount: verifiedDocs.length,
        hasAllRequiredDocs:
          documents.some(d => d.documentType === 'business-license') &&
          documents.some(d => d.documentType === 'tax-certificate'),
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,

      // Quick action indicators
      actionNeeded: {
        hasDocuments: documents.length > 0,
        pendingDocs: documents.length - verifiedDocs.length,
        canApprove: verifiedDocs.length >= 2 && steps.businessInfo,
        priority: getPriority(profile.createdAt, documents.length),
      },
    };
  });

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: startIndex + limit < total,
      hasPrevPage: startIndex > 0,
      total,
    },
    summary: {
      totalPending: total,
      withDocuments: processedData.filter(p => p.actionNeeded.hasDocuments)
        .length,
      readyToApprove: processedData.filter(p => p.actionNeeded.canApprove)
        .length,
      highPriority: processedData.filter(
        p => p.actionNeeded.priority === 'high'
      ).length,
    },
    data: processedData,
  });
});

// @desc    Get employer verification details
// @route   GET /api/admin/verifications/:id
// @access  Private (Admin only)
const getEmployerVerificationDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'ID không hợp lệ',
    });
  }

  // TÌM BẰNG USER ID thay vì EmployerProfile ID để thống nhất
  const employerProfile = await EmployerProfile.findOne({ mainUserId: id })
    .populate('mainUserId', 'email fullName phone')
    .populate('verification.documents.verifiedBy', 'fullName email')
    .populate('verification.adminNotes.addedBy', 'fullName email');

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile cho user này',
    });
  }

  // Calculate verification progress
  const steps = employerProfile.verification.steps;
  const completedSteps = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Document analysis
  const documents = employerProfile.verification.documents || [];
  const verifiedDocs = documents.filter(doc => doc.verified === true);
  const pendingDocs = documents.filter(doc => doc.verified === false);

  // Required documents check
  const requiredDocTypes = ['business-license', 'tax-certificate'];
  const missingDocTypes = requiredDocTypes.filter(
    docType => !documents.some(doc => doc.documentType === docType)
  );

  res.status(200).json({
    success: true,
    data: {
      // Basic info
      _id: employerProfile._id,
      user: employerProfile.mainUserId,
      status: employerProfile.status,
      createdAt: employerProfile.createdAt,
      updatedAt: employerProfile.updatedAt,

      // Company information
      company: employerProfile.company,
      businessInfo: employerProfile.businessInfo,
      legalRepresentative: employerProfile.legalRepresentative,
      contact: employerProfile.contact,

      // Verification details
      verification: {
        isVerified: employerProfile.verification.isVerified,
        steps: steps,
        progress: {
          percentage: progressPercentage,
          completedSteps,
          totalSteps,
        },
        documents: {
          total: documents.length,
          verified: verifiedDocs.length,
          pending: pendingDocs.length,
          missing: missingDocTypes,
          list: documents.map(doc => ({
            _id: doc._id,
            documentType: doc.documentType,
            url: doc.url,
            verified: doc.verified,
            uploadedAt: doc.uploadedAt,
            verifiedAt: doc.verifiedAt,
            verifiedBy: doc.verifiedBy,
            rejectionReason: doc.rejectionReason,
            metadata: doc.metadata,
          })),
        },
        adminNotes: employerProfile.verification.adminNotes || [],
      },

      // Quick actions for admin
      quickActions: {
        canApprove: verifiedDocs.length >= 2 && steps.businessInfo,
        canReject: true,
        pendingDocuments: pendingDocs.map(doc => ({
          _id: doc._id,
          documentType: doc.documentType,
          verifyEndpoint: `/admin/employers/${employerProfile.mainUserId._id}/documents/${doc._id}/verify`,
        })),
      },
    },
  });
});

// @desc    Verify employer
// @route   PUT /api/admin/verifications/:id
// @access  Private (Admin only)
const verifyEmployer = asyncHandler(async (req, res) => {
  const { action, reason, notes } = req.body; // action: 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Action không hợp lệ. Chỉ chấp nhận "approve" hoặc "reject"',
    });
  }

  const employerProfile = await EmployerProfile.findOne({
    mainUserId: req.params.id,
  }).populate('mainUserId', 'email fullName');

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile cho user này',
    });
  }

  // Add admin notes if provided
  if (notes) {
    if (!employerProfile.verification.adminNotes) {
      employerProfile.verification.adminNotes = [];
    }
    employerProfile.verification.adminNotes.push({
      note: notes,
      addedBy: req.user.id,
      addedAt: new Date(),
    });
  }

  if (action === 'approve') {
    // Check if all verification requirements are met
    const steps = employerProfile.verification.steps || {};
    const documents = employerProfile.verification.documents || [];

    // Required: businessInfo, business-license, tax-certificate
    const hasBusinessInfo = steps.businessInfo;
    const hasBusinessLicense = documents.find(
      d => d.documentType === 'business-license' && d.verified
    );
    const hasTaxCertificate = documents.find(
      d => d.documentType === 'tax-certificate' && d.verified
    );

    const missingRequirements = [];
    if (!hasBusinessInfo) missingRequirements.push('Thông tin doanh nghiệp');
    if (!hasBusinessLicense)
      missingRequirements.push('Giấy phép kinh doanh đã xác thực');
    if (!hasTaxCertificate)
      missingRequirements.push('Giấy chứng nhận thuế đã xác thực');

    if (missingRequirements.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Chưa đủ điều kiện để duyệt',
        missing: missingRequirements,
        currentStatus: {
          businessInfo: hasBusinessInfo,
          businessLicense: !!hasBusinessLicense,
          taxCertificate: !!hasTaxCertificate,
        },
      });
    }

    // Approve the profile
    employerProfile.verification.isVerified = true;
    employerProfile.verification.verifiedAt = new Date();
    employerProfile.verification.verifiedBy = req.user.id;
    employerProfile.status = EMPLOYER_PROFILE_STATUS.VERIFIED;

    logger.info(
      `Admin approved employer: ${employerProfile.mainUserId.email}`,
      {
        adminId: req.user.id,
        employerId: employerProfile._id,
        notes: !!notes,
      }
    );
  } else {
    // Reject the profile
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Phải cung cấp lý do từ chối',
      });
    }

    employerProfile.status = EMPLOYER_PROFILE_STATUS.REJECTED;
    employerProfile.verification.rejectionReason = reason;
    employerProfile.verification.rejectedAt = new Date();
    employerProfile.verification.rejectedBy = req.user.id;

    logger.warn(
      `Admin rejected employer: ${employerProfile.mainUserId.email}`,
      {
        adminId: req.user.id,
        employerId: employerProfile._id,
        reason,
      }
    );
  }

  await employerProfile.save();

  res.status(200).json({
    success: true,
    message: `Đã ${
      action === 'approve' ? 'duyệt' : 'từ chối'
    } hồ sơ nhà tuyển dụng`,
    data: {
      _id: employerProfile._id,
      user: employerProfile.mainUserId,
      status: employerProfile.status,
      verification: {
        isVerified: employerProfile.verification.isVerified,
        verifiedAt: employerProfile.verification.verifiedAt,
        verifiedBy: employerProfile.verification.verifiedBy,
        rejectionReason: employerProfile.verification.rejectionReason,
        rejectedAt: employerProfile.verification.rejectedAt,
      },
      action: action,
    },
  });
});

// @desc    Verify single employer document
// @route   PUT /api/admin/employers/:employerId/documents/:documentId/verify
// @access  Private (Admin only)
const verifyEmployerDocument = asyncHandler(async (req, res) => {
  const { employerId, documentId } = req.params;
  const { verified, rejectionReason, notes } = req.body;

  const employerProfile = await EmployerProfile.findOne({
    mainUserId: employerId,
  });

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  const document = employerProfile.verification.documents.id(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy tài liệu',
    });
  }

  // Update document verification status
  document.verified = verified === true;
  document.verifiedBy = req.user.id;
  document.verifiedAt = new Date();

  if (!verified && rejectionReason) {
    document.rejectionReason = rejectionReason;
  }

  // Add admin notes if provided
  if (notes) {
    employerProfile.verification.adminNotes.push({
      note: `Document ${document.documentType}: ${notes}`,
      addedBy: req.user.id,
      addedAt: new Date(),
    });
  }

  // Check if all required documents are verified
  const requiredDocuments = ['business-license', 'tax-certificate'];
  const allRequiredVerified = requiredDocuments.every(docType => {
    const doc = employerProfile.verification.documents.find(
      d => d.documentType === docType
    );
    return doc && doc.verified === true;
  });

  // Auto-approve if all documents are verified and business info is complete
  if (allRequiredVerified && employerProfile.verification.steps.businessInfo) {
    employerProfile.verification.steps.adminApproved = true;
    employerProfile.verification.isVerified = true;
    employerProfile.status = 'verified';

    logger.info('Employer auto-approved after all documents verified', {
      employerId,
      adminId: req.user.id,
    });
  }

  await employerProfile.save();

  logger.info('Document verification updated', {
    employerId,
    documentId,
    documentType: document.documentType,
    verified,
    adminId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: verified ? 'Tài liệu đã được xác thực' : 'Tài liệu đã bị từ chối',
    data: {
      document: {
        _id: document._id,
        documentType: document.documentType,
        verified: document.verified,
        verifiedAt: document.verifiedAt,
        rejectionReason: document.rejectionReason,
      },
      isFullyVerified: employerProfile.verification.isVerified,
      status: employerProfile.status,
    },
  });
});

// Helper function for priority calculation
const getPriority = (createdAt, docsCount) => {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24)
  );

  if (docsCount >= 2 && daysSinceCreation >= 3) return 'high';
  if (docsCount >= 1 && daysSinceCreation >= 7) return 'medium';
  return 'low';
};

module.exports = {
  getPendingVerifications,
  getEmployerVerificationDetails,
  verifyEmployer,
  verifyEmployerDocument,
};
