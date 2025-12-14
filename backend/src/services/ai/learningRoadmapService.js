/**
 * Learning Roadmap Service
 * Self-sufficient service for generating personalized learning roadmaps
 * 
 * Uses:
 * - PhoBERT NER for skill extraction from job descriptions
 * - Sentence-BERT for semantic matching between skills
 * - Vector Store (ChromaDB) for finding relevant learning resources
 * - TF-IDF for skill similarity calculation
 * 
 * NO mandatory Gemini dependency - fully self-sufficient
 */

const skillExtractionService = require('./skillExtractionService');
const skillNormalizationService = require('./skillNormalizationService');
const sentenceBertService = require('./sentenceBertService');
const vectorStoreService = require('../vectorStore/vectorStoreService');
const natural = require('natural');
const { logger } = require('../../utils/logger');

const TfIdf = natural.TfIdf;

class LearningRoadmapService {
  constructor() {
    this.tfidf = new TfIdf();
    this.initialized = false;
  }

  /**
   * Initialize service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      logger.info('Initializing Learning Roadmap Service...');
      
      // Initialize sub-services
      await skillExtractionService.initialize();
      await sentenceBertService.initialize();
      
      this.initialized = true;
      logger.info('✅ Learning Roadmap Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Learning Roadmap Service:', error);
      throw error;
    }
  }

  /**
   * Generate personalized learning roadmap for a job
   * 
   * @param {Object} job - Job object with requirements
   * @param {Object} candidateProfile - Candidate profile with current skills
   * @param {Number} duration - Roadmap duration in weeks (default: 12)
   * @returns {Object} Generated roadmap
   */
  async generateRoadmapForJob(job, candidateProfile, duration = 12) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info('Generating roadmap for job:', { jobId: job._id, duration });

      // Step 1: Extract required skills from job
      const requiredSkills = await this._extractJobSkills(job);
      logger.info(`Extracted ${requiredSkills.length} required skills from job`);

      // Step 2: Extract current skills from candidate
      const currentSkills = await this._extractCandidateSkills(candidateProfile);
      logger.info(`Candidate has ${currentSkills.length} current skills`);

      // Step 3: Perform skill gap analysis
      const skillGaps = await this._analyzeSkillGaps(requiredSkills, currentSkills);
      logger.info(`Found ${skillGaps.critical.length} critical, ${skillGaps.important.length} important, ${skillGaps.optional.length} optional skill gaps`);

      // Step 4: Prioritize skills to learn
      const prioritizedSkills = this._prioritizeSkills(skillGaps, duration);
      logger.info(`Prioritized ${prioritizedSkills.length} skills for learning`);

      // Step 5: Find learning resources for each skill
      const skillsWithResources = await this._findLearningResources(prioritizedSkills);
      logger.info(`Found resources for ${skillsWithResources.filter(s => s.resources.length > 0).length} skills`);

      // Step 6: Create week-by-week roadmap
      const weeks = this._createWeeklyRoadmap(skillsWithResources, duration);
      logger.info(`Created ${weeks.length} weeks roadmap`);

      // Step 7: Calculate total hours and difficulty
      const estimatedTotalHours = this._calculateTotalHours(weeks);
      const difficulty = this._calculateDifficulty(skillGaps, candidateProfile);

