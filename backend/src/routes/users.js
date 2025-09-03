const express = require('express');
const {
  protect,
  authorize,
  requireEmailVerification,
} = require('../middleware/auth');
const {
  uploadAvatar: uploadAvatarMiddleware,
  handleUploadError,
} = require('../middleware/upload');
const { uploadRateLimit } = require('../middleware/globalRateLimit');
const {
  getUser,
  uploadAvatar,
  updateProfile,
  changePassword,
  linkGoogleAccount,
  unlinkGoogleAccount,
  // Candidate profile management
  getCandidateProfile,
  createCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume,
  deleteCandidateResume,
  getCandidateSkills,
  addCandidateSkills,
  updateCandidateSkill,
  deleteCandidateSkill,
  // Employer profile management
  getEmployerProfile,
  createEmployerProfile,
  updateEmployerProfile,
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get single user
 *     tags: [Users]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/:id', getUser);

/**
 * @swagger
 * /api/users/upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (jpg, jpeg, png, gif, webp, max 10MB) - Uploads to Cloudinary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: No file selected or invalid file type
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Failed to update avatar in database
 */
router.post(
  '/upload-avatar',
  requireEmailVerification,
  uploadRateLimit,
  uploadAvatarMiddleware,
  handleUploadError,
  uploadAvatar
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               address:
 *                 type: object
 *               education:
 *                 type: object
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */
router.put('/profile', requireEmailVerification, updateProfile);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Current password incorrect
 */
router.put('/password', requireEmailVerification, changePassword);

/**
 * @swagger
 * /api/users/link-google:
 *   post:
 *     summary: Link Google account to existing user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Google account linked successfully
 *       400:
 *         description: Invalid token or account already linked
 */
router.post('/link-google', requireEmailVerification, linkGoogleAccount);

/**
 * @swagger
 * /api/users/unlink-google:
 *   delete:
 *     summary: Unlink Google account from user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google account unlinked successfully
 *       400:
 *         description: Cannot unlink if it's the only auth method
 */
router.delete('/unlink-google', requireEmailVerification, unlinkGoogleAccount);

// ========================================
// CANDIDATE PROFILE ROUTES
// ========================================

/**
 * @swagger
 * /api/users/candidate/profile:
 *   get:
 *     summary: Get candidate profile
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate profile retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.get('/candidate/profile', authorize('student'), getCandidateProfile);

/**
 * @swagger
 * /api/users/candidate/profile:
 *   post:
 *     summary: Create candidate profile
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               education:
 *                 type: object
 *               experience:
 *                 type: array
 *               skills:
 *                 type: array
 *               preferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Candidate profile created successfully
 *       400:
 *         description: Profile already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 */
router.post('/candidate/profile', authorize('student'), createCandidateProfile);

/**
 * @swagger
 * /api/users/candidate/profile:
 *   put:
 *     summary: Update candidate profile
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               education:
 *                 type: object
 *               experience:
 *                 type: array
 *               skills:
 *                 type: array
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Candidate profile updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.put('/candidate/profile', authorize('student'), updateCandidateProfile);

/**
 * @swagger
 * /api/users/candidate/resume:
 *   post:
 *     summary: Upload candidate resume
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (pdf, doc, docx, max 10MB)
 *     responses:
 *       200:
 *         description: Resume uploaded successfully
 *       400:
 *         description: No file selected or invalid file type
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.post(
  '/candidate/resume',
  authorize('student'),
  uploadRateLimit,
  uploadAvatarMiddleware,
  handleUploadError,
  uploadCandidateResume
);

/**
 * @swagger
 * /api/users/candidate/resume:
 *   delete:
 *     summary: Delete candidate resume
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resume deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.delete('/candidate/resume', authorize('student'), deleteCandidateResume);

/**
 * @swagger
 * /api/users/candidate/skills:
 *   get:
 *     summary: Get candidate skills
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Candidate skills retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.get('/candidate/skills', authorize('student'), getCandidateSkills);

/**
 * @swagger
 * /api/users/candidate/skills:
 *   post:
 *     summary: Add candidate skills
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skills
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Skills added successfully
 *       400:
 *         description: Skills must be an array
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.post('/candidate/skills', authorize('student'), addCandidateSkills);

/**
 * @swagger
 * /api/users/candidate/skills/{skillId}:
 *   put:
 *     summary: Update candidate skill level
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, expert]
 *               experience:
 *                 type: number
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile or skill not found
 */
router.put(
  '/candidate/skills/:skillId',
  authorize('student'),
  updateCandidateSkill
);

/**
 * @swagger
 * /api/users/candidate/skills/{skillId}:
 *   delete:
 *     summary: Delete candidate skill
 *     tags: [Candidate Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: skillId
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Student access required
 *       404:
 *         description: Candidate profile not found
 */
router.delete(
  '/candidate/skills/:skillId',
  authorize('student'),
  deleteCandidateSkill
);

// ========================================
// EMPLOYER PROFILE ROUTES
// ========================================

/**
 * @swagger
 * /api/users/employer/profile:
 *   get:
 *     summary: Get employer profile
 *     tags: [Employer Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employer profile retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Employer access required
 *       404:
 *         description: Employer profile not found
 */
router.get('/employer/profile', authorize('employer'), getEmployerProfile);

/**
 * @swagger
 * /api/users/employer/profile:
 *   post:
 *     summary: Create employer profile
 *     tags: [Employer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: object
 *               position:
 *                 type: object
 *               contact:
 *                 type: object
 *               preferences:
 *                 type: object
 *     responses:
 *       201:
 *         description: Employer profile created successfully
 *       400:
 *         description: Profile already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Employer access required
 */
router.post('/employer/profile', authorize('employer'), createEmployerProfile);

/**
 * @swagger
 * /api/users/employer/profile:
 *   put:
 *     summary: Update employer profile
 *     tags: [Employer Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: object
 *               position:
 *                 type: object
 *               contact:
 *                 type: object
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Employer profile updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Employer access required
 *       404:
 *         description: Employer profile not found
 */
router.put('/employer/profile', authorize('employer'), updateEmployerProfile);

module.exports = router;
