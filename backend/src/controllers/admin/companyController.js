const EmployerProfile = require('../../models/EmployerProfile');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../utils/logger');
const mongoose = require('mongoose');
const { EMPLOYER_PROFILE_STATUS } = require('../../constants/common.constants');

// ========================================
// COMPANY MANAGEMENT (Using EmployerProfile.company)
// ========================================

/**
 * Helper function to check if a company has sufficient information
 * Returns true if company has enough basic info, false otherwise
 */
const hasSufficientCompanyInfo = (company) => {
  // Check if name is not a placeholder
  const isPlaceholderName = 
    !company.name || 
    company.name.trim() === '' || 
    company.name === 'Tên công ty' ||
    company.name.toLowerCase().includes('placeholder');

  // Check if description exists and is meaningful
  const hasDescription = 
    company.description && 
    company.description.trim() !== '' && 
    company.description.trim().length > 10;

  // Check if logo has actual URL (not just uploadedAt)
  const hasLogo = company.logo && company.logo.url;

  // Check if office address has meaningful data
  const hasAddress = 
    company.officeAddress && (
      (company.officeAddress.street && 
       company.officeAddress.street.trim() !== '' &&
       company.officeAddress.street !== 'Chưa cập nhật') ||
      (company.officeAddress.city && 
       company.officeAddress.city.trim() !== '' &&
       company.officeAddress.city !== 'Chưa cập nhật')
    );

  // Company is considered complete if it has:
  // - Non-placeholder name AND
  // - (Description OR Logo OR Address)
  return !isPlaceholderName && (hasDescription || hasLogo || hasAddress);
};

// @desc    Get all companies (admin only)
// @route   GET /api/admin/companies
// @access  Private (Admin only)
const getCompanies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const filter = {};

  // Filter by EmployerProfile status (vì company info nằm trong EmployerProfile)
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by company size
  if (req.query.size) {
    filter['company.size'] = req.query.size;
  }

  // Filter by industry
  if (req.query.industry) {
    filter['company.industry'] = { $regex: req.query.industry, $options: 'i' };
  }

  // Search by company name or description
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [
      { 'company.name': searchRegex },
      { 'company.description': searchRegex },
    ];
  }

  // Check if we should include incomplete companies
  const includeIncomplete = req.query.includeIncomplete === 'true';

  // If filtering incomplete companies, we need to fetch all matching records first,
  // then filter and paginate in memory to get accurate total count
  let employerProfiles;
  let total;
  
  if (!includeIncomplete) {
    // Fetch all matching records (without pagination) to filter properly
    const allProfiles = await EmployerProfile.find(filter)
      .populate('owner', 'email fullName')
      .select('company businessInfo verification status createdAt updatedAt')
      .sort({ createdAt: -1 });

    // Transform and filter
    let allCompanies = allProfiles.map(profile => ({
      _id: profile._id,
      name: profile.company.name,
      industry: profile.company.industry,
      size: profile.company.size,
      email: profile.company.email,
      website: profile.company.website,
      description: profile.company.description,
      logo: profile.company.logo,
      employeesCount: profile.company.employeesCount,
      foundedYear: profile.company.foundedYear,
      officeAddress: profile.company.officeAddress,
      businessInfo: profile.businessInfo,
      verification: profile.verification,
      status: profile.status,
      createdBy: profile.owner,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    // Filter out incomplete companies
    allCompanies = allCompanies.filter(company => hasSufficientCompanyInfo(company));
    
    // Calculate accurate total after filtering
    total = allCompanies.length;
    
    // Apply pagination after filtering
    const companies = allCompanies.slice(startIndex, startIndex + limit);
    
    // Pagination
    const totalPages = Math.ceil(total / limit) || 1;
    const pagination = {
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      total,
    };

    return res.status(200).json({
      success: true,
      count: companies.length,
      total,
      pagination,
      data: companies,
      message: 'Companies từ EmployerProfile.company',
    });
  } else {
    // Include incomplete companies - use normal pagination
    total = await EmployerProfile.countDocuments(filter);
    employerProfiles = await EmployerProfile.find(filter)
      .populate('owner', 'email fullName')
      .select('company businessInfo verification status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);
  }

  // Transform data to look like companies (for includeIncomplete case)
  const companies = employerProfiles.map(profile => ({
    _id: profile._id,
    name: profile.company.name,
    industry: profile.company.industry,
    size: profile.company.size,
    email: profile.company.email,
    website: profile.company.website,
    description: profile.company.description,
    logo: profile.company.logo,
    employeesCount: profile.company.employeesCount,
    foundedYear: profile.company.foundedYear,
    officeAddress: profile.company.officeAddress,
    businessInfo: profile.businessInfo,
    verification: profile.verification,
    status: profile.status,
    createdBy: profile.owner,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }));

  // Pagination (for includeIncomplete case)
  const totalPages = Math.ceil(total / limit) || 1;
  const pagination = {
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    total,
  };

  res.status(200).json({
    success: true,
    count: companies.length,
    total,
    pagination,
    data: companies,
    message: 'Companies từ EmployerProfile.company',
  });
});

// @desc    Get single company (admin only)
// @route   GET /api/admin/companies/:id
// @access  Private (Admin only)
const getCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'EmployerProfile ID không hợp lệ',
    });
  }

  const employerProfile = await EmployerProfile.findById(id)
    .populate('owner', 'email fullName phone')
    .populate('verification.documents.verifiedBy', 'fullName email');

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  // Transform to company format
  const company = {
    _id: employerProfile._id,
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
    legalRepresentative: employerProfile.legalRepresentative,
    contact: employerProfile.contact,
    verification: employerProfile.verification,
    status: employerProfile.status,
    stats: employerProfile.stats,
    createdBy: employerProfile.owner,
    createdAt: employerProfile.createdAt,
    updatedAt: employerProfile.updatedAt,
  };

  res.status(200).json({
    success: true,
    data: company,
    message: 'Company details từ EmployerProfile',
  });
});

