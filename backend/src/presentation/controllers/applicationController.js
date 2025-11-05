const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const ApplicationResponseDTO = require('../dtos/ApplicationResponseDTO');

// Import use cases from DI container
const {
  applyForJobUseCase,
  getCandidateApplicationsUseCase,
} = require('../../infrastructure/config/diContainer');

// @desc    Apply for job
// @route   POST /api/applications
// @access  Private (Candidate)
const applyForJob = asyncHandler(async (req, res) => {
  try {
    const result = await applyForJobUseCase.execute({
      candidateId: req.user.candidateId,
      jobId: req.body.jobId,
      applicationData: req.body,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: ApplicationResponseDTO.fromApplication(result.application).toJSON(),
    });
  } catch (error) {
    if (error.message === 'CANDIDATE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy hồ sơ ứng viên',
      });
    }

    if (error.message === 'JOB_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy công việc',
      });
    }

    if (error.message === 'JOB_NOT_AVAILABLE') {
      return res.status(400).json({
        success: false,
        error: 'Công việc không khả dụng để ứng tuyển',
      });
    }

    if (error.message === 'ALREADY_APPLIED') {
      return res.status(400).json({
        success: false,
        error: 'Bạn đã ứng tuyển công việc này rồi',
      });
    }

    logger.error('Apply for job error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get candidate applications
// @route   GET /api/candidates/applications
// @access  Private (Candidate)
const getCandidateApplications = asyncHandler(async (req, res) => {
  try {
    const result = await getCandidateApplicationsUseCase.execute({
      candidateId: req.user.candidateId,
      filters: req.query,
      options: {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
      },
    });

    res.status(200).json({
      success: true,
      data: ApplicationResponseDTO.fromApplications(result.applications).map(
        dto => dto.toJSON()
      ),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get candidate applications error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get job applications
// @route   GET /api/jobs/:jobId/applications
// @access  Private (Employer)
const getJobApplications = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.getJobApplications(
      req.params.jobId,
      req.user.employerId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: ApplicationResponseDTO.fromApplications(result.applications).map(
        dto => dto.toJSON()
      ),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get job applications error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.getApplicationById(
      req.params.id,
      req.user
    );
    ApplicationResponseDTO.fomApplication(r).toJSON();

    res.status(200).json({
      success: true,
      data: result.application,
    });
  } catch (error) {
    logger.error('Get application by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.updateApplicationStatus(
      req.params.id,
      req.user.employerId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: ApplicationResponseDTO.fromApplication(result.application).toJSON(),
    });
  } catch (error) {
    logger.error('Update application status error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Candidate)
const withdrawApplication = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.withdrawApplication(
      req.params.id,
      req.user.candidateId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: ApplicationResponseDTO.fromApplication(result.application).toJSON(),
    });
  } catch (error) {
    logger.error('Withdraw application error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Mark application as viewed
// @route   PUT /api/applications/:id/view
// @access  Private (Employer)
const markApplicationAsViewed = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.markApplicationAsViewed(
      req.params.id,
      req.user.employerId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: ApplicationResponseDTO.fromApplication(result.application).toJSON(),
    });
  } catch (error) {
    logger.error('Mark application as viewed error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Add employer notes
// @route   PUT /api/applications/:id/notes
// @access  Private (Employer)
const addEmployerNotes = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.addEmployerNotes(
      req.params.id,
      req.user.employerId,
      req.body.notes
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: ApplicationResponseDTO.fromApplication(result.application).toJSON(),
    });
  } catch (error) {
    logger.error('Add employer notes error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get application stats
// @route   GET /api/applications/stats
// @access  Private
const getApplicationStats = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.getApplicationStats(req.user);

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get application stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get employer application stats
// @route   GET /api/employers/applications/stats
// @access  Private (Employer)
const getEmployerApplicationStats = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.getEmployerApplicationStats(
      req.user.employerId
    );

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get employer application stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Send notification to candidate
// @route   POST /api/applications/:id/notify
// @access  Private (Employer)
const sendApplicationNotification = asyncHandler(async (req, res) => {
  try {
    const result = await ApplicationService.sendApplicationNotification(
      req.params.id,
      req.user.employerId,
      req.body.message
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Send application notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  applyForJob,
  getCandidateApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
  sendApplicationNotification,
  markApplicationAsViewed,
  addEmployerNotes,
  getApplicationStats,
  getEmployerApplicationStats,
};
