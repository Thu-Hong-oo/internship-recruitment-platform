const EmployerProfile = require('../models/EmployerProfile');
const { EMPLOYER_PROFILE_STATUS } = require('../constants/common.constants');
const { logger } = require('../utils/logger');

/**
 * Middleware kiểm tra employer đã verified chưa
 * Chỉ cho phép employer đã được xác thực thực hiện các hành động quan trọng
 */
const requireVerifiedEmployer = async (req, res, next) => {
  try {
    // Chỉ áp dụng cho role employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ dành cho employer',
      });
    }

    // Tìm employer profile
    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message:
          'Không tìm thấy hồ sơ employer. Vui lòng hoàn thiện thông tin.',
        needsProfile: true,
      });
    }

    // Kiểm tra verification status
    if (
      !employerProfile.verification?.isVerified &&
      employerProfile.status !== EMPLOYER_PROFILE_STATUS.VERIFIED
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Tài khoản employer chưa được xác thực. Vui lòng hoàn thành quy trình xác thực doanh nghiệp.',
        verificationStatus: {
          isVerified: employerProfile.verification?.isVerified || false,
          status: employerProfile.status,
          steps: employerProfile.verification?.steps || {},
          missingDocuments: getMissingDocuments(employerProfile),
          nextSteps: getNextVerificationSteps(employerProfile),
        },
      });
    }

    // Attach employer profile to request for later use
    req.employerProfile = employerProfile;
    next();
  } catch (error) {
    logger.error('Error in requireVerifiedEmployer middleware:', {
      error: error.message,
      userId: req.user?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái xác thực',
    });
  }
};

/**
 * Middleware kiểm tra employer có profile hoàn chỉnh chưa
 * Ít strict hơn requireVerifiedEmployer, chỉ cần có profile cơ bản
 */
const requireEmployerProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ dành cho employer',
      });
    }

    const employerProfile = await EmployerProfile.findOne({
      owner: req.user.id,
    });

    if (!employerProfile) {
      return res.status(400).json({
        success: false,
        message:
          'Không tìm thấy hồ sơ employer. Vui lòng hoàn thiện thông tin cơ bản trước.',
        needsProfile: true,
        setupUrl: '/employers/company',
      });
    }

    req.employerProfile = employerProfile;
    next();
  } catch (error) {
    logger.error('Error in requireEmployerProfile middleware:', {
      error: error.message,
      userId: req.user?.id,
    });
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra hồ sơ employer',
    });
  }
};

/**
 * Helper function: Lấy danh sách documents còn thiếu
 */
function getMissingDocuments(employerProfile) {
  const requiredDocs = ['business-license', 'tax-certificate'];
  const uploadedDocs = employerProfile.verification?.documents || [];

  return requiredDocs.filter(
    docType => !uploadedDocs.some(doc => doc.documentType === docType)
  );
}

/**
 * Helper function: Lấy các bước tiếp theo cần làm
 */
function getNextVerificationSteps(employerProfile) {
  const steps = [];

  // Kiểm tra business info
  if (!employerProfile.verification?.steps?.businessInfo) {
    steps.push({
      step: 'businessInfo',
      title: 'Hoàn thiện thông tin doanh nghiệp',
      description: 'Cập nhật đầy đủ thông tin công ty, đại diện pháp luật',
      endpoint: 'PUT /employers/company',
      priority: 'high',
    });
  }

  // Kiểm tra documents
  const missingDocs = getMissingDocuments(employerProfile);
  missingDocs.forEach(docType => {
    if (docType === 'business-license') {
      steps.push({
        step: 'upload-business-license',
        title: 'Upload giấy phép kinh doanh',
        description: 'Tải lên giấy phép kinh doanh hợp lệ',
        endpoint: 'POST /employers/documents/business-license',
        priority: 'high',
      });
    }
    if (docType === 'tax-certificate') {
      steps.push({
        step: 'upload-tax-certificate',
        title: 'Upload giấy chứng nhận thuế',
        description: 'Tải lên giấy chứng nhận đăng ký thuế',
        endpoint: 'POST /employers/documents/tax-certificate',
        priority: 'high',
      });
    }
  });

  // Nếu đã upload hết documents nhưng chưa verified
  if (steps.length === 0 && !employerProfile.verification?.isVerified) {
    steps.push({
      step: 'wait-verification',
      title: 'Chờ admin xác thực',
      description: 'Hồ sơ đang được admin xem xét và xác thực',
      endpoint: 'GET /employers/verification-status',
      priority: 'info',
    });
  }

  return steps;
}

module.exports = {
  requireVerifiedEmployer,
  requireEmployerProfile,
  getMissingDocuments,
  getNextVerificationSteps,
};
