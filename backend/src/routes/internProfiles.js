const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  uploadCV,
  getApplications,
  getSavedJobs,
  getRecommendedJobs,
  getSkillRoadmap,
  updateSkillProgress,
  verifySkill,
  endorseSkill,
  addProject,
  updateProject,
  deleteProject,
  addCertification,
  updateCertification,
  deleteCertification
} = require('../controllers/internProfileController');

// Profile management
router.get('/profile', protect, authorize('intern'), getProfile);
router.put('/profile', protect, authorize('intern'), updateProfile);
router.post('/cv', protect, authorize('intern'), uploadMiddleware.single('cv'), uploadCV);

// Applications & Jobs
router.get('/applications', protect, authorize('intern'), getApplications);
router.get('/saved-jobs', protect, authorize('intern'), getSavedJobs);
router.get('/recommended-jobs', protect, authorize('intern'), getRecommendedJobs);

// Skills & Learning
router.get('/roadmap', protect, authorize('intern'), getSkillRoadmap);
router.put('/roadmap/:skillId/progress', protect, authorize('intern'), updateSkillProgress);
router.post('/skills/:skillId/verify', protect, authorize('intern'), verifySkill);
router.post('/skills/:skillId/endorse', protect, authorize('intern'), endorseSkill);

// Projects
router.post('/projects', protect, authorize('intern'), addProject);
router.put('/projects/:projectId', protect, authorize('intern'), updateProject);
router.delete('/projects/:projectId', protect, authorize('intern'), deleteProject);

// Certifications
router.post('/certifications', protect, authorize('intern'), addCertification);
router.put('/certifications/:certId', protect, authorize('intern'), updateCertification);
router.delete('/certifications/:certId', protect, authorize('intern'), deleteCertification);

module.exports = router;