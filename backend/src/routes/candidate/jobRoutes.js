const express = require('express');
const router = express.Router();
const JobController = require('../../controllers/candidate/JobController');

const jobController = new JobController();

// GET /api/candidates/jobs - Unified search for jobs (all, saved, following)
router.get('/', jobController.getJobs);

// POST /api/candidates/jobs/:id/action - Perform actions on a job (save, unsave, apply)
router.post('/:id/action', jobController.handleJobAction);

module.exports = router;
