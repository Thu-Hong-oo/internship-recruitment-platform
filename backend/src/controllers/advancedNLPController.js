const aiService = require('../services/ai/aiService');
const ragService = require('../services/dataCrawlers/ragService');
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
      const { cvData, jobId, candidateId, forceRecalculate } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID is required',
        });
      }

      const finalCandidateId = candidateId || userId;

      // If cvData not provided, fetch from candidate profile
      let finalCvData = cvData;
      if (!cvData && finalCandidateId) {
        const candidateProfile = await CandidateProfile.findOne({ userId: finalCandidateId })
          .populate('userId', 'fullName email')
          .lean();

        if (!candidateProfile || !candidateProfile.resume?.current) {
          return res.status(400).json({
            success: false,
            message: 'CV data is required. Please provide cvData or ensure candidate has uploaded a CV',
          });
        }

        // Build cvData from candidate profile
        // Transform profile format to match AI service expectations
        const profileSkills = candidateProfile.skills || {};
        const allSkills = [
          ...(profileSkills.technical || []),
          ...(profileSkills.soft || []),
          ...(profileSkills.languages || [])
        ];

        const profileExperience = candidateProfile.experience || {};
        const allExperience = [
          ...(profileExperience.internships || []),
          ...(profileExperience.fullTime || []),
          ...(profileExperience.projects || [])
        ];

        finalCvData = {
          personalInfo: candidateProfile.personalInfo || {},
          education: candidateProfile.education || {},
          experience: allExperience,
          skills: allSkills,
          resume: candidateProfile.resume?.current,
          extractedText: candidateProfile.resume?.current?.aiAnalysis?.extractedData || {},
        };
      }

      if (!finalCvData) {
        return res.status(400).json({
          success: false,
          message: 'CV data is required',
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

      // CACHE DISABLED: Always calculate fresh matching score
      // Reason: CV data changes frequently, weights updated, algorithm improvements
      // Old cached results become stale and misleading
      logger.info(`🔄 Calculating new matching score for candidate ${finalCandidateId} and job ${jobId}`);
      
      const matchingResult = await aiService.calculateAdvancedMatchScore(
        finalCvData,
        job,
        {
          candidateId: finalCandidateId,
          jobId,
          saveToDatabase: true,
        }
      );

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

      // Check authentication
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Verify job belongs to employer
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found',
        });
      }

      // Check if job has employer
      const employerId = job.employerId || job.employer?._id;
      if (!employerId) {
        return res.status(400).json({
          success: false,
          message: 'Job has no employer assigned',
        });
      }

      // Check if current user is employer and owns this job
      // job.postedBy is the User ID who posted the job
      if (job.postedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - You can only view candidates for jobs you posted',
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

      // Debug: Check total applications for this job
      const totalApplications = await CVMatchingScore.countDocuments({ jobId });
      const applicationsAboveThreshold = await CVMatchingScore.countDocuments(query);

      logger.info('Top candidates query', {
        jobId,
        minScore,
        totalApplications,
        applicationsAboveThreshold,
        tier: tier || 'all',
      });

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
          totalApplications,
          minScoreFilter: parseInt(minScore),
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

      // Validate candidate profile before returning matches
      const candidateProfile = await CandidateProfile.findOne({ 
        userId: candidateId 
      }).lean();

      if (!candidateProfile) {
        return res.status(400).json({
          success: false,
          message: 'Bạn chưa có hồ sơ. Vui lòng cập nhật thông tin profile hoặc tải CV trước khi sử dụng tính năng này.',
        });
      }

      // Check if profile has any meaningful data
      const profileSkills = candidateProfile.skills || {};
      const allSkills = [
        ...(profileSkills.technical || []),
        ...(profileSkills.soft || []),
        ...(profileSkills.languages || [])
      ];

      const profileExperience = candidateProfile.experience || {};
      const allExperience = [
        ...(profileExperience.internships || []),
        ...(profileExperience.fullTime || []),
        ...(profileExperience.projects || [])
      ];

      const hasSkills = Array.isArray(allSkills) && allSkills.length > 0;
      const hasExperience = Array.isArray(allExperience) && allExperience.length > 0;
      
      // Check education more strictly
      let hasEducation = false;
      if (candidateProfile.education) {
        const edu = candidateProfile.education;
        // Check university
        if (edu.university && (edu.university.name || edu.university.institution || edu.university.degree || edu.university.major || edu.university.field)) {
          hasEducation = true;
        }
        // Check certifications
        if (edu.certifications && Array.isArray(edu.certifications) && edu.certifications.length > 0) {
          hasEducation = true;
        }
        // Check other education fields
        if (edu.school || edu.degree || edu.major || edu.field) {
          hasEducation = true;
        }
      }
      
      // Check resume more strictly
      const hasResume =
        (candidateProfile.resume?.current?.url && candidateProfile.resume.current.url.trim() !== '') ||
        (candidateProfile.resume?.current?.fileName && candidateProfile.resume.current.fileName.trim() !== '') ||
        (candidateProfile.resume?.current?.aiAnalysis?.extractedData?.textContent && 
         candidateProfile.resume.current.aiAnalysis.extractedData.textContent.trim() !== '');

      if (!hasSkills && !hasExperience && !hasEducation && !hasResume) {
        // Delete any existing matching scores for this candidate since profile is empty
        await CVMatchingScore.deleteMany({ candidateId });
        logger.warn(`Profile validation failed for candidate ${candidateId}: Profile is empty. Deleted existing scores.`);
        
        return res.status(400).json({
          success: false,
          message: 'Bạn chưa cập nhật hồ sơ hoặc tải CV. Vui lòng upload CV hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi sử dụng tính năng gợi ý việc làm.',
        });
      }

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
          // Convert skills from object format { technical: [...], soft: [...] } to array format
          const skillsArray = [];
          
          // Add technical skills
          if (profile.skills?.technical && Array.isArray(profile.skills.technical)) {
            skillsArray.push(...profile.skills.technical.map(skill => ({
              name: skill.name || skill,
              level: skill.level || 'beginner',
            })));
          }
          
          // Add soft skills (optional, but include for completeness)
          if (profile.skills?.soft && Array.isArray(profile.skills.soft)) {
            skillsArray.push(...profile.skills.soft.map(skill => ({
              name: skill.name || skill,
              level: skill.level || 'beginner',
            })));
          }
          
          // Convert experience from object format { internships: [...], projects: [...] } to array format
          const experienceArray = [];
          if (profile.experience?.internships && Array.isArray(profile.experience.internships)) {
            experienceArray.push(...profile.experience.internships.map(exp => ({
              position: exp.position || '',
              company: exp.company || '',
              startDate: exp.startDate || null,
              endDate: exp.endDate || null,
              description: exp.description || '',
            })));
          }
          
          // Also check workExperience (if exists as separate field)
          if (profile.workExperience && Array.isArray(profile.workExperience)) {
            experienceArray.push(...profile.workExperience.map(exp => ({
              position: exp.position || exp.role || '',
              company: exp.company || '',
              startDate: exp.startDate || null,
              endDate: exp.endDate || null,
              description: exp.description || '',
            })));
          }
          
          // Convert education from object format { university: {...}, certifications: [...] } to array format
          const educationArray = [];
          if (profile.education?.university && profile.education.university.name) {
            educationArray.push({
              degree: profile.education.university.degree,
              major: profile.education.university.major || profile.education.university.field,
              school: profile.education.university.name || profile.education.university.institution,
              graduationYear: profile.education.university.graduationYear,
            });
          }
          if (profile.education?.certifications && Array.isArray(profile.education.certifications)) {
            educationArray.push(...profile.education.certifications.map(cert => ({
              degree: cert.degree || cert.name,
              major: cert.field,
              school: cert.issuer || cert.institution,
            })));
          }
          
          // Calculate currentLevel from experience (if available)
          let currentLevel = 'beginner';
          if (experienceArray.length > 0) {
            // Calculate total years of experience
            const totalYears = experienceArray.reduce((total, exp) => {
              if (exp.startDate && exp.endDate) {
                const start = new Date(exp.startDate);
                const end = new Date(exp.endDate);
                const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
                return total + Math.max(0, years);
              }
              return total;
            }, 0);
            
            // Determine level based on experience
            if (totalYears >= 5) {
              currentLevel = 'expert';
            } else if (totalYears >= 3) {
              currentLevel = 'advanced';
            } else if (totalYears >= 1) {
              currentLevel = 'intermediate';
            } else {
              currentLevel = 'beginner';
            }
          }
          
          // Also check if targetJob.level exists
          if (profile.targetJob?.level) {
            const levelMap = {
              'entry': 'beginner',
              'mid': 'intermediate',
              'senior': 'advanced',
              'executive': 'expert',
            };
            currentLevel = levelMap[profile.targetJob.level] || currentLevel;
          }
          
          candidateData = {
            skills: skillsArray,
            experience: experienceArray,
            education: educationArray,
            currentLevel: currentLevel,
          };
        }
      }

      // Get candidate profile for learning preferences
      const profile = await CandidateProfile.findOne({
        userId: candidateId,
      });
      
      // Extract learning preferences from profile
      const learningPreferences = profile?.preferences?.learning || {};
      const roadmapPreferences = profile?.preferences?.roadmap || {};

      // Generate roadmap with personalization
      const roadmap = await aiService.generatePersonalizedRoadmap({
        candidateId,
        targetJobId,
        targetRole: roleTitle,
        cvData: candidateData || {},
        jobData,
        timeframe: parseInt(timeframe),
        saveToDatabase: true,
        // Add learning preferences
        learningPreferences: {
          style: learningPreferences.style || 'visual',
          budget: learningPreferences.budget || 'free',
          maxHours: learningPreferences.maxHoursPerWeek || null,
          preferredResourceTypes: learningPreferences.preferredResourceTypes || [],
          preferredLanguage: learningPreferences.preferredLanguage || 'en',
        },
        roadmapPreferences: {
          pace: roadmapPreferences.preferredPace || 'normal',
          focusAreas: roadmapPreferences.focusAreas || [],
          skipBasics: roadmapPreferences.skipBasics || false,
        },
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

      // If all weeks are completed, mark roadmap as completed and sync skills to profile
      const totalWeeks = roadmap.totalWeeks || 0;
      const completedWeeksCount = roadmap.progress.completedWeeks.length;
      if (totalWeeks > 0 && completedWeeksCount >= totalWeeks) {
        roadmap.status = 'completed';
        roadmap.progress.overallProgress = 100;
        roadmap.progress.completedAt = new Date();

        // Sync learned skills into candidate profile (avoid duplicates, upgrade level if needed)
        try {
          const profile = await CandidateProfile.findOne({
            userId: roadmap.candidateId,
          });

          if (profile) {
            const currentTechSkills = profile.skills?.technical || [];
            const skillGaps = roadmap.skillGaps || [];

            skillGaps.forEach((gap) => {
              const name = (gap.skill || '').trim();
              if (!name) return;

              const existing = currentTechSkills.find(
                (s) => s.name && s.name.toLowerCase() === name.toLowerCase()
              );

              if (existing) {
                // Upgrade level if target level is higher/defined
                if (gap.targetLevel) {
                  existing.level = gap.targetLevel;
                }
              } else {
                currentTechSkills.push({
                  name,
                  level: gap.targetLevel || 'intermediate',
                  verified: false,
                });
              }
            });

            profile.skills = {
              ...profile.skills,
              technical: currentTechSkills,
            };

            await profile.save();
          }
        } catch (syncError) {
          logger.warn('Failed to sync roadmap skills to profile', {
            error: syncError.message,
            roadmapId,
          });
        }

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

  /**
   * @route   POST /api/nlp/learning-roadmap-rag
   * @desc    Generate RAG-powered learning roadmap with real resources
   * @access  Private (Candidate)
   */
  async generateRagRoadmap(req, res) {
    try {
      const {
        targetJobId,
        jobId, // Support both jobId and targetJobId for compatibility
        targetRole,
        cvData,
        timeframe = 12,
        useRag = true,
      } = req.body;

      // Use jobId if targetJobId is not provided (for frontend compatibility)
      const finalJobId = targetJobId || jobId;

      const candidateId = req.user._id;

      logger.info(`🚀 Generating RAG-powered roadmap for candidate: ${candidateId}`);

      // Get candidate profile first (needed for cvData)
      const candidateProfile = await CandidateProfile.findOne({
        userId: candidateId,
      });
      
      if (!candidateProfile) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found. Please complete your profile first.',
        });
      }

      // Extract cvData from profile if not provided
      let candidateCvData = cvData;
      if (!candidateCvData && candidateProfile.resume?.current?.aiAnalysis?.extractedData) {
        candidateCvData = candidateProfile.resume.current.aiAnalysis.extractedData;
        logger.info(`✅ Loaded CV data from profile`);
      }

      // Convert candidateProfile to cvData format for selfSufficientAI
      // Extract skills as strings (from objects with 'name' property)
      const extractSkillNames = (skillArray) => {
        if (!Array.isArray(skillArray)) return [];
        return skillArray.map(skill => {
          if (typeof skill === 'string') return skill;
          if (skill && typeof skill === 'object') {
            return skill.name || skill.skill || String(skill);
          }
          return String(skill);
        }).filter(Boolean);
      };

      // Extract all experience types
      const allExperience = [
        ...(candidateProfile.experience?.fulltime || []),
        ...(candidateProfile.experience?.internships || []),
        ...(candidateProfile.experience?.parttime || []),
        ...(candidateProfile.experience?.freelance || []),
        ...(candidateProfile.experience?.projects || [])
      ];

      // Extract education (university, certifications, etc.)
      const allEducation = [];
      if (candidateProfile.education?.university) {
        allEducation.push(candidateProfile.education.university);
      }
      if (Array.isArray(candidateProfile.education?.certifications)) {
        allEducation.push(...candidateProfile.education.certifications);
      }
      if (Array.isArray(candidateProfile.certifications)) {
        allEducation.push(...candidateProfile.certifications);
      }

      const convertedCvData = {
        skills: {
          technical: extractSkillNames(candidateProfile.skills?.technical || []),
          soft: extractSkillNames(candidateProfile.skills?.soft || []),
          languages: extractSkillNames(candidateProfile.skills?.languages || [])
        },
        experience: allExperience,
        education: allEducation,
        personalInfo: candidateProfile.personalInfo || {}
      };

      logger.info(`📋 Converted CV data:`, {
        technicalSkills: convertedCvData.skills.technical.length,
        softSkills: convertedCvData.skills.soft.length,
        languages: convertedCvData.skills.languages.length,
        experienceCount: convertedCvData.experience.length,
        educationCount: convertedCvData.education.length,
        hasPersonalInfo: !!convertedCvData.personalInfo,
        sampleTechnicalSkills: convertedCvData.skills.technical.slice(0, 3),
        sampleSoftSkills: convertedCvData.skills.soft.slice(0, 3),
      });

      // Get matching score to identify skill gaps
      let skillGaps = [];
      let jobData = null;
      let extractedTargetRole = targetRole; // Use provided or extract from job
      
      if (finalJobId) {
        // Try to get existing matching score
        let matchingScore = await CVMatchingScore.findOne({
          candidateId,
          jobId: finalJobId,
        }).lean();

        // If no matching score exists, calculate it automatically
        if (!matchingScore) {
          logger.info(`⚠️ No matching score found, calculating automatically...`);
          
          // Get job data
          jobData = await Job.findById(finalJobId);
          if (!jobData) {
            return res.status(404).json({
              success: false,
              message: 'Job not found',
            });
          }
          
          // Extract target role from job if not provided
          if (!extractedTargetRole) {
            extractedTargetRole = jobData.title || 'Target Position';
            logger.info(`✅ Extracted target role from job: ${extractedTargetRole}`);
          }

          // Use selfSufficientAIService to analyze skill gaps
          const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI = getSelfSufficientAIService();
          
          const skillGapResult = await selfSufficientAI.analyzeSkillGaps(
            convertedCvData,
            jobData
          );

          logger.info(`📊 Skill gap analysis result:`, {
            hasResult: !!skillGapResult,
            missingSkillsCount: skillGapResult?.missingSkills?.length || 0,
            stats: skillGapResult?._stats,
          });

          if (skillGapResult && skillGapResult.missingSkills && skillGapResult.missingSkills.length > 0) {
            skillGaps = skillGapResult.missingSkills.map(skill => {
              // Map importance: string → Number (0-1)
              let importanceValue = 0.5;
              if (typeof skill.importance === 'number') {
                importanceValue = Math.min(Math.max(skill.importance, 0), 1);
              } else if (typeof skill.importance === 'string') {
                const importanceMap = {'critical': 0.9, 'high': 0.8, 'important': 0.7, 'medium': 0.5, 'low': 0.3};
                importanceValue = importanceMap[skill.importance.toLowerCase()] || 0.5;
              }
              
              // Map priority: number → enum string
              let priorityValue = 'medium';
              if (typeof skill.priority === 'number') {
                if (skill.priority <= 2) priorityValue = 'critical';
                else if (skill.priority <= 4) priorityValue = 'high';
                else if (skill.priority <= 6) priorityValue = 'medium';
                else priorityValue = 'low';
              } else if (typeof skill.priority === 'string') {
                priorityValue = ['critical', 'high', 'medium', 'low'].includes(skill.priority.toLowerCase()) 
                  ? skill.priority.toLowerCase() : 'medium';
              }
              
              return {
                skill: skill.name || skill.skill || skill,
                currentLevel: skill.currentLevel || 'none',
                targetLevel: skill.targetLevel || 'intermediate',
                importance: importanceValue,
                priority: priorityValue,
              };
            });
            logger.info(`✅ Auto-calculated ${skillGaps.length} skill gaps:`, skillGaps.map(s => s.skill).join(', '));
          } else {
            logger.warn(`⚠️ No missing skills found in skill gap analysis, trying fallback...`);
            
            // FALLBACK: Generate skills from job title if no gaps found
            if (extractedTargetRole && jobData) {
              logger.info(`🔄 Fallback: Generating skills from job title: "${extractedTargetRole}"`);
              try {
                const suggestedSkills = await selfSufficientAI.suggestSkills(extractedTargetRole, 'mid-level');
                if (suggestedSkills && suggestedSkills.suggestions && suggestedSkills.suggestions.length > 0) {
                  // Get current skills as set for comparison
                  const currentSkillsSet = new Set([
                    ...convertedCvData.skills.technical,
                    ...convertedCvData.skills.soft,
                    ...convertedCvData.skills.languages
                  ].map(s => s.toLowerCase()));
                  
                  // Find skills that candidate doesn't have
                  const missingFromSuggestions = suggestedSkills.suggestions
                    .filter(skill => {
                      const skillName = (typeof skill === 'string' ? skill : skill.name || skill.skill || String(skill)).toLowerCase();
                      return !currentSkillsSet.has(skillName) && 
                             !Array.from(currentSkillsSet).some(cs => cs.includes(skillName) || skillName.includes(cs));
                    })
                    .slice(0, 5); // Limit to top 5
                  
                  if (missingFromSuggestions.length > 0) {
                    skillGaps = missingFromSuggestions.map((skill, index) => {
                      const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skill || String(skill));
                      return {
                        skill: skillName,
                        currentLevel: 'none',
                        targetLevel: 'intermediate',
                        importance: 0.7 - (index * 0.1), // Decreasing importance
                        priority: index < 2 ? 'high' : 'medium',
                      };
                    });
                    logger.info(`✅ Fallback generated ${skillGaps.length} skill gaps:`, skillGaps.map(s => s.skill).join(', '));
                  }
                }
              } catch (fallbackError) {
                logger.error('❌ Fallback skill generation failed:', fallbackError);
              }
            }
          }
        } else if (matchingScore.skillGapAnalysis?.missingSkills) {
          skillGaps = matchingScore.skillGapAnalysis.missingSkills.map(skill => {
            let importanceValue = 0.5;
            if (typeof skill.importance === 'number') {
              importanceValue = Math.min(Math.max(skill.importance, 0), 1);
            } else if (typeof skill.importance === 'string') {
              const importanceMap = {'critical': 0.9, 'high': 0.8, 'important': 0.7, 'medium': 0.5, 'low': 0.3};
              importanceValue = importanceMap[skill.importance.toLowerCase()] || 0.5;
            }
            
            let priorityValue = 'medium';
            if (typeof skill.priority === 'number') {
              if (skill.priority <= 2) priorityValue = 'critical';
              else if (skill.priority <= 4) priorityValue = 'high';
              else if (skill.priority <= 6) priorityValue = 'medium';
              else priorityValue = 'low';
            } else if (typeof skill.priority === 'string') {
              priorityValue = ['critical', 'high', 'medium', 'low'].includes(skill.priority.toLowerCase()) 
                ? skill.priority.toLowerCase() : 'medium';
            }
            
            return {
              skill: skill.name || skill.skill || skill,
              currentLevel: skill.currentLevel || 'none',
              targetLevel: skill.targetLevel || 'intermediate',
              importance: importanceValue,
              priority: priorityValue,
            };
          });
          logger.info(`✅ Using existing matching score with ${skillGaps.length} skill gaps`);
        }
      }

      // If still no skill gaps and targetRole provided, try to extract from profile
      if (skillGaps.length === 0 && extractedTargetRole) {
        logger.info(`⚠️ No skill gaps from job, trying to generate from targetRole: ${extractedTargetRole}`);
        
        // Use already loaded candidateProfile (no need to fetch again)
        if (candidateProfile) {
            // Use AI to suggest skills for target role
            const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
            const selfSufficientAI = getSelfSufficientAIService();
            
            // Create a mock job data for target role
            const mockJobData = {
              title: extractedTargetRole,
              skills: [], // Empty, let AI suggest
              description: `Position: ${extractedTargetRole}`,
            };
            
            const skillGapResult = await selfSufficientAI.analyzeSkillGaps(
              convertedCvData,
              mockJobData
            );
            
            if (skillGapResult && skillGapResult.missingSkills && skillGapResult.missingSkills.length > 0) {
              skillGaps = skillGapResult.missingSkills.map(skill => {
                let importanceValue = 0.5;
                if (typeof skill.importance === 'number') {
                  importanceValue = Math.min(Math.max(skill.importance, 0), 1);
                } else if (typeof skill.importance === 'string') {
                  const importanceMap = {'critical': 0.9, 'high': 0.8, 'important': 0.7, 'medium': 0.5, 'low': 0.3};
                  importanceValue = importanceMap[skill.importance.toLowerCase()] || 0.5;
                }
                
                let priorityValue = 'medium';
                if (typeof skill.priority === 'number') {
                  if (skill.priority <= 2) priorityValue = 'critical';
                  else if (skill.priority <= 4) priorityValue = 'high';
                  else if (skill.priority <= 6) priorityValue = 'medium';
                  else priorityValue = 'low';
                } else if (typeof skill.priority === 'string') {
                  priorityValue = ['critical', 'high', 'medium', 'low'].includes(skill.priority.toLowerCase()) 
                    ? skill.priority.toLowerCase() : 'medium';
                }
                
                return {
                  skill: skill.name || skill.skill || skill,
                  currentLevel: skill.currentLevel || 'none',
                  targetLevel: skill.targetLevel || 'intermediate',
                  importance: importanceValue,
                  priority: priorityValue,
                };
              });
              logger.info(`✅ Generated ${skillGaps.length} skill gaps from targetRole`);
            }
        }
      }

      // If no skill gaps from matching, extract from CVData
      if (skillGaps.length === 0 && candidateCvData) {
        logger.info(`⚠️ No skill gaps from job, using cvData...`);
        
        // Use selfSufficientAI to analyze skill gaps based on CV data
        const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
        const selfSufficientAI = getSelfSufficientAIService();
        
        // Create a mock job data if targetRole provided
        if (extractedTargetRole) {
          const mockJobData = {
            title: extractedTargetRole,
            skills: [],
            description: `Position: ${extractedTargetRole}`,
          };
          
          const skillGapResult = await selfSufficientAI.analyzeSkillGaps(
            convertedCvData,
            mockJobData
          );
          
          if (skillGapResult && skillGapResult.missingSkills && skillGapResult.missingSkills.length > 0) {
            skillGaps = skillGapResult.missingSkills.map(skill => {
              // Map importance: string → Number (0-1)
              let importanceValue = 0.5; // default medium
              if (typeof skill.importance === 'number') {
                importanceValue = Math.min(Math.max(skill.importance, 0), 1);
              } else if (typeof skill.importance === 'string') {
                const importanceMap = {
                  'critical': 0.9,
                  'high': 0.8,
                  'important': 0.7,
                  'medium': 0.5,
                  'low': 0.3,
                };
                importanceValue = importanceMap[skill.importance.toLowerCase()] || 0.5;
              }
              
              // Map priority: number → enum string
              let priorityValue = 'medium';
              if (typeof skill.priority === 'number') {
                if (skill.priority <= 2) priorityValue = 'critical';
                else if (skill.priority <= 4) priorityValue = 'high';
                else if (skill.priority <= 6) priorityValue = 'medium';
                else priorityValue = 'low';
              } else if (typeof skill.priority === 'string') {
                priorityValue = ['critical', 'high', 'medium', 'low'].includes(skill.priority.toLowerCase()) 
                  ? skill.priority.toLowerCase() 
                  : 'medium';
              }
              
              return {
                skill: skill.name || skill.skill || skill,
                currentLevel: skill.currentLevel || 'none',
                targetLevel: skill.targetLevel || 'intermediate',
                importance: importanceValue,
                priority: priorityValue,
              };
            });
            logger.info(`✅ Extracted ${skillGaps.length} skill gaps from CV data`);
          }
        }
      }

      // FINAL FALLBACK: Generate generic skill gaps based on job title if still empty
      if (skillGaps.length === 0) {
        logger.warn(`⚠️ Still no skill gaps after all attempts, using final fallback`);
        
        // Use targetRole or job title
        const roleForFallback = extractedTargetRole || jobData?.title || 'Target Position';
        logger.info(`🔄 Final fallback for role: "${roleForFallback}"`);
        
        try {
          const { getSelfSufficientAIService } = require('../services/ai/selfSufficientAIService');
          const selfSufficientAI = getSelfSufficientAIService();
          
          // Get current skills (all types)
          const currentSkillsSet = new Set([
            ...convertedCvData.skills.technical,
            ...convertedCvData.skills.soft,
            ...convertedCvData.skills.languages
          ].map(s => s.toLowerCase()).filter(Boolean));
          
          logger.info(`📊 Current skills count: ${currentSkillsSet.size}`, Array.from(currentSkillsSet).slice(0, 5));
          
          // Try 1: Generate skills based on job title/role
          let suggestedSkills = null;
          try {
            suggestedSkills = await selfSufficientAI.suggestSkills(roleForFallback, 'mid-level');
            logger.info(`💡 suggestSkills result:`, {
              hasResult: !!suggestedSkills,
              hasSuggestions: !!(suggestedSkills?.suggestions),
              suggestionsCount: suggestedSkills?.suggestions?.length || 0,
            });
          } catch (suggestError) {
            logger.error(`❌ suggestSkills failed:`, suggestError.message);
          }
          
          if (suggestedSkills && suggestedSkills.suggestions && suggestedSkills.suggestions.length > 0) {
            // Find missing skills (top 5-7)
            const missingFromSuggestions = suggestedSkills.suggestions
              .map(skill => typeof skill === 'string' ? skill : (skill.name || skill.skill || String(skill)))
              .filter(skill => {
                const skillName = skill.toLowerCase();
                // Check if candidate doesn't have this skill
                const hasExact = currentSkillsSet.has(skillName);
                const hasPartial = Array.from(currentSkillsSet).some(cs => 
                  cs.includes(skillName) || skillName.includes(cs)
                );
                return !hasExact && !hasPartial && skillName.length > 2; // Filter out too short skills
              })
              .slice(0, 7); // Get top 7
            
            if (missingFromSuggestions.length > 0) {
              skillGaps = missingFromSuggestions.map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skill || String(skill));
                return {
                  skill: skillName,
                  currentLevel: 'none',
                  targetLevel: 'intermediate',
                  importance: Math.max(0.5, 0.8 - (index * 0.1)), // Decreasing importance
                  priority: index < 3 ? 'high' : (index < 5 ? 'medium' : 'low'),
                };
              });
              logger.info(`✅ Final fallback generated ${skillGaps.length} skill gaps from suggestions:`, skillGaps.map(s => s.skill).join(', '));
            }
          }
          
          // Try 2: If still no gaps, create generic improvement skills based on role
          if (skillGaps.length === 0) {
            logger.warn(`⚠️ No gaps from suggestions, creating generic skills for: "${roleForFallback}"`);
            
            // Extract key words from role
            const roleWords = roleForFallback.toLowerCase().split(/\s+/);
            const isOffice = roleWords.some(w => ['văn', 'phòng', 'office', 'assistant', 'trợ', 'lý'].includes(w));
            const isLogistics = roleWords.some(w => ['logistics', 'vận', 'tải', 'giao', 'nhận'].includes(w));
            const isAccounting = roleWords.some(w => ['kế', 'toán', 'accounting', 'chứng', 'từ'].includes(w));
            
            const genericSkills = [];
            
            if (isOffice || isLogistics || isAccounting) {
              genericSkills.push(
                { name: 'Microsoft Office (Excel, Word, PowerPoint)', priority: 'high' },
                { name: 'Quản lý thời gian và tổ chức công việc', priority: 'high' },
                { name: 'Giao tiếp và làm việc nhóm', priority: 'medium' },
                { name: 'Kỹ năng tin học văn phòng nâng cao', priority: 'medium' }
              );
            } else {
              genericSkills.push(
                { name: 'Kỹ năng chuyên môn nâng cao', priority: 'high' },
                { name: 'Best practices trong ngành', priority: 'high' },
                { name: 'Kỹ năng mềm chuyên nghiệp', priority: 'medium' }
              );
            }
            
            skillGaps = genericSkills.map((skill, index) => ({
              skill: skill.name,
              currentLevel: 'basic',
              targetLevel: 'intermediate',
              importance: 0.7 - (index * 0.1),
              priority: skill.priority,
            }));
            
            logger.info(`✅ Created ${skillGaps.length} generic skill gaps:`, skillGaps.map(s => s.skill).join(', '));
          }
        } catch (fallbackError) {
          logger.error('❌ Final fallback failed:', fallbackError);
          // Last resort: create at least one skill gap
          skillGaps = [{
            skill: 'Kỹ năng cần thiết cho ' + roleForFallback,
            currentLevel: 'basic',
            targetLevel: 'intermediate',
            importance: 0.7,
            priority: 'high',
          }];
          logger.info(`✅ Created minimal skill gap as last resort`);
        }
      }

      if (skillGaps.length === 0) {
        logger.error('❌ No skill gaps identified after all fallbacks', {
          candidateId,
          targetJobId: finalJobId,
          targetRole: extractedTargetRole,
          hasCvData: !!candidateCvData,
          convertedCvData: {
            technicalSkillsCount: convertedCvData.skills?.technical?.length || 0,
            softSkillsCount: convertedCvData.skills?.soft?.length || 0,
            experienceCount: convertedCvData.experience?.length || 0,
            educationCount: convertedCvData.education?.length || 0,
          },
          hasJobData: !!jobData,
          jobTitle: jobData?.title,
        });
        
        return res.status(400).json({
          success: false,
          message: 'Unable to identify skill gaps. Please ensure you have a complete profile with skills, experience, and education.',
          details: {
            candidateId: candidateId,
            jobId: finalJobId,
            targetRole: extractedTargetRole || targetRole,
            suggestion: 'Please complete your profile at /api/candidate-profile or provide targetRole in request body',
            debug: {
              hasCvData: !!candidateCvData,
              technicalSkillsCount: convertedCvData.skills?.technical?.length || 0,
              softSkillsCount: convertedCvData.skills?.soft?.length || 0,
              experienceCount: convertedCvData.experience?.length || 0,
              educationCount: convertedCvData.education?.length || 0,
            },
          },
        });
      }

      logger.info(`📊 Identified ${skillGaps.length} skill gaps:`, skillGaps.map(s => s.skill).join(', '));

      // Initialize RAG service
      await ragService.initialize();

      // Generate RAG-powered roadmap with real resources
      const ragRoadmap = await ragService.generateRoadmap(skillGaps, {
        jobTitle: extractedTargetRole || 'Target Position',
        currentLevel: candidateCvData?.currentLevel || 'beginner',
        timeframe: timeframe,
      });

      // Save to database
      const learningRoadmap = new LearningRoadmap({
        candidateId: candidateId,
        targetJobId: finalJobId || null,
        targetRole: extractedTargetRole || 'Target Position',
        skillGaps: skillGaps,
        currentLevel: ragRoadmap.currentLevel,
        estimatedDuration: timeframe,
        totalDuration: `${timeframe} weeks`, // Required field
        phases: ragRoadmap.phases.map(phase => ({
          phaseNumber: phase.phaseNumber,
          title: phase.phaseName, // Schema requires 'title', not 'name'
          duration: `${phase.duration} weeks`, // Convert Number to String
          objectives: phase.learningObjectives || [],
          weeks: AdvancedNLPController.convertPhaseToWeeks(phase),
        })),
        progress: {
          currentPhase: 1,
          currentWeek: 1,
          startedAt: new Date(),
          completedWeeks: [],
          completedResources: [],
        },
        credibilityMetrics: ragRoadmap.credibilityMetrics,
        metadata: {
          generatedBy: 'RAG-powered AI',
          generationMethod: 'retrieval-augmented-generation',
          dataSources: ['youtube', 'github', 'vector-database'],
          verifiable: true,
          academicValidity: ragRoadmap.credibilityMetrics.academicValidity,
        },
      });

      await learningRoadmap.save();

      logger.info(`✅ RAG roadmap saved with ${ragRoadmap.totalResources} real resources`);

      res.status(201).json({
        success: true,
        message: 'RAG-powered learning roadmap generated successfully',
        data: {
          roadmap: learningRoadmap,
          credibilityMetrics: ragRoadmap.credibilityMetrics,
          totalResources: ragRoadmap.totalResources,
          sourceBreakdown: ragRoadmap.credibilityMetrics.sourceBreakdown,
        },
      });
    } catch (error) {
      logger.error('❌ Error generating RAG roadmap:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating RAG-powered roadmap',
        error: error.message,
      });
    }
  }

  /**
   * Convert RAG phase structure to weekly structure
   * @param {Object} phase - RAG phase
   * @returns {Array} Weekly breakdown
   */
  static convertPhaseToWeeks(phase) {
    const weeks = [];
    const weeksInPhase = typeof phase.duration === 'number' ? phase.duration : parseInt(phase.duration) || 1;
    
    // Fix: Only create weeks that have skills assigned
    const actualWeeks = Math.min(weeksInPhase, phase.skills.length);
    const skillsPerWeek = Math.ceil(phase.skills.length / actualWeeks);

    for (let weekNum = 1; weekNum <= actualWeeks; weekNum++) {
      const startIdx = (weekNum - 1) * skillsPerWeek;
      const endIdx = Math.min(startIdx + skillsPerWeek, phase.skills.length);
      const weekSkills = phase.skills.slice(startIdx, endIdx);

      const weekResources = weekSkills.flatMap(skillGroup => 
        skillGroup.resources.map(resource => {
          // Fix difficulty: ensure it's valid enum (beginner, intermediate, advanced)
          let validDifficulty = resource.difficulty;
          if (!validDifficulty || !['beginner', 'intermediate', 'advanced'].includes(validDifficulty)) {
            validDifficulty = 'beginner'; // Default to beginner if invalid
          }
          
          return {
            type: resource.type,
            title: resource.title,
            url: resource.url,
            provider: resource.provider,
            duration: resource.duration,
            difficulty: validDifficulty,
            rating: resource.rating,
            credibility: resource.credibility,
            source: resource.source,
            metadata: resource.metadata,
            isFree: resource.isFree !== undefined ? resource.isFree : true,
            language: resource.language || 'en',
          };
        })
      );

      weeks.push({
        weekNumber: weekNum,
        focus: weekSkills.map(s => s.skill).join(', ') || `Week ${weekNum} Learning`, // Required string field
        learningObjectives: weekSkills.map(s => `Master ${s.skill} fundamentals`),
        resources: weekResources,
        timeCommitment: `${Math.ceil(weekResources.length * 2)} hours/week`, // Estimate 2 hours per resource
      });
    }

    return weeks;
  }

  /**
   * @route   GET /api/nlp/rag-health
   * @desc    Check RAG service health and statistics
   * @access  Private
   */
  async checkRagHealth(req, res) {
    try {
      await ragService.initialize();
      const health = await ragService.getHealthStatus();

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error('Error checking RAG health:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking RAG service health',
        error: error.message,
      });
    }
  }

  /**
   * @route   POST /api/nlp/calculate-all-matches
   * @desc    Calculate matching scores for all active jobs for current candidate
   * @access  Private (Candidate/Intern)
   */
  async calculateAllJobMatches(req, res) {
    try {
      const candidateUserId = req.user._id;
      
      logger.info(`Calculating all job matches for candidate: ${candidateUserId}`);

      // 1. Fetch candidate profile
      const candidateProfile = await CandidateProfile.findOne({ 
        userId: candidateUserId 
      }).populate('userId', 'fullName email');

      if (!candidateProfile) {
        return res.status(404).json({
          success: false,
          message: 'Candidate profile not found',
        });
      }

      // 2. Build cvData from candidate profile
      const profileSkills = candidateProfile.skills || {};
      const allSkills = [
        ...(profileSkills.technical || []),
        ...(profileSkills.soft || []),
        ...(profileSkills.languages || [])
      ];

      const profileExperience = candidateProfile.experience || {};
      const allExperience = [
        ...(profileExperience.internships || []),
        ...(profileExperience.fullTime || []),
        ...(profileExperience.projects || [])
      ];

      const cvData = {
        personalInfo: candidateProfile.personalInfo || {},
        education: candidateProfile.education || {},
        experience: allExperience,
        skills: allSkills,
        resume: candidateProfile.resume?.current,
        extractedText: candidateProfile.resume?.current?.aiAnalysis?.extractedData || {},
      };

    // Validate profile data - check if profile is essentially empty
    const hasSkills = Array.isArray(allSkills) && allSkills.length > 0;
    const hasExperience = Array.isArray(allExperience) && allExperience.length > 0;
    
    // Check education more strictly
    let hasEducation = false;
    if (candidateProfile.education) {
      const edu = candidateProfile.education;
      // Check university
      if (edu.university && (edu.university.name || edu.university.institution || edu.university.degree || edu.university.major || edu.university.field)) {
        hasEducation = true;
      }
      // Check certifications
      if (edu.certifications && Array.isArray(edu.certifications) && edu.certifications.length > 0) {
        hasEducation = true;
      }
      // Check other education fields
      if (edu.school || edu.degree || edu.major || edu.field) {
        hasEducation = true;
      }
    }
    
    // Check resume more strictly
    const hasResume =
      (candidateProfile.resume?.current?.url && candidateProfile.resume.current.url.trim() !== '') ||
      (candidateProfile.resume?.current?.fileName && candidateProfile.resume.current.fileName.trim() !== '') ||
      (candidateProfile.resume?.current?.aiAnalysis?.extractedData?.textContent && 
       candidateProfile.resume.current.aiAnalysis.extractedData.textContent.trim() !== '');

    // Log validation details for debugging
    logger.info('Profile validation check:', {
      candidateId: candidateUserId,
      hasSkills,
      hasExperience,
      hasEducation,
      hasResume,
      skillsCount: allSkills.length,
      experienceCount: allExperience.length,
      hasResumeUrl: !!candidateProfile.resume?.current?.url,
      hasResumeFileName: !!candidateProfile.resume?.current?.fileName,
      hasExtractedText: !!candidateProfile.resume?.current?.aiAnalysis?.extractedData?.textContent,
    });

    if (!hasSkills && !hasExperience && !hasEducation && !hasResume) {
      logger.warn(`Profile validation failed for candidate ${candidateUserId}: Profile is empty`);
      
      // Delete any existing matching scores for this candidate since profile is empty
      await CVMatchingScore.deleteMany({ candidateId: candidateUserId });
      logger.info(`Deleted existing matching scores for candidate ${candidateUserId} due to empty profile`);
      
      return res.status(400).json({
        success: false,
        message:
          'Bạn chưa cập nhật hồ sơ hoặc tải CV. Vui lòng upload CV hoặc cập nhật thông tin (kỹ năng, kinh nghiệm, học vấn) trước khi sử dụng tính năng gợi ý việc làm.',
      });
    }

      // 3. Fetch all active jobs
      const activeJobs = await Job.find({ status: 'active' })
        .populate('skills')
        .populate('employer', 'companyName')
        .lean();

      if (activeJobs.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No active jobs available',
          data: {
            calculated: 0,
            total: 0,
          },
        });
      }

      // 4. Calculate matching scores for each job (PARALLEL PROCESSING)
      let successCount = 0;
      let errorCount = 0;
      const topMatches = [];

      logger.info(`📊 Starting calculation for ${activeJobs.length} jobs...`);

      // Process jobs in parallel batches for better performance
      const BATCH_SIZE = 5; // Process 5 jobs at a time
      const batches = [];
      
      for (let i = 0; i < activeJobs.length; i += BATCH_SIZE) {
        batches.push(activeJobs.slice(i, i + BATCH_SIZE));
      }

      logger.info(`⚡ Processing in ${batches.length} batches of ${BATCH_SIZE} jobs each`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStartIndex = batchIndex * BATCH_SIZE;

        logger.info(`📦 Batch ${batchIndex + 1}/${batches.length}: Processing ${batch.length} jobs in parallel...`);

        // Process batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (job, indexInBatch) => {
            const jobIndex = batchStartIndex + indexInBatch + 1;
            
            try {
              logger.info(`🔄 [${jobIndex}/${activeJobs.length}] Processing: ${job.title}`);

              // Prepare job data
              const jobData = {
                _id: job._id,
                title: job.title,
                description: job.description,
                requirements: job.requirements,
                skills: job.skills,
                industryCode: job.industryCode,
                location: job.location,
                salaryRange: job.salaryRange,
                employmentType: job.employmentType,
              };

              // Calculate matching score
              const matchingResult = await aiService.calculateAdvancedMatchScore(
                cvData,
                jobData,
                {
                  candidateId: candidateUserId,
                  jobId: job._id,
                  forceRecalculate: false,
                }
              );

              logger.info(`✅ [${jobIndex}/${activeJobs.length}] Score: ${matchingResult.overallScore}% - ${job.title}`);

              // Delete existing score if any
              await CVMatchingScore.deleteMany({
                candidateId: candidateUserId,
                jobId: job._id,
              });

              // Save new score
              await CVMatchingScore.create(matchingResult);

              return {
                success: true,
                job,
                matchingResult,
              };

            } catch (error) {
              logger.error(`❌ [${jobIndex}/${activeJobs.length}] Error for ${job.title}:`, error.message);
              return {
                success: false,
                job,
                error,
              };
            }
          })
        );

        // Process batch results
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
            const { matchingResult, job } = result.value;

            // Keep track of top matches for response (threshold: 30%)
            if (matchingResult.overallScore >= 30) {
              topMatches.push({
                jobId: job._id,
                title: job.title,
                company: job.employer?.companyName,
                score: matchingResult.overallScore,
              });
            }
          } else {
            errorCount++;
          }
        }

        logger.info(`✅ Batch ${batchIndex + 1}/${batches.length} completed: ${successCount} successful, ${errorCount} failed`);
      }

      // Sort top matches by score
      topMatches.sort((a, b) => b.score - a.score);

      res.status(200).json({
        success: true,
        message: 'Job matching scores calculated successfully',
        data: {
          calculated: successCount,
          failed: errorCount,
          total: activeJobs.length,
          topMatches: topMatches.slice(0, 10), // Return top 10
        },
      });

    } catch (error) {
      logger.error('Error calculating all job matches:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating job matches',
        error: error.message,
      });
    }
  }
}

module.exports = new AdvancedNLPController();
