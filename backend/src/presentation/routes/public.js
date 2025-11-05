const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// @desc    View CV with token (Public - no auth required)
// @route   GET /api/public/cv/view/:token?mode=view|download
// @access  Public (with valid token)
router.get(
  '/cv/view/:token',
  asyncHandler(async (req, res) => {
    try {
      const { token } = req.params;
      const mode = req.query.mode || 'view';

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );

      if (decoded.type !== 'cv_view') {
        return res.status(403).json({
          success: false,
          error: 'Invalid token type',
        });
      }

      // Fetch CV file from Cloudinary
      const viewCVUseCase = req.container.resolve('viewCVUseCase');
      const result = await viewCVUseCase.proxyFile({
        cvId: decoded.cvId,
        candidateId: decoded.candidateId,
        mode,
      });

      // Set headers for PDF viewing/downloading
      res.setHeader('Content-Type', result.mimeType);

      if (mode === 'download') {
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(result.fileName)}"`
        );
      } else {
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(result.fileName)}"`
        );
      }

      // Send file buffer
      res.send(result.buffer);

      logger.info('Public CV view', {
        cvId: decoded.cvId,
        mode,
        fileName: result.fileName,
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(403).json({
          success: false,
          error: 'Token không hợp lệ',
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(403).json({
          success: false,
          error: 'Token đã hết hạn',
        });
      }

      logger.error('Public CV view error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  })
);

module.exports = router;
