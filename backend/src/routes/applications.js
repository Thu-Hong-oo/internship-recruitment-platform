const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getApplication,
  updateApplicationStatus,
  scheduleInterview,
  submitFeedback,
  getApplicationTimeline,
  withdrawApplication,
  addInterviewFeedback,
  uploadAttachment,
  getApplicationAnalytics,
  bulkUpdateStatus
} = require('../controllers/applicationController');

// Application Management
router.get('/:id', protect, getApplication);
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus);
router.post('/:id/withdraw', protect, authorize('intern'), withdrawApplication);

// Interview Process
router.post('/:id/interview', protect, authorize('employer'), scheduleInterview);
router.post('/:id/interview/feedback', protect, authorize('employer'), addInterviewFeedback);

// Feedback & Timeline
router.post('/:id/feedback', protect, submitFeedback);
router.get('/:id/timeline', protect, getApplicationTimeline);

// Attachments
router.post('/:id/attachments', protect, uploadAttachment);

// Analytics
router.get('/:id/analytics', protect, authorize('employer'), getApplicationAnalytics);

// Bulk Operations (Admin/Employer only)
router.put('/bulk/status', protect, authorize(['admin', 'employer']), bulkUpdateStatus);

module.exports = router;
