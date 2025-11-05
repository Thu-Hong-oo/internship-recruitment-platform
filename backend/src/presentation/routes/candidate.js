const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  createProfile,
  getProfile,
  updateProfile,
  uploadCV,
  getCVs,
  setDefaultCV,
  deleteCV,
  analyzeCV,
  addEducation,
  addExperience,
  updateSkills,
  getProfileCompleteness,
  getCandidateStats,
} = require('../controllers/candidateController');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('candidate'));

// Profile routes
router.route('/profile').post(createProfile).get(getProfile).put(updateProfile);

// CV routes
router.route('/cv').post(upload.upload.single('cv'), uploadCV).get(getCVs);

router.route('/cv/:cvId/default').put(setDefaultCV);

router.route('/cv/:cvId').delete(deleteCV);

router.route('/cv/:cvId/analyze').post(analyzeCV);

// Education routes
router.route('/education').post(addEducation);

// Experience routes
router.route('/experience').post(addExperience);

// Skills routes
router.route('/skills').put(updateSkills);

// Stats and completeness routes
router.route('/completeness').get(getProfileCompleteness);

router.route('/stats').get(getCandidateStats);

module.exports = router;
