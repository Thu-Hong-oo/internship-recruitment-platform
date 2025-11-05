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

router.route('/:id').put(updateJobPost).delete(deleteJobPost);

router.route('/:id/publish').put(publishJobPost);

router.route('/:id/close').put(closeJobPost);

router.route('/:id/stats').get(getJobPostStats);

module.exports = router;
