const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getSystemDashboard,
  getAllUsers,
  getUserById,
  // createUser, // TODO: Implement createUserUseCase
  // updateUser, // TODO: Implement updateUserUseCase
  updateUserStatus,
  deleteUser,
  getAllEmployers,
  getEmployerById,
  updateEmployerStatus,
  getAllCandidates,
  getCandidateById,
  updateCandidateStatus,
  getAllCompanies,
  getCompanyById,
  // createCompany, // TODO: Implement createCompanyUseCase
  // updateCompany, // TODO: Implement updateCompanyUseCase
  // deleteCompany, // TODO: Implement deleteCompanyUseCase
  // getAllJobs, // TODO: Implement getAllJobsUseCase
  // getJobById, // TODO: Implement getJobByIdUseCase
  // createJob, // TODO: Implement createJobUseCase
  // updateJob, // TODO: Implement updateJobUseCase
  // deleteJob, // TODO: Implement deleteJobUseCase
  getSystemStats,
  getSystemLogs,
  getSystemHealth,
  updateSystemSettings,
} = require('../controllers/adminController');

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard routes
router.route('/dashboard').get(getSystemDashboard);

// User management routes
router.route('/users').get(getAllUsers); // .post(createUser); // TODO: Implement createUserUseCase
router.route('/users/:id').get(getUserById); // .put(updateUser); // TODO: Implement updateUserUseCase .delete(deleteUser);
router.route('/users/:id/status').patch(updateUserStatus);

// Employer management routes
router.route('/employers').get(getAllEmployers);
router.route('/employers/:id').get(getEmployerById);
router.route('/employers/:id/status').patch(updateEmployerStatus);

// Candidate management routes
router.route('/candidates').get(getAllCandidates);
router.route('/candidates/:id').get(getCandidateById);
router.route('/candidates/:id/status').patch(updateCandidateStatus);

// Company management routes
router.route('/companies').get(getAllCompanies); // .post(createCompany); // TODO: Implement createCompanyUseCase
router.route('/companies/:id').get(getCompanyById); // .put(updateCompany).delete(deleteCompany); // TODO: Implement updateCompanyUseCase and deleteCompanyUseCase

// Job management routes
// router.route('/jobs').get(getAllJobs).post(createJob); // TODO: Implement getAllJobsUseCase and createJobUseCase
// router.route('/jobs/:id').get(getJobById).put(updateJob).delete(deleteJob); // TODO: Implement getJobByIdUseCase, updateJobUseCase, and deleteJobUseCase

// System routes
router.route('/stats').get(getSystemStats);
router.route('/logs').get(getSystemLogs);
router.route('/health').get(getSystemHealth);
router.route('/settings').patch(updateSystemSettings);

module.exports = router;
