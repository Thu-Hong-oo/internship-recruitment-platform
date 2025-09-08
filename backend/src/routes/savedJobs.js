const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getSavedJobs,
  saveJob,
  removeSavedJob,
  removeSavedJobByJobId,
  checkJobSaved,
  getSavedJobsCount,
  clearAllSavedJobs,
  getSavedJobsByCategory
} = require('../controllers/savedJobController');

const router = express.Router();

// All routes are protected for candidates only
router.get('/', protect, authorize('candidate'), getSavedJobs);
router.get('/count', protect, authorize('candidate'), getSavedJobsCount);
router.get('/category/:category', protect, authorize('candidate'), getSavedJobsByCategory);
router.get('/check/:jobId', protect, authorize('candidate'), checkJobSaved);
router.post('/', protect, authorize('candidate'), saveJob);
router.delete('/', protect, authorize('candidate'), clearAllSavedJobs);
router.delete('/:id', protect, authorize('candidate'), removeSavedJob);
router.delete('/job/:jobId', protect, authorize('candidate'), removeSavedJobByJobId);

module.exports = router;
