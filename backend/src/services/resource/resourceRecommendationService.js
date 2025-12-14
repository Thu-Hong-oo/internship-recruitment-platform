/**
 * Resource Recommendation Service
 * 
 * Hệ thống đề xuất tài liệu học tập thông minh dựa trên:
 * 1. Skill gaps và priority
 * 2. Trình độ hiện tại vs target level
 * 3. Phase và timing (Foundation → Advanced)
 * 4. Learning objectives của từng tuần
 * 5. Credibility assessment với multi-factor scoring
 * 
 * Căn cứ nghiên cứu:
 * - Bloom's Taxonomy (1956): Phân chia learning objectives theo levels
 * - Spaced Repetition Theory: Resources phù hợp với giai đoạn học tập
 * - Source Credibility Theory (Hovland & Weiss, 1951): Đánh giá độ tin cậy
 */

const { logger } = require('../../utils/logger');
const vectorStoreService = require('../vectorStore/vectorStoreService');
const resourceHealthCheckService = require('./resourceHealthCheckService');
const realResourceUrlService = require('./realResourceUrlService');
const curatedResourcesDatabase = require('./curatedResourcesDatabase');
const intelligentResourceService = require('./intelligentResourceService'); // NEW: Intelligent fallback
const youtubeApiService = require('../api/youtubeApiService');
const githubApiService = require('../api/githubApiService');
const googleSearchService = require('../api/googleSearchService');
const devToApiService = require('../api/devToApiService');
const stackOverflowApiService = require('../api/stackOverflowApiService');
const khanAcademyApiService = require('../api/khanAcademyApiService');
const industryMappingService = require('./industryMappingService');
const resourceFilterService = require('./resourceFilterService');
const personalizationService = require('./personalizationService');
const { getCacheService } = require('../cache/cacheService');
const RESOURCE_CONSTANTS = require('./resourceConstants');

class ResourceRecommendationService {
  constructor() {
    // Use constants from centralized config
    this.levelOrder = RESOURCE_CONSTANTS.LEVEL_ORDER;
    this.phaseCharacteristics = RESOURCE_CONSTANTS.PHASE_CHARACTERISTICS;
    this.credibilityWeights = RESOURCE_CONSTANTS.CREDIBILITY_WEIGHTS;
    this.thresholds = RESOURCE_CONSTANTS.THRESHOLDS;

    // Cache service (Redis) for API responses
    this.cacheService = typeof getCacheService === 'function' ? getCacheService() : null;
    this.apiCacheTTLSeconds = RESOURCE_CONSTANTS.CACHE.API_CACHE_TTL_SECONDS;
  }

