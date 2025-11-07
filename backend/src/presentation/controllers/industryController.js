const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');
const IndustryService = require('../../infrastructure/services/internal/IndustryService');

const industryService = new IndustryService();

// @desc    Get all industries with filtering via query params
// @route   GET /api/industries
// @route   GET /api/industries?type=active
// @route   GET /api/industries?type=trends
// @route   GET /api/industries?search=software
// @access  Public
const getAllIndustries = asyncHandler(async (req, res) => {
  try {
    const { type, search, includeStats } = req.query;
    let result;

    // Route based on query parameter 'type'
    if (type === 'active') {
      result = await industryService.getActiveIndustries();
    } else if (type === 'trends') {
      result = await industryService.getIndustryTrends();
    } else if (search) {
      result = await industryService.searchIndustries(search);
    } else {
      // Default: get all industries
      result = await industryService.getAllIndustries(req.query);
    }

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
    const result = await industryService.getActiveIndustries();

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

    const result = await industryService.searchIndustries(q);

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
    const result = await industryService.getIndustryTrends();

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

// @desc    Get industry by ID with optional sub-resources
// @route   GET /api/industries/:id
// @route   GET /api/industries/:id?include=stats,companies,jobs
// @access  Public
const getIndustryById = asyncHandler(async (req, res) => {
  try {
    const { include, lang = 'vi' } = req.query;

    // Get base industry data
    const result = await industryService.getIndustryById(req.params.id, lang);

    // Check which additional data to include
    const includes = include ? include.split(',').map(i => i.trim()) : [];

    // Prepare response with basic data
    const response = {
      success: true,
      data: result.industry,
    };

    // Add requested additional data
    if (includes.includes('stats')) {
      const stats = await industryService.getIndustryStats(req.params.id);
      response.stats = stats.stats;
    }

    if (includes.includes('companies')) {
      const companies = await industryService.getIndustryCompanies(
        req.params.id,
        {
          page: req.query.companyPage || 1,
          limit: req.query.companyLimit || 10,
        }
      );
      response.companies = companies.companies;
      response.companiesPagination = companies.pagination;
    }

    if (includes.includes('jobs')) {
      const jobs = await industryService.getIndustryJobs(req.params.id, {
        page: req.query.jobPage || 1,
        limit: req.query.jobLimit || 10,
      });
      response.jobs = jobs.jobs;
      response.jobsPagination = jobs.pagination;
    }

    res.status(200).json(response);
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
    const result = await industryService.getIndustryStats(req.params.id);

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
    const result = await industryService.getIndustryCompanies(
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
    const result = await industryService.getIndustryJobs(
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
    const result = await industryService.createIndustry(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.industry,
    });
  } catch (error) {
    logger.error('Create industry error:', error);

    // Return 409 Conflict for duplicate code, 400 for other validation errors
    const statusCode = error.message.includes('already exists') ? 409 : 400;

    res.status(statusCode).json({
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
    const result = await industryService.updateIndustry(
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
    const result = await industryService.deleteIndustry(req.params.id);

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
