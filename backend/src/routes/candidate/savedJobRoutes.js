const express = require('express');
const router = express.Router();
const {
  getSavedJobs,
  saveJob,
  removeSavedJob,
  removeSavedJobByJobId,
  checkJobSaved,
  getSavedJobsCount,
  clearAllSavedJobs,
} = require('../../controllers/savedJobController');

// These routes are already protected by the parent router

router.get('/', getSavedJobs);
router.post('/', saveJob);
router.delete('/', clearAllSavedJobs);
router.get('/count', getSavedJobsCount);
router.get('/check/:jobId', checkJobSaved);
router.delete('/:id', removeSavedJob);
router.delete('/job/:jobId', removeSavedJobByJobId);

module.exports = router;
