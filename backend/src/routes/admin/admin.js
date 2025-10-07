const express = require('express');
const { protect, authorize } = require('../../middleware/auth');

// Import từ admin controllers mới - modular structure
const {
  // User Management
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
} = require('../../controllers/admin/userController');

const {
  // Analytics & Dashboard
  getDashboardStats,
  getUserAnalytics,
} = require('../../controllers/admin/analyticsController');

const {
  // Employer Management
  getEmployers,
  getEmployer,
  updateEmployerStatus,
  getEmployerCompanies,
  getEmployerJobs,
  searchEmployers,
} = require('../../controllers/admin/employerController');

const {
  // Company Management
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getCompanyApplications,
  updateCompanyStatus,
} = require('../../controllers/admin/companyController');

const {
  // Employer Verification
  getPendingVerifications,
  getEmployerVerificationDetails,
  verifyEmployer,
  verifyEmployerDocument,
} = require('../../controllers/admin/verificationController');

const {
  // Job Moderation
  getJobsAdmin,
  getJobAdmin,
  updateJobStatus,
  deleteJobAdmin,
  getJobApplicationsAdmin,
} = require('../../controllers/admin/jobController');

const {
  // System Management
  getSystemHealth,
  getSystemLogs,
  getSystemOverview,
  updateSystemSettings,
} = require('../../controllers/admin/systemController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// ========================================
// USER MANAGEMENT
// ========================================

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);

// ========================================
// ANALYTICS & DASHBOARD
// ========================================

router.get('/dashboard', getDashboardStats);
router.get('/analytics/users', getUserAnalytics);

// ========================================
// EMPLOYER MANAGEMENT
// ========================================

router.get('/employers', getEmployers);
router.get('/employers/pending', getPendingVerifications); // DEPRECATED - use /verifications
router.get('/employers/:id', getEmployer);
router.put('/employers/:id/status', updateEmployerStatus);
router.get('/employers/:id/companies', getEmployerCompanies);
router.get('/employers/:id/jobs', getEmployerJobs);
router.get('/employers/search', searchEmployers);

// ========================================
// COMPANY MANAGEMENT
// ========================================

router.get('/companies', getCompanies);
router.get('/companies/:id', getCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);
router.get('/companies/:id/jobs', getCompanyJobs);
router.get('/companies/:id/applications', getCompanyApplications);
router.put('/companies/:id/status', updateCompanyStatus);

// ========================================
// EMPLOYER VERIFICATION
// ========================================

router.get('/verifications', getPendingVerifications);
router.get('/verifications/:id', getEmployerVerificationDetails);
router.put('/verifications/:id', verifyEmployer);
router.put(
  '/employers/:employerId/documents/:documentId/verify',
  verifyEmployerDocument
);

// ========================================
// JOB MODERATION
// ========================================

router.get('/jobs', getJobsAdmin);
router.put('/jobs/:id/status', updateJobStatus);
router.route('/jobs/:id').get(getJobAdmin).delete(deleteJobAdmin);
router.get('/jobs/:id/applications', getJobApplicationsAdmin);

// ========================================
// SYSTEM MANAGEMENT
// ========================================

router.get('/system/health', getSystemHealth);
router.get('/system/logs', getSystemLogs);
router.get('/system/overview', getSystemOverview);
router.put('/system/settings', updateSystemSettings);

// ========================================
// INDUSTRY MANAGEMENT
// ========================================

router.use('/industries', require('./industriesAdmin'));

module.exports = router;
