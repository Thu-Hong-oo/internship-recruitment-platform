const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cvBuilderController = require('../controllers/cvBuilderController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/cv-builder:
 *   get:
 *     summary: Get user's CVs list
 *     tags: [CV Builder]
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
 *     responses:
 *       200:
 *         description: List of user's CVs
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth(), cvBuilderController.getUserCVs);

/**
 * @swagger
 * /api/cv-builder/create:
 *   post:
 *     summary: Create new CV
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *             properties:
 *               templateId:
 *                 type: string
 *                 example: "modern"
 *               title:
 *                 type: string
 *                 example: "My Professional CV"
 *     responses:
 *       201:
 *         description: CV created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/create', auth(), [
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters')
], cvBuilderController.createCV);

/**
 * @swagger
 * /api/cv-builder/{id}:
 *   get:
 *     summary: Get CV by ID
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CV data
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update CV content
 *     tags: [CV Builder]
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
 *             properties:
 *               content:
 *                 type: object
 *               customization:
 *                 type: object
 *     responses:
 *       200:
 *         description: CV updated successfully
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete CV
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CV deleted successfully
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', auth(), cvBuilderController.getCV);
router.put('/:id', auth(), cvBuilderController.updateCV);

/**
 * @swagger
 * /api/cv-builder/{id}/sections:
 *   post:
 *     summary: Add new section to CV
 *     tags: [CV Builder]
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
 *               - type
 *               - title
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [experience, education, skills, projects, careerObjective]
 *               title:
 *                 type: string
 *               content:
 *                 type: object
 *               position:
 *                 type: object
 *     responses:
 *       200:
 *         description: Section added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/sections', auth(), [
  body('type').isIn(['experience', 'education', 'skills', 'projects', 'careerObjective']).withMessage('Invalid section type'),
  body('title').notEmpty().withMessage('Section title is required')
], cvBuilderController.addSection);

/**
 * @swagger
 * /api/cv-builder/{id}/sections/{sectionId}:
 *   put:
 *     summary: Update CV section
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *               position:
 *                 type: object
 *               size:
 *                 type: object
 *     responses:
 *       200:
 *         description: Section updated successfully
 *       404:
 *         description: CV or section not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete CV section
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       404:
 *         description: CV or section not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/sections/:sectionId', auth(), cvBuilderController.updateSection);
router.delete('/:id/sections/:sectionId', auth(), cvBuilderController.deleteSection);

/**
 * @swagger
 * /api/cv-builder/{id}/ai-suggestions:
 *   post:
 *     summary: Get AI content suggestions for CV section
 *     tags: [CV Builder]
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
 *               - sectionType
 *             properties:
 *               sectionType:
 *                 type: string
 *                 enum: [experience, education, skills, projects, careerObjective]
 *               currentContent:
 *                 type: object
 *               targetJob:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI suggestions generated
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/ai-suggestions', auth(), [
  body('sectionType').isIn(['experience', 'education', 'skills', 'projects', 'careerObjective']).withMessage('Invalid section type')
], cvBuilderController.getAISuggestions);

/**
 * @swagger
 * /api/cv-builder/{id}/preview:
 *   get:
 *     summary: Generate CV preview
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [html, json]
 *           default: html
 *     responses:
 *       200:
 *         description: CV preview generated
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/preview', auth(), cvBuilderController.generatePreview);

/**
 * @swagger
 * /api/cv-builder/{id}/export:
 *   post:
 *     summary: Export CV to various formats
 *     tags: [CV Builder]
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
 *               - format
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, docx, html, json]
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: CV exported successfully
 *       400:
 *         description: Invalid format
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/export', auth(), [
  body('format').isIn(['pdf', 'docx', 'html', 'json']).withMessage('Invalid export format')
], cvBuilderController.exportCV);

/**
 * @swagger
 * /api/cv-builder/{id}/duplicate:
 *   post:
 *     summary: Duplicate CV
 *     tags: [CV Builder]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CV duplicated successfully
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/duplicate', auth(), cvBuilderController.duplicateCV);

/**
 * @swagger
 * /api/cv-builder/{id}/optimize:
 *   post:
 *     summary: Optimize CV for specific job
 *     tags: [CV Builder]
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
 *               - jobDescription
 *             properties:
 *               jobDescription:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: CV optimization completed
 *       404:
 *         description: CV not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/optimize', auth(), [
  body('jobDescription').notEmpty().withMessage('Job description is required')
], cvBuilderController.optimizeForJob);

module.exports = router;</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\backend\src\routes\cvBuilder.js