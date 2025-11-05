const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
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
} = require('../controllers/applicationController');

// Apply authentication to all routes
router.use(protect);

// Application routes
router.route('/').post(authorize('candidate'), applyForJob);

router.route('/:id').get(getApplicationById);

router
  .route('/:id/status')
  .patch(authorize('employer'), updateApplicationStatus); // PATCH for status change

router
  .route('/:id/withdraw')
  .patch(authorize('candidate'), withdrawApplication); // PATCH for status change

router.route('/:id/view').patch(authorize('employer'), markApplicationAsViewed); // PATCH for marking viewed

router.route('/:id/notes').patch(authorize('employer'), addEmployerNotes); // PATCH for adding notes

// Candidate routes
router
  .route('/candidate')
  .get(authorize('candidate'), getCandidateApplications);

// Employer routes
router.route('/job/:jobId').get(authorize('employer'), getJobApplications);

// Stats routes
router.route('/stats').get(getApplicationStats);

router
  .route('/employer/stats')
  .get(authorize('employer'), getEmployerApplicationStats);

module.exports = router;
