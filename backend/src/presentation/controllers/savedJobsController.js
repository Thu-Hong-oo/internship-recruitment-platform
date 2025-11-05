/**
 * Saved Jobs Controller
 * Presentation Layer - Supporting Domain
 * REST API endpoints for saved jobs functionality
 */
const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// Import use cases
const SaveJobUseCase = require('../../application/supporting/use-cases/SaveJobUseCase');
const GetSavedJobsUseCase = require('../../application/supporting/use-cases/GetSavedJobsUseCase');
const RemoveSavedJobUseCase = require('../../application/supporting/use-cases/RemoveSavedJobUseCase');
const UpdateSavedJobUseCase = require('../../application/supporting/use-cases/UpdateSavedJobUseCase');

// Import repositories
const SavedJobRepository = require('../../infrastructure/repositories/SavedJobRepository');
const JobRepository = require('../../infrastructure/repositories/JobRepository');
const CandidateRepository = require('../../infrastructure/repositories/CandidateRepository');

// Initialize dependencies
const savedJobRepository = new SavedJobRepository();
const jobRepository = new JobRepository();
const candidateRepository = new CandidateRepository();

// Initialize use cases
const saveJobUseCase = new SaveJobUseCase({
  savedJobRepository,
  jobRepository,
  candidateRepository,
});

const getSavedJobsUseCase = new GetSavedJobsUseCase({
  savedJobRepository,
  jobRepository,
  candidateRepository,
});

const removeSavedJobUseCase = new RemoveSavedJobUseCase({
  savedJobRepository,
  jobRepository,
  candidateRepository,
});

const updateSavedJobUseCase = new UpdateSavedJobUseCase({
  savedJobRepository,
  jobRepository,
  candidateRepository,
});

// @desc    Save a job for candidate
// @route   POST /api/saved-jobs
// @access  Private (Candidate)
const saveJob = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.candidateProfile._id;
    const { jobId, folder, tags, notes } = req.body;

    const result = await saveJobUseCase.execute({
      candidateId,
      jobId,
      folder,
      tags,
      notes,
    });

    logger.info(`Job saved successfully for candidate ${candidateId}`, {
      jobId,
      folder,
      candidateId,
    });

    res.status(201).json({
      success: true,
      message: 'Job saved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error saving job:', {
      error: error.message,
      candidateId: req.user.candidateProfile._id,
      jobId: req.body.jobId,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to save job',
    });
  }
});

// @desc    Get saved jobs for candidate
// @route   GET /api/saved-jobs
// @access  Private (Candidate)
const getSavedJobs = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.candidateProfile._id;
    const {
      page = 1,
      limit = 10,
      folder,
      tags,
      includeExpired = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      groupBy,
    } = req.query;

    const result = await getSavedJobsUseCase.execute({
      candidateId,
      page: parseInt(page),
      limit: parseInt(limit),
      folder,
      tags: tags ? tags.split(',') : undefined,
      includeExpired: includeExpired === 'true',
      sortBy,
      sortOrder,
      groupBy,
    });

    logger.info(`Retrieved saved jobs for candidate ${candidateId}`, {
      candidateId,
      page,
      limit,
      totalCount: result.pagination.total,
    });

    res.status(200).json({
      success: true,
      message: 'Saved jobs retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error retrieving saved jobs:', {
      error: error.message,
      candidateId: req.user.candidateProfile._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to retrieve saved jobs',
    });
  }
});

// @desc    Remove saved job
// @route   DELETE /api/saved-jobs/:id
// @access  Private (Candidate)
const removeSavedJob = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.candidateProfile._id;
    const { id: savedJobId } = req.params;

    const result = await removeSavedJobUseCase.execute({
      candidateId,
      savedJobId,
    });

    logger.info(`Saved job removed successfully`, {
      savedJobId,
      candidateId,
    });

    res.status(200).json({
      success: true,
      message: 'Saved job removed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error removing saved job:', {
      error: error.message,
      savedJobId: req.params.id,
      candidateId: req.user.candidateProfile._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to remove saved job',
    });
  }
});

// @desc    Update saved job metadata
// @route   PUT /api/saved-jobs/:id
// @access  Private (Candidate)
const updateSavedJob = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.candidateProfile._id;
    const { id: savedJobId } = req.params;
    const { folder, tags, notes } = req.body;

    const result = await updateSavedJobUseCase.execute({
      candidateId,
      savedJobId,
      folder,
      tags,
      notes,
    });

    logger.info(`Saved job updated successfully`, {
      savedJobId,
      candidateId,
    });

    res.status(200).json({
      success: true,
      message: 'Saved job updated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error updating saved job:', {
      error: error.message,
      savedJobId: req.params.id,
      candidateId: req.user.candidateProfile._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to update saved job',
    });
  }
});

// @desc    Remove multiple saved jobs
// @route   DELETE /api/saved-jobs/bulk
// @access  Private (Candidate)
const bulkRemoveSavedJobs = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.candidateProfile._id;
    const { jobIds, folder } = req.body;

    const result = await removeSavedJobUseCase.execute({
      candidateId,
      jobIds,
      folder,
    });

    logger.info(`Bulk saved jobs removed successfully`, {
      candidateId,
      removedCount: result.removedCount,
    });

    res.status(200).json({
      success: true,
      message: 'Saved jobs removed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error bulk removing saved jobs:', {
      error: error.message,
      candidateId: req.user.candidateProfile._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to remove saved jobs',
    });
  }
});

// @desc    Get saved jobs statistics
// @route   GET /api/saved-jobs/stats
// @access  Private (Candidate)
const getSavedJobsStats = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.candidateProfile._id;

    const result = await getSavedJobsUseCase.execute({
      candidateId,
      statsOnly: true,
    });

    logger.info(`Retrieved saved jobs stats for candidate ${candidateId}`, {
      candidateId,
      totalSavedJobs: result.stats.totalSavedJobs,
    });

    res.status(200).json({
      success: true,
      message: 'Saved jobs statistics retrieved successfully',
      data: result.stats,
    });
  } catch (error) {
    logger.error('Error retrieving saved jobs statistics:', {
      error: error.message,
      candidateId: req.user.candidateProfile._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to retrieve saved jobs statistics',
    });
  }
});

module.exports = {
  saveJob,
  getSavedJobs,
  removeSavedJob,
  updateSavedJob,
  bulkRemoveSavedJobs,
  getSavedJobsStats,
};