  /**
   * Recommend resources cho một tuần cụ thể
   * 
   * @param {Object} params
   * @param {string} params.skill - Skill cần học
   * @param {string} params.currentLevel - Trình độ hiện tại (none/beginner/intermediate/advanced)
   * @param {string} params.targetLevel - Trình độ mục tiêu
   * @param {number} params.phaseNumber - Phase number (1-4)
   * @param {Array} params.learningObjectives - Learning objectives của tuần này
   * @param {number} params.weekNumber - Week number
   * @param {number} params.totalWeeks - Total weeks
   * @returns {Array} Recommended resources
   */
  async recommendResources({
    skill,
    currentLevel = 'none',
    targetLevel = 'intermediate',
    phaseNumber = 1,
    learningObjectives = [],
    weekNumber = 1,
    totalWeeks = 12,
    // NEW: User preferences for personalization
    budget = 'free',
    maxHours = null,
    learningStyle = 'visual',
    // NEW: Industry context
    industry = null,
    preferredLanguage = 'en',
    // NEW: Target role for context-aware filtering
    targetRole = null,
  }) {
    try {
      // Validate input
      if (!skill || typeof skill !== 'string' || skill.trim().length === 0) {
        logger.warn('Invalid skill provided to recommendResources', { skill });
        // Return empty array instead of search URL fallback
        return [];
      }

      const sanitizedSkill = this._sanitizeSkillQuery(skill);
      const canonicalSkill = sanitizedSkill || skill || 'General Programming';
      
      // 1. Xác định độ khó phù hợp
      const appropriateDifficulty = this._determineAppropriateDifficulty(
        currentLevel,
        targetLevel,
        phaseNumber
      );

      // 2. Xác định resource types phù hợp (có thể adjust theo industry)
      let preferredTypes = this.phaseCharacteristics[phaseNumber]?.preferredTypes || 
                          ['course', 'video', 'documentation'];
      
      // Adjust resource types based on industry
      if (industry) {
        const industryTypes = industryMappingService.getPreferredResourceTypes(industry);
        // Merge với phase preferences, ưu tiên industry types
        preferredTypes = [...new Set([...industryTypes, ...preferredTypes])];
      }

      // 3. Xác định learning stage (theo Bloom's Taxonomy)
      const learningStage = this._determineLearningStage(phaseNumber, weekNumber, totalWeeks);

      // 4. Generate query cho RAG search
      const searchQuery = this._generateSearchQuery({
        skill: canonicalSkill,
        difficulty: appropriateDifficulty,
        learningStage,
        objectives: learningObjectives,
      });

      // 5. Retrieve resources từ knowledge base (RAG)
      let resources = [];
      
      // Try RAG search first (if vector store is available)
      if (vectorStoreService.isAvailable()) {
        try {
          const ragResources = await vectorStoreService.searchResources(
            {
              skill,
              difficulty: appropriateDifficulty,
              learningStage,
              objectives: learningObjectives,
            },
            {
              level: appropriateDifficulty,
              type: preferredTypes.length > 0 ? preferredTypes[0] : undefined,
              minRating: this.thresholds.MIN_RATING_FOR_RAG,
            },
            10 // Get more results for diversification
          );

          if (ragResources && ragResources.length > 0) {
            resources = ragResources;
            logger.info('Using RAG search results', {
              skill: canonicalSkill,
              resultsCount: resources.length,
            });
          } else {
            // RAG returned empty (ChromaDB not available or no results)
            // This is expected - continue with API fallback
            logger.debug('RAG search returned no results, using API fallback', {
              skill: canonicalSkill,
              note: 'ChromaDB may not be running. This is expected.'
            });
          }
        } catch (ragError) {
          // RAG error - expected if ChromaDB not running
          // Don't log as warning, just continue with fallback
          logger.debug('RAG search unavailable, using API fallback', {
            skill: canonicalSkill,
            note: 'ChromaDB not available. Using API-based recommendations.'
          });
        }
      } else {
        // Vector store not available - expected if ChromaDB not configured
        logger.debug('Vector store not available, using API fallback', {
          skill: canonicalSkill,
          note: 'ChromaDB not configured. This is expected for basic setup.'
        });
      }

      // 6. Use intelligent recommendations if not enough from RAG
      // PRIORITY CHANGE: IntelligentResourceService provides curated, verified resources
      // This should come BEFORE APIs (which return search URLs as last resort)
      if (resources.length < this.thresholds.MIN_RESOURCES_FOR_INTELLIGENT) {
        try {
          const intelligentResources = await this._generateIntelligentRecommendations({
            skill: canonicalSkill,
            difficulty: appropriateDifficulty,
            resourceTypes: preferredTypes,
            learningStage,
            phaseNumber,
            currentLevel,
            targetLevel,
          });
          resources = [...resources, ...intelligentResources];
          logger.info('Using intelligent recommendations', {
            skill: canonicalSkill,
            intelligentResourcesCount: intelligentResources.length,
            totalResources: resources.length,
          });
        } catch (intelligentError) {
          logger.warn('Error generating intelligent recommendations', {
            error: intelligentError.message,
            skill: canonicalSkill,
          });
          // Continue to API fallback
        }
      }

      // 7. Fetch from APIs only if still not enough resources (LAST RESORT)
      // APIs provide search URLs, not direct resources, so use only when needed
      if (resources.length < this.thresholds.MIN_RESOURCES_FOR_API_FALLBACK) {
        try {
          // Enhance search query with industry context AND skill-specific enhancements
          let enhancedSkill = industry 
            ? industryMappingService.enhanceSearchQuery(canonicalSkill, industry)
            : canonicalSkill;
          
          // Further enhance with skill-specific context (e.g., "sketch" → "sketch design tool")
          enhancedSkill = this._enhanceSkillQueryForSearch(enhancedSkill, targetRole, industry);
          
          const apiResources = await this._fetchFromAPIs(
            enhancedSkill, 
            appropriateDifficulty, 
            preferredTypes,
            industry, // Pass industry context
            preferredLanguage
          );
          resources = [...resources, ...apiResources];
          logger.info('Fetched resources from APIs (last resort fallback)', {
            skill: enhancedSkill,
            industry,
            apiResourcesCount: apiResources.length,
            totalResources: resources.length,
          });
        } catch (apiError) {
          logger.warn('Error fetching from APIs', {
            error: apiError.message,
            skill: canonicalSkill,
            industry,
          });
          // Continue with existing resources
        }
      }

      // 8. Final fallback if still no resources
      if (resources.length === 0) {
        logger.warn('No resources found after all fallbacks - returning empty array', {
          skill: canonicalSkill,
          targetRole,
          industry,
          recommendation: 'Add skill to IntelligentResourceService curated database or check API quota'
        });
        // Don't use _getDefaultResources() - it returns search URLs
        // Better to return empty array than broken search links
        resources = [];
      }

      // 8. Apply personalization filters
      const personalizedResources = personalizationService.personalize(resources, {
        budget,
        maxHours,
        learningStyle,
      });

      // 9. Filter by level match
      const levelFilteredResources = personalizationService.filterByLevel(
        personalizedResources,
        currentLevel,
        targetLevel
      );

      // 10. Calculate credibility scores (using enhanced filter service)
      const resourcesWithCredibility = levelFilteredResources.map((resource) => {
        // Add recency score if not present
        if (!resource.recencyScore) {
          resource.recencyScore = resourceFilterService.getRecencyScore(
            resource.publishedAt,
            resource.lastUpdated
          );
        }

        return {
          ...resource,
          credibility: resourceFilterService.calculateCredibilityScore(resource),
          recommendationScore: this._calculateRecommendationScore(resource, {
            skill,
            currentLevel,
            targetLevel,
            phaseNumber,
            learningStage,
          }),
        };
      });

      const skillWeightedResources = this._applySkillRelevanceWeight(
        resourcesWithCredibility,
        canonicalSkill
      );

      let phaseAlignedResources = skillWeightedResources;
      if (phaseNumber >= 3) {
        const advancedReadyResources = this._filterForAdvancedPhase(
          skillWeightedResources,
          learningObjectives
        );

        if (advancedReadyResources.length > 0) {
          phaseAlignedResources = advancedReadyResources;
        } else {
          logger.warn('Advanced phase filter removed all resources, falling back to original list', {
            skill,
            phaseNumber,
          });
        }
      }

      // 11. Filter by minimum credibility
      const credibleResources = resourceFilterService.filterByCredibility(
        phaseAlignedResources,
        this.thresholds.MIN_CREDIBILITY_SCORE
      );

      // 11.5. Filter by role relevance (NEW) - Remove resources not relevant to target role
      const roleRelevantResources = targetRole 
        ? this._filterByRoleRelevance(credibleResources, skill, targetRole, industry)
        : credibleResources;

      // 12. Sort by recommendation score
      const sortedResources = roleRelevantResources.sort(
        (a, b) => b.recommendationScore - a.recommendationScore
      );

      // 13. Health check: Filter out dead links và outdated resources
      // Skip health check for curated resources (already verified)
      // Only check for generated/fallback resources
      let validResources = sortedResources;
      
      // Separate curated vs generated resources
      const curatedResources = sortedResources.filter(r => r.isCurated === true);
      const generatedResources = sortedResources.filter(r => r.isCurated !== true);
      
      try {
        // Only health check generated resources
        if (generatedResources.length > 0) {
          const checkedGenerated = await resourceHealthCheckService.filterValidResources(generatedResources);
          
          // Combine curated (always valid) + checked generated
          validResources = [...curatedResources, ...checkedGenerated];
        } else {
          // All are curated, skip health check
          validResources = curatedResources;
        }
        
        // Nếu sau health check không còn resources, fallback to original (có thể là network issue)
        if (validResources.length === 0 && sortedResources.length > 0) {
          logger.warn('All resources failed health check, using original list', {
            originalCount: sortedResources.length,
            curatedCount: curatedResources.length,
          });
          // Normalize URLs ít nhất và keep all
          validResources = sortedResources.map(r => ({
            ...r,
            url: resourceHealthCheckService.normalizeUrl(r.url) || r.url,
          }));
        }
      } catch (healthCheckError) {
        logger.warn('Health check failed, using all resources', {
          error: healthCheckError.message,
        });
        // Normalize URLs ít nhất và keep all
        validResources = sortedResources.map(r => ({
          ...r,
          url: resourceHealthCheckService.normalizeUrl(r.url) || r.url,
        }));
      }

      // 10. Limit và diversify với MMR (Maximal Marginal Relevance)
      const finalResources = this._diversifyAndLimit(
        validResources, 
        preferredTypes, 
        this.thresholds.DEFAULT_RESOURCE_LIMIT, 
        this.thresholds.MMR_LAMBDA
      );
      
      // 11. CRITICAL: Ensure ALL resources have required 'type' field (Mongoose validation)
      // This is the final safety net before returning to prevent validation errors
      const sanitizedResources = finalResources.map(resource => {
        if (!resource.type) {
          // Infer type from URL or use default
          if (resource.url) {
            const url = resource.url.toLowerCase();
            if (RESOURCE_CONSTANTS.TYPE_INFERENCE.VIDEO.some(pattern => url.includes(pattern))) {
              resource.type = 'video';
            } else if (RESOURCE_CONSTANTS.TYPE_INFERENCE.COURSE.some(pattern => url.includes(pattern))) {
              resource.type = 'course';
            } else if (RESOURCE_CONSTANTS.TYPE_INFERENCE.PROJECT.some(pattern => url.includes(pattern))) {
              resource.type = 'project';
            } else if (RESOURCE_CONSTANTS.TYPE_INFERENCE.DOCUMENTATION.some(pattern => url.includes(pattern))) {
              resource.type = 'documentation';
            } else {
              resource.type = RESOURCE_CONSTANTS.TYPE_INFERENCE.DEFAULT;
            }
          } else {
            resource.type = RESOURCE_CONSTANTS.TYPE_INFERENCE.DEFAULT;
          }
          logger.warn('Resource missing type field, inferred as:', {
            title: resource.title,
            inferredType: resource.type,
          });
        }
        return resource;
      });
      
      return sanitizedResources;
    } catch (error) {
      logger.error('Error recommending resources:', error);
      // CRITICAL: Don't return search URLs as fallback - return empty array instead
      // User experience: Empty is better than broken search URLs
      logger.warn('Returning empty resources due to error - avoid search URL fallback');
      return [];
    }
  }

