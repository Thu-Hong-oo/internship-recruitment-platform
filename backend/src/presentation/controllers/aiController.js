/**
 * AI Services Controller
 * Presentation Layer - AI/NLP Domain
 * REST API endpoints for AI-powered matching and NLP services
 */
const asyncHandler = require('express-async-handler');
const { logger } = require('../../shared/utils/logger');

// Import use cases
const MatchCandidateToJobUseCase = require('../../application/ai-nlp/use-cases/MatchCandidateToJobUseCase');
const ParseCVUseCase = require('../../application/ai-nlp/use-cases/ParseCVUseCase');
const ParseJobDescriptionUseCase = require('../../application/ai-nlp/use-cases/ParseJobDescriptionUseCase');

// Import services and repositories
const AIMatchingService = require('../../domain/ai-nlp/services/AIMatchingService');
const NLPEngine = require('../../domain/ai-nlp/services/NLPEngine');
const CVParser = require('../../domain/ai-nlp/services/CVParser');
const JobDescriptionParser = require('../../domain/ai-nlp/services/JobDescriptionParser');
const CandidateRepository = require('../../infrastructure/repositories/CandidateRepository');
const JobRepository = require('../../infrastructure/repositories/JobRepository');
const AiMatchingRepository = require('../../infrastructure/repositories/AiMatchingRepository');
const SkillRepository = require('../../infrastructure/repositories/SkillRepository');

// Import models
const AiMatching = require('../../infrastructure/models/AiMatching');

// Initialize dependencies
const nlpEngine = new NLPEngine({
  useAdvancedEngine: process.env.USE_ADVANCED_NLP === 'true' || false,
});
const skillRepository = new SkillRepository();
const candidateRepository = new CandidateRepository();
const jobRepository = new JobRepository();
const aiMatchingRepository = new AiMatchingRepository({
  aiMatchingModel: AiMatching,
});

const cvParser = new CVParser({
  nlpEngine,
  skillRepository,
});
const jobDescriptionParser = new JobDescriptionParser({
  nlpEngine,
  skillRepository,
});

const aiMatchingService = new AIMatchingService({
  nlpEngine,
  cvParser,
  jobDescriptionParser,
  skillRepository,
  matchingHistoryRepository: aiMatchingRepository,
});

// Initialize use cases
const matchCandidateToJobUseCase = new MatchCandidateToJobUseCase({
  aiMatchingService,
  candidateRepository,
  jobRepository,
  aiMatchingRepository,
});

const parseCVUseCase = new ParseCVUseCase({
  cvParser,
  nlpEngine,
  skillRepository,
});

const parseJobDescriptionUseCase = new ParseJobDescriptionUseCase({
  jobDescriptionParser,
  nlpEngine,
  skillRepository,
});

// @desc    Match candidate to job using AI
// @route   POST /api/ai/match
// @access  Private
const matchCandidateToJob = asyncHandler(async (req, res) => {
  try {
    const { candidateId, jobId, options = {} } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId and jobId are required',
      });
    }

    const result = await matchCandidateToJobUseCase.execute({
      candidateId,
      jobId,
      options,
      requestedBy: req.user._id,
    });

    logger.info(`AI matching completed successfully`, {
      candidateId,
      jobId,
      matchScore: result.matchScore,
      requestedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'AI matching completed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in AI matching:', {
      error: error.message,
      candidateId: req.body.candidateId,
      jobId: req.body.jobId,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to perform AI matching',
    });
  }
});

// @desc    Get AI matching history
// @route   GET /api/ai/matching-history
// @access  Private
const getMatchingHistory = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      candidateId,
      jobId,
      minScore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filters = {
      ...(candidateId && { candidateId }),
      ...(jobId && { jobId }),
      ...(minScore && {
        'matchResult.matchScore': { $gte: parseFloat(minScore) },
      }),
    };

    // For candidates, filter to their own history
    if (req.user.role === 'candidate' && req.user.candidateProfile) {
      filters.candidateId = req.user.candidateProfile._id;
    }

    const result = await aiMatchingRepository.findWithPagination(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'candidateId', select: 'firstName lastName email' },
        { path: 'jobId', select: 'title company location' },
      ],
    });

    logger.info(`Retrieved AI matching history`, {
      requestedBy: req.user._id,
      filters,
      resultCount: result.data.length,
    });

    res.status(200).json({
      success: true,
      message: 'AI matching history retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error retrieving AI matching history:', {
      error: error.message,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to retrieve AI matching history',
    });
  }
});

