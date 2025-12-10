/**
 * RAG Routes
 * 
 * API endpoints cho RAG recommendation system:
 * - Metrics tracking
 * - Sync status
 * - Manual sync triggers
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getRAGRecommendationService } = require('../services/ai/ragRecommendationService');
const { getRAGMetricsService } = require('../services/ai/ragMetricsService');
const { getRAGSyncService } = require('../services/ai/ragSyncService');
const { ApiResponse } = require('../utils/responseHandler');
const { logger } = require('../utils/logger');

/**
 * GET /api/rag/metrics
 * Get RAG system metrics
 */
router.get('/metrics', protect, authorize('admin', 'employer'), async (req, res) => {
  try {
    const ragService = getRAGRecommendationService();
    const metricsService = getRAGMetricsService();

    const ragMetrics = ragService.getMetrics();
    const systemMetrics = metricsService.getMetrics();

    return ApiResponse.success(res, {
      rag: ragMetrics,
      system: systemMetrics,
      timestamp: new Date()
    }, 'RAG metrics retrieved successfully');
  } catch (error) {
    logger.error('Failed to get RAG metrics:', error);
    return ApiResponse.error(res, 'Failed to retrieve metrics', 500);
  }
});

/**
 * GET /api/rag/sync/status
 * Get sync status
 */
router.get('/sync/status', protect, authorize('admin'), async (req, res) => {
  try {
    const syncService = getRAGSyncService();
    const status = await syncService.getStatus();

    return ApiResponse.success(res, status, 'Sync status retrieved successfully');
  } catch (error) {
    logger.error('Failed to get sync status:', error);
    return ApiResponse.error(res, 'Failed to retrieve sync status', 500);
  }
});

/**
 * POST /api/rag/sync/jobs
 * Manually trigger job sync
 */
router.post('/sync/jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const syncService = getRAGSyncService();
    const result = await syncService.syncJobs();

    return ApiResponse.success(res, result, 'Job sync completed successfully');
  } catch (error) {
    logger.error('Job sync failed:', error);
    return ApiResponse.error(res, error.message || 'Job sync failed', 500);
  }
});

/**
 * POST /api/rag/sync/candidates
 * Manually trigger candidate sync
 */
router.post('/sync/candidates', protect, authorize('admin'), async (req, res) => {
  try {
    const syncService = getRAGSyncService();
    const result = await syncService.syncCandidates();

    return ApiResponse.success(res, result, 'Candidate sync completed successfully');
  } catch (error) {
    logger.error('Candidate sync failed:', error);
    return ApiResponse.error(res, error.message || 'Candidate sync failed', 500);
  }
});

/**
 * POST /api/rag/sync/popular-jobs
 * Pre-compute embeddings for popular jobs
 */
router.post('/sync/popular-jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const syncService = getRAGSyncService();
    const result = await syncService.precomputePopularJobEmbeddings();

    return ApiResponse.success(res, result, 'Popular jobs pre-computed successfully');
  } catch (error) {
    logger.error('Popular jobs pre-compute failed:', error);
    return ApiResponse.error(res, error.message || 'Pre-compute failed', 500);
  }
});

/**
 * POST /api/rag/metrics/reset
 * Reset metrics (admin only)
 */
router.post('/metrics/reset', protect, authorize('admin'), async (req, res) => {
  try {
    const ragService = getRAGRecommendationService();
    const metricsService = getRAGMetricsService();

    ragService.resetMetrics();
    metricsService.resetAll();

    return ApiResponse.success(res, null, 'Metrics reset successfully');
  } catch (error) {
    logger.error('Failed to reset metrics:', error);
    return ApiResponse.error(res, 'Failed to reset metrics', 500);
  }
});

module.exports = router;

