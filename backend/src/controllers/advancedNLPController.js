const aiService = require('../services/aiService');
const LearningRoadmap = require('../models/LearningRoadmap');
const CVMatchingScore = require('../models/CVMatchingScore');
const Job = require('../models/Job');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const { logger } = require('../utils/logger');
const { getCacheService } = require('../config/initializeServices');

/**
 * Advanced NLP Controller
 * Handles matching score and learning roadmap generation
 */
class AdvancedNLPController {
  /**
   * @route   POST /api/nlp/matching-score
   * @desc    Calculate advanced matching score between CV and Job
   * @access  Private (Candidate + Employer)
   */
  async calculateMatchingScore(req, res) {
    try {
      const { cvData, jobId, candidateId } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!cvData || !jobId) {
        return res.status(400).json({
          success: false,
          message: 'CV data and Job ID are required',
        });
      }

      // Fetch job data
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
        });
      }

      const finalCandidateId = candidateId || userId;

      // Try to get from cache first
      const cacheService = getCacheService();
      let matchingResult = null;
      
      if (cacheService) {
        matchingResult = await cacheService.getCachedMatchingScore(finalCandidateId, jobId);
      }

      // If not in cache, calculate matching score
      if (!matchingResult) {
        matchingResult = await aiService.calculateAdvancedMatchScore(
          cvData,
          job,
          {
            candidateId: finalCandidateId,
            jobId,
            saveToDatabase: true,
          }
        );

        // Cache the result
        if (cacheService) {
          await cacheService.cacheMatchingScore(finalCandidateId, jobId, matchingResult);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Matching score calculated successfully',
        data: matchingResult,
      });
    } catch (error) {
      logger.error('Error calculating matching score:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating matching score',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/matching-score/:jobId/:candidateId
   * @desc    Get existing matching score
   * @access  Private
   */
  async getMatchingScore(req, res) {
    try {
      const { jobId, candidateId } = req.params;

      // Try to get from cache first
      const cacheService = getCacheService();
      let matchingScore = null;
      
      if (cacheService) {
        const cached = await cacheService.getCachedMatchingScore(candidateId, jobId);
        if (cached) {
          // If cached result exists, return it
          return res.status(200).json({
            success: true,
            data: cached,
          });
        }
      }

      // If not in cache, fetch from database
      matchingScore = await CVMatchingScore.findOne({
        jobId,
        candidateId,
      }).populate('jobId candidateId', 'title fullName email');

      if (!matchingScore) {
        return res.status(404).json({
          success: false,
          message: 'Matching score not found',
        });
      }

      res.status(200).json({
        success: true,
        data: matchingScore,
      });
    } catch (error) {
      logger.error('Error fetching matching score:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching matching score',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/top-candidates/:jobId
   * @desc    Get top candidates for a job (For Employers)
   * @access  Private (Employer only)
   */
  async getTopCandidates(req, res) {
    try {
      const { jobId } = req.params;
      const { limit = 20, minScore = 70, tier } = req.query;

      // Verify job belongs to employer
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
        });
      }

      if (job.employerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Build query
      const query = {
        jobId,
        overallScore: { $gte: parseInt(minScore) },
      };

      if (tier) {
        query['ranking.tier'] = tier;
      }

      const topCandidates = await CVMatchingScore.find(query)
        .sort({ overallScore: -1, calculatedAt: -1 })
        .limit(parseInt(limit))
        .populate('candidateId', 'fullName email profile')
        .lean();

      // Get statistics
      const statistics = await CVMatchingScore.getMatchStatistics(jobId);

      res.status(200).json({
        success: true,
        data: {
          candidates: topCandidates,
          statistics,
          total: topCandidates.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching top candidates:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching top candidates',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/best-matches
   * @desc    Get best job matches for candidate
   * @access  Private (Candidate)
   */
  async getBestJobMatches(req, res) {
    try {
      const candidateId = req.user._id;
      const { limit = 10, minScore = 60 } = req.query;

      const bestMatches = await CVMatchingScore.find({
        candidateId,
        overallScore: { $gte: parseInt(minScore) },
      })
        .sort({ overallScore: -1 })
        .limit(parseInt(limit))
        .populate('jobId')
        .lean();

      res.status(200).json({
        success: true,
        data: bestMatches,
        total: bestMatches.length,
      });
    } catch (error) {
      logger.error('Error fetching best job matches:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching best job matches',
        error: error.message,
      });
    }
  }

  /**
   * @route   POST /api/nlp/learning-roadmap
   * @desc    Generate personalized learning roadmap
   * @access  Private (Candidate)
   */
  async generateLearningRoadmap(req, res) {
    try {
      const {
        targetJobId,
        targetRole,
        cvData,
        timeframe = 12,
      } = req.body;

      const candidateId = req.user._id;

      // Validate input
      if (!targetRole && !targetJobId) {
        return res.status(400).json({
          success: false,
          message: 'Target role or target job ID is required',
        });
      }

      let jobData = null;
      let roleTitle = targetRole;

      // Fetch job data if jobId provided
      if (targetJobId) {
        jobData = await Job.findById(targetJobId);
        if (!jobData) {
          return res.status(404).json({
            success: false,
            message: 'Target job not found',
          });
        }
        roleTitle = jobData.title;
      }

      // Get candidate profile if cvData not provided
      let candidateData = cvData;
      if (!candidateData) {
        const profile = await CandidateProfile.findOne({
          userId: candidateId,
        });
        if (profile) {
          candidateData = {
            skills: profile.skills,
            experience: profile.workExperience,
            education: profile.education,
            currentLevel: profile.experienceLevel || 'beginner',
          };
        }
      }

      // Generate roadmap
      const roadmap = await aiService.generatePersonalizedRoadmap({
        candidateId,
        targetJobId,
        targetRole: roleTitle,
        cvData: candidateData || {},
        jobData,
        timeframe: parseInt(timeframe),
        saveToDatabase: true,
      });

      res.status(201).json({
        success: true,
        message: 'Learning roadmap generated successfully',
        data: roadmap,
      });
    } catch (error) {
      logger.error('Error generating learning roadmap:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating learning roadmap',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/learning-roadmap/:roadmapId
   * @desc    Get learning roadmap by ID
   * @access  Private
   */
  async getLearningRoadmap(req, res) {
    try {
      const { roadmapId } = req.params;

      const roadmap = await LearningRoadmap.findById(roadmapId)
        .populate('candidateId', 'fullName email')
        .populate('targetJobId', 'title company');

      if (!roadmap) {
        return res.status(404).json({
          success: false,
          message: 'Learning roadmap not found',
        });
      }

      // Check access permission
      if (
        roadmap.candidateId._id.toString() !== req.user._id.toString() &&
        !roadmap.isPublic
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.status(200).json({
        success: true,
        data: roadmap,
      });
    } catch (error) {
      logger.error('Error fetching learning roadmap:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching learning roadmap',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/my-roadmaps
   * @desc    Get all roadmaps for current user
   * @access  Private (Candidate)
   */
  async getMyRoadmaps(req, res) {
    try {
      const candidateId = req.user._id;
      const { status } = req.query;

      const query = { candidateId };
      if (status) {
        query.status = status;
      }

      const roadmaps = await LearningRoadmap.find(query)
        .sort({ createdAt: -1 })
        .populate('targetJobId', 'title company');

      res.status(200).json({
        success: true,
        data: roadmaps,
        total: roadmaps.length,
      });
    } catch (error) {
      logger.error('Error fetching roadmaps:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching roadmaps',
        error: error.message,
      });
    }
  }

  /**
   * @route   PUT /api/nlp/learning-roadmap/:roadmapId/progress
   * @desc    Update roadmap progress
   * @access  Private (Candidate)
   */
  async updateRoadmapProgress(req, res) {
    try {
      const { roadmapId } = req.params;
      const { weekNumber, resourceId, phaseNumber } = req.body;

      const roadmap = await LearningRoadmap.findById(roadmapId);

      if (!roadmap) {
        return res.status(404).json({
          success: false,
          message: 'Roadmap not found',
        });
      }

      // Check ownership
      if (roadmap.candidateId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Update progress
      if (weekNumber) {
        await roadmap.updateProgress(weekNumber);
      }

      if (resourceId) {
        await roadmap.markResourceCompleted(resourceId);
      }

      if (phaseNumber) {
        roadmap.progress.currentPhase = phaseNumber;
        await roadmap.save();
      }

      res.status(200).json({
        success: true,
        message: 'Progress updated successfully',
        data: roadmap,
      });
    } catch (error) {
      logger.error('Error updating roadmap progress:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating progress',
        error: error.message,
      });
    }
  }

  /**
   * @route   PUT /api/nlp/learning-roadmap/:roadmapId/feedback
   * @desc    Submit feedback for roadmap
   * @access  Private (Candidate)
   */
  async submitRoadmapFeedback(req, res) {
    try {
      const { roadmapId } = req.params;
      const { rating, comment, isHelpful } = req.body;

      const roadmap = await LearningRoadmap.findById(roadmapId);

      if (!roadmap) {
        return res.status(404).json({
          success: false,
          message: 'Roadmap not found',
        });
      }

      if (roadmap.candidateId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      roadmap.feedback = {
        rating,
        comment,
        isHelpful,
        submittedAt: new Date(),
      };

      await roadmap.save();

      res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: roadmap,
      });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting feedback',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/roadmap/recommended-resources/:roadmapId
   * @desc    Get recommended resources for current week
   * @access  Private
   */
  async getRecommendedResources(req, res) {
    try {
      const { roadmapId } = req.params;
      const { phase, week } = req.query;

      const roadmap = await LearningRoadmap.findById(roadmapId);

      if (!roadmap) {
        return res.status(404).json({
          success: false,
          message: 'Roadmap not found',
        });
      }

      const resources = roadmap.getRecommendedResources(
        parseInt(phase) || roadmap.progress.currentPhase,
        parseInt(week) || roadmap.progress.currentWeek
      );

      res.status(200).json({
        success: true,
        data: resources,
      });
    } catch (error) {
      logger.error('Error fetching recommended resources:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching resources',
        error: error.message,
      });
    }
  }

  /**
   * @route   GET /api/nlp/popular-roadmaps
   * @desc    Get popular public roadmaps
   * @access  Public
   */
  async getPopularRoadmaps(req, res) {
    try {
      const { limit = 10 } = req.query;

      const popularRoadmaps = await LearningRoadmap.getPopularRoadmaps(
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        data: popularRoadmaps,
      });
    } catch (error) {
      logger.error('Error fetching popular roadmaps:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching popular roadmaps',
        error: error.message,
      });
    }
  }

  /**
   * @route   POST /api/nlp/recalculate-scores/:jobId
   * @desc    Recalculate matching scores for all applicants (Employer only)
   * @access  Private (Employer)
   */
  async recalculateJobScores(req, res) {
    try {
      const { jobId } = req.params;

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
        });
      }

      if (job.employerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Mark all scores as stale
      await CVMatchingScore.updateMany(
        { jobId },
        { isStale: true, recalculationReason: 'Manual recalculation' }
      );

      res.status(200).json({
        success: true,
        message: 'Recalculation initiated. Scores will be updated shortly.',
      });
    } catch (error) {
      logger.error('Error initiating recalculation:', error);
      res.status(500).json({
        success: false,
        message: 'Error initiating recalculation',
        error: error.message,
      });
    }
  }
}

module.exports = new AdvancedNLPController();