  /**
   * Xác định độ khó phù hợp dựa trên current level, target level và phase
   * 
   * Thuật toán:
   * - Phase 1 (Foundation): Bắt đầu từ beginner hoặc 1 level dưới target
   * - Phase 2-3 (Intermediate/Advanced): Progression từ current → target
   * - Phase 4 (Specialization): Focus vào advanced/expert
   */
  _determineAppropriateDifficulty(currentLevel, targetLevel, phaseNumber) {
    const currentIndex = this.levelOrder.indexOf(currentLevel) || 0;
    const targetIndex = this.levelOrder.indexOf(targetLevel) || 2;

    if (phaseNumber === 1) {
      // Foundation: Bắt đầu từ beginner hoặc current level (nếu > beginner)
      return currentIndex > 1 ? this.levelOrder[currentIndex] : 'beginner';
    } else if (phaseNumber === 2) {
      // Intermediate: Between current and target
      const midIndex = Math.ceil((currentIndex + targetIndex) / 2);
      return this.levelOrder[Math.min(midIndex, targetIndex)];
    } else if (phaseNumber === 3) {
      // Advanced: Close to target
      const advIndex = Math.max(targetIndex - 1, currentIndex + 1);
      return this.levelOrder[Math.min(advIndex, targetIndex)];
    } else {
      // Specialization: Target level
      return targetLevel;
    }
  }

  /**
   * Xác định learning stage theo Bloom's Taxonomy
   * 
   * Bloom's Taxonomy levels:
   * 1. Remember (Foundation)
   * 2. Understand (Foundation → Intermediate)
   * 3. Apply (Intermediate)
   * 4. Analyze (Intermediate → Advanced)
   * 5. Evaluate (Advanced)
   * 6. Create (Advanced → Specialization)
   */
  _determineLearningStage(phaseNumber, weekNumber, totalWeeks) {
    const progress = weekNumber / totalWeeks;

    if (phaseNumber === 1) {
      // Foundation: Remember → Understand
      return progress < 0.5 ? 'remember' : 'understand';
    } else if (phaseNumber === 2) {
      // Intermediate: Understand → Apply
      return progress < 0.5 ? 'understand' : 'apply';
    } else if (phaseNumber === 3) {
      // Advanced: Apply → Analyze
      return progress < 0.5 ? 'apply' : 'analyze';
    } else {
      // Specialization: Analyze → Create
      return progress < 0.5 ? 'analyze' : 'create';
    }
  }

  /**
   * Generate search query cho RAG với Strict Filtering
   * 
   * CẢI TIẾN: Thêm context keywords để tránh hallucination
   * - Thêm "programming", "development", "tutorial" để tránh nhầm lẫn
   * - Ví dụ: "Java" (programming) vs "Java" (island)
   * 
   * @param {Object} params - Query parameters
   * @returns {Object} Query with text và filters
   */
  _generateSearchQuery({ skill, difficulty, learningStage, objectives }) {
    const stageDescriptions = {
      remember: 'introduction basics fundamentals',
      understand: 'concepts principles theory',
      apply: 'practice exercises projects',
      analyze: 'advanced techniques optimization',
      evaluate: 'best practices comparisons',
      create: 'build develop implement',
    };

    // Add context keywords to avoid hallucination
    // Ví dụ: "Java programming" thay vì chỉ "Java"
    const contextKeywords = [
      'programming',
      'development',
      'tutorial',
      'course',
      'learning',
      'coding',
    ].join(' ');

    const query = `
      Learn ${skill} ${contextKeywords}
      for ${difficulty} level
      ${stageDescriptions[learningStage] || ''}
      ${objectives.join(' ')}
    `.trim();

    // Strict metadata filters để tránh hallucination
    const metadataFilters = {
      // Category filter: Chỉ lấy trong "Programming/Computer Science"
      category: { $in: ['programming', 'computer-science', 'software-development', 'web-development'] },
      
      // Exclude irrelevant categories
      excludeCategories: { $nin: ['travel', 'food', 'geography', 'coffee'] },
      
      // Language filter (if applicable)
      language: 'en', // Hoặc 'vi' nếu cần
      
      // Minimum rating
      rating: { $gte: 4.0 },
    };

    return {
      text: query,
      filters: metadataFilters,
    };
  }

  /**
   * Generate intelligent recommendations
   * Priority: Curated database → Real URLs → Fallback
   */
  async _generateIntelligentRecommendations({
    skill,
    difficulty,
    resourceTypes,
    learningStage,
    phaseNumber,
    currentLevel,
    targetLevel,
  }) {
    // Use new IntelligentResourceService with multi-level fallback
    try {
      const allResources = [];
      
      // Get resources for each requested type
      for (const type of resourceTypes) {
        const typeResources = await intelligentResourceService.getRecommendations({
          skill,
          difficulty,
          type,
          limit: 2, // 2 per type
        });
        allResources.push(...typeResources);
      }
      
      // If no type specified, get mixed recommendations
      if (resourceTypes.length === 0 || !resourceTypes) {
        const mixedResources = await intelligentResourceService.getRecommendations({
          skill,
          difficulty,
          type: null,
          limit: 5,
        });
        allResources.push(...mixedResources);
      }
      
      return allResources;
    } catch (error) {
      logger.error('IntelligentResourceService failed, using legacy fallback', error);
      // Legacy fallback
      return this._generateLegacyRecommendations({
        skill,
        difficulty,
        resourceTypes,
        learningStage,
        phaseNumber,
        currentLevel,
        targetLevel,
      });
    }
  }

