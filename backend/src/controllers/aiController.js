const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const aiService = require('../services/aiService');
const { logger } = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/cv');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// @desc    Analyze CV/Resume
// @route   POST /api/ai/analyze-cv
// @access  Private
const analyzeCV = asyncHandler(async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a CV file'
      });
    }

    const filePath = req.file.path;
    const userId = req.user.id;

    logger.info(`Starting CV analysis for user ${userId}`, { 
      filename: req.file.filename,
      originalName: req.file.originalname 
    });

    // Extract text from CV
    const extractedText = await aiService.extractTextFromCV(filePath);
    
    if (!extractedText || extractedText.trim().length === 0) {
      // Clean up uploaded file
      await fs.unlink(filePath);
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from CV. Please ensure the file is readable.'
      });
    }

    // Analyze CV content
    const analysis = await aiService.analyzeCV(extractedText);

    // Update user profile with extracted information
    const updateData = {
      resume: {
        url: filePath,
        filename: req.file.filename,
        uploadedAt: new Date()
      }
    };

    // Update skills if extracted
    if (analysis.skills && analysis.skills.length > 0) {
      updateData.skills = analysis.skills.map(skill => ({
        name: skill.name,
        level: skill.level || 'intermediate',
        yearsOfExperience: skill.yearsOfExperience || 0
      }));
    }

    // Update experience if extracted
    if (analysis.experience && analysis.experience.length > 0) {
      updateData.experience = analysis.experience;
    }

    // Update education if extracted
    if (analysis.education) {
      updateData.education = analysis.education;
    }

    // Save updated user profile
    await User.findByIdAndUpdate(userId, updateData, { new: true });

    logger.info(`CV analysis completed for user ${userId}`, { 
      skillsCount: analysis.skills?.length || 0,
      experienceCount: analysis.experience?.length || 0 
    });

    res.status(200).json({
      success: true,
      data: {
        analysis,
        extractedText: extractedText.substring(0, 500) + '...', // First 500 chars for preview
        filename: req.file.filename,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }

    logger.error('CV analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'CV analysis failed. Please try again.'
    });
  }
});

// @desc    Get job recommendations
// @route   POST /api/ai/job-recommendations
// @access  Private
const getJobRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 10, minScore = 60 } = req.body;

  try {
    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get active jobs
    const jobs = await Job.findActive().populate('postedBy', 'firstName lastName company');

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          recommendations: [],
          message: 'No active jobs available at the moment'
        }
      });
    }

    // Get recommendations from AI service
    const recommendations = await aiService.getJobRecommendations(user, jobs, {
      limit: parseInt(limit),
      minScore: parseInt(minScore)
    });

    logger.info(`Generated ${recommendations.length} job recommendations for user ${userId}`);

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        totalJobs: jobs.length,
        filteredCount: recommendations.length
      }
    });

  } catch (error) {
    logger.error('Job recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate job recommendations'
    });
  }
});

// @desc    Generate skill roadmap
// @route   POST /api/ai/skill-roadmap
// @access  Private
const generateSkillRoadmap = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { targetRole, targetSkills, timeframe = 12, currentLevel = 'beginner' } = req.body;

  try {
    // Validate input
    if (!targetRole && (!targetSkills || targetSkills.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a target role or target skills'
      });
    }

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate roadmap
    const roadmap = await aiService.generateSkillRoadmap({
      user,
      targetRole,
      targetSkills,
      timeframe: parseInt(timeframe),
      currentLevel
    });

    logger.info(`Generated skill roadmap for user ${userId}`, { 
      targetRole, 
      timeframe, 
      skillsCount: roadmap.skills?.length || 0 
    });

    res.status(200).json({
      success: true,
      data: roadmap
    });

  } catch (error) {
    logger.error('Skill roadmap generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate skill roadmap'
    });
  }
});

// @desc    Analyze job posting
// @route   POST /api/ai/analyze-job
// @access  Private (Employer only)
const analyzeJobPosting = asyncHandler(async (req, res) => {
  const { jobId, jobDescription } = req.body;

  try {
    let job;

    if (jobId) {
      // Analyze existing job
      job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Check if user owns this job
      if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to analyze this job'
        });
      }
    } else if (jobDescription) {
      // Analyze job description text
      job = { description: jobDescription, title: 'Job Analysis' };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide either jobId or jobDescription'
      });
    }

    // Perform AI analysis
    const analysis = await aiService.analyzeJobPosting(job);

    // Update job with AI analysis if it's an existing job
    if (jobId && job._id) {
      job.aiAnalysis = {
        ...analysis,
        lastAnalyzed: new Date()
      };
      await job.save();
    }

    logger.info(`Job analysis completed`, { 
      jobId: jobId || 'description-only',
      skillsFound: analysis.skillsExtracted?.length || 0 
    });

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Job analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze job posting'
    });
  }
});

