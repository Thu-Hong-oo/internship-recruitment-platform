// cvBuilderRoutes.js - Fixed
const express = require('express');
const router = express.Router();
const CVBuilderController = require('../../controllers/candidate/CVBuilderController');
const { protect, authorize } = require('../../middleware/auth');

// Create controller instance
const cvController = new CVBuilderController();
router.use(protect);
router.use(authorize('candidate'));
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

// ✅ GET - Lấy danh sách templates
router.get('/templates', cvController.getTemplates);

// ✅ POST - Analyze job description
router.post('/analyze-job', cvController.analyzeJobDescription);

// ✅ POST - Export CV as PDF from URL
router.post('/export-pdf', cvController.exportPDF);

// ✅ POST - Export CV as PDF directly from HTML content
router.post('/export-pdf-direct', cvController.exportPDFDirect);

// ✅ GET - Preview PDF CV
router.get('/preview-pdf/:cvId', cvController.previewPDF);

// ✅ GET - PDF Viewer with embedded viewer
router.get('/pdf-viewer/:cvId', cvController.getPDFViewer);

module.exports = router;