  /**
   * Legacy recommendation generator (fallback only)
   */
  async _generateLegacyRecommendations({
    skill,
    difficulty,
    resourceTypes,
    learningStage,
    phaseNumber,
  }) {
    const resources = [];

    // Try curated database first (highest quality)
    const hasCurated = curatedResourcesDatabase.hasResources(skill);

    // Course recommendations
    if (resourceTypes.includes('course')) {
      if (hasCurated) {
        // Use curated courses
        const curatedCourses = curatedResourcesDatabase.getResources(skill, 'course', difficulty, 2);
        curatedCourses.forEach(course => {
          resources.push({
            type: 'course',
            title: course.title,
            provider: course.provider,
            instructor: course.instructor,
            difficulty: course.difficulty || difficulty,
            duration: course.duration,
            rating: course.rating,
            isFree: course.isFree || false,
            estimatedCost: course.estimatedCost || 0,
            certificateOffered: course.certificateOffered || false,
            url: course.url,
            relevanceScore: this._calculateRelevance(skill, course.difficulty || difficulty, learningStage),
            isCurated: true, // Mark as curated to skip health check
          });
        });
      } else {
        // CRITICAL: Don't generate fake courses with Udemy search URLs
        // Better to have no resources than search URLs that confuse users
        logger.warn('No curated courses found for skill - skipping course recommendations', {
          skill,
          recommendation: 'Add curated courses to curatedResourcesExtensions.js'
        });
        // Don't push anything - empty is better than broken
      }
    }

    // Video recommendations
    if (resourceTypes.includes('video') && (phaseNumber === 1 || difficulty === 'beginner')) {
      if (hasCurated) {
        // Use curated videos
        const curatedVideos = curatedResourcesDatabase.getResources(skill, 'video', 'beginner', 2);
        curatedVideos.forEach(video => {
          resources.push({
            type: 'video',
            title: video.title,
            provider: video.provider,
            channel: video.channel,
            difficulty: video.difficulty || 'beginner',
            duration: video.duration,
            rating: video.rating,
            isFree: true,
            estimatedCost: 0,
            url: video.url,
            relevanceScore: this._calculateRelevance(skill, 'beginner', 'remember'),
            isCurated: true, // Mark as curated to skip health check
          });
        });
      } else {
        // CRITICAL: Don't generate fake resources with YouTube search URLs
        // Better to have no resources than search URLs that confuse users
        logger.warn('No curated videos found for skill - skipping video recommendations', {
          skill,
          recommendation: 'Add curated videos to curatedResourcesExtensions.js'
        });
        // Don't push anything - empty is better than broken
      }
    }

    // Documentation (always include for fundamentals)
    if (resourceTypes.includes('documentation')) {
      if (hasCurated) {
        // Use curated documentation
        const curatedDocs = curatedResourcesDatabase.getResources(skill, 'documentation', null, 1);
        curatedDocs.forEach(doc => {
          resources.push({
            type: 'documentation',
            title: doc.title,
            provider: doc.provider,
            difficulty: doc.difficulty || 'intermediate',
            duration: 'Reference',
            rating: doc.rating || 5.0,
            isFree: true,
            estimatedCost: 0,
            url: doc.url,
            relevanceScore: 0.9,
            isCurated: true, // Mark as curated to skip health check
          });
        });
      } else {
        // Fallback to official docs only if URL exists (not Google search)
        const docUrl = realResourceUrlService.getRealUrl({
          skill,
          type: 'documentation',
        });
        
        if (docUrl) {
          resources.push({
            type: 'documentation',
            title: `Official ${skill} Documentation`,
            provider: 'Official Docs',
            difficulty: 'intermediate',
            duration: 'Reference',
            rating: 5.0,
            isFree: true,
            estimatedCost: 0,
            url: docUrl,
            relevanceScore: 0.9,
          });
        } else {
          logger.warn('No official documentation URL found for skill - skipping documentation', {
            skill,
            recommendation: 'Add official docs URL to realResourceUrlService.officialDocs mapping'
          });
        }
      }
    }

    // Articles for advanced stages - only if we have curated articles or skip
    // Skip articles if we don't have curated ones (avoid search URLs)
    // if (resourceTypes.includes('article') && phaseNumber >= 3) {
    //   // Only add articles if we have curated ones
    //   // For now, skip to avoid search URLs
    // }

    return resources;
  }

  /**
   * Calculate credibility score với multi-factor assessment
   * 
   * Căn cứ: Source Credibility Theory (Hovland & Weiss, 1951)
   * Factors:
   * 1. Provider Reputation (40%)
   * 2. User Rating (30%)
   * 3. Resource Type (20%)
   * 4. Certificate Offered (10%)
   */
  _calculateCredibilityScore(resource) {
    const { providerReputation, userRating, resourceType, certificateOffered } = 
      this.credibilityWeights;

    // Provider reputation score
    const providerScore = this._getProviderReputationScore(resource.provider);

    // User rating score (normalized to 0-1)
    const ratingScore = (resource.rating || 0) / 5.0;

    // Resource type score
    const typeScore = this._getResourceTypeScore(resource.type);

    // Certificate score
    const certScore = resource.certificateOffered ? 1.0 : 0.5;

    // Weighted combination
    const credibility = (
      providerScore * providerReputation +
      ratingScore * userRating +
      typeScore * resourceType +
      certScore * certificateOffered
    );

    return Math.min(1.0, Math.max(0.0, credibility));
  }

  /**
   * Get provider reputation score
   */
  _getProviderReputationScore(provider) {
    const reputationScores = {
      // Official sources: 1.0
      'Official Docs': 1.0,
      'MDN Web Docs': 1.0,
      'W3C': 1.0,

      // Top-tier educational: 0.9-0.95
      'Coursera': 0.95,
      'edX': 0.95,
      'MIT OpenCourseWare': 0.95,
      'Stanford Online': 0.9,

      // Popular platforms: 0.8-0.85
      'Udemy': 0.85,
      'Pluralsight': 0.85,
      'LinkedIn Learning': 0.8,

      // Video platforms: 0.7-0.8
      'YouTube - Official Channel': 0.8,
      'YouTube - Verified Channel': 0.75,
      'YouTube': 0.7,

      // Blogs/Articles: 0.6-0.75
      'Tech Blog - Authoritative': 0.75,
      'Medium - Verified': 0.7,
      'Dev.to': 0.65,
    };

    return reputationScores[provider] || 0.6; // Default for unknown
  }

  /**
   * Get resource type score
   */
  _getResourceTypeScore(type) {
    const typeScores = {
      documentation: 1.0,      // Official docs are most credible
      course: 0.9,              // Structured courses
      video: 0.75,              // Videos can vary
      article: 0.7,             // Articles depend on source
      book: 0.85,               // Books are usually credible
      project: 0.8,             // Projects from reputable sources
    };

    return typeScores[type] || 0.6;
  }

