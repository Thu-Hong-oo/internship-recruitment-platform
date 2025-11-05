const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const RoadmapService = require('../../infrastructure/services/internal/RoadmapService');
const LearningRoadmapResponseDTO = require('../dtos/LearningRoadmapResponseDTO');

// @desc    Generate learning roadmap
// @route   POST /api/roadmaps/generate
// @access  Private (Candidate)
const generateRoadmap = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.generateRoadmap(
      req.user.candidateId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: LearningRoadmapResponseDTO.fromRoadmap(result.roadmap).toJSON(),
    });
  } catch (error) {
    logger.error('Generate roadmap error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get user roadmaps
// @route   GET /api/roadmaps
// @access  Private (Candidate)
const getUserRoadmaps = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.getUserRoadmaps(
      req.user.candidateId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: LearningRoadmapResponseDTO.fromRoadmaps(result.roadmaps).map(dto =>
        dto.toJSON()
      ),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get user roadmaps error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get roadmap by ID
// @route   GET /api/roadmaps/:id
// @access  Private (Candidate)
const getRoadmapById = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.getRoadmapById(
      req.params.id,
      req.user.candidateId
    );

    res.status(200).json({
      success: true,
      data: LearningRoadmapResponseDTO.fromRoadmap(result.roadmap).toJSON(),
    });
  } catch (error) {
    logger.error('Get roadmap by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update roadmap progress
// @route   PUT /api/roadmaps/:id/progress
// @access  Private (Candidate)
const updateRoadmapProgress = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.updateRoadmapProgress(
      req.params.id,
      req.user.candidateId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: LearningRoadmapResponseDTO.fromRoadmap(result.roadmap).toJSON(),
    });
  } catch (error) {
    logger.error('Update roadmap progress error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Complete roadmap phase
// @route   PUT /api/roadmaps/:id/phases/:phaseId/complete
// @access  Private (Candidate)
const completeRoadmapPhase = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.completeRoadmapPhase(
      req.params.id,
      req.params.phaseId,
      req.user.candidateId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: LearningRoadmapResponseDTO.fromRoadmap(result.roadmap).toJSON(),
    });
  } catch (error) {
    logger.error('Complete roadmap phase error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get roadmap progress
// @route   GET /api/roadmaps/:id/progress
// @access  Private (Candidate)
const getRoadmapProgress = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.getRoadmapProgress(
      req.params.id,
      req.user.candidateId
    );

    res.status(200).json({
      success: true,
      data: result.progress,
    });
  } catch (error) {
    logger.error('Get roadmap progress error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete roadmap
// @route   DELETE /api/roadmaps/:id
// @access  Private (Candidate)
const deleteRoadmap = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.deleteRoadmap(
      req.params.id,
      req.user.candidateId
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete roadmap error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get roadmap recommendations
// @route   GET /api/roadmaps/recommendations
// @access  Private (Candidate)
const getRoadmapRecommendations = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.getRoadmapRecommendations(
      req.user.candidateId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.recommendations,
    });
  } catch (error) {
    logger.error('Get roadmap recommendations error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get roadmap stats
// @route   GET /api/roadmaps/stats
// @access  Private (Candidate)
const getRoadmapStats = asyncHandler(async (req, res) => {
  try {
    const result = await RoadmapService.getRoadmapStats(req.user.candidateId);

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get roadmap stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  generateRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  updateRoadmapProgress,
  completeRoadmapPhase,
  getRoadmapProgress,
  deleteRoadmap,
  getRoadmapRecommendations,
  getRoadmapStats,
};
