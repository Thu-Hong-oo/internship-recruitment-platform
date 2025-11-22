// cvBuilderRoutes.js - CV Builder Core Features Only
const express = require('express');
const router = express.Router();
const CVBuilderController = require('../../controllers/candidate/CVBuilderController');

// Create controller instance
const cvController = new CVBuilderController();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'CV Builder routes working' });
});

// ========================================
// 📝 CV BUILDER CORE ROUTES
// ========================================

// ✅ GET - Lấy dữ liệu CV builder
router.get('/', cvController.getBuilderData);

// ✅ PUT - Cập nhật dữ liệu CV builder
router.put('/', cvController.updateBuilderData);

// ✅ POST - Tạo CV thông minh với AI
router.post('/generate', cvController.generateSmartCV);

// ✅ GET - Lấy danh sách templates
router.get('/templates', cvController.getTemplates);

// ========================================
// 📄 PDF EXPORT ROUTES
// ========================================

// ✅ POST - Export CV as PDF from URL
router.post('/export-pdf', cvController.exportPDF);

// ✅ POST - Export CV as PDF directly from HTML content
router.post('/export-pdf-direct', cvController.exportPDFDirect);

// ========================================
// 📚 CV HISTORY MANAGEMENT ROUTES
// ========================================
// ❌ REMOVED: These features are already available in /api/candidates/me/resume/*
// - GET history: Use GET /api/candidates/me/resume?version=all
// - DELETE from history: Use DELETE /api/candidates/me/resume/:id
// - SET current CV: Use PUT /api/candidates/me/resume/set-current/:id

// ========================================
// 🔗 NOTE: AI FEATURES MOVED TO /api/ai/*
// ========================================
// - AI Suggestions: POST /api/ai/suggestions
// - Job Match Analysis: POST /api/nlp/matching-score (⚠️ /api/ai/analyze-job-match is deprecated)
// - Skill Gap Analysis: POST /api/ai/skill-gap-analysis
// - Learning Roadmap: POST /api/nlp/learning-roadmap (⚠️ /api/ai/skill-roadmap is deprecated)
// - CV Analysis: POST /api/ai/analyze-cv-text

module.exports = router;