  /**
   * Calculate recommendation score
   * Combines credibility with relevance và fit
   */
  _calculateRecommendationScore(resource, context) {
    const { skill, currentLevel, targetLevel, phaseNumber, learningStage } = context;

    // Credibility weight: 50%
    const credibilityWeight = 0.5;
    
    // Relevance weight: 30%
    const relevanceWeight = 0.3;
    
    // Fit weight: 20% (how well it matches current → target progression)
    const fitWeight = 0.2;

    // Credibility score
    const credibilityScore = resource.credibility || 0.5;

    // Relevance score (from resource.relevanceScore if available)
    const relevanceScore = resource.relevanceScore || 0.7;

    // Fit score (how well difficulty matches progression)
    const fitScore = this._calculateFitScore(
      resource.difficulty,
      currentLevel,
      targetLevel,
      phaseNumber
    );

    // Weighted combination
    const recommendationScore = (
      credibilityScore * credibilityWeight +
      relevanceScore * relevanceWeight +
      fitScore * fitWeight
    );

    return recommendationScore;
  }

  /**
   * Ensure advanced phases only receive challenging, in-depth resources
   */
  _filterForAdvancedPhase(resources, learningObjectives = []) {
    if (!Array.isArray(resources) || resources.length === 0) {
      return [];
    }

    const minDifficulties = new Set(['intermediate', 'advanced', 'expert']);
    const preferredTypes = new Set(['course', 'project', 'documentation', 'book', 'video', 'article']);
    const objectiveHints = (learningObjectives || []).map((obj) => (obj || '').toLowerCase());
    const advancedKeywords = [
      'advanced',
      'performance',
      'scalability',
      'optimization',
      'architecture',
      'production',
      'best practice',
      'best practices',
      'deep dive',
      'system design',
      'resilience',
    ];

    const filtered = resources
      .map((resource) => {
        const difficulty = (resource.difficulty || '').toLowerCase();
        const type = (resource.type || '').toLowerCase();
        const title = (resource.title || '').toLowerCase();
        const description = (resource.description || '').toLowerCase();
        const combined = `${title} ${description}`;
        const hasAdvancedKeyword =
          advancedKeywords.some((keyword) => combined.includes(keyword)) ||
          objectiveHints.some(
            (hint) =>
              hint.includes('optimize') ||
              hint.includes('architecture') ||
              hint.includes('scalability')
          );

        const isLongForm = this._isLongFormResource(type, resource.duration);
        const meetsDifficulty = minDifficulties.has(difficulty);
        const typeAllowed = preferredTypes.has(type);

        if (!typeAllowed) {
          return null;
        }

        if (meetsDifficulty) {
          return {
            ...resource,
            recommendationScore: (resource.recommendationScore || 0.5) + 0.1 + (type === 'course' || type === 'project' ? 0.05 : 0),
          };
        }

        if (hasAdvancedKeyword && isLongForm) {
          return {
            ...resource,
            difficulty: difficulty || 'intermediate',
            recommendationScore: (resource.recommendationScore || 0.5) + 0.05,
          };
        }

        return null;
      })
      .filter(Boolean);

    return filtered;
  }

  _isLongFormResource(type, duration) {
    if (['course', 'project', 'documentation', 'book'].includes(type)) {
      return true;
    }

    if (type === 'video' || type === 'article') {
      const minutes = this._parseDurationToMinutes(duration);
      return type === 'video' ? minutes >= 20 : minutes >= 10;
    }

    return false;
  }

  _parseDurationToMinutes(duration) {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;

    const text = duration.toString().toLowerCase();
    let minutes = 0;

    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(hour|hr|h)/);
    if (hourMatch) {
      minutes += parseFloat(hourMatch[1]) * 60;
    }

    const minuteMatch = text.match(/(\d+)\s*(minute|min|m)/);
    if (minuteMatch) {
      minutes += parseInt(minuteMatch[1], 10);
    }

    if (minutes === 0 && /^\d+$/.test(text.trim())) {
      minutes = parseInt(text.trim(), 10);
    }

