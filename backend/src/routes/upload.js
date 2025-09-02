const express = require('express');
const { protect, authorize, requireEmailVerification } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/globalRateLimit');
const {
  uploadSingleImage,
  uploadMultipleImages,
  uploadAvatar,
  uploadCompanyLogo,
  deleteImage,
  getImageInfo
} = require('../controllers/uploadController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *             publicId:
 *               type: string
 *             width:
 *               type: number
 *             height:
 *               type: number
 *             format:
 *               type: string
 *             size:
 *               type: number
 */

/**
 * @swagger
 * /api/upload/single:
 *   post:
 *     summary: Upload single image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many upload requests
 */
router.post('/single', protect, requireEmailVerification, uploadRateLimit, uploadSingleImage);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple images
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple image files to upload
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No files uploaded or invalid files
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many upload requests
 */
router.post('/multiple', protect, requireEmailVerification, uploadRateLimit, uploadMultipleImages);

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many upload requests
 */
router.post('/avatar', protect, requireEmailVerification, uploadRateLimit, uploadAvatar);

/**
 * @swagger
 * /api/upload/logo:
 *   post:
 *     summary: Upload company logo
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Company logo image file
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many upload requests
 */
router.post('/logo', protect, requireEmailVerification, authorize('employer', 'admin'), uploadRateLimit, uploadCompanyLogo);

/**
 * @swagger
 * /api/upload/{publicId}:
 *   delete:
 *     summary: Delete uploaded image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
router.delete('/:publicId', protect, requireEmailVerification, deleteImage);

/**
 * @swagger
 * /api/upload/{publicId}/info:
 *   get:
 *     summary: Get image information
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the image
 *     responses:
 *       200:
 *         description: Image information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Image not found
 */
router.get('/:publicId/info', protect, getImageInfo);

module.exports = router;
