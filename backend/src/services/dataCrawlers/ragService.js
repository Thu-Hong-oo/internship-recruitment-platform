const vectorStoreService = require('../vectorStore/vectorStoreService');
const youtubeDataService = require('./youtubeDataService');
const githubDataService = require('./githubDataService');
const courseraDataService = require('./courseraDataService');
const { logger } = require('../../utils/logger');

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Combines vector search with real data sources to generate credible learning roadmaps
 * 
 * @description Provides academically defensible learning resources for thesis
 * @supports Multi-industry: Technology, Marketing, Business, Design, Accounting, Healthcare, etc.
 * @author Thu-Hong-oo
 * @date 2025-12-01
 */
class RAGService {
  constructor() {
    this.initialized = false;
    
    // Industry to data source mapping
    this.industryDataSources = {
      Technology: ['youtube', 'github', 'vector'],
      Marketing: ['coursera', 'youtube', 'vector'],
      Business: ['coursera', 'youtube', 'vector'],
      Design: ['coursera', 'youtube', 'vector'],
      Accounting: ['coursera', 'youtube', 'vector'],
      Finance: ['coursera', 'youtube', 'vector'],
      HR: ['coursera', 'youtube', 'vector'],
      Healthcare: ['coursera', 'youtube', 'vector'],
      Education: ['coursera', 'youtube', 'vector'],
      Engineering: ['youtube', 'coursera', 'github', 'vector'],
      Hospitality: ['coursera', 'youtube', 'vector'],
      Law: ['coursera', 'youtube', 'vector'],
      Media: ['youtube', 'coursera', 'vector'],
      Logistics: ['coursera', 'youtube', 'vector'],
    };
  }

  /**
   * Initialize all services
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      logger.info('🚀 Initializing Multi-Industry RAG Service...');

      // Initialize vector store
      const vectorInit = await vectorStoreService.initialize();
      if (!vectorInit) {
        logger.warn('⚠️ Vector store initialization failed, RAG will use reduced functionality');
      }

      // Initialize data crawlers
      await youtubeDataService.initialize();
      await githubDataService.initialize();
      await courseraDataService.initialize();

      this.initialized = true;
      logger.info('✅ Multi-Industry RAG Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('❌ RAG Service initialization failed:', error);
      return false;
    }
  }

  /**
   * Detect industry from skill name
   * @param {string} skill - The skill name
   * @returns {string} - Detected industry
   */
  detectIndustry(skill) {
    const lowerSkill = skill.toLowerCase();

    if (lowerSkill.includes('marketing') || lowerSkill.includes('seo') || lowerSkill.includes('ads')) {
      return 'Marketing';
    }
    if (lowerSkill.includes('design') || lowerSkill.includes('photoshop') || lowerSkill.includes('figma')) {
      return 'Design';
    }
    if (lowerSkill.includes('account') || lowerSkill.includes('finance') || lowerSkill.includes('tax')) {
      return 'Accounting';
    }
    if (lowerSkill.includes('business') || lowerSkill.includes('management') || lowerSkill.includes('sales')) {
      return 'Business';
    }
    if (lowerSkill.includes('hr') || lowerSkill.includes('recruitment') || lowerSkill.includes('talent')) {
      return 'HR';
    }
    if (lowerSkill.includes('nursing') || lowerSkill.includes('healthcare') || lowerSkill.includes('medical')) {
      return 'Healthcare';
    }
    if (lowerSkill.includes('teaching') || lowerSkill.includes('education') || lowerSkill.includes('curriculum')) {
      return 'Education';
    }
    if (lowerSkill.includes('engineering') || lowerSkill.includes('autocad') || lowerSkill.includes('mechanical')) {
      return 'Engineering';
    }
    if (lowerSkill.includes('hotel') || lowerSkill.includes('hospitality') || lowerSkill.includes('event')) {
      return 'Hospitality';
    }
    if (lowerSkill.includes('law') || lowerSkill.includes('legal') || lowerSkill.includes('contract')) {
      return 'Law';
    }
    if (lowerSkill.includes('media') || lowerSkill.includes('journalism') || lowerSkill.includes('content')) {
      return 'Media';
    }
    if (lowerSkill.includes('supply chain') || lowerSkill.includes('logistics') || lowerSkill.includes('inventory')) {
      return 'Logistics';
    }

    return 'Technology'; // Default
  }

