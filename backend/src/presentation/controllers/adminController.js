const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// @desc    Get system dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getSystemDashboard = asyncHandler(async (req, res) => {
  try {
    const getSystemDashboardUseCase = req.container.resolve('getSystemDashboardUseCase');
    const result = await getSystemDashboardUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.dashboard,
    });
  } catch (error) {
    logger.error('Get system dashboard error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const getAllUsersUseCase = req.container.resolve('getAllUsersUseCase');
    const result = await getAllUsersUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
  try {
    const getUserByIdUseCase = req.container.resolve('getUserByIdUseCase');
    const result = await getUserByIdUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
  try {
    const createUserUseCase = req.container.resolve('createUserUseCase');
    const result = await createUserUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  try {
    const updateUserUseCase = req.container.resolve('updateUserUseCase');
    const result = await updateUserUseCase.execute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = asyncHandler(async (req, res) => {
  try {
    const updateUserStatusUseCase = req.container.resolve('updateUserStatusUseCase');
    const result = await updateUserStatusUseCase.execute(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const deleteUserUseCase = req.container.resolve('deleteUserUseCase');
    const result = await deleteUserUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all employers
// @route   GET /api/admin/employers
// @access  Private (Admin)
const getAllEmployers = asyncHandler(async (req, res) => {
  try {
    const getAllEmployersUseCase = req.container.resolve('getAllEmployersUseCase');
    const result = await getAllEmployersUseCase.execute({ options: req.query });

    res.status(200).json({
      success: true,
      data: result.employers,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get all employers error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get employer by ID
// @route   GET /api/admin/employers/:id
// @access  Private (Admin)
const getEmployerById = asyncHandler(async (req, res) => {
  try {
    const getEmployerByIdUseCase = req.container.resolve('getEmployerByIdUseCase');
    const result = await getEmployerByIdUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      data: result.employer,
    });
  } catch (error) {
    logger.error('Get employer by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update employer status
// @route   PATCH /api/admin/employers/:id/status
// @access  Private (Admin)
const updateEmployerStatus = asyncHandler(async (req, res) => {
  try {
    const updateEmployerStatusUseCase = req.container.resolve('updateEmployerStatusUseCase');
    const result = await updateEmployerStatusUseCase.execute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Update employer status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all candidates
// @route   GET /api/admin/candidates
// @access  Private (Admin)
const getAllCandidates = asyncHandler(async (req, res) => {
  try {
    const getAllCandidatesUseCase = req.container.resolve('getAllCandidatesUseCase');
    const result = await getAllCandidatesUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get all candidates error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get candidate by ID
// @route   GET /api/admin/candidates/:id
// @access  Private (Admin)
const getCandidateById = asyncHandler(async (req, res) => {
  try {
    const getCandidateByIdUseCase = req.container.resolve('getCandidateByIdUseCase');
    const result = await getCandidateByIdUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      data: result.candidate,
    });
  } catch (error) {
    logger.error('Get candidate by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update candidate status
// @route   PATCH /api/admin/candidates/:id/status
// @access  Private (Admin)
const updateCandidateStatus = asyncHandler(async (req, res) => {
  try {
    const updateCandidateStatusUseCase = req.container.resolve('updateCandidateStatusUseCase');
    const result = await updateCandidateStatusUseCase.execute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.candidate,
    });
  } catch (error) {
    logger.error('Update candidate status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all companies
// @route   GET /api/admin/companies
// @access  Private (Admin)
const getAllCompanies = asyncHandler(async (req, res) => {
  try {
    const getAllCompaniesUseCase = req.container.resolve('getAllCompaniesUseCase');
    const result = await getAllCompaniesUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.companies,
    });
  } catch (error) {
    logger.error('Get all companies error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create a new company
// @route   POST /api/admin/companies
// @access  Private (Admin)
const createCompany = asyncHandler(async (req, res) => {
  try {
    const createCompanyUseCase = req.container.resolve('createCompanyUseCase');
    const result = await createCompanyUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      data: result.company,
    });
  } catch (error) {
    logger.error('Create company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update company details
// @route   PUT /api/admin/companies/:id
// @access  Private (Admin)
const updateCompany = asyncHandler(async (req, res) => {
  try {
    const updateCompanyUseCase = req.container.resolve('updateCompanyUseCase');
    const result = await updateCompanyUseCase.execute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: result.company,
    });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete a company
// @route   DELETE /api/admin/companies/:id
// @access  Private (Admin)
const deleteCompany = asyncHandler(async (req, res) => {
  try {
    const deleteCompanyUseCase = req.container.resolve('deleteCompanyUseCase');
    const result = await deleteCompanyUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete company error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all jobs
// @route   GET /api/admin/jobs
// @access  Private (Admin)
const getAllJobs = asyncHandler(async (req, res) => {
  try {
    const getAllJobsUseCase = req.container.resolve('getAllJobsUseCase');
    const result = await getAllJobsUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.jobs,
    });
  } catch (error) {
    logger.error('Get all jobs error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create a new job
// @route   POST /api/admin/jobs
// @access  Private (Admin)
const createJob = asyncHandler(async (req, res) => {
  try {
    const createJobUseCase = req.container.resolve('createJobUseCase');
    const result = await createJobUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      data: result.job,
    });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update job details
// @route   PUT /api/admin/jobs/:id
// @access  Private (Admin)
const updateJob = asyncHandler(async (req, res) => {
  try {
    const updateJobUseCase = req.container.resolve('updateJobUseCase');
    const result = await updateJobUseCase.execute(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: result.job,
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete a job
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
const deleteJob = asyncHandler(async (req, res) => {
  try {
    const deleteJobUseCase = req.container.resolve('deleteJobUseCase');
    const result = await deleteJobUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getSystemStats = asyncHandler(async (req, res) => {
  try {
    const getSystemStatsUseCase = req.container.resolve('getSystemStatsUseCase');
    const result = await getSystemStatsUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get system stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
const getSystemLogs = asyncHandler(async (req, res) => {
  try {
    const getSystemLogsUseCase = req.container.resolve('getSystemLogsUseCase');
    const result = await getSystemLogsUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get system logs error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system health
// @route   GET /api/admin/health
// @access  Private (Admin)
const getSystemHealth = asyncHandler(async (req, res) => {
  try {
    const getSystemHealthUseCase = req.container.resolve('getSystemHealthUseCase');
    const result = await getSystemHealthUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.health,
    });
  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get queue status
// @route   GET /api/admin/queues
// @access  Private (Admin)
const getQueueStatus = asyncHandler(async (req, res) => {
  try {
    const getQueueStatusUseCase = req.container.resolve('getQueueStatusUseCase');
    const result = await getQueueStatusUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.queues,
    });
  } catch (error) {
    logger.error('Get queue status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Clear queue
// @route   DELETE /api/admin/queues/:queueName
// @access  Private (Admin)
const clearQueue = asyncHandler(async (req, res) => {
  try {
    const clearQueueUseCase = req.container.resolve('clearQueueUseCase');
    const result = await clearQueueUseCase.execute(req.params.queueName);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Clear queue error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
const getSystemSettings = asyncHandler(async (req, res) => {
  try {
    const getSystemSettingsUseCase = req.container.resolve('getSystemSettingsUseCase');
    const result = await getSystemSettingsUseCase.execute();

    res.status(200).json({
      success: true,
      data: result.settings,
    });
  } catch (error) {
    logger.error('Get system settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
const updateSystemSettings = asyncHandler(async (req, res) => {
  try {
    const updateSystemSettingsUseCase = req.container.resolve('updateSystemSettingsUseCase');
    const result = await updateSystemSettingsUseCase.execute(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.settings,
    });
  } catch (error) {
    logger.error('Update system settings error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Send system notification
// @route   POST /api/admin/notifications
// @access  Private (Admin)
const sendSystemNotification = asyncHandler(async (req, res) => {
  try {
    const sendSystemNotificationUseCase = req.container.resolve('sendSystemNotificationUseCase');
    const result = await sendSystemNotificationUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.notification,
    });
  } catch (error) {
    logger.error('Send system notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getSystemReports = asyncHandler(async (req, res) => {
  try {
    const getSystemReportsUseCase = req.container.resolve('getSystemReportsUseCase');
    const result = await getSystemReportsUseCase.execute(req.query);

    res.status(200).json({
      success: true,
      data: result.reports,
    });
  } catch (error) {
    logger.error('Get system reports error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Verify employer document
// @route   PUT /api/admin/employers/:employerId/documents/:documentId/verify
// @access  Private (Admin)
const verifyEmployerDocument = asyncHandler(async (req, res) => {
  try {
    const verifyEmployerDocumentUseCase = req.container.resolve(
      'verifyEmployerDocumentUseCase'
    );

    const result = await verifyEmployerDocumentUseCase.execute({
      documentId: req.params.documentId,
      adminId: req.user.id,
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: `Document ${
        req.body.status === 'approved' ? 'approved' : 'rejected'
      } successfully`,
      data: result.document,
    });
  } catch (error) {
    logger.error('Verify employer document error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get company by ID
// @route   GET /api/admin/companies/:id
// @access  Private (Admin)
const getCompanyById = asyncHandler(async (req, res) => {
  try {
    const getCompanyByIdUseCase = req.container.resolve('getCompanyByIdUseCase');
    const companyId = req.params.id;
    const isAdmin = req.user.role === 'admin';

    // Fetch company details
    const company = await getCompanyByIdUseCase.execute(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    // Filter fields based on role
    const response = isAdmin
      ? company // Admin gets full details
      : {
          id: company.id,
          name: company.name,
          industry: company.industry,
          address: company.address,
        }; // Public view

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Get company by ID error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get job by ID
// @route   GET /api/admin/jobs/:id
// @access  Private (Admin)
const getJobById = asyncHandler(async (req, res) => {
  try {
    const getJobByIdUseCase = req.container.resolve('getJobByIdUseCase');
    const result = await getJobByIdUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      data: result.job,
    });
  } catch (error) {
    logger.error('Get job by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  getSystemDashboard,
  getAllUsers,
  getUserById,
  // createUser, // TODO: Implement createUserUseCase
  // updateUser, // TODO: Implement updateUserUseCase
  updateUserStatus,
  deleteUser,
  getAllEmployers,
  getEmployerById,
  updateEmployerStatus,
  getAllCandidates,
  getCandidateById,
  updateCandidateStatus,
  getAllCompanies,
  // createCompany, // TODO: Implement createCompanyUseCase
  getCompanyById,
  // updateCompany, // TODO: Implement updateCompanyUseCase
  // deleteCompany, // TODO: Implement deleteCompanyUseCase
  // getAllJobs, // TODO: Implement getAllJobsUseCase
  // createJob, // TODO: Implement createJobUseCase
  // updateJob, // TODO: Implement updateJobUseCase
  // deleteJob, // TODO: Implement deleteJobUseCase
  getSystemStats,
  getSystemLogs,
  getSystemHealth,
  getQueueStatus,
  clearQueue,
  getSystemSettings,
  updateSystemSettings,
  sendSystemNotification,
  getSystemReports,
  verifyEmployerDocument,
  // getJobById, // TODO: Implement getJobByIdUseCase
};
