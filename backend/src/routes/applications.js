const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUserApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus,
  getEmployerApplications
} = require('../controllers/applicationController');

const router = express.Router();

// Protected routes for candidates
router.get('/', protect, authorize('candidate'), getUserApplications);
router.get('/employer', protect, authorize('employer'), getEmployerApplications);
router.get('/:id', protect, getApplication);
router.post('/', protect, authorize('candidate'), createApplication);
router.put('/:id', protect, authorize('candidate'), updateApplication);
router.delete('/:id', protect, authorize('candidate'), deleteApplication);

// Protected routes for employers
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus);

module.exports = router;