    return minutes || 0;
  }

  /**
   * Calculate fit score (how well resource matches learning progression)
   * 
   * CẢI TIẾN: Asymmetric Penalty
   * - Học tài liệu dễ hơn (below ideal): Penalty nhẹ (boredom, waste time)
   * - Học tài liệu khó hơn (above ideal): Penalty nặng (frustration, demotivation)
   * 
   * Căn cứ: Zone of Proximal Development (Vygotsky, 1978)
   * - Resources quá khó gây nản chí nhiều hơn resources quá dễ
   */
  _calculateFitScore(resourceDifficulty, currentLevel, targetLevel, phaseNumber) {
    const currentIndex = this.levelOrder.indexOf(currentLevel) || 0;
    const targetIndex = this.levelOrder.indexOf(targetLevel) || 2;
    const resourceIndex = this.levelOrder.indexOf(resourceDifficulty) || 1;

    // Ideal difficulty based on phase
    let idealIndex;
    if (phaseNumber === 1) {
      idealIndex = Math.max(1, currentIndex); // Beginner/intermediate
    } else if (phaseNumber === 2) {
      idealIndex = Math.ceil((currentIndex + targetIndex) / 2);
    } else {
      idealIndex = Math.min(targetIndex, currentIndex + 1);
    }

    // Calculate distance with direction
    const distance = resourceIndex - idealIndex;
    
    // ASYMMETRIC PENALTY:
    // - distance < 0: Resource dễ hơn ideal → Penalty nhẹ (1.0x)
    // - distance > 0: Resource khó hơn ideal → Penalty nặng (2.0x)
    // - distance = 0: Perfect match → Score cao (1.0)
    
    if (distance === 0) {
      // Perfect match
      return 1.0;
    } else if (distance < 0) {
      // Resource dễ hơn ideal (below level)
      const absDistance = Math.abs(distance);
      if (absDistance === 1) return 0.8;  // Nhẹ penalty
      return 0.6; // Moderate penalty
    } else {
      // Resource khó hơn ideal (above level) - PHẠT NẶNG
      const absDistance = distance;
      if (absDistance === 1) return 0.6;  // Penalty nặng (2x so với below)
      if (absDistance === 2) return 0.3;  // Rất nặng
      return 0.1; // Quá khó, không recommend
    }
  }

  /**
   * Diversify và limit resources với MMR (Maximal Marginal Relevance)
   * 
   * CẢI TIẾN: Sử dụng MMR algorithm để tránh trùng lặp nội dung
   * - Cân bằng giữa relevance (liên quan) và diversity (đa dạng)
   * - Tránh các resources quá giống nhau về mặt semantic
   * 
   * Căn cứ: Carbonell & Goldstein (1998) - MMR algorithm
   * 
   * @param {Array} resources - Sorted resources by recommendation score
   * @param {Array} preferredTypes - Preferred resource types
   * @param {number} limit - Maximum number of resources
   * @param {number} lambda - MMR lambda parameter (0.7 = 70% relevance, 30% diversity)
   * @returns {Array} Diversified resources
   */
  _diversifyAndLimit(resources, preferredTypes, limit, lambda = 0.7) {
    if (resources.length === 0) return [];
    
    const diversified = [];
    const typeCount = {};

    // Calculate semantic similarity between resources (simplified)
    // In production, use actual embeddings for semantic similarity
    const calculateSimilarity = (res1, res2) => {
      // Simple similarity based on title, provider, and skills overlap
      let similarity = 0;
      const title1 = (res1.title || '').toLowerCase();
      const title2 = (res2.title || '').toLowerCase();
      
      // Title overlap
      const words1 = new Set(title1.split(/\s+/));
      const words2 = new Set(title2.split(/\s+/));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;
      
      // Provider match
      if (res1.provider === res2.provider) similarity += 0.3;
      
      // Type match
      if (res1.type === res2.type) similarity += 0.2;
      
      // Title similarity
      similarity += jaccard * 0.5;
      
      return Math.min(1.0, similarity);
    };

    // Generate query representation for relevance (simplified)
    // In production, use actual query embedding
    const calculateRelevance = (resource) => {
      // Relevance = recommendationScore (already calculated)
      return resource.recommendationScore || 0.5;
    };

    // MMR Algorithm
    while (diversified.length < limit && diversified.length < resources.length) {
      let bestMMRScore = -Infinity;
      let bestResource = null;
      let bestIndex = -1;

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
        // Skip if already selected
        if (diversified.find(r => r.title === resource.title && r.provider === resource.provider)) {
          continue;
        }

        // Check type constraints
        const type = resource.type;
        if (!typeCount[type]) typeCount[type] = 0;
        
        const isPreferred = preferredTypes.includes(type);
        const maxAllowed = isPreferred ? 2 : 1;
        
        if (typeCount[type] >= maxAllowed) {
          continue; // Type limit reached
        }

        // Calculate relevance score
        const relevance = calculateRelevance(resource);

        // Calculate max similarity with already selected resources
        let maxSimilarity = 0;
        if (diversified.length > 0) {
          maxSimilarity = Math.max(
            ...diversified.map(selected => calculateSimilarity(resource, selected))
          );
        }

        // MMR Score = lambda * relevance - (1 - lambda) * max_similarity
        const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestResource = resource;
          bestIndex = i;
        }
      }

      // If no suitable resource found, break
      if (!bestResource) break;

      // Add best resource
      diversified.push(bestResource);
      const type = bestResource.type;
      if (!typeCount[type]) typeCount[type] = 0;
      typeCount[type]++;
    }

    // Fallback: If MMR didn't fill quota, add best remaining
    if (diversified.length < limit) {
      for (const resource of resources) {
        if (diversified.length >= limit) break;
        
        const alreadyAdded = diversified.find(
          r => r.title === resource.title && r.provider === resource.provider
        );
        
        if (!alreadyAdded) {
          diversified.push(resource);
        }
      }
    }

    return diversified.slice(0, limit);
  }

  // Helper methods
  _getPhaseTitle(phaseNumber) {
    return RESOURCE_CONSTANTS.PHASE_TITLES[phaseNumber] || `Phase ${phaseNumber}`;
  }

  _sanitizeSkillQuery(rawSkill = '') {
    if (!rawSkill || typeof rawSkill !== 'string') return '';
    const primarySegment = rawSkill.split('-')[0].trim();
    return primarySegment.replace(/\s+/g, ' ');
  }

  /**
   * Enhance skill query for better API search results
   * Add context to avoid ambiguous results (e.g., "sketch" → "sketch design tool")
   * 
   * @param {string} skill - Skill name
   * @param {string} targetRole - Target role
   * @param {string} industry - Industry context
   * @returns {string} Enhanced skill query
   */
  _enhanceSkillQueryForSearch(skill, targetRole = '', industry = '') {
    if (!skill) return skill;
    
    const normalizedSkill = skill.toLowerCase().trim();
    const normalizedRole = (targetRole || '').toLowerCase();
    const normalizedIndustry = (industry || '').toLowerCase();
    
    // Skill-specific enhancements
    const skillEnhancements = {
      'sketch': {
        // "sketch" is ambiguous - could be Sketch app or drawing
        context: normalizedRole.includes('design') || normalizedIndustry.includes('design')
          ? 'sketch design tool app'
          : 'sketch drawing',
        exclude: ['sketchup', '3d modeling', 'perspective drawing', 'draw anything']
      },
      'design systems': {
        // "design systems" could be UI/UX or system architecture
        context: normalizedRole.includes('design') || normalizedIndustry.includes('design')
          ? 'ui design systems ux design system'
          : 'system design architecture',
        exclude: ['system design interview', 'distributed systems', 'microservices']
      },
      'adobe xd': {
        context: 'adobe xd design tool',
        exclude: []
      },
      'figma': {
        context: 'figma design tool',
        exclude: []
      }
    };

    // Check if skill needs enhancement
    for (const [key, enhancement] of Object.entries(skillEnhancements)) {
      if (normalizedSkill.includes(key)) {
        return enhancement.context;
      }
    }

    // Default: add industry/role context if available
    if (normalizedRole.includes('design') || normalizedIndustry.includes('design')) {
      if (!normalizedSkill.includes('design')) {
        return `${skill} design`;
      }
    }

    return skill;
  }

  /**
   * Filter resources by role relevance
   * Remove resources that are clearly not relevant to the target role/industry
   * 
   * @param {Array} resources - Array of resources
   * @param {string} skill - Skill name
   * @param {string} targetRole - Target role (e.g., "UI/UX Designer")
   * @param {string} industry - Industry context
   * @returns {Array} Filtered resources
   */
  _filterByRoleRelevance(resources, skill, targetRole = '', industry = null) {
    if (!targetRole || !resources || resources.length === 0) {
      return resources;
    }

    const normalizedRole = targetRole.toLowerCase().trim();
    const normalizedSkill = skill.toLowerCase().trim();
    
    // Keywords that indicate irrelevant resources for specific roles
    const irrelevantKeywords = {
      'ui/ux designer': ['r programming', 'r language', 'statistical computing', 'data science r', 'r studio'],
      'ui designer': ['r programming', 'r language', 'backend', 'api', 'server'],
      'ux designer': ['r programming', 'r language', 'backend', 'api', 'server'],
      'designer': ['r programming', 'r language', 'backend development', 'server-side'],
      'developer': ['design principles', 'color theory', 'typography'],
    };

    // Find matching role pattern
    let rolePattern = null;
    for (const [role, keywords] of Object.entries(irrelevantKeywords)) {
      if (normalizedRole.includes(role) || role.includes(normalizedRole.split('/')[0])) {
        rolePattern = keywords;
        break;
      }
    }

    // Filter out irrelevant resources
    const filtered = resources.filter(resource => {
      const resourceText = `${resource.title} ${resource.description || ''} ${resource.provider || ''}`.toLowerCase();
      
      // Check for irrelevant keywords
      if (rolePattern) {
        const hasIrrelevantKeyword = rolePattern.some(keyword => resourceText.includes(keyword));
        if (hasIrrelevantKeyword) {
          logger.debug('Filtered out irrelevant resource for role', {
            role: targetRole,
            resourceTitle: resource.title,
            keyword: rolePattern.find(k => resourceText.includes(k)),
          });
          return false;
        }
      }

      // Check if resource title/description mentions unrelated technologies
      // Example: R programming article for UI/UX Designer
      const unrelatedTech = {
        'r programming': ['design', 'ui', 'ux', 'designer', 'figma', 'sketch'],
        'design': ['r programming', 'statistical computing', 'r language'],
      };

      // If skill is about design, filter out programming articles
      if (normalizedSkill.includes('design') || normalizedRole.includes('design')) {
        if (resourceText.includes('r programming') || resourceText.includes('r language')) {
          logger.debug('Filtered out R programming resource for design role', {
            role: targetRole,
            skill,
            resourceTitle: resource.title,
          });
          return false;
        }
      }

      // Enhanced filtering for ambiguous skills
      // Filter out SketchUp, 3D modeling for "sketch" design skill
      if (normalizedSkill.includes('sketch') && (normalizedRole.includes('design') || normalizedIndustry === 'design')) {
        if (resourceText.includes('sketchup') || resourceText.includes('3d modeling') || 
            resourceText.includes('perspective drawing') || resourceText.includes('draw anything') ||
            resourceText.includes('illustrator') && !resourceText.includes('sketch app')) {
          logger.debug('Filtered out unrelated sketch resource for design role', {
            role: targetRole,
            skill,
            resourceTitle: resource.title,
          });
          return false;
        }
        // Prefer resources that mention "sketch app" or "sketch design"
        if (resourceText.includes('sketch app') || resourceText.includes('sketch design tool')) {
          return true; // Keep these
        }
      }

      // Filter out system architecture for "design systems" in UI/UX context
      if (normalizedSkill.includes('design systems') && (normalizedRole.includes('design') || normalizedIndustry === 'design')) {
        if (resourceText.includes('system design interview') || resourceText.includes('distributed systems') ||
            resourceText.includes('microservices') || resourceText.includes('backend architecture')) {
          logger.debug('Filtered out system architecture resource for UI/UX design systems', {
            role: targetRole,
            skill,
            resourceTitle: resource.title,
          });
          return false;
        }
        // Prefer resources that mention "ui design system" or "ux design system"
        if (resourceText.includes('ui design system') || resourceText.includes('ux design system') ||
            resourceText.includes('design system component')) {
          return true; // Keep these
        }
      }

      // If skill is about programming, but resource is clearly about unrelated field
      if (normalizedSkill.includes('programming') && !normalizedSkill.includes('r')) {
        // Allow R programming only if explicitly searching for R
        if (resourceText.includes('r programming') && !normalizedSkill.includes('r')) {
          return false;
        }
      }

      return true;
    });

    // If filtering removed too many resources, keep some with lower relevance
    if (filtered.length < 2 && resources.length >= 2) {
      logger.warn('Role filtering removed too many resources, keeping some lower relevance', {
        role: targetRole,
        skill,
        originalCount: resources.length,
        filteredCount: filtered.length,
      });
      // Return at least top 2 resources even if not perfectly matched
      return resources.slice(0, 2);
    }

    return filtered.length > 0 ? filtered : resources; // Fallback to original if all filtered out
  }

  _getActiveCache() {
    if (this.cacheService && typeof this.cacheService.isCacheAvailable === 'function') {
      return this.cacheService.isCacheAvailable() ? this.cacheService : null;
    }
    return null;
  }

  _buildApiCacheKey(cacheService, skill, difficulty, preferredTypes, preferredLanguage, industry) {
    if (!cacheService) return null;
    return cacheService.generateKey(
      cacheService.KEY_PREFIXES.SEARCH || 'search',
      'resources',
      `skill:${(skill || '').toLowerCase()}`,
      `diff:${difficulty || 'na'}`,
      preferredLanguage ? `lang:${preferredLanguage}` : null,
      Array.isArray(preferredTypes) && preferredTypes.length > 0
        ? `types:${preferredTypes.slice(0, 3).join(',')}`
        : null,
      industry ? `industry:${industry}` : null
    );
  }

  _applySkillRelevanceWeight(resources, skillName) {
    if (!skillName || !Array.isArray(resources)) {
      return resources || [];
    }

    const keywords = this._getSkillKeywordVariants(skillName);
    if (keywords.length === 0) {
      return resources;
    }

    return resources.map((resource) => {
      const haystack = `${resource.title || ''} ${resource.description || ''} ${resource.provider || ''}`.toLowerCase();
      const hasMatch = keywords.some((keyword) => keyword && haystack.includes(keyword));
      if (hasMatch) {
        return resource;
      }
      const penalty = 0.15;
      return {
        ...resource,
        recommendationScore: Math.max(0, (resource.recommendationScore || 0.5) - penalty),
        relevancePenalty: true,
      };
    });
  }

  _getSkillKeywordVariants(skillName) {
    const normalized = (skillName || '').toString().toLowerCase().trim();
    if (!normalized) return [];
    const variants = new Set([
      normalized,
      normalized.replace(/\s+/g, ''),
      normalized.replace(/[.\-]/g, ' '),
      normalized.replace(/[.\-]/g, ''),
    ]);
    return Array.from(variants).filter(Boolean);
  }

  _getRecommendedProvider(phaseNumber, type) {
    if (type === 'course') {
      return phaseNumber === 1 ? 'Udemy' : 'Coursera';
    }
    if (type === 'video') {
      return 'YouTube - Recommended Channel';
    }
    return 'Official Docs';
  }

  _calculateDuration(phaseNumber, difficulty, type = 'course') {
    const baseHours = {
      beginner: 10,
      intermediate: 20,
      advanced: 30,
      expert: 40,
    };

    const multiplier = phaseNumber >= 3 ? 1.5 : 1.0;
    const hours = Math.ceil(baseHours[difficulty] * multiplier);

    if (type === 'video') {
      return `${Math.min(hours, 5)} hours`;
    }

    return `${hours} hours`;
  }

  _calculateRelevance(skill, difficulty, learningStage) {
    // Placeholder: In real implementation, use semantic similarity
    return 0.8 + Math.random() * 0.2;
  }

  _getAdvancedTopic(learningStage) {
    const topics = {
      analyze: 'Performance Optimization',
      evaluate: 'Best Practices & Patterns',
      create: 'Building Production Applications',
    };
    return topics[learningStage] || 'Advanced Concepts';
  }

  _getDefaultResources(skill) {
    // DEPRECATED: Returning search URLs creates terrible UX
    // Users click on YouTube search results instead of specific videos
    // Better to return empty array and force system to use curated resources
    const skillName = skill || 'Programming';
    
    logger.warn('_getDefaultResources called - returning empty array to avoid search URL fallback', {
      skill: skillName,
      recommendation: 'Add skill to IntelligentResourceService curated database or enable API fallback'
    });
    
    // Return empty array instead of broken search URLs
    return [];
  }

  /**
   * Fetch resources from external APIs
   * Priority: YouTube > GitHub > Dev.to > Stack Overflow > Khan Academy > Google Search
   * 
   * @param {string} skill - Skill name
   * @param {string} difficulty - Difficulty level
   * @param {Array} preferredTypes - Preferred resource types
   * @param {string} industry - Industry code (optional)
   * @returns {Promise<Array>} Array of resources from APIs
   */
  async _fetchFromAPIs(skill, difficulty, preferredTypes, industry = null, preferredLanguage = 'en') {
    const cacheService = this._getActiveCache();
    const cacheKey = this._buildApiCacheKey(
      cacheService,
      skill,
      difficulty,
      preferredTypes,
      preferredLanguage,
      industry
    );

    if (cacheService && cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (Array.isArray(cached) && cached.length > 0) {
        logger.info('Resource API cache hit', { skill, difficulty, cachedCount: cached.length });
        return cached;
      }
    }

    const resources = [];

    try {
      // Get preferred APIs for this industry
      const preferredApis = industry 
        ? industryMappingService.getPreferredApis(industry)
        : ['youtube', 'github', 'devto', 'stackoverflow', 'khanacademy', 'googlesearch'];

      const fetchTasks = [];

      if (preferredTypes.includes('video') && 
          youtubeApiService.isServiceAvailable() &&
          (industry === null || preferredApis.includes('youtube'))) {
        fetchTasks.push(
          youtubeApiService
            .searchVideos(skill, difficulty, 5, { language: preferredLanguage })
            .then((videos) => {
              logger.info(`Fetched ${videos.length} videos from YouTube API for: ${skill} (${industry || 'general'})`);
              return videos;
            })
            .catch((error) => {
              logger.warn('YouTube API fetch failed:', error.message);
              return [];
            })
        );
      }

      if (preferredTypes.includes('course') && 
          khanAcademyApiService.isServiceAvailable() &&
          (industry === null || preferredApis.includes('khanacademy'))) {
        fetchTasks.push(
          khanAcademyApiService
            .searchTopics(skill, industry, difficulty, 5)
            .then((courses) => {
              logger.info(`Fetched ${courses.length} courses from Khan Academy API for: ${skill} (${industry || 'general'})`);
              return courses;
            })
            .catch((error) => {
              logger.warn('Khan Academy API fetch failed:', error.message);
              return [];
            })
        );
      }

      if (githubApiService.isServiceAvailable() &&
          (industry === null || 
           industry === 'technology' || 
           industry === 'software-development' ||
           preferredApis.includes('github'))) {
        fetchTasks.push(
          githubApiService
            .getAwesomeList(skill, 3)
            .then((awesomeResources) => {
              const filtered = preferredTypes.length > 0
                ? awesomeResources.filter(r => preferredTypes.includes(r.type))
                : awesomeResources;
              const limited = filtered.slice(0, 5);
              logger.info(`Fetched ${limited.length} resources from GitHub Awesome Lists for: ${skill}`);
              return limited;
            })
            .catch((error) => {
              logger.warn('GitHub API fetch failed:', error.message);
              return [];
            })
        );
      }

      if (preferredTypes.includes('article') && 
          devToApiService.isServiceAvailable() &&
          (industry === null || 
           industry === 'technology' || 
           industry === 'software-development' ||
           preferredApis.includes('devto'))) {
        fetchTasks.push(
          devToApiService
            .searchArticles(skill, difficulty, 5)
            .then((articles) => {
              logger.info(`Fetched ${articles.length} articles from Dev.to API for: ${skill}`);
              return articles;
            })
            .catch((error) => {
              logger.warn('Dev.to API fetch failed:', error.message);
              return [];
            })
        );
      }

      if (preferredTypes.includes('article') && 
          stackOverflowApiService.isServiceAvailable() &&
          (industry === null || 
           industry === 'technology' || 
           industry === 'software-development' ||
           preferredApis.includes('stackoverflow'))) {
        fetchTasks.push(
          stackOverflowApiService
            .searchQuestions(skill, difficulty, 5)
            .then((questions) => {
              logger.info(`Fetched ${questions.length} questions from Stack Overflow API for: ${skill}`);
              return questions;
            })
            .catch((error) => {
              logger.warn('Stack Overflow API fetch failed:', error.message);
              return [];
            })
        );
      }

      const results = await Promise.all(fetchTasks);
      results.forEach((items) => {
        if (Array.isArray(items) && items.length > 0) {
          resources.push(...items);
        }
      });

      if (resources.length < 3 && 
          googleSearchService.isServiceAvailable() &&
          (industry === null || preferredApis.includes('googlesearch'))) {
        try {
          const searchResults = await googleSearchService.searchResources(
            skill,
            difficulty,
            null,
            5,
            preferredLanguage
          );
          resources.push(...searchResults);
          logger.info(`Fetched ${searchResults.length} results from Google Search API for: ${skill}`);
        } catch (error) {
          logger.warn('Google Search API fetch failed:', error.message);
        }
      }

      if (cacheService && cacheKey && resources.length > 0) {
        await cacheService.set(cacheKey, resources, this.apiCacheTTLSeconds);
      }
    } catch (error) {
      logger.error('Error fetching from APIs:', error.message);
    }

    return resources;
  }

  /**
   * Hybrid Search: Kết hợp vector search với live search API
   * 
   * Vấn đề: Vector DB có thể không có resources mới nhất
   * Giải pháp: Fallback to live search (Google Search API) cho trending topics
   * 
   * @param {string} query - Search query
   * @param {Object} filters - Metadata filters
   * @returns {Promise<Array>} Resources from both sources
   */
  async hybridSearch(query, filters) {
    try {
      // 1. Try vector DB first (faster, cheaper)
      let resources = [];
      
      // TODO: Implement vector DB search
      // resources = await vectorDB.search(query, filters);
      
      // 2. If not enough results hoặc query is very new, try live search
      if (resources.length < 3) {
        // Check if topic is trending/new (heuristic: skill name in recent job postings)
        const isTrending = await this._isTrendingTopic(query);
        
        if (isTrending) {
          // Use Google Search API
          if (googleSearchService.isServiceAvailable()) {
            const liveResults = await googleSearchService.searchResources(query, 'beginner', null, 5);
            resources = [...resources, ...liveResults];
            logger.info(`Using hybrid search for trending topic: ${query}`);
          }
        }
      }
      
      return resources;
    } catch (error) {
      logger.error('Hybrid search error:', error);
      return [];
    }
  }

  /**
   * Check if topic is trending (new/recent)
   * Simplified heuristic - in production, check job postings trends
   */
  async _isTrendingTopic(query) {
    // TODO: Implement actual trending detection
    // For now, return false
    return false;
  }
}

// Export singleton instance (for backward compatibility)
const resourceRecommendationService = new ResourceRecommendationService();

// Export factory function for testing
function getResourceRecommendationService() {
  return resourceRecommendationService;
}

module.exports = resourceRecommendationService;
module.exports.getResourceRecommendationService = getResourceRecommendationService;
module.exports.ResourceRecommendationService = ResourceRecommendationService;

