const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const aiService = require('../services/ai/aiService');
const { logger } = require('../utils/logger');
const { ApiResponse } = require('../utils/responseHandler');
const { AppError } = require('../utils/errors');

// ============================================
// MULTER CONFIGURATION FOR CV UPLOAD
// ============================================
// Ensure upload directory exists
const uploadPath = path.join(__dirname, '../../uploads/cv');
if (!fsSync.existsSync(uploadPath)) {
  fsSync.mkdirSync(uploadPath, { recursive: true });
  logger.info(`Created upload directory: ${uploadPath}`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Directory is already created above
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

// ============================================
// AI CONTROLLER CLASS
// ============================================
class AIController {
  constructor() {
    // CV Analysis
    this.analyzeCV = [upload.single('cv'), this.analyzeCVHandler.bind(this)];
    this.analyzeCVText = this.analyzeCVText.bind(this);

    // Job & Career AI
    this.getJobRecommendations = this.getJobRecommendations.bind(this);
    this.getCandidateRecommendations = this.getCandidateRecommendations.bind(this);
    this.analyzeJobPosting = this.analyzeJobPosting.bind(this);
    this.analyzeJobDescription = this.analyzeJobDescription.bind(this);

    // Matching & Scoring
    this.analyzeJobMatch = this.analyzeJobMatch.bind(this);
    this.getMatchScore = this.getMatchScore.bind(this);
    this.analyzeCandidate = this.analyzeCandidate.bind(this);

    // Skills & Learning
    this.getSkillGapAnalysis = this.getSkillGapAnalysis.bind(this);
    this.generateSkillRoadmap = this.generateSkillRoadmap.bind(this);
    this.getAISuggestions = this.getAISuggestions.bind(this);

    // Insights & Analytics
    this.getCandidateInsights = this.getCandidateInsights.bind(this);
    this.getEmployerInsights = this.getEmployerInsights.bind(this);
    this.getAIInsights = this.getAIInsights.bind(this);

    // Batch Operations
    this.batchAnalyzeApplications = this.batchAnalyzeApplications.bind(this);
  }

  // ========================================
  // CV ANALYSIS ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/analyze-cv
   * Phân tích CV từ file upload
   */
  async analyzeCVHandler(req, res) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, 'Please upload a CV file', 400);
      }

      const filePath = req.file.path;
      const userId = req.user.id;

      logger.info(`Starting CV analysis for user ${userId}`, {
        filename: req.file.filename,
        originalName: req.file.originalname,
      });

      // Extract text from CV
      const extractedText = await aiService.extractTextFromCV(filePath);

      if (!extractedText || extractedText.trim().length === 0) {
        await fs.unlink(filePath);
        return ApiResponse.error(
          res,
          'Could not extract text from CV. Please ensure the file is readable.',
          400
        );
      }

      // Analyze CV content using self-sufficient AI
      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeCV(extractedText);
      logger.info('🔬 CV analyzed (self-sufficient mode)');

      // Update user profile with extracted information
      const updateData = {
        resume: {
          url: filePath,
          filename: req.file.filename,
          uploadedAt: new Date(),
        },
      };

      if (analysis.skills && analysis.skills.length > 0) {
        updateData.skills = analysis.skills.map(skill => ({
          name: skill.name,
          level: skill.level || 'intermediate',
          yearsOfExperience: skill.yearsOfExperience || 0,
        }));
      }

      if (analysis.experience && analysis.experience.length > 0) {
        updateData.experience = analysis.experience;
      }

      if (analysis.education) {
        updateData.education = analysis.education;
      }

      await User.findByIdAndUpdate(userId, updateData, { new: true });

      logger.info(`CV analysis completed for user ${userId}`, {
        skillsCount: analysis.skills?.length || 0,
        experienceCount: analysis.experience?.length || 0,
      });

      return ApiResponse.success(
        res,
        {
          analysis,
          extractedText: extractedText.substring(0, 500) + '...',
          filename: req.file.filename,
          uploadedAt: new Date(),
        },
        'CV analyzed successfully'
      );
    } catch (error) {
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting uploaded file:', unlinkError);
        }
      }

      logger.error('CV analysis error:', error);
      return ApiResponse.error(
        res,
        'CV analysis failed. Please try again.',
        500
      );
    }
  }

  /**
   * POST /api/ai/analyze-cv-text
   * Phân tích CV từ văn bản thô (không cần upload file)
   */
  async analyzeCVText(req, res, next) {
    try {
      const { rawCVText } = req.body;

      if (
        !rawCVText ||
        typeof rawCVText !== 'string' ||
        rawCVText.trim().length === 0
      ) {
        return ApiResponse.error(res, 'Missing or invalid rawCVText', 400);
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeCV(rawCVText);
      logger.info('🔬 CV analyzed from text (self-sufficient mode)');

      let profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        profile = new CandidateProfile({ userId: req.user.id });
      }

      // Update profile với dữ liệu AI extract (không ghi đè dữ liệu có sẵn)
      profile.skills = analysis.skills || profile.skills;
      profile.experience = analysis.experience || profile.experience;
      profile.education = analysis.education || profile.education;
      profile.personalInfo = {
        ...profile.personalInfo,
        ...analysis.contact,
        bio: analysis.summary || profile.personalInfo?.bio || '',
      };

      await profile.save();

      return ApiResponse.success(
        res,
        {
          analysis,
          message: 'CV analyzed from text successfully',
        },
        'CV analyzed from text successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/analyze-cv-improvements
   * Phân tích CV và đưa ra gợi ý cải thiện để viết CV hay hơn
   */
  async analyzeCVImprovements(req, res, next) {
    try {
      const { cvData, cvText, cvId } = req.body;
      const userId = req.user.id;

      // Get CV data from profile if not provided
      let finalCvData = cvData;
      let finalCvText = cvText;

      if (!finalCvData || !finalCvText) {
        // Try to get from candidate profile
        const profile = await CandidateProfile.findOne({ userId });
        if (profile) {
          if (!finalCvData) {
            finalCvData = {
              personalInfo: profile.personalInfo,
              education: profile.education,
              experience: profile.experience,
              skills: profile.skills,
            };
          }

          // Try to get CV text from resume if cvId provided
          if (!finalCvText && cvId) {
            try {
              const aiService = require('../services/ai/aiService');
              const resume = profile.resume?.current || 
                            (profile.resume?.history && profile.resume.history.find(h => h._id?.toString() === cvId));
              
              if (resume?.url) {
                const extractedText = await aiService.extractTextFromCV(resume.url);
                if (extractedText) {
                  finalCvText = extractedText;
                }
              }
            } catch (extractError) {
              logger.warn('Could not extract text from CV file:', extractError.message);
            }
          }

          // Build CV text from profile data if still not available
          if (!finalCvText && finalCvData) {
            const parts = [];
            if (finalCvData.personalInfo?.bio) parts.push(finalCvData.personalInfo.bio);
            if (finalCvData.experience) {
              finalCvData.experience.forEach(exp => {
                parts.push(`${exp.position} at ${exp.company}: ${exp.description || ''}`);
              });
            }
            if (finalCvData.education) {
              finalCvData.education.forEach(edu => {
                parts.push(`${edu.degree} in ${edu.major} from ${edu.school || edu.institution}`);
              });
            }
            if (finalCvData.skills) {
              const techSkills = finalCvData.skills.technical?.map(s => s.name || s).join(', ') || '';
              const softSkills = finalCvData.skills.soft?.map(s => s.name || s).join(', ') || '';
              if (techSkills) parts.push(`Technical skills: ${techSkills}`);
              if (softSkills) parts.push(`Soft skills: ${softSkills}`);
            }
            finalCvText = parts.join('\n');
          }
        }
      }

      if (!finalCvData && !finalCvText) {
        return ApiResponse.error(
          res,
          'Please provide cvData and cvText, or ensure you have a CV uploaded',
          400
        );
      }

      if (!finalCvText || finalCvText.trim().length < 50) {
        return ApiResponse.error(
          res,
          'CV text is too short or missing. Please upload a CV or provide cvText.',
          400
        );
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const improvements = await selfSufficientAI.analyzeCVImprovements(
        finalCvData || {},
        finalCvText
      );
      
      logger.info('📝 CV improvements analyzed', {
        userId,
        overallScore: improvements.overallScore,
        suggestionsCount: Object.values(improvements.suggestions).flat().length
      });

      return ApiResponse.success(
        res,
        improvements,
        'CV improvements analysis completed successfully'
      );
    } catch (error) {
      logger.error('CV improvements analysis error:', error);
      next(error);
    }
  }

  // ========================================
  // JOB & CAREER AI ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/job-recommendations
   * Lấy gợi ý công việc dựa trên profile
   */
  async getJobRecommendations(req, res) {
    const userId = req.user.id;
    const { limit = 10, minScore = 60 } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      const jobs = await Job.findActive().populate(
        'postedBy',
        'firstName lastName company'
      );

      if (jobs.length === 0) {
        return ApiResponse.success(
          res,
          {
            recommendations: [],
            message: 'No active jobs available at the moment',
          },
          'No active jobs found'
        );
      }

      const recommendations = await aiService.getJobRecommendations(
        user,
        jobs,
        {
          limit: parseInt(limit),
          minScore: parseInt(minScore),
        }
      );

      logger.info(
        `Generated ${recommendations.length} job recommendations for user ${userId}`
      );

      return ApiResponse.success(
        res,
        {
          recommendations,
          totalJobs: jobs.length,
          filteredCount: recommendations.length,
        },
        'Job recommendations generated successfully'
      );
    } catch (error) {
      logger.error('Job recommendations error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate job recommendations',
        500
      );
    }
  }

  /**
   * POST /api/ai/candidate-recommendations
   * Lấy gợi ý ứng viên phù hợp cho một job (Employer only)
   */
  async getCandidateRecommendations(req, res) {
    const { jobId, limit = 10, minScore = 60 } = req.body;

    try {
      const Job = require('../models/Job');
      const CandidateProfile = require('../models/CandidateProfile');
      const CandidateRecommendation = require('../models/CandidateRecommendation');
      const { getCacheService } = require('../services/cache/cacheService');

      // Verify job exists
      const job = await Job.findById(jobId).populate('postedBy', 'id company');
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      // Verify user is employer and owns the job
      if (!req.user.role || req.user.role !== 'employer') {
        return ApiResponse.error(res, 'Only employers can view candidate recommendations', 403);
      }

      if (job.postedBy && job.postedBy._id.toString() !== req.user.id && job.postedBy.id?.toString() !== req.user.id) {
        return ApiResponse.error(res, 'Not authorized to view recommendations for this job', 403);
      }

      // Check cache first
      const cacheService = getCacheService();
      const cached = await cacheService.getCachedCandidateRecommendations(jobId);
      if (cached && cached.length > 0) {
        logger.info(`Retrieved ${cached.length} candidate recommendations from cache for job ${jobId}`);
        return ApiResponse.success(
          res,
          {
            recommendations: cached,
            totalCandidates: cached.length,
            filteredCount: cached.length,
            cached: true,
          },
          'Candidate recommendations retrieved from cache'
        );
      }

      // Get all active candidate profiles
      // Filter candidates that are searchable and active
      const candidates = await CandidateProfile.find({
        status: 'active',
        'settings.searchable': true,
        $or: [
          { deletedAt: { $exists: false } },
          { deletedAt: null },
        ],
      })
        .populate('userId', 'email')
        .limit(1000) // Limit to avoid performance issues with large datasets
        .lean();

      if (candidates.length === 0) {
        return ApiResponse.success(
          res,
          {
            recommendations: [],
            message: 'No active candidates available at the moment',
          },
          'No candidates found'
        );
      }

      // Generate recommendations
      const recommendations = await aiService.getCandidateRecommendations(
        job,
        candidates,
        {
          limit: parseInt(limit),
          minScore: parseInt(minScore),
        }
      );

      // Cache results (1 hour)
      if (recommendations.length > 0) {
        await cacheService.cacheCandidateRecommendations(jobId, recommendations, 3600);
      }

      // Save to database
      if (recommendations.length > 0) {
        await CandidateRecommendation.findOneAndUpdate(
          { jobId },
          {
            jobId,
            recommendations,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isStale: false,
          },
          { upsert: true, new: true }
        );
      }

      logger.info(
        `Generated ${recommendations.length} candidate recommendations for job ${jobId}`
      );

      return ApiResponse.success(
        res,
        {
          recommendations,
          totalCandidates: candidates.length,
          filteredCount: recommendations.length,
          cached: false,
        },
        'Candidate recommendations generated successfully'
      );
    } catch (error) {
      logger.error('Candidate recommendations error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate candidate recommendations',
        500
      );
    }
  }

  /**
   * POST /api/ai/analyze-job-posting
   * Phân tích job posting (từ jobId hoặc mô tả)
   */
  async analyzeJobPosting(req, res) {
    const { jobId, jobDescription } = req.body;

    try {
      let job;

      if (jobId) {
        job = await Job.findById(jobId);
        if (!job) {
          return ApiResponse.error(res, 'Job not found', 404);
        }

        if (
          job.postedBy.toString() !== req.user.id &&
          req.user.role !== 'admin'
        ) {
          return ApiResponse.error(
            res,
            'Not authorized to analyze this job',
            403
          );
        }
      } else if (jobDescription) {
        job = { description: jobDescription, title: 'Job Analysis' };
      } else {
        return ApiResponse.error(
          res,
          'Please provide either jobId or jobDescription',
          400
        );
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeJobPosting(job);
      logger.info('📝 Job posting analyzed (self-sufficient mode)');

      if (jobId && job._id) {
        job.aiAnalysis = {
          ...analysis,
          lastAnalyzed: new Date(),
        };
        await job.save();
      }

      logger.info(`Job analysis completed`, {
        jobId: jobId || 'description-only',
        skillsFound: analysis.skillsExtracted?.length || 0,
      });

      return ApiResponse.success(
        res,
        analysis,
        'Job posting analyzed successfully'
      );
    } catch (error) {
      logger.error('Job analysis error:', error);
      return ApiResponse.error(res, 'Failed to analyze job posting', 500);
    }
  }

  /**
   * POST /api/ai/analyze-job-description
   * Phân tích job description chi tiết (dành cho CV optimization)
   */
  async analyzeJobDescription(req, res, next) {
    try {
      const { jobDescription, targetJob, companyInfo } = req.body;

      if (!jobDescription) {
        return ApiResponse.error(res, 'Job description is required', 400);
      }

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return ApiResponse.error(res, 'Profile not found', 404);
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeJobDescription(
        jobDescription,
        targetJob,
        companyInfo
      );
      logger.info('🔬 Job description analyzed (self-sufficient mode)');

      return ApiResponse.success(
        res,
        analysis,
        'Job description analyzed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // MATCHING & SCORING ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/analyze-job-match
   * Phân tích độ khớp giữa candidate và job
   * 
   * @deprecated This endpoint is deprecated. Use /api/nlp/matching-score instead for advanced matching with detailed breakdown, caching, and recalculation.
   */
  async analyzeJobMatch(req, res, next) {
    try {
      // Deprecation warning
      logger.warn('Deprecated endpoint /api/ai/analyze-job-match called. Consider using /api/nlp/matching-score instead.', {
        userId: req.user.id,
        endpoint: '/api/ai/analyze-job-match'
      });

      const { targetJobDescription, targetJobTitle, jobId } = req.body;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return ApiResponse.error(res, 'Profile not found', 404);
      }

      const cvData = this.extractCVData(profile);

      let jobData = {
        title: targetJobTitle,
        description: targetJobDescription,
      };

      // Nếu có jobId, lấy thêm thông tin từ DB
      if (jobId) {
        const job = await Job.findById(jobId);
        if (job) {
          jobData = {
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            skills: job.skills,
          };
        }
      }

      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      const analysis = await selfSufficientAI.analyzeJobMatch(cvData, jobData);
      logger.info('🎯 Job match analyzed (self-sufficient mode)');

      return ApiResponse.success(
        res, 
        {
          ...analysis,
          _deprecationWarning: {
            message: 'This endpoint is deprecated. Use /api/nlp/matching-score instead for advanced features.',
            alternativeEndpoint: '/api/nlp/matching-score',
            reason: 'Advanced matching with detailed breakdown, caching, and recalculation'
          }
        }, 
        'Job match analysis completed'
      );
    } catch (error) {
      console.error('Job match analysis error:', error);
      next(new AppError('Failed to analyze job match', 500));
    }
  }

  /**
   * POST /api/ai/match-score
   * Tính điểm khớp giữa candidate và job
   */
  async getMatchScore(req, res) {
    try {
      const { jobId, applicantId } = req.body;
      const userId = req.user.id;

      const job = await Job.findById(jobId);
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      const targetApplicantId = applicantId || userId;
      const applicant = await CandidateProfile.findOne({
        userId: targetApplicantId,
      });

      if (!applicant) {
        return ApiResponse.error(res, 'Applicant profile not found', 404);
      }

      // Check authorization
      if (
        applicantId &&
        applicantId !== userId &&
        req.user.role !== 'admin' &&
        job.postedBy.toString() !== userId
      ) {
        return ApiResponse.error(
          res,
          'Not authorized to view this match score',
          403
        );
      }

      const matchScore = await aiService.calculateMatchScore(applicant, job);

      // Check và update application nếu tồn tại
      let application = null;
      if (targetApplicantId === userId) {
        application = await Application.findOne({
          job: jobId,
          applicant: targetApplicantId,
        });

        if (application) {
          application.aiAnalysis = {
            ...application.aiAnalysis,
            ...matchScore,
            lastAnalyzed: new Date(),
          };
          await application.save();
        }
      }

      logger.info(`Match score calculated`, {
        jobId,
        applicantId: targetApplicantId,
        score: matchScore.overallScore,
      });

      return ApiResponse.success(
        res,
        {
          matchScore,
          hasApplication: !!application,
          applicationId: application?._id,
        },
        'Match score calculated successfully'
      );
    } catch (error) {
      logger.error('Match score calculation error:', error);
      return ApiResponse.error(res, 'Failed to calculate match score', 500);
    }
  }

  /**
   * POST /api/ai/analyze-candidate
   * Phân tích candidate cho một job cụ thể (Employer view)
   */
  async analyzeCandidate(req, res) {
    const { jobId, applicantId } = req.body;
    const userId = req.user.id;

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      const targetApplicantId = applicantId || userId;
      const applicant = await User.findById(targetApplicantId);

      if (!applicant) {
        return ApiResponse.error(res, 'Applicant not found', 404);
      }

      // Check authorization
      if (
        applicantId &&
        applicantId !== userId &&
        req.user.role !== 'admin' &&
        job.postedBy.toString() !== userId
      ) {
        return ApiResponse.error(
          res,
          'Not authorized to view this match score',
          403
        );
      }

      const matchScore = await aiService.calculateMatchScore(applicant, job);

      let application = null;
      if (targetApplicantId === userId) {
        application = await Application.findOne({
          job: jobId,
          applicant: targetApplicantId,
        });

        if (application) {
          application.aiAnalysis = {
            ...application.aiAnalysis,
            ...matchScore,
            lastAnalyzed: new Date(),
          };
          await application.save();
        }
      }

      logger.info(`Candidate analyzed`, {
        jobId,
        applicantId: targetApplicantId,
        score: matchScore.overallScore,
      });

      return ApiResponse.success(
        res,
        {
          matchScore,
          hasApplication: !!application,
          applicationId: application?._id,
        },
        'Candidate analyzed successfully'
      );
    } catch (error) {
      logger.error('Candidate analysis error:', error);
      return ApiResponse.error(res, 'Failed to analyze candidate', 500);
    }
  }

  // ========================================
  // SKILLS & LEARNING ENDPOINTS
  // ========================================

  /**
   * POST /api/ai/skill-gap-analysis
   * Phân tích khoảng cách kỹ năng
   * 
   * ✅ SELF-SUFFICIENT: Uses PhoBERT + Sentence-BERT (NO Gemini)
   */
  async getSkillGapAnalysis(req, res, next) {
    try {
      const { targetJobDescription, targetJobTitle, industry, jobId } =
        req.body;

      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        return ApiResponse.error(res, 'Profile not found', 404);
      }

      const cvData = this.extractCVData(profile);

      let jobData = {
        title: targetJobTitle,
        description: targetJobDescription,
        industry,
      };

      // Nếu có jobId, lấy thông tin job từ DB
      if (jobId) {
        const job = await Job.findById(jobId);
        if (job) {
          jobData = {
            title: job.title,
            description: job.description,
            industry: job.industry,
            skills: job.skills,
          };
        }
      }

      logger.info('🔬 Analyzing skill gaps (self-sufficient mode)', {
        userId: req.user.id,
        jobTitle: jobData.title,
        hasSkills: !!cvData.skills,
      });

      // ✅ Use self-sufficient AI service (PhoBERT + Sentence-BERT)
      const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
      const selfSufficientAI = getSelfSufficientAIService();
      
      const skillGapAnalysis = await selfSufficientAI.analyzeSkillGaps(
        cvData,
        jobData
      );

      return ApiResponse.success(
        res,
        skillGapAnalysis,
        'Skill gap analysis completed'
      );
    } catch (error) {
      logger.error('Skill gap analysis error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      next(new AppError('Failed to analyze skill gaps', 500));
    }
  }

  /**
   * POST /api/ai/skill-roadmap
   * Tạo lộ trình học tập/phát triển kỹ năng
   * 
   * @deprecated This endpoint is deprecated. Use /api/nlp/learning-roadmap instead for full CRUD operations, progress tracking, feedback, and resource recommendations.
   */
  async generateSkillRoadmap(req, res) {
    const userId = req.user.id;
    const {
      targetRole,
      targetSkills,
      timeframe = 12,
      currentLevel = 'beginner',
      targetJobTitle,
      targetJobDescription,
      skillGaps,
      learningPreferences,
    } = req.body;

    try {
      // Deprecation warning
      logger.warn('Deprecated endpoint /api/ai/skill-roadmap called. Consider using /api/nlp/learning-roadmap instead.', {
        userId: req.user.id,
        endpoint: '/api/ai/skill-roadmap'
      });
      if (
        !targetRole &&
        (!targetSkills || targetSkills.length === 0) &&
        !targetJobTitle
      ) {
        return ApiResponse.error(
          res,
          'Please provide either a target role, target skills, or target job',
          400
        );
      }

      const user = await User.findById(userId);
      const profile = await CandidateProfile.findOne({ userId });

      if (!user && !profile) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      let roadmap;

      // Case 1: Generate from target role/skills (legacy)
      if (targetRole || targetSkills) {
        const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
        const selfSufficientAI = getSelfSufficientAIService();
        roadmap = await selfSufficientAI.generateSkillRoadmap({
          user,
          targetRole,
          targetSkills,
          timeframe: parseInt(timeframe),
          currentLevel,
        });
        logger.info('🗺️ Skill roadmap generated (self-sufficient mode - deprecated)');
      }
      // Case 2: Generate from job description và skill gaps (advanced)
      else if (targetJobTitle || targetJobDescription) {
        const cvData = this.extractCVData(profile);

        const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
        const selfSufficientAI = getSelfSufficientAIService();
        roadmap = await selfSufficientAI.generateLearningRoadmap({
          currentSkills: cvData.skills,
          targetJob: {
            title: targetJobTitle,
            description: targetJobDescription,
          },
          skillGaps,
          timeframe: timeframe ? `${timeframe} weeks` : '12 weeks',
          preferences: learningPreferences || {},
        });
        logger.info('📚 Learning roadmap generated (self-sufficient mode - deprecated)');

        // Save roadmap to profile
        if (profile) {
          profile.skillRoadmap = {
            ...roadmap,
            createdAt: new Date(),
            targetJob: {
              title: targetJobTitle,
              description: targetJobDescription,
            },
          };
          await profile.save();
        }
      }

      logger.info(`Skill roadmap generated for user ${userId}`, {
        targetRole: targetRole || targetJobTitle,
        timeframe,
        skillsCount: roadmap.skills?.length || 0,
        deprecated: true,
      });

      return ApiResponse.success(
        res,
        {
          ...roadmap,
          _deprecationWarning: {
            message: 'This endpoint is deprecated. Use /api/nlp/learning-roadmap instead for full CRUD operations, progress tracking, feedback, and resource recommendations.',
            alternativeEndpoint: '/api/nlp/learning-roadmap',
            reason: 'Full CRUD operations, progress tracking, feedback, and resource recommendations'
          }
        },
        'Skill roadmap generated successfully'
      );
    } catch (error) {
      logger.error('Skill roadmap generation error:', error);
      return ApiResponse.error(res, 'Failed to generate skill roadmap', 500);
    }
  }

  /**
   * POST /api/ai/suggestions
   * Lấy gợi ý AI cho các trường form (career objective, skills, experience, etc.)
   */
  async getAISuggestions(req, res, next) {
    try {
      const { stepType, currentData, context } = req.body;

      let suggestions = {};

      switch (stepType) {
        case 'targetJob':
          const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI = getSelfSufficientAIService();
          suggestions = await selfSufficientAI.getJobSuggestions(currentData.title);
          break;

        case 'careerObjective':
          const { getSelfSufficientAIService: getSelfSufficientAIService2 } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI2 = getSelfSufficientAIService2();
          suggestions = await selfSufficientAI2.generateCareerObjective(
            currentData,
            context
          );
          break;

        case 'skills':
          const { getSelfSufficientAIService: getSelfSufficientAIService3 } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI3 = getSelfSufficientAIService3();
          suggestions = await selfSufficientAI3.suggestSkills(
            context.targetJob,
            context.experience
          );
          break;

        case 'experience':
          const { getSelfSufficientAIService: getSelfSufficientAIService4 } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI4 = getSelfSufficientAIService4();
          suggestions = await selfSufficientAI4.enhanceExperienceDescription(
            currentData
          );
          break;

        default:
          return ApiResponse.error(res, 'Invalid step type', 400);
      }

      return ApiResponse.success(
        res,
        { suggestions },
        'AI suggestions generated successfully'
      );
    } catch (error) {
      console.error('AI suggestions error:', error);
      return ApiResponse.error(res, 'Failed to generate AI suggestions', 500);
    }
  }

  // ========================================
  // INSIGHTS & ANALYTICS ENDPOINTS
  // ========================================

  /**
   * GET /api/ai/insights
   * Lấy AI insights dựa trên role (candidate/employer/admin)
   */
  async getAIInsights(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let insights = {};

      if (userRole === 'candidate') {
        return this.getCandidateInsights(req, res);
      } else if (userRole === 'employer') {
        return this.getEmployerInsights(req, res);
      } else if (userRole === 'admin') {
        insights = {
          platformStats: await aiService.getPlatformStatistics(),
          userBehavior: await aiService.getUserBehaviorInsights(),
          systemPerformance: await aiService.getSystemPerformanceMetrics(),
          trends: await aiService.getPlatformTrends(),
        };
      } else {
        return ApiResponse.error(res, 'Invalid user role', 400);
      }

      logger.info(`AI insights generated for user ${userId}`, {
        role: userRole,
      });

      return ApiResponse.success(
        res,
        insights,
        'AI insights generated successfully'
      );
    } catch (error) {
      logger.error('AI insights error:', error);
      return ApiResponse.error(res, 'Failed to generate AI insights', 500);
    }
  }

  /**
   * GET /api/ai/candidate-insights
   * Lấy insights cho candidate
   */
  async getCandidateInsights(req, res) {
    const userId = req.user.id;

    try {
      const user = await User.findById(userId);
      const applications = await Application.find({ applicant: userId })
        .populate('job', 'title company')
        .sort({ createdAt: -1 })
        .limit(10);

      const insights = {
        profileStrength: await aiService.calculateProfileStrength(user),
        skillGaps: await aiService.identifySkillGaps(user),
        applicationInsights: {
          totalApplications: applications.length,
          averageScore:
            applications.reduce(
              (acc, app) => acc + (app.aiAnalysis?.overallScore || 0),
              0
            ) / Math.max(applications.length, 1),
          topMatchingJobs: applications
            .filter(app => app.aiAnalysis?.overallScore > 80)
            .map(app => ({
              job: app.job,
              score: app.aiAnalysis.overallScore,
            })),
        },
        recommendations: {
          skillsToImprove: await aiService.getSkillRecommendations(user),
          careerSuggestions: await aiService.getCareerSuggestions(user),
        },
      };

      logger.info(`Candidate insights generated for user ${userId}`);

      return ApiResponse.success(
        res,
        insights,
        'Candidate insights generated successfully'
      );
    } catch (error) {
      logger.error('Candidate insights error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate candidate insights',
        500
      );
    }
  }

  /**
   * GET /api/ai/employer-insights
   * Lấy insights cho employer
   */
  async getEmployerInsights(req, res) {
    const userId = req.user.id;

    try {
      const jobs = await Job.find({ postedBy: userId });
      const applications = await Application.find({
        job: { $in: jobs.map(j => j._id) },
      }).populate('applicant', 'firstName lastName');

      const insights = {
        jobPerformance: await aiService.analyzeJobPerformance(jobs),
        applicantInsights: await aiService.getApplicantInsights(applications),
        marketTrends: await aiService.getMarketTrends(),
        recommendations: {
          jobOptimization: await aiService.getJobOptimizationTips(jobs),
          talentPool: await aiService.getTalentPoolInsights(),
        },
      };

      logger.info(`Employer insights generated for user ${userId}`);

      return ApiResponse.success(
        res,
        insights,
        'Employer insights generated successfully'
      );
    } catch (error) {
      logger.error('Employer insights error:', error);
      return ApiResponse.error(
        res,
        'Failed to generate employer insights',
        500
      );
    }
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * POST /api/ai/batch-analyze-applications
   * Phân tích hàng loạt ứng viên cho một công việc
   */
  async batchAnalyzeApplications(req, res) {
    const { jobId } = req.body;
    const userId = req.user.id;

    try {
      const job = await Job.findById(jobId);
      if (!job) {
        return ApiResponse.error(res, 'Job not found', 404);
      }

      if (job.postedBy.toString() !== userId && req.user.role !== 'admin') {
        return ApiResponse.error(
          res,
          'Not authorized to analyze applications for this job',
          403
        );
      }

      const applications = await Application.find({ job: jobId }).populate(
        'applicant',
        'firstName lastName skills experience education'
      );

      if (applications.length === 0) {
        return ApiResponse.success(
          res,
          {
            message: 'No applications found for this job',
            analyzed: 0,
          },
          'No applications found'
        );
      }

      const analysisResults = [];
      for (const application of applications) {
        try {
          const matchScore = await aiService.calculateMatchScore(
            application.applicant,
            job
          );

          application.aiAnalysis = {
            ...application.aiAnalysis,
            ...matchScore,
            lastAnalyzed: new Date(),
          };

          await application.save();
          analysisResults.push({
            applicationId: application._id,
            applicantName: application.applicant.fullName,
            score: matchScore.overallScore,
            status: 'analyzed',
          });
        } catch (error) {
          logger.error(
            `Error analyzing application ${application._id}:`,
            error
          );
          analysisResults.push({
            applicationId: application._id,
            applicantName: application.applicant.fullName,
            status: 'error',
            error: error.message,
          });
        }
      }

      logger.info(`Batch analysis completed for job ${jobId}`, {
        totalApplications: applications.length,
        successful: analysisResults.filter(r => r.status === 'analyzed').length,
      });

      return ApiResponse.success(
        res,
        {
          jobTitle: job.title,
          totalApplications: applications.length,
          analyzed: analysisResults.filter(r => r.status === 'analyzed').length,
          errors: analysisResults.filter(r => r.status === 'error').length,
          results: analysisResults,
        },
        'Batch analysis completed successfully'
      );
    } catch (error) {
      logger.error('Batch analysis error:', error);
      return ApiResponse.error(res, 'Batch analysis failed', 500);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Extract CV data từ CandidateProfile
   */
  extractCVData(profile) {
    return {
      personalInfo: profile.personalInfo || {},
      skills: this.formatSkills(profile.skills || {}),
      experience: this.getAllExperience(profile.experience || {}),
      education: this.getAllEducation(profile.education || {}),
      projects: profile.projects || [],
      certifications: profile.certifications || [],
      summary: profile.personalInfo?.bio || '',
      targetJob: profile.targetJob || {},
    };
  }

  /**
   * Format skills theo cấu trúc chuẩn
   */
  formatSkills(skills) {
    return {
      technical: skills?.technical || [],
      soft: skills?.soft || [],
      languages: skills?.languages || [],
    };
  }

  /**
   * Lấy tất cả experience từ các loại khác nhau
   */
  getAllExperience(experience) {
    const allExp = [];
    if (experience) {
      ['internships', 'fulltime', 'parttime', 'freelance'].forEach(type => {
        if (experience[type]) {
          experience[type].forEach(exp => allExp.push(exp));
        }
      });
    }
    return allExp.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  /**
   * Lấy tất cả education
   */
  getAllEducation(education) {
    const allEdu = [];
    if (education?.university) allEdu.push(education.university);
    if (education?.highSchool) allEdu.push(education.highSchool);
    return allEdu;
  }
}

module.exports = new AIController();
