const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPost,
  deleteJobPost,
  publishJobPost,
  closeJobPost,
  getEmployerJobPosts,
  searchJobPosts,
  getJobPostStats,
} = require('../controllers/jobPostController');

// Public routes
router.route('/').get(getAllJobPosts);

router.route('/search').get(searchJobPosts);

router.route('/:id').get(getJobPostById);

// Protected routes for employers
router.use(protect);
router.use(authorize('employer'));

router.route('/').post(createJobPost);

router.route('/employer').get(getEmployerJobPosts);

router.route('/:id').patch(updateJobPost).delete(deleteJobPost); // PATCH for partial update

router.route('/:id/publish').patch(publishJobPost); // PATCH for status change

router.route('/:id/close').patch(closeJobPost); // PATCH for status change

router.route('/:id/stats').get(getJobPostStats);

module.exports = router;