// @desc    Update company (admin only)
// @route   PUT /api/admin/companies/:id
// @access  Private (Admin only)
const updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'EmployerProfile ID không hợp lệ',
    });
  }

  // Build update object for nested company fields
  const update = {};

  // Update company fields
  if (updateData.name) update['company.name'] = updateData.name;
  if (updateData.industry) update['company.industry'] = updateData.industry;
  if (updateData.size) update['company.size'] = updateData.size;
  if (updateData.email) update['company.email'] = updateData.email;
  if (updateData.website) update['company.website'] = updateData.website;
  if (updateData.description)
    update['company.description'] = updateData.description;
  if (updateData.employeesCount)
    update['company.employeesCount'] = updateData.employeesCount;
  if (updateData.foundedYear)
    update['company.foundedYear'] = updateData.foundedYear;

  // Update business info if provided
  if (updateData.businessInfo) {
    Object.keys(updateData.businessInfo).forEach(key => {
      update[`businessInfo.${key}`] = updateData.businessInfo[key];
    });
  }

  const employerProfile = await EmployerProfile.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).populate('owner', 'email fullName');

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  logger.info('Admin updated company info', {
    adminId: req.user.id,
    employerProfileId: id,
    companyName: employerProfile.company.name,
  });

  res.status(200).json({
    success: true,
    data: {
      _id: employerProfile._id,
      company: employerProfile.company,
      businessInfo: employerProfile.businessInfo,
      status: employerProfile.status,
      updatedAt: employerProfile.updatedAt,
    },
    message: 'Cập nhật thông tin company thành công',
  });
});

