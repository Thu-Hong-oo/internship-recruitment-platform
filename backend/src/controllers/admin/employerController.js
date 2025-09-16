const User = require('../../models/User');
const EmployerProfile = require('../../models/EmployerProfile');
const Job = require('../../models/Job');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');

// ========================================
// EMPLOYER MANAGEMENT
// ========================================

// @desc    Get all employers
// @route   GET /api/admin/employers
// @access  Private (Admin only)
const getEmployers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const startIndex = (page - 1) * limit;

  // Build filter for User collection
  const userFilter = { role: 'employer' };

  // Build search
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    userFilter.$or = [{ email: searchRegex }, { fullName: searchRegex }];
  }

  // Get users first
  const total = await User.countDocuments(userFilter);
  const users = await User.find(userFilter)
    .select('email fullName role createdAt lastActive')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get employer profiles for these users
  const userIds = users.map(user => user._id);
  const employerProfiles = await EmployerProfile.find({
    mainUserId: { $in: userIds },
  }).select('mainUserId company verification status createdAt updatedAt');

  // Create map for quick lookup
  const profileMap = new Map();
  employerProfiles.forEach(profile => {
    profileMap.set(profile.mainUserId.toString(), profile);
  });

  // Process and combine data
  const processedEmployers = users.map(user => {
    const profile = profileMap.get(user._id.toString());

    if (!profile) {
      return {
        _id: user._id,
        user: {
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          createdAt: user.createdAt,
          lastActive: user.lastActive,
        },
        profile: null,
        company: null,
        status: 'no_profile',
        verification: {
          isVerified: false,
          progress: 0,
          documentsCount: 0,
        },
      };
    }

    const documents = profile.verification?.documents || [];
    const verifiedDocs = documents.filter(doc => doc.verified);
    const steps = profile.verification?.steps || {};
    const completedSteps = Object.values(steps).filter(Boolean).length;

    return {
      _id: user._id,
      user: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
      },
      profileId: profile._id,
      company: {
        name: profile.company?.name || 'Chưa cập nhật',
        email: profile.company?.email,
        industry: profile.company?.industry,
        size: profile.company?.size,
      },
      status: profile.status,
      verification: {
        isVerified: profile.verification?.isVerified || false,
        progress: Math.round((completedSteps / 3) * 100),
        completedSteps,
        totalSteps: 3,
        documentsCount: documents.length,
        verifiedDocsCount: verifiedDocs.length,
      },
      timestamps: {
        profileCreated: profile.createdAt,
        profileUpdated: profile.updatedAt,
      },
    };
  });

  // Apply post-processing filters
  let filteredEmployers = processedEmployers;

  if (req.query.status && req.query.status !== 'all') {
    filteredEmployers = filteredEmployers.filter(
      emp => emp.status === req.query.status
    );
  }

  if (req.query.verified !== undefined) {
    const verified = req.query.verified === 'true';
    filteredEmployers = filteredEmployers.filter(
      emp => emp.verification.isVerified === verified
    );
  }

  if (req.query.industry && req.query.industry !== 'all') {
    filteredEmployers = filteredEmployers.filter(emp =>
      emp.company?.industry
        ?.toLowerCase()
        .includes(req.query.industry.toLowerCase())
    );
  }

  // Summary statistics
  const summary = {
    total: filteredEmployers.length,
    verified: filteredEmployers.filter(emp => emp.verification.isVerified)
      .length,
    pending: filteredEmployers.filter(emp => emp.status === 'pending').length,
    approved: filteredEmployers.filter(emp => emp.status === 'approved').length,
    withProfiles: filteredEmployers.filter(emp => emp.profile !== null).length,
  };

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: startIndex + limit < total,
      hasPrevPage: startIndex > 0,
    },
    summary,
    filters: {
      search: req.query.search || '',
      status: req.query.status || 'all',
      verified: req.query.verified || 'all',
      industry: req.query.industry || 'all',
    },
    data: filteredEmployers,
  });
});

// @desc    Get single employer
// @route   GET /api/admin/employers/:id
// @access  Private (Admin only)
const getEmployer = asyncHandler(async (req, res) => {
  const employer = await User.findById(req.params.id).select(
    'email fullName role createdAt employerProfile'
  );

  if (!employer || employer.role !== 'employer') {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy nhà tuyển dụng',
    });
  }

  res.status(200).json({
    success: true,
    data: employer,
  });
});

// @desc    Update employer status
// @route   PUT /api/admin/employers/:id/status
// @access  Private (Admin only)
const updateEmployerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Trạng thái không hợp lệ',
    });
  }

  const employer = await User.findById(req.params.id);

  if (!employer || employer.role !== 'employer') {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy nhà tuyển dụng',
    });
  }

  employer.status = status;
  await employer.save();

  logger.info(`Admin updated employer status: ${employer.email} to ${status}`, {
    adminId: req.user.id,
    employerId: employer._id,
  });

  res.status(200).json({
    success: true,
    data: employer,
  });
});

