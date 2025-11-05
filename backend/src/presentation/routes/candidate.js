const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCV,
  getCVs,
  proxyCVFile,
  updateCV,
  setDefaultCV,
  deleteCV,
  analyzeCV,
  getProfileCompleteness,
  getCandidateStats,
} = require('../controllers/candidateController');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('candidate'));

// Profile routes - POST removed (profile auto-created on email verification)
router.route('/profile').get(getProfile).patch(updateProfile); // PATCH for partial update

// Avatar upload route
router.route('/avatar').post(upload.upload.single('avatar'), uploadAvatar);

// CV routes
router.route('/cv').post(upload.upload.single('cv'), uploadCV).get(getCVs);

// View/Download CV - Stream through backend
router.route('/cv/:cvId/view').get(proxyCVFile); // ?mode=download để tải về, mặc định là xem

router.route('/cv/:cvId').patch(updateCV).delete(deleteCV); // PATCH to update CV name

router.route('/cv/:cvId/default').patch(setDefaultCV); // PATCH for status change

router.route('/cv/:cvId/analyze').post(analyzeCV);

// Stats and completeness routes
router.route('/completeness').get(getProfileCompleteness);

router.route('/stats').get(getCandidateStats);

module.exports = router;