// @desc    Delete company (admin only)
// @route   DELETE /api/admin/companies/:id
// @access  Private (Admin only)
const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'EmployerProfile ID không hợp lệ',
    });
  }

  const employerProfile = await EmployerProfile.findById(id);

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  // Check if employer has active jobs
  const activeJobs = await Job.find({
    createdBy: employerProfile.owner,
    status: { $in: ['active', 'draft'] },
  });

  if (activeJobs.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Không thể xóa company có jobs đang active',
      activeJobsCount: activeJobs.length,
    });
  }

  await employerProfile.remove();

  logger.info('Admin deleted employer profile/company', {
    adminId: req.user.id,
    employerProfileId: id,
    companyName: employerProfile.company.name,
  });

  res.status(200).json({
    success: true,
    message: 'Đã xóa employer profile/company thành công',
    data: {},
  });
});

// @desc    Get company's jobs (admin only)
// @route   GET /api/admin/companies/:id/jobs
// @access  Private (Admin only)
const getCompanyJobs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'EmployerProfile ID không hợp lệ',
    });
  }

  const employerProfile = await EmployerProfile.findById(id);

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  // Build filter for jobs
  const filter = { createdBy: employerProfile.owner };
  if (req.query.status) filter.status = req.query.status;

  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .populate('createdBy', 'email fullName')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNextPage: startIndex + limit < total,
    hasPrevPage: startIndex > 0,
    total,
  };

  res.status(200).json({
    success: true,
    pagination,
    data: jobs,
    company: {
      _id: employerProfile._id,
      name: employerProfile.company.name,
      industry: employerProfile.company.industry,
    },
    message: 'Jobs của company từ EmployerProfile',
  });
});

// @desc    Get company's applications (admin only)
// @route   GET /api/admin/companies/:id/applications
// @access  Private (Admin only)
const getCompanyApplications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'EmployerProfile ID không hợp lệ',
    });
  }

  const employerProfile = await EmployerProfile.findById(id);

  if (!employerProfile) {
    return res.status(404).json({
      success: false,
      error: 'Không tìm thấy employer profile',
    });
  }

  // Get all jobs of this employer first
  const jobs = await Job.find({ createdBy: employerProfile.owner }).select(
    '_id'
  );
  const jobIds = jobs.map(job => job._id);

  // Build filter for applications
  const filter = { jobId: { $in: jobIds } };
  if (req.query.status) filter.status = req.query.status;

  const total = await Application.countDocuments(filter);
  const applications = await Application.find(filter)
    .populate('userId', 'email fullName')
    .populate('jobId', 'title status')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNextPage: startIndex + limit < total,
    hasPrevPage: startIndex > 0,
    total,
  };

  res.status(200).json({
    success: true,
    pagination,
    data: applications,
    company: {
      _id: employerProfile._id,
      name: employerProfile.company.name,
      industry: employerProfile.company.industry,
      totalJobs: jobIds.length,
    },
    message: 'Applications cho jobs của company từ EmployerProfile',
  });
});

// @desc    Update company status (admin only)
// @route   PUT /api/admin/companies/:id/status
// @access  Private (Admin only)
const updateCompanyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // must be one of EMPLOYER_PROFILE_STATUS

  const allowed = Object.values(EMPLOYER_PROFILE_STATUS);
  if (!allowed.includes(status)) {
    return res
      .status(400)
      .json({ success: false, error: 'Trạng thái công ty không hợp lệ' });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, error: 'EmployerProfile ID không hợp lệ' });
  }

  // Cập nhật status của EmployerProfile, không phải Company model riêng biệt
  const employerProfile = await EmployerProfile.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).populate('owner', 'email fullName');

  if (!employerProfile) {
    return res
      .status(404)
      .json({ success: false, error: 'Không tìm thấy employer profile' });
  }

  logger.info('Admin updated employer profile status', {
    adminId: req.user.id,
    employerProfileId: id,
    companyName: employerProfile.company.name,
    status,
  });

  res.status(200).json({
    success: true,
    data: {
      _id: employerProfile._id,
      company: employerProfile.company,
      status: employerProfile.status,
      user: employerProfile.owner,
    },
    message: 'Cập nhật trạng thái employer profile thành công',
  });
});

module.exports = {
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getCompanyApplications,
  updateCompanyStatus,
};
