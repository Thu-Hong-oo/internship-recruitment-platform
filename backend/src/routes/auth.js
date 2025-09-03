const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  verifyEmail,
  resendEmailVerification
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const {
  emailVerificationRateLimit,
  passwordResetRateLimit,
  otpVerificationRateLimit,
  resendVerificationRateLimit
} = require('../middleware/otpRateLimit');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password
 *         firstName:
 *           type: string
 *           maxLength: 50
 *           description: User's first name
 *         lastName:
 *           type: string
 *           maxLength: 50
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [student, employer, admin]
 *           default: student
 *           description: User's role
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             role:
 *               type: string
 *             fullName:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
router.post('/register', emailVerificationRateLimit, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Login failed - various error types
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     error:
 *                       type: string
 *                       example: "Email này chưa được đăng ký trong hệ thống"
 *                     errorType:
 *                       type: string
 *                       enum: [EMAIL_NOT_REGISTERED, GOOGLE_OAUTH_REQUIRED, INVALID_PASSWORD, EMAIL_NOT_VERIFIED, ACCOUNT_DISABLED]
 *                       example: "EMAIL_NOT_REGISTERED"
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     error:
 *                       type: string
 *                       example: "Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập."
 *                     errorType:
 *                       type: string
 *                       example: "EMAIL_NOT_VERIFIED"
 *                     requiresEmailVerification:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         role:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         isEmailVerified:
 *                           type: boolean
 *                         authMethod:
 *                           type: string
 */
router.post('/login', login);



/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information retrieved successfully
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
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/forgotpassword:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 resetUrl:
 *                   type: string
 */
router.post('/forgotpassword', passwordResetRateLimit, forgotPassword);

/**
 * @swagger
 * /api/auth/resetpassword:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-digit OTP code from email
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid OTP or missing fields
 *       404:
 *         description: User not found
 */
router.post('/resetpassword', otpVerificationRateLimit, resetPassword);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth login/register
 *     tags: [Authentication]
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
 *         description: Google OAuth successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                 isNew:
 *                   type: boolean
 */
router.post('/google', googleAuth);



/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-digit OTP code from email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid OTP or missing fields
 *       404:
 *         description: User not found
 */
router.post('/verify-email', otpVerificationRateLimit, verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to send email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
router.post('/resend-verification', resendVerificationRateLimit, resendEmailVerification);

module.exports = router;
