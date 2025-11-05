const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const SkillService = require('../../infrastructure/services/internal/SkillService');
const SkillResponseDTO = require('../dtos/SkillResponseDTO');

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
const getAllSkills = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getAllSkills(req.query);

    res.status(200).json({
      success: true,
      data: SkillResponseDTO.fromSkills(result.skills).map(dto => dto.toJSON()),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get all skills error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
const getSkillById = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getSkillById(req.params.id);

    res.status(200).json({
      success: true,
      data: SkillResponseDTO.fromSkill(result.skill).toJSON(),
    });
  } catch (error) {
    logger.error('Get skill by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Search skills
// @route   GET /api/skills/search
// @access  Public
const searchSkills = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.searchSkills(req.query);

    res.status(200).json({
      success: true,
      data: SkillResponseDTO.fromSkills(result.skills).map(dto => dto.toJSON()),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Search skills error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get skill categories
// @route   GET /api/skills/categories
// @access  Public
const getSkillCategories = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getSkillCategories(req.query);

    res.status(200).json({
      success: true,
      data: result.categories,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get skill categories error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get skills by category
// @route   GET /api/skills/category/:categoryId
// @access  Public
const getSkillsByCategory = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getSkillsByCategory(
      req.params.categoryId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: SkillResponseDTO.fromSkills(result.skills).map(dto => dto.toJSON()),
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get skills by category error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get popular skills
// @route   GET /api/skills/popular
// @access  Public
const getPopularSkills = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getPopularSkills(req.query);

    res.status(200).json({
      success: true,
      data: SkillResponseDTO.fromSkills(result.skills).map(dto => dto.toJSON()),
    });
  } catch (error) {
    logger.error('Get popular skills error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get trending skills
// @route   GET /api/skills/trending
// @access  Public
const getTrendingSkills = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getTrendingSkills(req.query);

    res.status(200).json({
      success: true,
      data: SkillResponseDTO.fromSkills(result.skills).map(dto => dto.toJSON()),
    });
  } catch (error) {
    logger.error('Get trending skills error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get skill recommendations for candidate
// @route   GET /api/skills/recommendations
// @access  Private (Candidate)
const getSkillRecommendations = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getSkillRecommendations(
      req.user.candidateId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.recommendations,
    });
  } catch (error) {
    logger.error('Get skill recommendations error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get skill stats
// @route   GET /api/skills/stats
// @access  Public
const getSkillStats = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.getSkillStats();

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get skill stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create skill (Admin)
// @route   POST /api/skills
// @access  Private (Admin)
const createSkill = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.createSkill(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: SkillResponseDTO.fromSkill(result.skill).toJSON(),
    });
  } catch (error) {
    logger.error('Create skill error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update skill (Admin)
// @route   PUT /api/skills/:id
// @access  Private (Admin)
const updateSkill = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.updateSkill(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: SkillResponseDTO.fromSkill(result.skill).toJSON(),
    });
  } catch (error) {
    logger.error('Update skill error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete skill (Admin)
// @route   DELETE /api/skills/:id
// @access  Private (Admin)
const deleteSkill = asyncHandler(async (req, res) => {
  try {
    const result = await SkillService.deleteSkill(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete skill error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  getAllSkills,
  getSkillById,
  searchSkills,
  getSkillCategories,
  getSkillsByCategory,
  getPopularSkills,
  getTrendingSkills,
  getSkillRecommendations,
  getSkillStats,
  createSkill,
  updateSkill,
  deleteSkill,
};
