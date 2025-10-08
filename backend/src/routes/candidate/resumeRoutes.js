const express = require('express');
const router = express.Router();
const ResumeController = require('../../controllers/candidate/ResumeController');
const upload = require('../../middleware/multerUpload');
const { apiRateLimit } = require('../../middleware/globalRateLimit');

const resumeController = new ResumeController();

// POST /api/candidates/me/resume - Handle resume upload and parsing
router.post(
  '/',
  apiRateLimit,
  upload.single('file'),
  resumeController.handleResume
);

// GET /api/candidates/me/resume - Get resume data (current or all versions)
router.get('/', resumeController.getResume);

// POST /api/candidates/me/resume/generate - Generate a smart resume with AI
router.post('/generate', resumeController.generateSmartResume);

// POST /api/candidates/me/resume/generate/:jobId - Generate a resume targeted for a specific job
router.post('/generate/:jobId', resumeController.generateTargetedResume);

// GET /api/candidates/me/resume/view/:id? - Stream CV for viewing in browser
router.get('/view/:id?', resumeController.viewCurrentCV);

// PUT /api/candidates/me/resume/set-current/:id - Set a resume from history as current
router.put('/set-current/:id', resumeController.setCurrentResume);

// PUT /api/candidates/me/resume/rename - Rename a CV
router.put('/rename', resumeController.renameResume);

// DELETE /api/candidates/me/resume/:id - Delete a CV
router.delete('/:id', resumeController.deleteResume);

module.exports = router;
