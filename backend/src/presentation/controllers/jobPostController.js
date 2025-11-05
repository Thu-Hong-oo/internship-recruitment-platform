const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const JobResponseDTO = require('../dtos/JobResponseDTO');

// @desc    Create job post
// @route   POST /api/jobs
// @access  Private (Employer)
const createJobPost = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const createJobUseCase = req.container.resolve('createJobUseCase');

    const result = await createJobUseCase.execute({
      employerId: req.user.employerId,
      jobData: req.body,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: JobResponseDTO.fromJobPost(result.job),
    });
  } catch (error) {
    logger.error('Create job post error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get all job posts
// @route   GET /api/jobs
// @access  Public
const getAllJobPosts = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getAllJobsUseCase = req.container.resolve('getAllJobsUseCase');

    const result = await getAllJobsUseCase.execute({
      filters: req.query,
      options: {
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      },
      userRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPosts(result.jobs),
      pagination: result.pagination,
      filters: result.filters,
    });
  } catch (error) {
    logger.error('Get all job posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// @desc    Get single job post
// @route   GET /api/jobs/:id
// @access  Public
const getJobPost = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const getJobUseCase = req.container.resolve('getJobUseCase');

    const result = await getJobUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      data: JobResponseDTO.fromJobPost(result),
    });
  } catch (error) {
    logger.error('Get job post error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update job post
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
const updateJobPost = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const updateJobUseCase = req.container.resolve('updateJobUseCase');

    const result = await updateJobUseCase.execute({
      jobId: req.params.id,
      employerId: req.user.employerId,
      updateData: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: JobResponseDTO.fromJobPost(result.job),
    });
  } catch (error) {
    logger.error('Update job post error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete job post
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
const deleteJobPost = asyncHandler(async (req, res) => {
  try {
    // Get use case from Awilix container (dependency injection)
    const deleteJobUseCase = req.container.resolve('deleteJobUseCase');

    const result = await deleteJobUseCase.execute({
      jobId: req.params.id,
      employerId: req.user.employerId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete job post error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Publish job post
// @route   PUT /api/jobs/:id/publish
// @access  Private (Employer)
const publishJobPost = asyncHandler(async (req, res) => {
  // TODO: Implement publish job post functionality
  res.status(501).json({
    success: false,
    error: 'Not implemented yet',
  });
});

// @desc    Close job post
// @route   PUT /api/jobs/:id/close
// @access  Private (Employer)
const closeJobPost = asyncHandler(async (req, res) => {
  // TODO: Implement close job post functionality
  res.status(501).json({
    success: false,
    error: 'Not implemented yet',
  });
});

// @desc    Get employer's job posts
// @route   GET /api/jobs/employer
// @access  Private (Employer)
const getEmployerJobPosts = asyncHandler(async (req, res) => {
  // TODO: Implement get employer job posts functionality
  res.status(501).json({
    success: false,
    error: 'Not implemented yet',
  });
});

// @desc    Search job posts
// @route   GET /api/jobs/search
// @access  Public
const searchJobPosts = asyncHandler(async (req, res) => {
  // TODO: Implement search job posts functionality
  res.status(501).json({
    success: false,
    error: 'Not implemented yet',
  });
});

// @desc    Get job post statistics
// @route   GET /api/jobs/stats
// @access  Private (Employer)
const getJobPostStats = asyncHandler(async (req, res) => {
  // TODO: Implement get job post stats functionality
  res.status(501).json({
    success: false,
    error: 'Not implemented yet',
  });
});

module.exports = {
  createJobPost,
  getJobPostById: getJobPost,
  getAllJobPosts,
  updateJobPost,
  deleteJobPost,
  publishJobPost,
  closeJobPost,
  getEmployerJobPosts,
  searchJobPosts,
  getJobPostStats,
};