// @desc    Parse CV using AI/NLP
// @route   POST /api/ai/parse-cv
// @access  Private
const parseCV = asyncHandler(async (req, res) => {
  try {
    const { cvText, cvFile, options = {} } = req.body;

    if (!cvText && !cvFile) {
      return res.status(400).json({
        success: false,
        error: 'Either cvText or cvFile is required',
      });
    }

    const result = await parseCVUseCase.execute({
      cvText,
      cvFile,
      options,
      requestedBy: req.user._id,
    });

    logger.info(`CV parsing completed successfully`, {
      requestedBy: req.user._id,
      hasText: !!cvText,
      hasFile: !!cvFile,
      extractedSkillsCount: result.skills?.length || 0,
    });

    res.status(200).json({
      success: true,
      message: 'CV parsing completed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error parsing CV:', {
      error: error.message,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to parse CV',
    });
  }
});

// @desc    Parse job description using AI/NLP
// @route   POST /api/ai/parse-job-description
// @access  Private
const parseJobDescription = asyncHandler(async (req, res) => {
  try {
    const { jobDescription, options = {} } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'jobDescription is required',
      });
    }

    const result = await parseJobDescriptionUseCase.execute({
      jobDescription,
      options,
      requestedBy: req.user._id,
    });

    logger.info(`Job description parsing completed successfully`, {
      requestedBy: req.user._id,
      extractedSkillsCount: result.requiredSkills?.length || 0,
    });

    res.status(200).json({
      success: true,
      message: 'Job description parsing completed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error parsing job description:', {
      error: error.message,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to parse job description',
    });
  }
});

// @desc    Get skill suggestions based on profile/CV
// @route   POST /api/ai/suggestions/skills
// @access  Private
const getSkillSuggestions = asyncHandler(async (req, res) => {
  try {
    const { candidateId, currentSkills, targetRole, experienceLevel } =
      req.body;

    // Use current user if candidateId not provided and user is candidate
    const targetCandidateId =
      candidateId ||
      (req.user.role === 'candidate' ? req.user.candidateProfile?._id : null);

    if (!targetCandidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId is required',
      });
    }

    // TODO: Implement skill suggestions logic
    const suggestions = {
      recommendedSkills: [],
      learningPaths: [],
      marketDemand: {},
      confidenceScore: 0,
    };

    logger.info(`Skill suggestions generated`, {
      candidateId: targetCandidateId,
      requestedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Skill suggestions generated successfully',
      data: suggestions,
    });
  } catch (error) {
    logger.error('Error generating skill suggestions:', {
      error: error.message,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate skill suggestions',
    });
  }
});

// @desc    Get career path suggestions
// @route   POST /api/ai/suggestions/career
// @access  Private
const getCareerSuggestions = asyncHandler(async (req, res) => {
  try {
    const { candidateId, currentRole, interests, timeframe } = req.body;

    // Use current user if candidateId not provided and user is candidate
    const targetCandidateId =
      candidateId ||
      (req.user.role === 'candidate' ? req.user.candidateProfile?._id : null);

    if (!targetCandidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId is required',
      });
    }

    // TODO: Implement career suggestions logic
    const suggestions = {
      careerPaths: [],
      requiredSkills: [],
      marketOpportunities: {},
      timeline: {},
    };

    logger.info(`Career suggestions generated`, {
      candidateId: targetCandidateId,
      requestedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Career suggestions generated successfully',
      data: suggestions,
    });
  } catch (error) {
    logger.error('Error generating career suggestions:', {
      error: error.message,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to generate career suggestions',
    });
  }
});

// @desc    Get market insights and trends
// @route   GET /api/ai/insights/market
// @access  Private
const getMarketInsights = asyncHandler(async (req, res) => {
  try {
    const {
      industry,
      location,
      skillCategory,
      timeframe = '6months',
    } = req.query;

    // TODO: Implement market insights logic
    const insights = {
      demandTrends: {},
      salaryTrends: {},
      skillGaps: [],
      emergingSkills: [],
      geographicInsights: {},
    };

    logger.info(`Market insights retrieved`, {
      industry,
      location,
      requestedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Market insights retrieved successfully',
      data: insights,
    });
  } catch (error) {
    logger.error('Error retrieving market insights:', {
      error: error.message,
      requestedBy: req.user._id,
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to retrieve market insights',
    });
  }
});

module.exports = {
  matchCandidateToJob,
  getMatchingHistory,
  parseCV,
  parseJobDescription,
  getSkillSuggestions,
  getCareerSuggestions,
  getMarketInsights,
};