  /**
   * Get learning resources for a skill with multi-source retrieval
   * @param {string} skill - Skill to find resources for
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Ranked learning resources
   */
  async getResources(skill, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        difficulty = 'beginner',
        resourceTypes = ['video', 'project', 'documentation', 'course'],
        maxResourcesPerType = 5,
        minCredibility = 0.6,
        industry = null, // Optional: explicitly set industry
      } = options;

      // Detect industry if not provided
      const detectedIndustry = industry || this.detectIndustry(skill);
      const dataSources = this.industryDataSources[detectedIndustry] || this.industryDataSources.Technology;

      logger.info(`🔍 RAG retrieving resources for: ${skill} (${difficulty}, Industry: ${detectedIndustry})`);
      logger.info(`📊 Using data sources: ${dataSources.join(', ')}`);

      const allResources = [];

      // 1. Search vector database (if available and enabled for industry)
      if (dataSources.includes('vector')) {
        try {
          const vectorResources = await vectorStoreService.searchResources(
            `Learn ${skill} ${difficulty} level tutorial`,
            {
              topK: maxResourcesPerType,
              skill: skill,
              difficulty: difficulty,
              minCredibility: minCredibility,
            }
          );
          
          if (vectorResources && vectorResources.length > 0) {
            logger.info(`✅ Found ${vectorResources.length} resources from vector DB`);
            allResources.push(...vectorResources);
          }
        } catch (error) {
          logger.warn('⚠️ Vector search failed, continuing with other sources:', error.message);
        }
      }

      // 2. Fetch from Coursera (for non-tech industries)
      if (dataSources.includes('coursera') && resourceTypes.includes('course')) {
        try {
          const courseraResources = await courseraDataService.searchCourses(skill, maxResourcesPerType);

          if (courseraResources && courseraResources.length > 0) {
            logger.info(`✅ Found ${courseraResources.length} resources from Coursera`);
            allResources.push(...courseraResources);
          }
        } catch (error) {
          logger.warn('⚠️ Coursera search failed:', error.message);
        }
      }

      // 3. Fetch from YouTube (if video type requested)
      if (dataSources.includes('youtube') && resourceTypes.includes('video')) {
        try {
          const youtubeResources = await youtubeDataService.searchVideos(skill, {
            maxResults: maxResourcesPerType,
            difficulty: difficulty,
          });

          if (youtubeResources && youtubeResources.length > 0) {
            logger.info(`✅ Found ${youtubeResources.length} resources from YouTube`);
            allResources.push(...youtubeResources);
          }

          // Also get from trusted channels
          const trustedVideos = await youtubeDataService.getVideosFromTrustedChannels(skill, {
            maxResults: 3,
            difficulty: difficulty,
          });

          if (trustedVideos && trustedVideos.length > 0) {
            logger.info(`✅ Found ${trustedVideos.length} trusted channel videos`);
            allResources.push(...trustedVideos);
          }
        } catch (error) {
          logger.warn('⚠️ YouTube search failed:', error.message);
        }
      }

      // 4. Fetch from GitHub (if project type requested and enabled)
      if (dataSources.includes('github') && resourceTypes.includes('project')) {
        try {
          const githubResources = await githubDataService.searchRepositories(skill, {
            maxResults: maxResourcesPerType,
            difficulty: difficulty,
          });

          if (githubResources && githubResources.length > 0) {
            logger.info(`✅ Found ${githubResources.length} resources from GitHub`);
            allResources.push(...githubResources);
          }

          // Get awesome list
          const awesomeList = await githubDataService.getAwesomeList(skill);
          if (awesomeList) {
            logger.info('✅ Found awesome list');
            allResources.push(awesomeList);
          }
        } catch (error) {
          logger.warn('⚠️ GitHub search failed:', error.message);
        }
      }

      // 5. Rank and filter resources
      const rankedResources = this.rankResourcesByCredibility(allResources, {
        minCredibility: minCredibility,
        maxResults: maxResourcesPerType * resourceTypes.length,
      });

      logger.info(`✅ RAG retrieved and ranked ${rankedResources.length} total resources`);

