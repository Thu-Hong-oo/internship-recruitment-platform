/**
 * Saved Jobs Routes
 * Presentation Layer - Supporting Domain
 * REST API routes for saved jobs functionality
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  saveJob,
  getSavedJobs,
  removeSavedJob,
  updateSavedJob,
  bulkRemoveSavedJobs,
  getSavedJobsStats,
} = require('../controllers/savedJobsController');

// Apply authentication middleware to all routes
router.use(protect);
router.use(authorize('candidate'));

// @route   POST /api/saved-jobs
// @desc    Save a job for candidate
// @access  Private (Candidate)
router.post('/', saveJob);

// @route   GET /api/saved-jobs
// @desc    Get saved jobs for candidate with filtering and pagination
// @access  Private (Candidate)
router.get('/', getSavedJobs);

// @route   GET /api/saved-jobs/stats
// @desc    Get saved jobs statistics for candidate
// @access  Private (Candidate)
router.get('/stats', getSavedJobsStats);

// @route   PATCH /api/saved-jobs/:id
// @desc    Update saved job metadata (folder, tags, notes)
// @access  Private (Candidate)
router.patch('/:id', updateSavedJob); // Changed from PUT to PATCH - partial update of metadata

// @route   DELETE /api/saved-jobs/:id
// @desc    Remove saved job
// @access  Private (Candidate)
router.delete('/:id', removeSavedJob);

// @route   DELETE /api/saved-jobs/bulk
// @desc    Remove multiple saved jobs
// @access  Private (Candidate)
router.delete('/bulk', bulkRemoveSavedJobs);

module.exports = router;
