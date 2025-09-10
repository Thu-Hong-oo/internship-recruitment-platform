const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  // User Management
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,

  // Analytics & Dashboard
  getDashboardStats,
  getUserAnalytics,

  // Employer Management
  getEmployers,
  getEmployer,
  updateEmployerStatus,
  getEmployerCompanies,
  getEmployerJobs,

  // Company Management
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanyJobs,
  getCompanyApplications,

  // Employer Verification
  getPendingVerifications,
  verifyEmployer,

  // Company Moderation
  updateCompanyStatus,

  // Job Moderation
  getJobsAdmin,
  updateJobStatusAdmin,

  // System Management
  getSystemHealth,
  getSystemLogs,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// ========================================
// USER MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, employer, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by user status
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by email verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/users', getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get single user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.get('/users/:id', getUser);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create new user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.post('/users', createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.put('/users/:id', updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete user with active applications
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update user status (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, banned]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.put('/users/:id/status', updateUserStatus);

// ========================================
// ANALYTICS & DASHBOARD
// ========================================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                     recentActivities:
 *                       type: object
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/admin/analytics/users:
 *   get:
 *     summary: Get user analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '30'
 *         description: Analytics period in days
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/analytics/users', getUserAnalytics);

// ========================================
// EMPLOYER MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/admin/employers:
 *   get:
 *     summary: Get all employers
 *     tags: [Admin - Employer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of employers per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: verified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by email verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *     responses:
 *       200:
 *         description: List of employers retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/employers', getEmployers);

/**
 * @swagger
 * /api/admin/employers/{id}:
 *   get:
 *     summary: Get single employer
 *     tags: [Admin - Employer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employer ID
 *     responses:
 *       200:
 *         description: Employer retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employer not found
 */
router.get('/employers/:id', getEmployer);

/**
 * @swagger
 * /api/admin/employers/{id}/status:
 *   put:
 *     summary: Update employer status
 *     tags: [Admin - Employer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, banned]
 *                 description: New status
 *     responses:
 *       200:
 *         description: Employer status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employer not found
 */
router.put('/employers/:id/status', updateEmployerStatus);

/**
 * @swagger
 * /api/admin/employers/{id}/companies:
 *   get:
 *     summary: Get employer's companies
 *     tags: [Admin - Employer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employer ID
 *     responses:
 *       200:
 *         description: Employer's companies retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employer not found
 */
router.get('/employers/:id/companies', getEmployerCompanies);

/**
 * @swagger
 * /api/admin/employers/{id}/jobs:
 *   get:
 *     summary: Get employer's jobs
 *     tags: [Admin - Employer Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of jobs per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, inactive, expired]
 *         description: Filter by job status
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, hidden, private]
 *         description: Filter by job visibility
 *     responses:
 *       200:
 *         description: Employer's jobs retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employer not found
 */
router.get('/employers/:id/jobs', getEmployerJobs);

// ========================================
// COMPANY MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/admin/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Admin - Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of companies per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, suspended, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [startup, small, medium, large, enterprise]
 *         description: Filter by company size
 *       - in: query
 *         name: companyType
 *         schema:
 *           type: string
 *           enum: [private, public, government, nonprofit]
 *         description: Filter by company type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *     responses:
 *       200:
 *         description: List of companies retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/companies', getCompanies);

/**
 * @swagger
 * /api/admin/companies/{id}:
 *   get:
 *     summary: Get single company
 *     tags: [Admin - Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.get('/companies/:id', getCompany);

/**
 * @swagger
 * /api/admin/companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Admin - Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               website:
 *                 type: string
 *               size:
 *                 type: string
 *                 enum: [startup, small, medium, large, enterprise]
 *               companyType:
 *                 type: string
 *                 enum: [private, public, government, nonprofit]
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.put('/companies/:id', updateCompany);

/**
 * @swagger
 * /api/admin/companies/{id}:
 *   delete:
 *     summary: Delete company
 *     tags: [Admin - Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *       400:
 *         description: Cannot delete company with active jobs
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.delete('/companies/:id', deleteCompany);

/**
 * @swagger
 * /api/admin/companies/{id}/jobs:
 *   get:
 *     summary: Get company's jobs
 *     tags: [Admin - Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of jobs per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, inactive, expired]
 *         description: Filter by job status
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, hidden, private]
 *         description: Filter by job visibility
 *     responses:
 *       200:
 *         description: Company's jobs retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.get('/companies/:id/jobs', getCompanyJobs);

/**
 * @swagger
 * /api/admin/companies/{id}/applications:
 *   get:
 *     summary: Get company's applications
 *     tags: [Admin - Company Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of applications per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewing, interviewing, accepted, rejected]
 *         description: Filter by application status
 *     responses:
 *       200:
 *         description: Company's applications retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.get('/companies/:id/applications', getCompanyApplications);

// ========================================
// EMPLOYER VERIFICATION
// ========================================

/**
 * @swagger
 * /api/admin/verifications:
 *   get:
 *     summary: Get pending employer verifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending verifications retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/verifications', getPendingVerifications);

/**
 * @swagger
 * /api/admin/verifications/{id}:
 *   put:
 *     summary: Verify employer (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Employer profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *                 description: Required if action is reject
 *     responses:
 *       200:
 *         description: Employer verification updated successfully
 *       400:
 *         description: Invalid action
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Employer profile not found
 */
router.put('/verifications/:id', verifyEmployer);

// ========================================
// COMPANY MODERATION
// ========================================

/**
 * @swagger
 * /api/admin/companies/{id}/status:
 *   put:
 *     summary: Update company status (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, pending, suspended, inactive]
 *     responses:
 *       200:
 *         description: Company status updated successfully
 *       400:
 *         description: Invalid status or company id
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Company not found
 */
router.put('/companies/:id/status', updateCompanyStatus);

// ========================================
// JOB MODERATION
// ========================================

/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     summary: Get jobs for moderation (filter by status/company/employer)
 *     tags: [Admin - Job Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, closed, filled]
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: employerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           description: text search
 *     responses:
 *       200:
 *         description: Jobs retrieved
 */
router.get('/jobs', getJobsAdmin);

/**
 * @swagger
 * /api/admin/jobs/{id}/status:
 *   put:
 *     summary: Update job status (approve/reject/publish)
 *     tags: [Admin - Job Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, closed, filled]
 *     responses:
 *       200:
 *         description: Job status updated
 */
router.put('/jobs/:id/status', updateJobStatusAdmin);

// ========================================
// SYSTEM MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/admin/system/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     redis:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     email:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     storage:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/system/health', getSystemHealth);

/**
 * @swagger
 * /api/admin/system/logs:
 *   get:
 *     summary: Get system logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           default: 'error'
 *           enum: [error, warn, info, debug]
 *         description: Log level filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of log entries to return
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/system/logs', getSystemLogs);

module.exports = router;
