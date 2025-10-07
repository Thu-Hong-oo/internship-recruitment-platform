// cvBuilderRoutes.js - Fixed Authentication Issue
const express = require('express');
const router = express.Router();
const CVBuilderController = require('../../controllers/candidate/CVBuilderController');

// Create controller instance
const cvController = new CVBuilderController();

// ❌ REMOVED: Double authentication (already handled in parent route)
// router.use(protect);
// router.use(authorize('candidate'));

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'CV Builder routes working' });
});

// ✅ GET - Lấy dữ liệu CV builder
router.get('/', cvController.getBuilderData);

// ✅ PUT - Cập nhật dữ liệu CV builder
router.put('/', cvController.updateBuilderData); // FIX HERE!

// ✅ POST - Tạo CV thông minh với AI
router.post('/generate', cvController.generateSmartCV);

// ✅ POST - Tạo CV từ raw text (AI parsing)
router.post('/generate-direct', cvController.generateDirectCV);

// ✅ GET - Lấy danh sách templates
router.get('/templates', cvController.getTemplates);

// ✅ POST - Analyze job description
router.post('/analyze-job', cvController.analyzeJobDescription);

// ✅ POST - Export CV as PDF from URL
router.post('/export-pdf', cvController.exportPDF);

// ✅ POST - Export CV as PDF directly from HTML content
router.post('/export-pdf-direct', cvController.exportPDFDirect);

// 🤖 AI ANALYSIS & ASSISTANCE ROUTES
// ✅ POST - AI Suggestions cho form fields
router.post('/ai-suggestions', cvController.getAISuggestions);

// ✅ POST - Phân tích độ phù hợp với job
router.post('/analyze-job-match', cvController.analyzeJobMatch);

// ✅ POST - Phân tích skill gaps
router.post('/skill-gap-analysis', cvController.getSkillGapAnalysis);

// ✅ POST - Tạo learning roadmap
router.post('/generate-roadmap', cvController.generateSkillRoadmap);

// Removed preview routes; use /api/candidates/me/resume/view instead

module.exports = router;
