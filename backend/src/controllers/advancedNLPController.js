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
        targetRole,
        cvData,
        timeframe = 12,
        useRag = true,
      } = req.body;

      const candidateId = req.user._id;

      logger.info(`🚀 Generating RAG-powered roadmap for candidate: ${candidateId}`);

      // Get matching score to identify skill gaps
      let skillGaps = [];
      
      if (targetJobId) {
        const matchingScore = await CVMatchingScore.findOne({
          candidateId,
          jobId: targetJobId,
        }).lean();

        if (matchingScore && matchingScore.skillGapAnalysis?.missingSkills) {
          skillGaps = matchingScore.skillGapAnalysis.missingSkills.map(skill => ({
            skill: skill.skill || skill,
            importance: skill.importance || 'important',
            priority: skill.priority || 5,
          }));
        }
      }

      // If no skill gaps from matching, extract from CVData
      if (skillGaps.length === 0 && cvData) {
        // Use AI to extract skill gaps
        const extractedGaps = await aiService.extractSkillGapsFromCV(cvData, targetRole);
        skillGaps = extractedGaps || [];
      }

      if (skillGaps.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Unable to identify skill gaps. Please provide CVData or calculate matching score first.',
        });
      }

      logger.info(`📊 Identified ${skillGaps.length} skill gaps`);

      // Initialize RAG service
      await ragService.initialize();

      // Generate RAG-powered roadmap with real resources
      const ragRoadmap = await ragService.generateRoadmap(skillGaps, {
        jobTitle: targetRole || 'Target Position',
        currentLevel: cvData?.currentLevel || 'beginner',
        timeframe: timeframe,
      });

      // Save to database
      const learningRoadmap = new LearningRoadmap({
        candidateId: candidateId,
        targetJobId: targetJobId || null,
        targetRole: targetRole || 'Target Position',
        skillGaps: skillGaps,
        currentLevel: ragRoadmap.currentLevel,
        targetLevel: ragRoadmap.targetLevel,
        estimatedDuration: timeframe,
        phases: ragRoadmap.phases.map(phase => ({
          phaseNumber: phase.phaseNumber,
          name: phase.phaseName,
          duration: phase.duration,
          learningObjectives: phase.learningObjectives,
          weeks: this.convertPhaseToWeeks(phase),
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
  convertPhaseToWeeks(phase) {
    const weeks = [];
    const weeksInPhase = phase.duration;
    const skillsPerWeek = Math.ceil(phase.skills.length / weeksInPhase);

    for (let weekNum = 1; weekNum <= weeksInPhase; weekNum++) {
      const startIdx = (weekNum - 1) * skillsPerWeek;
      const endIdx = Math.min(startIdx + skillsPerWeek, phase.skills.length);
      const weekSkills = phase.skills.slice(startIdx, endIdx);

      const weekResources = weekSkills.flatMap(skillGroup => 
        skillGroup.resources.map(resource => ({
          type: resource.type,
          title: resource.title,
          url: resource.url,
          provider: resource.provider,
          duration: resource.duration,
          difficulty: resource.difficulty,
          rating: resource.rating,
          credibility: resource.credibility,
          source: resource.source,
          metadata: resource.metadata,
        }))
      );

      weeks.push({
        weekNumber: weekNum,
        focusSkills: weekSkills.map(s => s.skill),
        learningObjectives: weekSkills.map(s => `Master ${s.skill} fundamentals`),
        resources: weekResources,
        estimatedHours: weekResources.reduce((sum, r) => sum + (r.duration || 0) / 60, 0),
        completed: false,
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
}

module.exports = new AdvancedNLPController();
