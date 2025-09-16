const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createRoadmap,
  getRoadmap,
  updateProgress,
  getMilestones,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  getLearningResources,
  addResource,
  updateResource,
  deleteResource,
  getRoadmapAnalytics,
  generateFeedback,
  shareRoadmap
} = require('../controllers/skillRoadmapController');

// Roadmap Management
router.post('/', protect, authorize('intern'), createRoadmap);
router.get('/:id', protect, getRoadmap);
router.put('/:id/progress', protect, authorize('intern'), updateProgress);

// Milestones
router.get('/:id/milestones', protect, getMilestones);
router.post('/:id/milestones', protect, authorize(['admin', 'employer']), addMilestone);
router.put('/:id/milestones/:milestoneId', protect, authorize(['admin', 'employer']), updateMilestone);
router.delete('/:id/milestones/:milestoneId', protect, authorize(['admin', 'employer']), deleteMilestone);

// Learning Resources
router.get('/:id/resources', protect, getLearningResources);
router.post('/:id/resources', protect, authorize(['admin', 'employer']), addResource);
router.put('/:id/resources/:resourceId', protect, authorize(['admin', 'employer']), updateResource);
router.delete('/:id/resources/:resourceId', protect, authorize(['admin', 'employer']), deleteResource);

// Analytics & Feedback
router.get('/:id/analytics', protect, getRoadmapAnalytics);
router.post('/:id/feedback', protect, generateFeedback);
router.post('/:id/share', protect, authorize('intern'), shareRoadmap);

module.exports = router;