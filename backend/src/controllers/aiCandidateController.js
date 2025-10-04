const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const { aiService } = require('../services/aiService');
const { recommendationService } = require('../services/recommendationService');
const { careerPathService } = require('../services/careerPathService');
const { ApiResponse } = require('../utils/responseHandler');
const { AppError } = require('../utils/errors');

class AICandidateController {
  // ============================================
  // RECOMMENDATIONS & MATCHING (2 endpoints)
  // ============================================

  /**
   * GET /api/v2/ai/candidates/recommendations
   * Unified recommendations endpoint for all types
   * Query: ?type=jobs|skills|courses|career-paths|similar-jobs&job_id=&limit=10
   */
  async getRecommendations(req, res, next) {
    try {
      const { type, job_id, limit = 10, current_role, target_role } = req.query;

      // Validate type parameter
      const validTypes = [
        'jobs',
        'skills',
        'courses',
        'career-paths',
        'similar-jobs',
      ];
      if (!validTypes.includes(type)) {
        throw new AppError(
          `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          400
        );
      }

      // Get candidate profile
      const profile = await CandidateProfile.findOne({
        userId: req.user.id,
      }).populate('userId', 'fullName email');

      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      let recommendations = {};

      switch (type) {
        case 'jobs':
          recommendations = await this._getJobRecommendations(profile, {
            limit,
          });
          break;

        case 'skills':
          recommendations = await this._getSkillRecommendations(profile, {
            limit,
          });
          break;

        case 'courses':
          recommendations = await this._getCourseRecommendations(profile, {
            limit,
          });
          break;

        case 'career-paths':
          recommendations = await this._getCareerPathRecommendations(profile, {
            limit,
            current_role,
            target_role,
          });
          break;

        case 'similar-jobs':
          if (!job_id) {
            throw new AppError('job_id is required for similar-jobs type', 400);
          }
          recommendations = await this._getSimilarJobs(profile, job_id, {
            limit,
          });
          break;
      }

      return ApiResponse.success(
        res,
        {
          type,
          recommendations,
          profile_id: profile._id,
          generated_at: new Date(),
        },
        `${type} recommendations generated successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v2/ai/candidates/matching
   * Unified job matching endpoint
   * Query: ?job_id=xxx&action=score|analysis|fit|compare
   * Body (POST for compare): { job_ids: [1,2,3] }
   */
  async getJobMatching(req, res, next) {
    try {
      const { job_id, action = 'score' } = req.query;

      // Validate action parameter
      const validActions = ['score', 'analysis', 'fit', 'compare'];
      if (!validActions.includes(action)) {
        throw new AppError(
          `Invalid action. Must be one of: ${validActions.join(', ')}`,
          400
        );
      }

      // Get candidate profile
      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      let result = {};

      switch (action) {
        case 'score':
          if (!job_id)
            throw new AppError('job_id is required for score action', 400);
          result = await this._getMatchScore(profile, job_id);
          break;

        case 'analysis':
          if (!job_id)
            throw new AppError('job_id is required for analysis action', 400);
          result = await this._getCompatibilityAnalysis(profile, job_id);
          break;

        case 'fit':
          if (!job_id)
            throw new AppError('job_id is required for fit action', 400);
          result = await this._getJobFitAnalysis(profile, job_id);
          break;

        case 'compare':
          // For compare, expect job_ids in request body (if POST) or query
          const jobIds = req.body?.job_ids || req.query.job_ids?.split(',');
          if (!jobIds || jobIds.length < 2) {
            throw new AppError(
              'At least 2 job_ids are required for compare action',
              400
            );
          }
          result = await this._compareJobs(profile, jobIds);
          break;
      }

      return ApiResponse.success(
        res,
        {
          action,
          job_id: action === 'compare' ? undefined : job_id,
          ...result,
        },
        `Job ${action} completed successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // SEARCH & RESUME AI (3 endpoints)
  // ============================================

  /**
   * POST /api/v2/ai/candidates/search
   * Semantic search for jobs and companies
   * Body: { query: "semantic search query", type: "jobs" | "companies" }
   */
  async semanticSearch(req, res, next) {
    try {
      const { query, type = 'jobs' } = req.body;

      if (!query) {
        throw new AppError('Search query is required', 400);
      }

      if (!['jobs', 'companies'].includes(type)) {
        throw new AppError('Type must be "jobs" or "companies"', 400);
      }

      // Get candidate profile for personalization
      const profile = await CandidateProfile.findOne({ userId: req.user.id });

      let results = {};

      if (type === 'jobs') {
        results = await this._semanticJobSearch(query, profile);
      } else {
        results = await this._semanticCompanySearch(query, profile);
      }

      return ApiResponse.success(
        res,
        {
          query,
          type,
          results,
          search_metadata: {
            personalized: !!profile,
            result_count: results.items?.length || 0,
            search_time: new Date(),
          },
        },
        `Semantic ${type} search completed successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/ai/candidates/resume
   * Unified resume AI operations
   * Body: { resume_id?, action: "analyze" | "optimize" | "score" | "ats-check", target_job_id? }
   */
  async handleResumeAI(req, res, next) {
    try {
      const { resume_id, action, target_job_id } = req.body;

      // Validate action parameter
      const validActions = ['analyze', 'optimize', 'score', 'ats-check'];
      if (!validActions.includes(action)) {
        throw new AppError(
          `Invalid action. Must be one of: ${validActions.join(', ')}`,
          400
        );
      }

      // Get candidate profile
      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      // Get resume data
      const resumeData = profile.resume?.current;
      if (!resumeData?.url) {
        throw new AppError(
          'No resume found. Please upload a resume first.',
          404
        );
      }

      let result = {};

      switch (action) {
        case 'analyze':
          result = await this._analyzeResume(resumeData, profile);
          break;

        case 'optimize':
          result = await this._optimizeResume(
            resumeData,
            profile,
            target_job_id
          );
          break;

        case 'score':
          result = await this._scoreResume(resumeData, profile, target_job_id);
          break;

        case 'ats-check':
          result = await this._atsCheckResume(resumeData, profile);
          break;
      }

      // Update resume AI analysis if available
      if (result.skills || result.suggestions) {
        profile.resume.current.aiAnalysis = {
          ...profile.resume.current.aiAnalysis,
          lastAction: action,
          lastAnalyzedAt: new Date(),
          ...(result.skills && { skills: result.skills }),
          ...(result.suggestions && { suggestions: result.suggestions }),
        };
        await profile.save();
      }

      return ApiResponse.success(
        res,
        {
          action,
          resume_id: resumeData._id,
          target_job_id,
          ...result,
        },
        `Resume ${action} completed successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/ai/candidates/resume/builder
   * AI resume content generation
   * Body: { action: "summary" | "bullets" | "skills" | "tailor", data: {...}, job_id? }
   */
  async resumeBuilder(req, res, next) {
    try {
      const { action, data, job_id } = req.body;

      // Validate action parameter
      const validActions = ['summary', 'bullets', 'skills', 'tailor'];
      if (!validActions.includes(action)) {
        throw new AppError(
          `Invalid action. Must be one of: ${validActions.join(', ')}`,
          400
        );
      }

      // Get candidate profile
      const profile = await CandidateProfile.findOne({
        userId: req.user.id,
      }).populate('userId', 'fullName email');

      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      let generatedContent = {};

      switch (action) {
        case 'summary':
          generatedContent = await this._generateProfileSummary(
            profile,
            job_id
          );
          break;

        case 'bullets':
          generatedContent = await this._generateExperienceBullets(
            profile,
            data,
            job_id
          );
          break;

        case 'skills':
          generatedContent = await this._generateSkillsSection(profile, job_id);
          break;

        case 'tailor':
          if (!job_id)
            throw new AppError('job_id is required for tailor action', 400);
          generatedContent = await this._tailorResumeForJob(profile, job_id);
          break;
      }

      return ApiResponse.success(
        res,
        {
          action,
          job_id,
          generated_content: generatedContent,
          profile_id: profile._id,
          generated_at: new Date(),
        },
        `Resume ${action} generated successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // CAREER DEVELOPMENT (2 endpoints)
  // ============================================

  /**
   * GET /api/v2/ai/candidates/career
   * Unified career development endpoint
   * Query: ?type=path|skill-gap|learning&current_role=&target_role=&skill=
   */
  async getCareerDevelopment(req, res, next) {
    try {
      const {
        type,
        current_role,
        target_role,
        skill,
        level = 'beginner',
      } = req.query;

      // Validate type parameter
      const validTypes = ['path', 'skill-gap', 'learning'];
      if (!validTypes.includes(type)) {
        throw new AppError(
          `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          400
        );
      }

      // Get candidate profile
      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      let result = {};

      switch (type) {
        case 'path':
          result = await this._getCareerPaths(profile, {
            current_role,
            target_role,
          });
          break;

        case 'skill-gap':
          result = await this._getSkillGapAnalysis(profile, { target_role });
          break;

        case 'learning':
          result = await this._getLearningPaths(profile, {
            skill,
            level,
            target_role,
          });
          break;
      }

      return ApiResponse.success(
        res,
        {
          type,
          current_role,
          target_role,
          skill,
          ...result,
        },
        `Career ${type} analysis completed successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v2/ai/candidates/career/:pathId
   * Career path actions
   * Body: { action: "select" | "enroll" }
   */
  async handleCareerPath(req, res, next) {
    try {
      const { pathId } = req.params;
      const { action } = req.body;

      // Validate action parameter
      const validActions = ['select', 'enroll'];
      if (!validActions.includes(action)) {
        throw new AppError(
          `Invalid action. Must be one of: ${validActions.join(', ')}`,
          400
        );
      }

      // Get candidate profile
      const profile = await CandidateProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      let result = {};

      switch (action) {
        case 'select':
          result = await this._selectCareerPath(profile, pathId);
          break;

        case 'enroll':
          result = await this._enrollLearningPath(profile, pathId);
          break;
      }

      return ApiResponse.success(
        res,
        {
          path_id: pathId,
          action,
          ...result,
        },
        `Career path ${action} completed successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // INTERVIEW PREPARATION (1 endpoint)
  // ============================================

  /**
   * POST /api/v2/ai/candidates/interview
   * Interview preparation and mock interviews
   * Body: { job_id, action: "prep" | "mock", questions?, answers? }
   */
  async handleInterview(req, res, next) {
    try {
      const { job_id, action, questions, answers } = req.body;

      // Validate action parameter
      const validActions = ['prep', 'mock'];
      if (!validActions.includes(action)) {
        throw new AppError(
          `Invalid action. Must be one of: ${validActions.join(', ')}`,
          400
        );
      }

      if (!job_id) {
        throw new AppError('job_id is required', 400);
      }

      // Get candidate profile and job
      const [profile, job] = await Promise.all([
        CandidateProfile.findOne({ userId: req.user.id }),
        Job.findById(job_id).populate('employer', 'company'),
      ]);

      if (!profile) {
        throw new AppError('Candidate profile not found', 404);
      }

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      let result = {};

      switch (action) {
        case 'prep':
          result = await this._getInterviewPreparation(profile, job);
          break;

        case 'mock':
          if (!questions || !answers) {
            throw new AppError(
              'Both questions and answers are required for mock interview',
              400
            );
          }
          result = await this._conductMockInterview(
            profile,
            job,
            questions,
            answers
          );
          break;
      }

      return ApiResponse.success(
        res,
        {
          job_id,
          action,
          company: job.employer?.company?.name,
          position: job.title,
          ...result,
        },
        `Interview ${action} completed successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // HELPER METHODS FOR RECOMMENDATIONS
  // ============================================

  async _getJobRecommendations(profile, options) {
    const { limit } = options;

    // Build recommendation criteria based on profile
    const criteria = {
      skills: profile.skills?.technical?.map(s => s.name) || [],
      industries: profile.preferences?.industries || [],
      locations: profile.preferences?.locations || [],
      experience_level: this._inferExperienceLevel(profile),
    };

    // Get recommended jobs using AI/ML service
    const recommendedJobs = await recommendationService.getJobRecommendations(
      criteria,
      {
        limit: parseInt(limit),
        user_id: profile.userId,
        exclude_applied: true,
      }
    );

    return {
      jobs: recommendedJobs,
      criteria_used: criteria,
      personalization_score: this._calculatePersonalizationScore(profile),
    };
  }

  async _getSkillRecommendations(profile, options) {
    const { limit } = options;

    const currentSkills = profile.skills?.technical?.map(s => s.name) || [];
    const targetRoles = profile.preferences?.targetRoles || [];

    const skillGaps = await aiService.analyzeSkillGaps({
      current_skills: currentSkills,
      target_roles: targetRoles,
      industry: profile.preferences?.industries?.[0],
    });

    return {
      recommended_skills: skillGaps.missing_skills?.slice(0, limit) || [],
      skill_importance: skillGaps.skill_importance || {},
      learning_priority: skillGaps.priority_order || [],
    };
  }

  async _getCourseRecommendations(profile, options) {
    const { limit } = options;

    const skills = profile.skills?.technical?.map(s => s.name) || [];
    const interests = profile.preferences?.industries || [];

    const courses = await recommendationService.getCourseRecommendations({
      current_skills: skills,
      interests,
      skill_level: 'intermediate', // Could be inferred from profile
      limit: parseInt(limit),
    });

    return {
      courses,
      learning_tracks: courses.learning_tracks || [],
      estimated_time: courses.total_hours || 0,
    };
  }

  async _getCareerPathRecommendations(profile, options) {
    const { limit, current_role, target_role } = options;

    const currentRole = current_role || this._inferCurrentRole(profile);
    const targetRoles = target_role
      ? [target_role]
      : profile.preferences?.targetRoles || [];

    const careerPaths = await careerPathService.getCareerPaths({
      from_role: currentRole,
      to_roles: targetRoles,
      current_skills: profile.skills?.technical?.map(s => s.name) || [],
      experience_years: this._calculateExperienceYears(profile),
      limit: parseInt(limit),
    });

    return {
      career_paths: careerPaths,
      current_role: currentRole,
      target_roles: targetRoles,
      timeline_estimate: careerPaths.average_timeline || '2-3 years',
    };
  }

  async _getSimilarJobs(profile, jobId, options) {
    const { limit } = options;

    const targetJob = await Job.findById(jobId);
    if (!targetJob) {
      throw new AppError('Target job not found', 404);
    }

    const similarJobs = await recommendationService.getSimilarJobs({
      reference_job: targetJob,
      candidate_profile: profile,
      limit: parseInt(limit),
      similarity_threshold: 0.7,
    });

    return {
      reference_job: {
        id: targetJob._id,
        title: targetJob.title,
        company: targetJob.company,
      },
      similar_jobs: similarJobs,
      similarity_factors: ['skills', 'industry', 'level', 'location'],
    };
  }

  // ============================================
  // HELPER METHODS FOR MATCHING
  // ============================================

  async _getMatchScore(profile, jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const matchScore = await aiService.calculateJobMatch(profile, job);

    return {
      overall_score: matchScore.overall,
      breakdown: matchScore.breakdown,
      confidence: matchScore.confidence,
      job_title: job.title,
      company: job.company,
    };
  }

  async _getCompatibilityAnalysis(profile, jobId) {
    const job = await Job.findById(jobId).populate('employer', 'company');
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const analysis = await aiService.analyzeCompatibility(profile, job);

    return {
      compatibility_score: analysis.score,
      strengths: analysis.strengths,
      concerns: analysis.concerns,
      cultural_fit: analysis.cultural_fit,
      growth_potential: analysis.growth_potential,
      recommendations: analysis.recommendations,
    };
  }

  async _getJobFitAnalysis(profile, jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const fitAnalysis = await aiService.analyzeJobFit(profile, job);

    return {
      fit_score: fitAnalysis.score,
      why_good_fit: fitAnalysis.positive_factors,
      potential_challenges: fitAnalysis.challenges,
      success_probability: fitAnalysis.success_probability,
      interview_tips: fitAnalysis.interview_tips,
    };
  }

  async _compareJobs(profile, jobIds) {
    const jobs = await Job.find({ _id: { $in: jobIds } });

    if (jobs.length !== jobIds.length) {
      throw new AppError('One or more jobs not found', 404);
    }

    const comparison = await aiService.compareJobs(profile, jobs);

    return {
      jobs_compared: jobs.map(job => ({
        id: job._id,
        title: job.title,
        company: job.company,
      })),
      comparison_matrix: comparison.matrix,
      best_match: comparison.best_match,
      ranking: comparison.ranking,
      decision_factors: comparison.factors,
    };
  }

  // ============================================
  // HELPER METHODS FOR SEARCH
  // ============================================

  async _semanticJobSearch(query, profile) {
    const searchResults = await aiService.semanticSearch({
      query,
      type: 'jobs',
      user_context: profile
        ? {
            skills: profile.skills?.technical?.map(s => s.name) || [],
            preferences: profile.preferences || {},
          }
        : null,
      limit: 20,
    });

    return {
      items: searchResults.jobs,
      total_found: searchResults.total,
      semantic_matches: searchResults.semantic_relevance,
      personalized: !!profile,
    };
  }

  async _semanticCompanySearch(query, profile) {
    const searchResults = await aiService.semanticSearch({
      query,
      type: 'companies',
      user_context: profile
        ? {
            industries: profile.preferences?.industries || [],
            company_size_preference: profile.preferences?.companySize,
          }
        : null,
      limit: 20,
    });

    return {
      items: searchResults.companies,
      total_found: searchResults.total,
      semantic_matches: searchResults.semantic_relevance,
      personalized: !!profile,
    };
  }

  // ============================================
  // HELPER METHODS FOR RESUME AI
  // ============================================

  async _analyzeResume(resumeData, profile) {
    const analysis = await aiService.analyzeResume({
      resume_url: resumeData.url,
      profile_context: profile,
    });

    return {
      overall_score: analysis.score,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      skills_extracted: analysis.skills,
      ats_compatibility: analysis.ats_score,
      suggestions: analysis.improvement_suggestions,
    };
  }

  async _optimizeResume(resumeData, profile, targetJobId) {
    let targetJob = null;
    if (targetJobId) {
      targetJob = await Job.findById(targetJobId);
    }

    const optimization = await aiService.optimizeResume({
      resume_url: resumeData.url,
      profile_context: profile,
      target_job: targetJob,
    });

    return {
      optimized_content: optimization.content,
      changes_made: optimization.changes,
      keyword_optimization: optimization.keywords,
      ats_improvements: optimization.ats_improvements,
      impact_score: optimization.impact_score,
    };
  }

  async _scoreResume(resumeData, profile, targetJobId) {
    const scoring = await aiService.scoreResume({
      resume_url: resumeData.url,
      profile_context: profile,
      target_job_id: targetJobId,
    });

    return {
      overall_score: scoring.overall,
      category_scores: scoring.categories,
      ats_score: scoring.ats,
      keyword_density: scoring.keywords,
      improvement_areas: scoring.improvements,
      benchmark_comparison: scoring.benchmark,
    };
  }

  async _atsCheckResume(resumeData, profile) {
    const atsCheck = await aiService.checkATS({
      resume_url: resumeData.url,
      profile_context: profile,
    });

    return {
      ats_score: atsCheck.score,
      parsing_success: atsCheck.parsing_success,
      formatting_issues: atsCheck.formatting_issues,
      keyword_optimization: atsCheck.keyword_optimization,
      recommendations: atsCheck.recommendations,
      compatible_systems: atsCheck.compatible_systems,
    };
  }

  // ============================================
  // HELPER METHODS FOR RESUME BUILDER
  // ============================================

  async _generateProfileSummary(profile, jobId) {
    let targetJob = null;
    if (jobId) {
      targetJob = await Job.findById(jobId);
    }

    const summary = await aiService.generateSummary({
      profile,
      target_job: targetJob,
      tone: 'professional',
      length: 'medium',
    });

    return {
      generated_summary: summary.content,
      key_highlights: summary.highlights,
      tailored_keywords: summary.keywords,
      alternative_versions: summary.alternatives,
    };
  }

  async _generateExperienceBullets(profile, experienceData, jobId) {
    let targetJob = null;
    if (jobId) {
      targetJob = await Job.findById(jobId);
    }

    const bullets = await aiService.generateExperienceBullets({
      experience_data: experienceData,
      profile_context: profile,
      target_job: targetJob,
    });

    return {
      generated_bullets: bullets.bullets,
      action_verbs_used: bullets.action_verbs,
      quantified_achievements: bullets.quantified,
      impact_focused: bullets.impact_focused,
    };
  }

  async _generateSkillsSection(profile, jobId) {
    let targetJob = null;
    if (jobId) {
      targetJob = await Job.findById(jobId);
    }

    const skillsSection = await aiService.generateSkillsSection({
      current_skills: profile.skills,
      target_job: targetJob,
      prioritize_relevant: true,
    });

    return {
      organized_skills: skillsSection.organized,
      prioritized_list: skillsSection.prioritized,
      skill_groupings: skillsSection.groupings,
      relevance_scores: skillsSection.relevance,
    };
  }

  async _tailorResumeForJob(profile, jobId) {
    const targetJob = await Job.findById(jobId);
    if (!targetJob) {
      throw new AppError('Target job not found', 404);
    }

    const tailoring = await aiService.tailorResume({
      profile,
      target_job: targetJob,
      sections: ['summary', 'experience', 'skills'],
    });

    return {
      tailored_sections: tailoring.sections,
      keyword_matches: tailoring.keyword_matches,
      relevance_improvements: tailoring.improvements,
      customization_score: tailoring.score,
    };
  }

  // ============================================
  // HELPER METHODS FOR CAREER DEVELOPMENT
  // ============================================

  async _getCareerPaths(profile, options) {
    const { current_role, target_role } = options;

    const paths = await careerPathService.getCareerPaths({
      from_role: current_role || this._inferCurrentRole(profile),
      to_role: target_role,
      current_skills: profile.skills?.technical?.map(s => s.name) || [],
      industry: profile.preferences?.industries?.[0],
    });

    return {
      available_paths: paths.paths,
      recommended_path: paths.recommended,
      timeline_estimates: paths.timelines,
      skill_requirements: paths.skill_requirements,
    };
  }

  async _getSkillGapAnalysis(profile, options) {
    const { target_role } = options;

    const analysis = await aiService.analyzeSkillGaps({
      current_skills: profile.skills?.technical?.map(s => s.name) || [],
      target_role: target_role || profile.preferences?.targetRoles?.[0],
      industry: profile.preferences?.industries?.[0],
    });

    return {
      skill_gaps: analysis.gaps,
      priority_skills: analysis.priority,
      market_demand: analysis.market_demand,
      learning_recommendations: analysis.learning_paths,
    };
  }

  async _getLearningPaths(profile, options) {
    const { skill, level, target_role } = options;

    const learningPaths = await recommendationService.getLearningPaths({
      target_skill: skill,
      current_level: level,
      target_role,
      learning_style: profile.preferences?.learningStyle || 'mixed',
    });

    return {
      learning_paths: learningPaths.paths,
      estimated_duration: learningPaths.duration,
      recommended_resources: learningPaths.resources,
      progress_milestones: learningPaths.milestones,
    };
  }

  async _selectCareerPath(profile, pathId) {
    // Add selected career path to profile
    if (!profile.progress.activeRoadmaps) {
      profile.progress.activeRoadmaps = [];
    }

    const existingPath = profile.progress.activeRoadmaps.find(
      path => path.roadmapId.toString() === pathId
    );

    if (existingPath) {
      throw new AppError('Career path already selected', 400);
    }

    profile.progress.activeRoadmaps.push({
      roadmapId: pathId,
      startedAt: new Date(),
      status: 'active',
      progress: 0,
    });

    await profile.save();

    return {
      path_id: pathId,
      status: 'selected',
      started_at: new Date(),
      next_steps: [
        'Complete skill assessment',
        'Review learning materials',
        'Set weekly goals',
      ],
    };
  }

  async _enrollLearningPath(profile, pathId) {
    // Similar to select but with more detailed enrollment
    const enrollment = await careerPathService.enrollInPath(
      profile._id,
      pathId
    );

    return {
      path_id: pathId,
      enrollment_id: enrollment.id,
      status: 'enrolled',
      access_materials: enrollment.materials,
      schedule: enrollment.schedule,
    };
  }

  // ============================================
  // HELPER METHODS FOR INTERVIEW
  // ============================================

  async _getInterviewPreparation(profile, job) {
    const preparation = await aiService.generateInterviewPrep({
      candidate_profile: profile,
      job_details: job,
      company_info: job.employer?.company,
    });

    return {
      common_questions: preparation.common_questions,
      behavioral_questions: preparation.behavioral_questions,
      technical_questions: preparation.technical_questions,
      company_specific: preparation.company_questions,
      preparation_tips: preparation.tips,
      key_talking_points: preparation.talking_points,
    };
  }

  async _conductMockInterview(profile, job, questions, answers) {
    const evaluation = await aiService.evaluateMockInterview({
      candidate_profile: profile,
      job_details: job,
      questions,
      answers,
    });

    return {
      overall_score: evaluation.overall_score,
      question_scores: evaluation.individual_scores,
      strengths: evaluation.strengths,
      improvement_areas: evaluation.improvements,
      feedback: evaluation.detailed_feedback,
      recommendations: evaluation.recommendations,
      follow_up_questions: evaluation.follow_up,
    };
  }

  // ============================================
  // UTILITY HELPER METHODS
  // ============================================

  _inferExperienceLevel(profile) {
    const internships = profile.experience?.internships?.length || 0;
    const projects = profile.experience?.projects?.length || 0;

    if (internships === 0 && projects <= 2) return 'entry';
    if (internships <= 2 && projects <= 5) return 'junior';
    return 'mid';
  }

  _inferCurrentRole(profile) {
    // Infer current role from latest experience or preferences
    const latestInternship = profile.experience?.internships?.[0];
    if (latestInternship) {
      return latestInternship.position;
    }

    const targetRoles = profile.preferences?.targetRoles;
    if (targetRoles && targetRoles.length > 0) {
      return `Aspiring ${targetRoles[0]}`;
    }

    return 'Student/Recent Graduate';
  }

  _calculateExperienceYears(profile) {
    const internships = profile.experience?.internships || [];
    const totalDays = internships.reduce((total, internship) => {
      if (internship.startDate && internship.endDate) {
        const days =
          Math.abs(internship.endDate - internship.startDate) /
          (1000 * 60 * 60 * 24);
        return total + days;
      }
      return total;
    }, 0);

    return Math.round((totalDays / 365) * 10) / 10; // Round to 1 decimal
  }

  _calculatePersonalizationScore(profile) {
    let score = 0;

    if (profile.skills?.technical?.length > 0) score += 25;
    if (profile.preferences?.industries?.length > 0) score += 25;
    if (profile.preferences?.locations?.length > 0) score += 20;
    if (profile.experience?.internships?.length > 0) score += 15;
    if (profile.education?.university?.institution) score += 15;

    return score;
  }
}

module.exports = new AICandidateController();