// @desc    Get application match score
// @route   POST /api/ai/match-score
// @access  Private
const getMatchScore = asyncHandler(async (req, res) => {
  const { jobId, applicantId } = req.body;
  const userId = req.user.id;

  try {
    // Get job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Get applicant (if not provided, use current user)
    const targetApplicantId = applicantId || userId;
    const applicant = await User.findById(targetApplicantId);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found'
      });
    }

    // Check authorization
    if (applicantId && applicantId !== userId && req.user.role !== 'admin' && job.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this match score'
      });
    }

    // Calculate match score
    const matchScore = await aiService.calculateMatchScore(applicant, job);

    // Check if there's an existing application
    let application = null;
    if (targetApplicantId === userId) {
      application = await Application.findOne({ 
        job: jobId, 
        applicant: targetApplicantId 
      });

      // Update application with match score if it exists
      if (application) {
        application.aiAnalysis = {
          ...application.aiAnalysis,
          ...matchScore,
          lastAnalyzed: new Date()
        };
        await application.save();
      }
    }

    logger.info(`Match score calculated`, { 
      jobId, 
      applicantId: targetApplicantId, 
      score: matchScore.overallScore 
    });

    res.status(200).json({
      success: true,
      data: {
        matchScore,
        hasApplication: !!application,
        applicationId: application?._id
      }
    });

  } catch (error) {
    logger.error('Match score calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate match score'
    });
  }
});

// @desc    Get AI insights for dashboard
// @route   GET /api/ai/insights
// @access  Private
const getAIInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let insights = {};

    if (userRole === 'student') {
      // Student insights
      const user = await User.findById(userId);
      const applications = await Application.find({ applicant: userId })
        .populate('job', 'title company')
        .sort({ createdAt: -1 })
        .limit(10);

      insights = {
        profileStrength: await aiService.calculateProfileStrength(user),
        skillGaps: await aiService.identifySkillGaps(user),
        applicationInsights: {
          totalApplications: applications.length,
          averageScore: applications.reduce((acc, app) => 
            acc + (app.aiAnalysis?.overallScore || 0), 0) / Math.max(applications.length, 1),
          topMatchingJobs: applications
            .filter(app => app.aiAnalysis?.overallScore > 80)
            .map(app => ({
              job: app.job,
              score: app.aiAnalysis.overallScore
            }))
        },
        recommendations: {
          skillsToImprove: await aiService.getSkillRecommendations(user),
          careerSuggestions: await aiService.getCareerSuggestions(user)
        }
      };

    } else if (userRole === 'employer') {
      // Employer insights
      const jobs = await Job.find({ postedBy: userId });
      const applications = await Application.find({ 
        job: { $in: jobs.map(j => j._id) } 
      }).populate('applicant', 'firstName lastName');

      insights = {
        jobPerformance: await aiService.analyzeJobPerformance(jobs),
        applicantInsights: await aiService.getApplicantInsights(applications),
        marketTrends: await aiService.getMarketTrends(),
        recommendations: {
          jobOptimization: await aiService.getJobOptimizationTips(jobs),
          talentPool: await aiService.getTalentPoolInsights()
        }
      };

    } else if (userRole === 'admin') {
      // Admin insights
      insights = {
        platformStats: await aiService.getPlatformStatistics(),
        userBehavior: await aiService.getUserBehaviorInsights(),
        systemPerformance: await aiService.getSystemPerformanceMetrics(),
        trends: await aiService.getPlatformTrends()
      };
    }

    logger.info(`AI insights generated for user ${userId}`, { role: userRole });

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    logger.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights'
    });
  }
});

// @desc    Batch analyze applications
// @route   POST /api/ai/batch-analyze
// @access  Private (Employer/Admin only)
const batchAnalyzeApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user.id;

  try {
    // Get job and verify ownership
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.postedBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to analyze applications for this job'
      });
    }

    // Get all applications for this job
    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'firstName lastName skills experience education');

    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No applications found for this job',
          analyzed: 0
        }
      });
    }

    // Batch analyze applications
    const analysisResults = [];
    for (const application of applications) {
      try {
        const matchScore = await aiService.calculateMatchScore(application.applicant, job);
        
        application.aiAnalysis = {
          ...application.aiAnalysis,
          ...matchScore,
          lastAnalyzed: new Date()
        };
        
        await application.save();
        analysisResults.push({
          applicationId: application._id,
          applicantName: application.applicant.fullName,
          score: matchScore.overallScore,
          status: 'analyzed'
        });

      } catch (error) {
        logger.error(`Error analyzing application ${application._id}:`, error);
        analysisResults.push({
          applicationId: application._id,
          applicantName: application.applicant.fullName,
          status: 'error',
          error: error.message
        });
      }
    }

    logger.info(`Batch analysis completed for job ${jobId}`, { 
      totalApplications: applications.length,
      successful: analysisResults.filter(r => r.status === 'analyzed').length
    });

    res.status(200).json({
      success: true,
      data: {
        jobTitle: job.title,
        totalApplications: applications.length,
        analyzed: analysisResults.filter(r => r.status === 'analyzed').length,
        errors: analysisResults.filter(r => r.status === 'error').length,
        results: analysisResults
      }
    });

  } catch (error) {
    logger.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch analysis failed'
    });
  }
});

module.exports = {
  analyzeCV: [upload.single('cv'), analyzeCV],
  getJobRecommendations,
  generateSkillRoadmap,
  analyzeJobPosting,
  getMatchScore,
  getAIInsights,
  batchAnalyzeApplications
};
