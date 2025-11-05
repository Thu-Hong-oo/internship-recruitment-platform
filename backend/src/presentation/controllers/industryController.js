const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const IndustryService = require('../../infrastructure/services/internal/IndustryService');

// @desc    Get all industries
// @route   GET /api/industries
// @access  Public
const getAllIndustries = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getAllIndustries(req.query);

    res.status(200).json({
      success: true,
      data: result.industries,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get all industries error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get active industries
// @route   GET /api/industries/active
// @access  Public
const getActiveIndustries = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getActiveIndustries();

    res.status(200).json({
      success: true,
      data: result.industries,
    });
  } catch (error) {
    logger.error('Get active industries error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Search industries
// @route   GET /api/industries/search
// @access  Public
const searchIndustries = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const result = await IndustryService.searchIndustries(q);

    res.status(200).json({
      success: true,
      data: result.industries,
    });
  } catch (error) {
    logger.error('Search industries error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get industry trends
// @route   GET /api/industries/trends
// @access  Public
const getIndustryTrends = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getIndustryTrends();

    res.status(200).json({
      success: true,
      data: result.trends,
    });
  } catch (error) {
    logger.error('Get industry trends error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get industry by ID
// @route   GET /api/industries/:id
// @access  Public
const getIndustryById = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getIndustryById(req.params.id);

    res.status(200).json({
      success: true,
      data: result.industry,
    });
  } catch (error) {
    logger.error('Get industry by ID error:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get industry statistics
// @route   GET /api/industries/:id/stats
// @access  Public
const getIndustryStats = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getIndustryStats(req.params.id);

    res.status(200).json({
      success: true,
      data: result.stats,
    });
  } catch (error) {
    logger.error('Get industry stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get companies in industry
// @route   GET /api/industries/:id/companies
// @access  Public
const getIndustryCompanies = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getIndustryCompanies(
      req.params.id,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.companies,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get industry companies error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Get jobs in industry
// @route   GET /api/industries/:id/jobs
// @access  Public
const getIndustryJobs = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.getIndustryJobs(
      req.params.id,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Get industry jobs error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Create industry
// @route   POST /api/industries
// @access  Private (Admin)
const createIndustry = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.createIndustry(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.industry,
    });
  } catch (error) {
    logger.error('Create industry error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update industry
// @route   PATCH /api/industries/:id
// @access  Private (Admin)
const updateIndustry = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.updateIndustry(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.industry,
    });
  } catch (error) {
    logger.error('Update industry error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete industry
// @route   DELETE /api/industries/:id
// @access  Private (Admin)
const deleteIndustry = asyncHandler(async (req, res) => {
  try {
    const result = await IndustryService.deleteIndustry(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Delete industry error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = {
  getAllIndustries,
  getActiveIndustries,
  searchIndustries,
  getIndustryTrends,
  getIndustryById,
  getIndustryStats,
  getIndustryCompanies,
  getIndustryJobs,
  createIndustry,
  updateIndustry,
  deleteIndustry,
};
