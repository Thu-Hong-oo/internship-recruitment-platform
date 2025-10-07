const express = require('express');
const router = express.Router();
const CVPreviewGenerator = require('../../services/cvPreviewGenerator');
const { protect, authorize } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

/**
 * CV Templates Preview Generator Routes
 * Admin-only endpoints for managing CV template previews
 */

// Middleware: Admin authentication required
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   POST /api/admin/templates/generate-previews
 * @desc    Generate preview images for all CV templates
 * @access  Admin only
 * @body    { regenerate?: boolean } - Force regenerate existing previews
 */
router.post('/generate-previews', async (req, res) => {
  try {
    const { regenerate = false } = req.body;

    logger.info('Admin initiated CV template preview generation', {
      regenerate,
      adminId: req.user.id,
    });

    const generator = new CVPreviewGenerator();

    // Generate all previews
    const results = await generator.generateAllPreviews();

    // Close generator
    await generator.close();

    // Log results
    logger.info('CV template preview generation completed', {
      ...results.summary,
      adminId: req.user.id,
    });

    return res.json({
      success: true,
      message: 'CV template previews generated successfully',
      data: {
        summary: results.summary,
        results: Object.keys(results.results).reduce((acc, templateId) => {
          const result = results.results[templateId];
          acc[templateId] = {
            success: !result.error,
            preview: result.preview || null,
            thumbnail: result.thumbnail || null,
            error: result.error || null,
          };
          return acc;
        }, {}),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error generating CV template previews:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_GENERATION_FAILED',
        message: 'Failed to generate template previews',
        details: error.message,
      },
    });
  }
});

/**
 * @route   POST /api/admin/templates/:templateId/generate-preview
 * @desc    Generate preview for a specific template
 * @access  Admin only
 * @param   templateId - Template ID to generate preview for
 * @body    { cvData?: object } - Optional custom CV data
 */
router.post('/:templateId/generate-preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { cvData } = req.body;

    logger.info('Admin generating single template preview', {
      templateId,
      adminId: req.user.id,
    });

    const generator = new CVPreviewGenerator();

    // Generate preview for specific template
    const result = await generator.generatePreview(templateId, cvData);

    // Close generator
    await generator.close();

    logger.info('Single template preview generated successfully', {
      templateId,
      adminId: req.user.id,
    });

    return res.json({
      success: true,
      message: `Preview generated for template: ${templateId}`,
      data: result,
    });
  } catch (error) {
    logger.error(
      `Error generating preview for template ${req.params.templateId}:`,
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'SINGLE_PREVIEW_FAILED',
        message: `Failed to generate preview for template: ${req.params.templateId}`,
        details: error.message,
      },
    });
  }
});

/**
 * @route   GET /api/admin/templates/preview-status
 * @desc    Check preview generation status for all templates
 * @access  Admin only
 */
router.get('/preview-status', async (req, res) => {
  try {
    const { CV_TEMPLATES } = require('../../config/cvTemplates');
    const generator = new CVPreviewGenerator();

    const templateIds = Object.keys(CV_TEMPLATES);
    const statusChecks = await Promise.all(
      templateIds.map(templateId => generator.checkPreviewExists(templateId))
    );

    await generator.close();

    const status = statusChecks.reduce((acc, check) => {
      acc[check.templateId] = {
        preview: check.preview || { exists: false, url: null },
        thumbnail: check.thumbnail || { exists: false, url: null },
        complete: check.preview?.exists && check.thumbnail?.exists,
        error: check.error || null,
      };
      return acc;
    }, {});

    const summary = {
      total: templateIds.length,
      completed: Object.values(status).filter(s => s.complete).length,
      missing: Object.values(status).filter(s => !s.complete).length,
      checkedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: {
        summary,
        templates: status,
      },
    });
  } catch (error) {
    logger.error('Error checking preview status:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: 'Failed to check preview status',
        details: error.message,
      },
    });
  }
});

/**
 * @route   DELETE /api/admin/templates/:templateId/preview
 * @desc    Delete preview files for a specific template
 * @access  Admin only
 * @param   templateId - Template ID to delete previews for
 */
router.delete('/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const fs = require('fs').promises;
    const path = require('path');

    const previewDir = path.join(
      __dirname,
      '../../../public/templates/previews'
    );
    const previewPath = path.join(previewDir, `${templateId}-preview.jpg`);
    const thumbnailPath = path.join(previewDir, `${templateId}-thumb.jpg`);

    const deletions = [];

    // Delete preview file if exists
    try {
      await fs.unlink(previewPath);
      deletions.push('preview');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Delete thumbnail file if exists
    try {
      await fs.unlink(thumbnailPath);
      deletions.push('thumbnail');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    logger.info('Admin deleted template previews', {
      templateId,
      deletions,
      adminId: req.user.id,
    });

    return res.json({
      success: true,
      message: `Deleted ${deletions.length} preview files for template: ${templateId}`,
      data: {
        templateId,
        deletedFiles: deletions,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(
      `Error deleting preview for template ${req.params.templateId}:`,
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_PREVIEW_FAILED',
        message: `Failed to delete preview for template: ${req.params.templateId}`,
        details: error.message,
      },
    });
  }
});

/**
 * @route   GET /api/admin/templates
 * @desc    Get all templates with admin details
 * @access  Admin only
 */
router.get('/', async (req, res) => {
  try {
    const { CV_TEMPLATES } = require('../../config/cvTemplates');

    const templates = Object.entries(CV_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      industryCode: template.industryCode,
      color: template.color,
      style: template.style,
      sections: template.sections,
      preview: template.preview,
      customization: template.customization,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z', // Mock date
      updatedAt: new Date().toISOString(),
    }));

    return res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
        summary: {
          total: templates.length,
          byIndustry: templates.reduce((acc, t) => {
            acc[t.industryCode] = (acc[t.industryCode] || 0) + 1;
            return acc;
          }, {}),
          byStyle: templates.reduce((acc, t) => {
            acc[t.style] = (acc[t.style] || 0) + 1;
            return acc;
          }, {}),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting admin templates:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_TEMPLATES_FAILED',
        message: 'Failed to get template list',
        details: error.message,
      },
    });
  }
});

module.exports = router;