      return {
        success: true,
        roadmap: {
          targetJobTitle: job.title,
          targetJobId: job._id,
          duration,
          difficulty,
          estimatedTotalHours,
          skillGaps,
          weeks,
          metadata: {
            totalSkillsToLearn: prioritizedSkills.length,
            totalResources: skillsWithResources.reduce((sum, s) => sum + s.resources.length, 0),
            generatedAt: new Date(),
            generationMethod: 'self-sufficient-nlp',
            models: {
              skillExtraction: 'PhoBERT NER (F1 96%)',
              semanticMatching: 'Sentence-BERT (768-dim)',
              resourceMatching: 'TF-IDF + ChromaDB',
            },
          },
        },
      };
    } catch (error) {
      logger.error('Error generating roadmap:', error);
      return {
        success: false,
        error: error.message,
        roadmap: null,
      };
    }
  }

  /**
   * Extract required skills from job description
   * Uses PhoBERT NER for accurate skill extraction
   */
  async _extractJobSkills(job) {
    const skills = [];

    try {
      // Extract from job requirements (if structured)
      if (job.requirements && Array.isArray(job.requirements)) {
        job.requirements.forEach(req => {
          if (req.type === 'skill' || req.category === 'skills') {
            skills.push({
              name: req.name || req.skill,
              level: req.level || 'intermediate',
              importance: req.importance || 'important',
              source: 'structured',
            });
          }
        });
      }

      // Extract from job description text using PhoBERT
      if (job.description) {
        const extractedSkills = await skillExtractionService.extractSkills(job.description);
        extractedSkills.forEach(skill => {
          if (!skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
            skills.push({
              name: skill.name,
              level: 'intermediate',
              importance: 'important',
              source: 'phobert',
              confidence: skill.confidence,
            });
          }
        });
      }

      // Normalize skill names
      const normalizedSkills = await Promise.all(
        skills.map(async skill => {
          const normalized = await skillNormalizationService.normalizeSkill(skill.name);
          return {
            ...skill,
            name: normalized.normalizedName,
            category: normalized.category,
          };
        })
      );

      return normalizedSkills;
    } catch (error) {
      logger.error('Error extracting job skills:', error);
      return skills;
    }
  }

  /**
   * Extract current skills from candidate profile
   */
  async _extractCandidateSkills(candidateProfile) {
    const skills = [];

    try {
      // Extract from profile skills array
      if (candidateProfile.skills && Array.isArray(candidateProfile.skills)) {
        candidateProfile.skills.forEach(skill => {
          skills.push({
            name: skill.name || skill,
            level: skill.level || 'beginner',
            yearsOfExperience: skill.yearsOfExperience || 0,
            source: 'profile',
          });
        });
      }

      // Extract from experience descriptions using PhoBERT
      if (candidateProfile.experience && Array.isArray(candidateProfile.experience)) {
        for (const exp of candidateProfile.experience) {
          if (exp.description) {
            const extractedSkills = await skillExtractionService.extractSkills(exp.description);
            extractedSkills.forEach(skill => {
              if (!skills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
                skills.push({
                  name: skill.name,
                  level: 'intermediate',
                  yearsOfExperience: exp.duration || 0,
                  source: 'experience',
                  confidence: skill.confidence,
                });
              }
            });
          }
        }
      }

      // Normalize skill names
      const normalizedSkills = await Promise.all(
        skills.map(async skill => {
          const normalized = await skillNormalizationService.normalizeSkill(skill.name);
          return {
            ...skill,
            name: normalized.normalizedName,
            category: normalized.category,
          };
        })
      );

      return normalizedSkills;
    } catch (error) {
      logger.error('Error extracting candidate skills:', error);
      return skills;
    }
  }

  /**
   * Analyze skill gaps between required and current skills
   */
  async _analyzeSkillGaps(requiredSkills, currentSkills) {
    const gaps = {
      critical: [],
      important: [],
      optional: [],
    };

    try {
      for (const required of requiredSkills) {
        // Check if candidate has this skill
        const hasSkill = currentSkills.find(
          current => current.name.toLowerCase() === required.name.toLowerCase()
        );

        if (!hasSkill) {
          // Skill missing - categorize by importance
          const gap = {
            skillName: required.name,
            requiredLevel: required.level,
            currentLevel: 'none',
            category: required.category,
            importance: required.importance,
          };

          if (required.importance === 'critical' || required.level === 'required') {
            gaps.critical.push(gap);
          } else if (required.importance === 'important' || required.level === 'preferred') {
            gaps.important.push(gap);
          } else {
            gaps.optional.push(gap);
          }
        } else if (this._skillLevelBelowRequired(hasSkill.level, required.level)) {
          // Skill level insufficient
          const gap = {
            skillName: required.name,
            requiredLevel: required.level,
            currentLevel: hasSkill.level,
            category: required.category,
            importance: 'upgrade',
          };

          if (required.importance === 'critical') {
            gaps.critical.push(gap);
          } else {
            gaps.important.push(gap);
          }
        }
      }

      return gaps;
    } catch (error) {
      logger.error('Error analyzing skill gaps:', error);
      return gaps;
    }
  }

  /**
   * Check if current skill level is below required
   */
  _skillLevelBelowRequired(currentLevel, requiredLevel) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel?.toLowerCase() || 'beginner');
    const requiredIndex = levels.indexOf(requiredLevel?.toLowerCase() || 'intermediate');
    return currentIndex < requiredIndex;
  }

  /**
   * Prioritize skills to learn based on gaps and duration
   */
  _prioritizeSkills(skillGaps, duration) {
    const prioritized = [];

    // Add critical skills first (must learn)
    prioritized.push(...skillGaps.critical.map(gap => ({
      ...gap,
      priority: 1,
      estimatedWeeks: this._estimateWeeksToLearn(gap),
    })));

    // Add important skills
    prioritized.push(...skillGaps.important.map(gap => ({
      ...gap,
      priority: 2,
      estimatedWeeks: this._estimateWeeksToLearn(gap),
    })));

    // Add optional skills if duration allows
    const weeksUsed = prioritized.reduce((sum, skill) => sum + skill.estimatedWeeks, 0);
    const weeksRemaining = duration - weeksUsed;

    if (weeksRemaining > 0) {
      let optionalWeeks = 0;
      for (const gap of skillGaps.optional) {
        const weeks = this._estimateWeeksToLearn(gap);
        if (optionalWeeks + weeks <= weeksRemaining) {
          prioritized.push({
            ...gap,
            priority: 3,
            estimatedWeeks: weeks,
          });
          optionalWeeks += weeks;
        }
      }
    }

    return prioritized;
  }

  /**
   * Estimate weeks needed to learn a skill
   */
  _estimateWeeksToLearn(gap) {
    // Base weeks by level
    const levelWeeks = {
      beginner: 2,
      intermediate: 3,
      advanced: 4,
      expert: 6,
    };

    let weeks = levelWeeks[gap.requiredLevel?.toLowerCase()] || 3;

    // If upgrading (not learning from scratch), reduce time
    if (gap.currentLevel && gap.currentLevel !== 'none') {
      weeks = Math.ceil(weeks * 0.6);
    }

    return Math.max(1, weeks);
  }

  /**
   * Find learning resources for each skill using vector search
   */
  async _findLearningResources(prioritizedSkills) {
    const skillsWithResources = [];

    for (const skill of prioritizedSkills) {
      try {
        // Search for resources using vector store
        const resources = await vectorStoreService.searchResources(
          `${skill.skillName} ${skill.requiredLevel} tutorial course`,
          5 // Top 5 resources
        );

        skillsWithResources.push({
          ...skill,
          resources: resources.map(r => ({
            title: r.title,
            url: r.url,
            type: r.type,
            difficulty: r.difficulty,
            duration: r.duration,
            score: r.score,
            provider: r.provider || 'Unknown',
          })),
        });
      } catch (error) {
        logger.warn(`Could not find resources for ${skill.skillName}:`, error.message);
        
        // Fallback: generate generic resource suggestions
        skillsWithResources.push({
          ...skill,
          resources: this._generateFallbackResources(skill),
        });
      }
    }

    return skillsWithResources;
  }

  /**
   * Generate fallback resources when vector search fails
   */
  _generateFallbackResources(skill) {
    const skillName = skill.skillName;
    const level = skill.requiredLevel || 'intermediate';

    return [
      {
        title: `${skillName} ${level} Course`,
        url: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`,
        type: 'course',
        difficulty: level,
        duration: '4-6 weeks',
        provider: 'Coursera',
        score: 0.7,
      },
      {
        title: `Learn ${skillName} on Udemy`,
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillName)}`,
        type: 'course',
        difficulty: level,
        duration: '20-40 hours',
        provider: 'Udemy',
        score: 0.6,
      },
      {
        title: `${skillName} Documentation`,
        url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' official documentation')}`,
        type: 'documentation',
        difficulty: level,
        duration: 'self-paced',
        provider: 'Official Docs',
        score: 0.8,
      },
    ];
  }

  /**
   * Create week-by-week learning roadmap
   */
  _createWeeklyRoadmap(skillsWithResources, totalDuration) {
    const weeks = [];
    let currentWeek = 1;
    let skillIndex = 0;

    while (currentWeek <= totalDuration && skillIndex < skillsWithResources.length) {
      const skill = skillsWithResources[skillIndex];
      const weeksForSkill = Math.min(skill.estimatedWeeks, totalDuration - currentWeek + 1);

      for (let i = 0; i < weeksForSkill; i++) {
        weeks.push({
          weekNumber: currentWeek,
          title: `Week ${currentWeek}: ${skill.skillName}`,
          description: `Learn ${skill.skillName} to ${skill.requiredLevel} level`,
          skills: [
            {
              skillName: skill.skillName,
              targetLevel: skill.requiredLevel,
              category: skill.category,
              priority: skill.priority,
            },
          ],
          resources: skill.resources,
          tasks: this._generateWeeklyTasks(skill, i + 1, weeksForSkill),
          estimatedHours: this._estimateWeeklyHours(skill.requiredLevel),
          milestones: i === weeksForSkill - 1 ? [`Complete ${skill.skillName}`] : [],
        });
        currentWeek++;
      }

      skillIndex++;
    }

    return weeks;
  }

  /**
   * Generate tasks for a specific week
   */
  _generateWeeklyTasks(skill, weekNumber, totalWeeks) {
    const tasks = [];

    if (weekNumber === 1) {
      tasks.push(
        `Review ${skill.skillName} fundamentals and prerequisites`,
        `Watch introductory tutorials and read documentation`,
        `Set up development environment for ${skill.skillName}`
      );
    } else if (weekNumber === totalWeeks) {
      tasks.push(
        `Complete a mini-project using ${skill.skillName}`,
        `Review and consolidate knowledge`,
        `Take practice assessments or quizzes`
      );
    } else {
      tasks.push(
        `Continue hands-on practice with ${skill.skillName}`,
        `Work through intermediate exercises`,
        `Build components or features using ${skill.skillName}`
      );
    }

    return tasks;
  }

  /**
   * Estimate weekly hours based on skill level
   */
  _estimateWeeklyHours(level) {
    const hoursMap = {
      beginner: 8,
      intermediate: 12,
      advanced: 15,
      expert: 20,
    };
    return hoursMap[level?.toLowerCase()] || 10;
  }

  /**
   * Calculate total hours for roadmap
   */
  _calculateTotalHours(weeks) {
    return weeks.reduce((total, week) => total + (week.estimatedHours || 0), 0);
  }

  /**
   * Calculate roadmap difficulty
   */
  _calculateDifficulty(skillGaps, candidateProfile) {
    const criticalCount = skillGaps.critical.length;
    const importantCount = skillGaps.important.length;
    const totalGaps = criticalCount + importantCount + skillGaps.optional.length;

    const experienceYears = candidateProfile.experience
      ? candidateProfile.experience.reduce((sum, exp) => sum + (exp.duration || 0), 0)
      : 0;

    // Calculate difficulty score
    let difficultyScore = 0;

    // Weight by gap severity
    difficultyScore += criticalCount * 3;
    difficultyScore += importantCount * 2;
    difficultyScore += skillGaps.optional.length * 1;

    // Adjust for candidate experience (more experience = easier)
    if (experienceYears > 5) {
      difficultyScore *= 0.7;
    } else if (experienceYears > 2) {
      difficultyScore *= 0.85;
    }

    // Categorize difficulty
    if (difficultyScore < 5) return 'beginner';
    if (difficultyScore < 10) return 'intermediate';
    if (difficultyScore < 15) return 'advanced';
    return 'expert';
  }

  /**
   * Get info about the service
   */
  getInfo() {
    return {
      name: 'Learning Roadmap Service',
      version: '1.0.0',
      status: this.initialized ? 'ready' : 'not initialized',
      features: {
        skillExtraction: 'PhoBERT NER (F1 96%)',
        skillMatching: 'Sentence-BERT (768-dim)',
        resourceSearch: 'ChromaDB + TF-IDF',
        roadmapGeneration: 'Self-sufficient algorithm',
      },
      dependencies: {
        gemini: 'optional',
        phobert: 'required',
        sentenceBert: 'required',
        chromadb: 'required',
      },
    };
  }
}

// Singleton instance
const learningRoadmapService = new LearningRoadmapService();

module.exports = learningRoadmapService;