// @desc    Get employer's companies
// @route   GET /api/admin/employers/:id/companies
// @access  Private (Admin only)
const getEmployerCompanies = asyncHandler(async (req, res) => {
  const employer = await User.findById(req.params.id);

  if (!employer || employer.role !== 'employer') {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy nhà tuyển dụng',
    });
  }

  // Get company info from EmployerProfile - không có separate Company model
  const employerProfile = await EmployerProfile.findOne({
    mainUserId: employer._id,
  });

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy profile của nhà tuyển dụng',
    });
  }

  // Return company info from EmployerProfile.company
  const companyInfo = {
    _id: employerProfile._id, // Use EmployerProfile ID
    name: employerProfile.company.name,
    industry: employerProfile.company.industry,
    size: employerProfile.company.size,
    email: employerProfile.company.email,
    website: employerProfile.company.website,
    description: employerProfile.company.description,
    logo: employerProfile.company.logo,
    coverImage: employerProfile.company.coverImage,
    employeesCount: employerProfile.company.employeesCount,
    foundedYear: employerProfile.company.foundedYear,
    officeAddress: employerProfile.company.officeAddress,
    businessInfo: employerProfile.businessInfo,
    verification: employerProfile.verification,
    status: employerProfile.status,
    createdAt: employerProfile.createdAt,
    updatedAt: employerProfile.updatedAt,
  };

  res.status(200).json({
    success: true,
    data: [companyInfo], // Return as array for consistency
    message: 'Company info từ EmployerProfile.company',
  });
});

// @desc    Get employer's jobs
// @route   GET /api/admin/employers/:id/jobs
// @access  Private (Admin only)
const getEmployerJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const employer = await User.findById(req.params.id);

  if (!employer || employer.role !== 'employer') {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy nhà tuyển dụng',
    });
  }

  // Build filter
  const filter = { createdBy: employer._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.visibility) filter.visibility = req.query.visibility;

  // Get total count
  const total = await Job.countDocuments(filter);

  // Get jobs with pagination
  const jobs = await Job.find(filter)
    .populate('company', 'name logo')
    .populate('createdBy', 'email profile')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Calculate pagination info
  const pagination = {
    current: page,
    pages: Math.ceil(total / limit),
    total,
    limit,
  };

  res.status(200).json({
    success: true,
    data: jobs,
    pagination,
  });
});

// @desc    Search employers
// @route   GET /api/admin/employers/search
// @access  Private (Admin only)
const searchEmployers = asyncHandler(async (req, res) => {
  const { query, status, verified, industry, page = 1, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Query phải có ít nhất 2 ký tự',
    });
  }

  const searchRegex = { $regex: query.trim(), $options: 'i' };
  const filter = {
    $or: [
      { 'company.name': searchRegex },
      { 'company.email': searchRegex },
      { 'company.taxId': searchRegex },
    ],
  };

  // Apply filters
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (verified !== undefined) {
    filter['verification.isVerified'] = verified === 'true';
  }

  if (industry && industry !== 'all') {
    filter['company.industry'] = { $regex: industry, $options: 'i' };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;

  try {
    const total = await EmployerProfile.countDocuments(filter);
    const employers = await EmployerProfile.find(filter)
      .populate('mainUserId', 'email fullName phone createdAt lastActive')
      .select('company verification status createdAt updatedAt lastActive')
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    // Process results
    const processedResults = employers.map(profile => {
      const documents = profile.verification?.documents || [];
      const verifiedDocs = documents.filter(doc => doc.verified);
      const steps = profile.verification?.steps || {};
      const completedSteps = Object.values(steps).filter(Boolean).length;

      return {
        _id: profile._id,
        user: profile.mainUserId,
        company: {
          name: profile.company?.name || 'Chưa cập nhật',
          email: profile.company?.email,
          industry: profile.company?.industry,
          taxId: profile.company?.taxId,
          address: profile.company?.address,
        },
        status: profile.status,
        verification: {
          isVerified: profile.verification?.isVerified || false,
          progress: Math.round((completedSteps / 3) * 100),
          completedSteps,
          documentsUploaded: documents.length,
          documentsVerified: verifiedDocs.length,
        },
        timestamps: {
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          lastActive: profile.lastActive,
        },
        quickActions: getQuickActions(profile),
      };
    });

    res.status(200).json({
      success: true,
      query: query.trim(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasNextPage: startIndex + limitNum < total,
        hasPrevPage: startIndex > 0,
      },
      filters: {
        status: status || 'all',
        verified: verified || 'all',
        industry: industry || 'all',
      },
      results: processedResults,
    });
  } catch (error) {
    console.error('Search employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tìm kiếm nhà tuyển dụng',
      error: error.message,
    });
  }
});

// Helper function for quick actions
const getQuickActions = profile => {
  const documents = profile.verification?.documents || [];
  const steps = profile.verification?.steps || {};
  const verifiedDocs = documents.filter(doc => doc.verified);

  const actions = [];

  if (profile.status === 'pending') {
    if (documents.length > 0 && verifiedDocs.length < documents.length) {
      actions.push('review_documents');
    }
    if (verifiedDocs.length >= 2 && steps.businessInfo) {
      actions.push('approve_profile');
    }
  }

  if (profile.status === 'approved' && !profile.verification?.isVerified) {
    actions.push('verify_company');
  }

  if (documents.length === 0) {
    actions.push('request_documents');
  }

  return actions;
};

module.exports = {
  getEmployers,
  getEmployer,
  updateEmployerStatus,
  getEmployerCompanies,
  getEmployerJobs,
  searchEmployers,
};