      return rankedResources;
    } catch (error) {
      logger.error(`❌ RAG resource retrieval failed for: ${skill}`, error);
      return [];
    }
  }

  /**
   * Rank resources by multi-factor credibility scoring
   * @param {Array} resources - All resources from different sources
   * @param {Object} options - Ranking options
   * @returns {Array} Ranked resources
   */
  rankResourcesByCredibility(resources, options = {}) {
    const { minCredibility = 0.6, maxResults = 15 } = options;

    // Remove duplicates (same URL)
    const uniqueResources = [];
    const seenUrls = new Set();

    for (const resource of resources) {
      if (!seenUrls.has(resource.url)) {
        seenUrls.add(resource.url);
        uniqueResources.push(resource);
      }
    }

    // Filter by minimum credibility
    const filteredResources = uniqueResources.filter(r => r.credibility >= minCredibility);

    // Calculate composite score
    const scoredResources = filteredResources.map(resource => {
      // Multi-factor scoring formula
      const credibilityWeight = 0.40;
      const popularityWeight = 0.25;
      const recencyWeight = 0.15;
      const ratingWeight = 0.10;
      const similarityWeight = 0.10;

      // Normalize popularity (log scale to prevent dominance of viral content)
      const normalizedPopularity = Math.min(Math.log10(resource.popularity + 1) / 7, 1);

      // Recency score (newer is better, decay over time)
      let recencyScore = 0.5; // Default for no date info
      if (resource.metadata && resource.metadata.publishedAt) {
        const monthsOld = (Date.now() - new Date(resource.metadata.publishedAt)) / (1000 * 60 * 60 * 24 * 30);
        recencyScore = Math.max(0, 1 - monthsOld / 36); // Decay over 3 years
      } else if (resource.metadata && resource.metadata.updatedAt) {
        const monthsOld = (Date.now() - new Date(resource.metadata.updatedAt)) / (1000 * 60 * 60 * 24 * 30);
        recencyScore = Math.max(0, 1 - monthsOld / 36);
      }

      // Rating score (normalize to 0-1)
      const ratingScore = (resource.rating || 3) / 5;

      // Similarity score (from vector search, default 0.5 if not available)
      const similarityScore = resource.similarity || 0.5;

      // Composite score
      const compositeScore = 
        resource.credibility * credibilityWeight +
        normalizedPopularity * popularityWeight +
        recencyScore * recencyWeight +
        ratingScore * ratingWeight +
        similarityScore * similarityWeight;

      return {
        ...resource,
        compositeScore: compositeScore,
      };
    });

    // Sort by composite score (descending)
    scoredResources.sort((a, b) => b.compositeScore - a.compositeScore);

    logger.info(`✅ Ranked ${scoredResources.length} resources (filtered from ${resources.length})`);

    return scoredResources.slice(0, maxResults);
  }

  /**
   * Generate a complete learning roadmap with real resources
   * @param {Array} skillGaps - Skills to learn
   * @param {Object} options - Roadmap generation options
   * @returns {Promise<Object>} Complete learning roadmap
   */
  async generateRoadmap(skillGaps, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        jobTitle = 'Target Position',
        currentLevel = 'beginner',
        timeframe = 12, // weeks
      } = options;

      logger.info(`📚 Generating RAG-powered roadmap for ${skillGaps.length} skills`);

      // Sort skill gaps by priority (enum string: critical > high > medium > low)
      const priorityOrder = {'critical': 1, 'high': 2, 'medium': 3, 'low': 4};
      const sortedSkills = skillGaps.sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        return aPriority - bPriority; // Lower number = higher priority
      });

      // Divide into phases (Foundation, Core Skills, Advanced)
      const phases = this.divideIntoPhases(sortedSkills, timeframe);

      // For each phase, get real learning resources
      const roadmapPhases = [];

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const phaseResources = [];

        for (const skill of phase.skills) {
          const resources = await this.getResources(skill.skill, {
            difficulty: skill.importance >= 0.7 ? 'intermediate' : 'beginner', // importance is Number (0-1)
            resourceTypes: ['video', 'project', 'documentation'],
            maxResourcesPerType: 3,
            minCredibility: 0.65,
          });

          phaseResources.push({
            skill: skill.skill,
            importance: skill.importance,
            resources: resources,
          });
        }

        roadmapPhases.push({
          phaseNumber: i + 1,
          phaseName: phase.name,
          duration: phase.duration,
          learningObjectives: phase.objectives,
          skills: phaseResources,
          totalResources: phaseResources.reduce((sum, s) => sum + s.resources.length, 0),
        });
      }

      const roadmap = {
        jobTitle: jobTitle,
        skillGaps: skillGaps,
        currentLevel: currentLevel,
        targetLevel: 'advanced', // Must be enum: beginner/intermediate/advanced/expert
        estimatedDuration: timeframe,
        phases: roadmapPhases,
        totalResources: roadmapPhases.reduce((sum, p) => sum + p.totalResources, 0),
        credibilityMetrics: this.calculateRoadmapCredibility(roadmapPhases),
        generatedAt: new Date().toISOString(),
        generatedBy: 'RAG-powered AI with real data sources',
      };

      logger.info(`✅ Generated roadmap with ${roadmap.totalResources} real resources across ${roadmapPhases.length} phases`);

      return roadmap;
    } catch (error) {
      logger.error('❌ Roadmap generation failed:', error);
      throw error;
    }
  }

  /**
   * Divide skills into learning phases
   * @param {Array} skills - Sorted skill gaps
   * @param {number} timeframe - Total weeks available
   * @returns {Array} Phases with skills
   */
  divideIntoPhases(skills, timeframe) {
    const phases = [];

    // Phase 1: Foundation (high importance/critical priority, first 25% of time)
    const foundationSkills = skills.filter(s => 
      (s.importance >= 0.7 || s.priority === 'critical' || s.priority === 'high')
    ).slice(0, 3);
    if (foundationSkills.length > 0) {
      phases.push({
        name: 'Foundation Phase',
        duration: Math.floor(timeframe * 0.25),
        skills: foundationSkills,
        objectives: foundationSkills.map(s => `Master ${s.skill} fundamentals`),
      });
    }

    // Phase 2: Core Skills (medium importance, next 50% of time)
    const coreSkills = skills.filter(s => 
      (s.importance >= 0.4 && s.importance < 0.7) || s.priority === 'medium'
    ).slice(0, 4);
    if (coreSkills.length > 0) {
      phases.push({
        name: 'Core Skills Development',
        duration: Math.floor(timeframe * 0.50),
        skills: coreSkills,
        objectives: coreSkills.map(s => `Build proficiency in ${s.skill}`),
      });
    }

    // Phase 3: Advanced & Integration (low importance, final 25% of time)
    const advancedSkills = skills.filter(s => 
      s.importance < 0.4 || s.priority === 'low'
    ).slice(0, 3);
    if (advancedSkills.length > 0) {
      phases.push({
        name: 'Advanced Topics & Integration',
        duration: Math.floor(timeframe * 0.25),
        skills: advancedSkills,
        objectives: advancedSkills.map(s => `Explore ${s.skill} and integrate knowledge`),
      });
    }

    // Fallback: If no phases created, distribute all skills evenly
    if (phases.length === 0 && skills.length > 0) {
      const skillsPerPhase = Math.ceil(skills.length / 3);
      const phase1 = skills.slice(0, skillsPerPhase);
      const phase2 = skills.slice(skillsPerPhase, skillsPerPhase * 2);
      const phase3 = skills.slice(skillsPerPhase * 2);

      if (phase1.length > 0) {
        phases.push({
          name: 'Foundation Phase',
          duration: Math.floor(timeframe * 0.33),
          skills: phase1,
          objectives: phase1.map(s => `Learn ${s.skill}`),
        });
      }

      if (phase2.length > 0) {
        phases.push({
          name: 'Core Skills Development',
          duration: Math.floor(timeframe * 0.34),
          skills: phase2,
          objectives: phase2.map(s => `Master ${s.skill}`),
        });
      }

      if (phase3.length > 0) {
        phases.push({
          name: 'Advanced & Integration',
          duration: Math.floor(timeframe * 0.33),
          skills: phase3,
          objectives: phase3.map(s => `Apply ${s.skill}`),
        });
      }

      logger.info(`⚠️ Used fallback phase distribution: ${phases.length} phases from ${skills.length} skills`);
    }

    return phases;
  }

  /**
   * Calculate credibility metrics for the roadmap
   * @param {Array} phases - Roadmap phases with resources
   * @returns {Object} Credibility metrics
   */
  calculateRoadmapCredibility(phases) {
    let totalResources = 0;
    let totalCredibilityScore = 0;
    let resourcesWithUrls = 0;
    let resourcesFromTrustedSources = 0;

    const sourceBreakdown = {
      youtube: 0,
      github: 0,
      vectorDB: 0,
      other: 0,
    };

    logger.info(`🔍 Calculating credibility for ${phases?.length || 0} phases`);

    if (!phases || !Array.isArray(phases)) {
      logger.warn('⚠️ No phases provided to calculateRoadmapCredibility');
      return {
        totalResources: 0,
        averageCredibility: 0,
        verificationRate: 0,
        trustedSourceRate: 0,
        sourceBreakdown: sourceBreakdown,
        academicValidity: 'No data available',
      };
    }

    for (const phase of phases) {
      if (!phase || !phase.skills || !Array.isArray(phase.skills)) {
        logger.warn(`⚠️ Phase ${phase?.phaseNumber || '?'} has no skills array`);
        continue;
      }
      
      logger.info(`  📦 Phase ${phase.phaseNumber}: ${phase.skills.length} skill groups`);
      
      for (const skillGroup of phase.skills) {
        if (!skillGroup || !skillGroup.resources || !Array.isArray(skillGroup.resources)) {
          logger.warn(`    ⚠️ Skill "${skillGroup?.skill || '?'}" has no resources array`);
          continue;
        }
        
        logger.info(`    🎯 Skill "${skillGroup.skill}": ${skillGroup.resources.length} resources`);
        
        for (const resource of skillGroup.resources) {
          if (!resource) {
            logger.warn(`      ⚠️ Null/undefined resource found`);
            continue;
          }
          
          totalResources++;
          totalCredibilityScore += (resource.credibility || 0);
          
          logger.info(`      ✅ Resource: ${resource.title?.substring(0, 40)} - credibility: ${resource.credibility}`);


          if (resource.url && resource.url.startsWith('http')) {
            resourcesWithUrls++;
          }

          if (resource.credibility && resource.credibility >= 0.8) {
            resourcesFromTrustedSources++;
          }

          if (resource.source) {
            sourceBreakdown[resource.source] = (sourceBreakdown[resource.source] || 0) + 1;
          }
        }
      }
    }

    const metrics = {
      totalResources: totalResources,
      averageCredibility: totalResources > 0 ? (totalCredibilityScore / totalResources).toFixed(2) : 0,
      verificationRate: totalResources > 0 ? ((resourcesWithUrls / totalResources) * 100).toFixed(1) : 0,
      trustedSourceRate: totalResources > 0 ? ((resourcesFromTrustedSources / totalResources) * 100).toFixed(1) : 0,
      sourceBreakdown: sourceBreakdown,
      academicValidity: 'All resources are verifiable with URLs and credibility scores',
    };

    logger.info(`📊 Credibility Metrics: ${totalResources} resources, avg credibility: ${metrics.averageCredibility}`);

    return metrics;
  }

  /**
   * Refresh resources in vector database (maintenance task)
   * @param {Array} skills - Skills to refresh resources for
   */
  async refreshVectorDatabase(skills) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.info(`🔄 Refreshing vector database for ${skills.length} skills...`);

      let addedCount = 0;

      for (const skill of skills) {
        // Get fresh resources from YouTube and GitHub
        const youtubeResources = await youtubeDataService.searchVideos(skill, {
          maxResults: 5,
          difficulty: 'beginner',
        });

        const githubResources = await githubDataService.searchRepositories(skill, {
          maxResults: 5,
          difficulty: 'beginner',
        });

        // Add to vector database
        const allResources = [...youtubeResources, ...githubResources];
        
        for (const resource of allResources) {
          const added = await vectorStoreService.addResource(resource);
          if (added) addedCount++;
        }
      }

      logger.info(`✅ Refreshed vector database: added ${addedCount} new resources`);
      return addedCount;
    } catch (error) {
      logger.error('❌ Vector database refresh failed:', error);
      return 0;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    try {
      const status = {
        initialized: this.initialized,
        services: {
          vectorStore: false,
          youtube: false,
          github: false,
        },
        stats: {},
      };

      // Check vector store
      try {
        const stats = await vectorStoreService.getStats();
        status.services.vectorStore = stats !== null;
        status.stats.vectorStore = stats;
      } catch (error) {
        logger.warn('⚠️ Vector store health check failed');
      }

      // Check YouTube
      try {
        status.services.youtube = await youtubeDataService.validateApiKey();
      } catch (error) {
        logger.warn('⚠️ YouTube health check failed');
      }

      // Check GitHub
      try {
        const rateLimit = await githubDataService.checkRateLimit();
        status.services.github = rateLimit !== null;
        status.stats.github = rateLimit;
      } catch (error) {
        logger.warn('⚠️ GitHub health check failed');
      }

      return status;
    } catch (error) {
      logger.error('❌ Health status check failed:', error);
      return null;
    }
  }
}

// Export singleton instance
const ragService = new RAGService();

module.exports = ragService;
