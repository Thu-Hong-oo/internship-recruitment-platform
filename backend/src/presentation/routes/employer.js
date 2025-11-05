const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createProfile,
  getProfile,
  updateProfile,
  createCompany,
  getCompany,
  updateCompany,
  getEmployerStats,
  getDashboard,
} = require('../controllers/employerController');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('employer'));

// Profile routes
router.route('/profile').post(createProfile).get(getProfile).put(updateProfile);

// Company routes
router.route('/company').post(createCompany).get(getCompany).put(updateCompany);

// Stats and dashboard routes
router.route('/stats').get(getEmployerStats);

router.route('/dashboard').get(getDashboard);

module.exports = router;
