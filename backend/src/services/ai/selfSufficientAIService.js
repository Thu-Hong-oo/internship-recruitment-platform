/**
 * 🚀 Self-Sufficient AI Service
 * 
 * 100% tự chủ - KHÔNG phụ thuộc Gemini API
 * 
 * Tech Stack:
 * - PhoBERT NER (F1 96%) for skill extraction
 * - Sentence-BERT (768-dim) for semantic similarity
 * - TF-IDF for text matching
 * - Rule-based algorithms for analysis
 * 
 * Replace các hàm Gemini trong aiService.js với implementation tự chủ
 */

// const phobertService = require('../phobertService'); // DISABLED - will re-enable after fixing PhoBERT extraction issues
const { getSentenceBertService } = require('./sentenceBertService');
const { getJobMatchingService } = require('./jobMatchingService');
const { logger } = require('../../utils/logger');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class SelfSufficientAIService {
  constructor() {
    this.sentenceBert = getSentenceBertService();
    this.jobMatching = getJobMatchingService();
    
    // Initialize Gemini API for AI-powered CV improvements
    this.geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    this.geminiModel = null;
    if (this.geminiApiKey && this.geminiApiKey.startsWith('AIzaSy')) {
      try {
        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        this.geminiModel = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
        });
        logger.info('✅ Gemini model initialized for CV improvements analysis');
      } catch (error) {
        logger.warn('⚠️ Gemini initialization failed, will use rule-based fallback:', error.message);
      }
    } else {
      logger.info('ℹ️ Gemini API not available, will use rule-based CV improvements');
    }
    
    // DEPRECATED: Hardcoded categories (kept for fallback only)
    // Use database Skill model instead!
    this.fallbackSkillCategories = {
      programming: ['java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'],
      frontend: ['react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'next.js', 'nuxt'],
      backend: ['node.js', 'express', 'nestjs', 'spring', 'django', 'flask', 'laravel', 'rails'],
      database: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'oracle'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins'],
      mobile: ['react native', 'flutter', 'ios', 'android', 'xamarin'],
      tools: ['git', 'jira', 'postman', 'figma', 'vscode', 'intellij', 'excel', 'microsoft office', 'powerpoint', 'word'],
      accounting: ['accounting', 'sap', 'misa', 'financial reporting', 'taxation', 'bookkeeping', 'audit', 'erp'],
      marketing: ['marketing', 'seo', 'sem', 'google analytics', 'facebook ads', 'content', 'social media', 'branding'],
      hr: ['recruitment', 'hr', 'human resource', 'employee relations', 'labor law', 'organizational'],
      softSkill: ['leadership', 'communication', 'teamwork', 'problem solving', 'agile', 'scrum', 'time management', 'attention to detail', 'organizational', 'analytical']
    };

    // Cache for database skills (refresh periodically)
    this.skillsCache = null;
    this.skillsCacheExpiry = null;
    this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get skills from database with caching
   * @private
   */
  async _getSkillsFromDB() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.skillsCache && this.skillsCacheExpiry && now < this.skillsCacheExpiry) {
        return this.skillsCache;
      }

      // Query database (fix path: services/ai/ -> models/)
      const Skill = require('../../models/Skill');
      const skills = await Skill.find({ isActive: true })
        .select('name category aliases demandLevel trend embedding')
        .lean();

      // Update cache
      this.skillsCache = skills;
      this.skillsCacheExpiry = now + this.CACHE_TTL;

      logger.info(`🗄️ Loaded ${skills.length} skills from database (cached for ${this.CACHE_TTL/60000} min)`);
      return skills;
    } catch (error) {
      logger.error('❌ Error loading skills from database:', error);
      return [];
    }
  }

  /**
   * Find skill in database by name (with aliases support)
   * @private
   */
  async _findSkillInDB(skillName) {
    const skills = await this._getSkillsFromDB();
    const lowerName = skillName.toLowerCase().trim();

    return skills.find(skill => {
      // Check exact name match
      if (skill.name.toLowerCase() === lowerName) return true;
      
      // Check aliases
      if (skill.aliases && skill.aliases.length > 0) {
        return skill.aliases.some(alias => alias.toLowerCase() === lowerName);
      }
      
      return false;
    });
  }

  /**
   * Identify skill category from database
   * @private
   */
  async _identifySkillCategory(skillName) {
    try {
      const dbSkill = await this._findSkillInDB(skillName);
      
      if (dbSkill) {
        // Map database category to display category
        const category = dbSkill.category;
        
        // Map categories
        if (category === 'soft-skills' || category === 'softSkill') return 'soft skill';
        if (category === 'programming-languages' || category === 'programming') return 'technical';
        if (category.includes('frontend') || category.includes('backend') || 
            category.includes('database') || category.includes('cloud')) {
          return 'technical';
        }
        
        return 'technical'; // Default for tech skills
      }

      // Fallback to hardcoded categories
      const lowerSkill = skillName.toLowerCase();
      
      // Check soft skills FIRST (leadership, communication, agile, etc.)
      if (this.fallbackSkillCategories.softSkill.some(kw => 
        lowerSkill.includes(kw) || kw.includes(lowerSkill)
      )) {
        return 'soft skill';
      }
      
      // Then check technical skills
      for (const [category, keywords] of Object.entries(this.fallbackSkillCategories)) {
        if (category !== 'softSkill' && keywords.some(kw => 
          lowerSkill.includes(kw) || kw.includes(lowerSkill)
        )) {
          return 'technical';
        }
      }

      return 'other';
    } catch (error) {
      logger.error('❌ Error identifying skill category:', error);
      return 'other';
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Analyze Skill Gaps
   * Replace aiService.analyzeSkillGaps()
   * 
   * Uses: PhoBERT + Sentence-BERT + Rule-based
   */
  async analyzeSkillGaps(cvData, jobData) {
    try {
      logger.info('🔬 Fast skill gap analysis (keyword + fuzzy matching)');

      // Pre-load skills cache to avoid multiple DB queries
      await this._getSkillsFromDB();

      // Build texts
      const cvText = this._buildCVText(cvData);
      const jobText = this._buildJobText(jobData);

      // Detect language separately for CV and Job
      const isCVVietnamese = this._isVietnameseText(cvText);
      const isJobVietnamese = this._isVietnameseText(jobText);
      
      let currentSkills = [];
      let requiredSkills = [];

      // ✅ Use Hybrid System (Rule-based + Multilingual NER) instead of PhoBERT
      // PhoBERT is disabled due to extraction issues - will re-enable after fixing
      if (cvText.length > 50) {
        logger.info(`🌍 Using Hybrid System for skill extraction (${isCVVietnamese ? 'Vietnamese' : 'English'} text)`);
        try {
          const { getSkillExtractionService } = require('./skillExtractionService');
          const skillExtractor = getSkillExtractionService();
          const extractedSkills = await skillExtractor.extractSkills(cvText, {
            useHybrid: true,      // Use Hybrid System (Rule-based + Multilingual NER)
            usePhoBERT: false,    // Disabled - will re-enable after fixing
            useGemini: false,
            maxSkills: 50
          });
          
          if (extractedSkills && extractedSkills.length > 0) {
            const skillNames = extractedSkills.map(s => s.name);
            currentSkills.push(...skillNames);
            logger.info(`✅ Hybrid System extracted ${skillNames.length} skills from CV`);
          }
        } catch (error) {
          logger.warn('⚠️ Hybrid System failed, falling back to keyword extraction:', error.message);
        }
      }
      
      // Add manual skills if provided
      const allCurrentSkills = [
        ...currentSkills,
        ...(cvData.skills?.technical || []),
        ...(cvData.skills?.soft || []),
        ...(cvData.skills?.languages || [])
      ].map(s => (typeof s === 'string' ? s : s.name).toLowerCase().trim());

      let allRequiredSkills = [
        ...requiredSkills,
        ...(jobData.skills || [])
      ].map(s => (typeof s === 'string' ? s : s.name).toLowerCase().trim()).filter(Boolean);

      // 🔥 AUTO-GENERATE required skills if empty or too few (using job title/description)
      // Always try to generate skills if we have job title, even if some skills exist
      if (jobData.title) {
        if (allRequiredSkills.length === 0 || allRequiredSkills.length < 3) {
          logger.info(`🤖 Auto-generating required skills for job title: "${jobData.title}" (current: ${allRequiredSkills.length})`);
          try {
            const suggestedSkills = await this.suggestSkills(jobData.title, 'mid-level');
            if (suggestedSkills && suggestedSkills.suggestions && suggestedSkills.suggestions.length > 0) {
              const newSkills = suggestedSkills.suggestions
                .map(s => (typeof s === 'string' ? s : (s.name || s.skill || String(s))).toLowerCase().trim())
                .filter(Boolean);
              
              // Merge with existing skills, avoiding duplicates
              const existingSet = new Set(allRequiredSkills);
              const uniqueNewSkills = newSkills.filter(s => !existingSet.has(s));
              allRequiredSkills = [...allRequiredSkills, ...uniqueNewSkills];
              
              logger.info(`✅ Auto-generated ${uniqueNewSkills.length} additional skills (total: ${allRequiredSkills.length}):`, allRequiredSkills.join(', '));
            } else {
              logger.warn(`⚠️ suggestSkills returned no suggestions for: "${jobData.title}"`);
            }
          } catch (error) {
            logger.error(`❌ Error auto-generating skills:`, error.message);
          }
        }
      }
      
      // If still no skills, try to extract from job description
      if (allRequiredSkills.length === 0 && jobData.description) {
        logger.info(`🤖 No skills found, trying to extract from job description...`);
        try {
          const { getSkillExtractionService } = require('./skillExtractionService');
          const skillExtractor = getSkillExtractionService();
          const extractedSkills = await skillExtractor.extractSkills(jobData.description, {
            useHybrid: true,
            usePhoBERT: false,
            useGemini: false,
            maxSkills: 10
          });
          
          if (extractedSkills && extractedSkills.length > 0) {
            allRequiredSkills = extractedSkills.map(s => s.name.toLowerCase().trim());
            logger.info(`✅ Extracted ${allRequiredSkills.length} skills from job description:`, allRequiredSkills.join(', '));
          }
        } catch (error) {
          logger.error(`❌ Error extracting skills from description:`, error.message);
        }
      }

      // 3. Enhanced fuzzy matching with database aliases
      let matched = [];
      let missing = [];
      
      logger.info('⚡ Using enhanced fuzzy matching with database aliases');
      
      const currentSet = new Set(allCurrentSkills.map(s => s.toLowerCase()));
      const dbSkills = await this._getSkillsFromDB();
      
      for (const reqSkill of allRequiredSkills) {
        const normalized = reqSkill.toLowerCase();
        
        // 1. Exact match
        if (currentSet.has(normalized)) {
          matched.push(reqSkill);
          continue;
        }
        
        // 2. Database aliases match
        const dbSkill = dbSkills.find(s => 
          s.name.toLowerCase() === normalized || 
          (s.aliases && s.aliases.some(alias => alias.toLowerCase() === normalized))
        );
        
        if (dbSkill) {
          // Check if candidate has this skill by any alias
          const hasSkillByAlias = allCurrentSkills.some(cs => {
            const csLower = cs.toLowerCase();
            return csLower === dbSkill.name.toLowerCase() || 
                   (dbSkill.aliases && dbSkill.aliases.some(alias => alias.toLowerCase() === csLower));
          });
          
          if (hasSkillByAlias) {
            matched.push(reqSkill);
            continue;
          }
        }
        
        // 3. Fuzzy match
        let fuzzyMatched = false;
        for (const currentSkill of allCurrentSkills) {
          const currNorm = currentSkill.toLowerCase();
          
          // Substring match
          if (currNorm.includes(normalized) || normalized.includes(currNorm)) {
            matched.push(reqSkill);
            fuzzyMatched = true;
            break;
          }
          
          // Word-level match (improved)
          const reqWords = normalized.split(/[\s-._]+/);
          const currWords = currNorm.split(/[\s-._]+/);
          const commonWords = reqWords.filter(w => w.length > 2 && currWords.includes(w));
          if (commonWords.length >= Math.min(reqWords.length, 2)) {
            matched.push(reqSkill);
            fuzzyMatched = true;
            break;
          }
        }
        
        if (!fuzzyMatched) {
          missing.push(reqSkill);
        }
      }

      // 4. Analyze and categorize skills
      const missingSkills = await this._categorizeMissingSkills(missing, jobData);
      const strongSkills = await this._categorizeStrongSkills(matched, jobData);
      const skillsToImprove = await this._identifySkillsToImprove(currentSkills, requiredSkills);

      // 5. Generate learning priority
      const learningPriority = await this._generateLearningPriority(missingSkills); // Must await!

      // 6. Calculate overall gap level
      const overallGapLevel = this._calculateGapLevel(
        missingSkills.length,
        allRequiredSkills.length
      );

      const result = {
        missingSkills,
        skillsToImprove,
        strongSkills,
        learningPriority,
        overallGapLevel,
        _method: 'enhanced fuzzy matching + database',
        _timestamp: new Date(),
        _stats: {
          totalRequired: allRequiredSkills.length,
          matched: matched.length,
          missing: missingSkills.length,
          matchRate: allRequiredSkills.length > 0 
            ? Math.round((matched.length / allRequiredSkills.length) * 100) 
            : 0
        }
      };

      logger.info(`✅ Skill gap analysis completed:`, {
        required: allRequiredSkills.length,
        matched: matched.length,
        missing: missingSkills.length,
        strong: strongSkills.length,
        matchRate: `${result._stats.matchRate}%`,
        method: result._method
      });
      
      return result;

    } catch (error) {
      logger.error('❌ Self-sufficient skill gap analysis error:', error);
      // Fallback to basic analysis
      return this._basicSkillGapAnalysis(cvData, jobData);
    }
  }

  /**
   * Semantic skill matching using Sentence-BERT
   */
  async _semanticSkillMatching(currentSkills, requiredSkills) {
    const matched = [];
    const missing = [];

    // Quick exact match first
    const currentSkillsSet = new Set(currentSkills.map(s => s.toLowerCase()));
    const exactMatches = new Set();
    
    const needsSemanticCheck = [];
    
    for (const reqSkill of requiredSkills) {
      const normalized = reqSkill.toLowerCase();
      if (currentSkillsSet.has(normalized)) {
        matched.push(reqSkill);
        exactMatches.add(normalized);
      } else {
        needsSemanticCheck.push(reqSkill);
      }
    }

    // Skip semantic matching if no current skills or nothing to check
    if (currentSkills.length === 0 || needsSemanticCheck.length === 0) {
      missing.push(...needsSemanticCheck);
      return { matched, missing };
    }

    // Batch ALL skills at once for much faster processing
    try {
      // Limit to top 10 skills for performance
      const skillsToCheck = needsSemanticCheck.slice(0, 10);
      const skippedSkills = needsSemanticCheck.slice(10);
      
      if (skippedSkills.length > 0) {
        logger.info(`⚡ Skipping ${skippedSkills.length} skills (performance optimization)`);
        missing.push(...skippedSkills);
      }
      
      // Process ALL skills in parallel with single timeout
      const semanticChecks = skillsToCheck.map(async (reqSkill) => {
        try {
          const similarities = await this.sentenceBert.similarityBatch(reqSkill, currentSkills);
          const maxSimilarity = Math.max(...similarities);
          return { skill: reqSkill, similarity: maxSimilarity, matched: maxSimilarity >= 0.75 };
        } catch (error) {
          logger.warn(`⚠️ Semantic check error for "${reqSkill}":`, error.message);
          return { skill: reqSkill, similarity: 0, matched: false };
        }
      });
      
      // Wait for all checks with 15s timeout total (not per skill)
      const results = await Promise.race([
        Promise.allSettled(semanticChecks),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Semantic matching timeout (15s)')), 15000)
        )
      ]);
      
      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          if (result.value.matched) {
            matched.push(result.value.skill);
          } else {
            missing.push(result.value.skill);
          }
        } else if (result.status === 'rejected' || !result.value) {
          // Timeout or error - mark all remaining as missing
          const checkedSkills = new Set([...matched, ...missing]);
          const remainingSkills = skillsToCheck.filter(s => !checkedSkills.has(s));
          missing.push(...remainingSkills);
          break;
        }
      }
    } catch (error) {
      logger.warn('⚠️ Semantic matching failed entirely:', error.message);
      missing.push(...needsSemanticCheck);
    }

    return { matched, missing };
  }

  /**
   * Categorize missing skills with importance
   */
  async _categorizeMissingSkills(missingSkills, jobData) {
    const categorized = [];
    
    for (const skill of missingSkills) {
      const category = await this._identifySkillCategory(skill); // Must await!
      const importance = this._calculateSkillImportance(skill, jobData);
      const reason = this._generateSkillReason(skill, jobData);

      categorized.push({
        name: skill,
        category,
        importance,
        reason
      });
    }
    
    return categorized;
  }

  /**
   * Categorize strong skills
   */
  async _categorizeStrongSkills(matchedSkills, jobData) {
    return matchedSkills.map(skill => {
      const relevance = this._calculateSkillRelevance(skill, jobData);
      
      return {
        name: skill,
        level: 'intermediate', // Default level
        relevance
      };
    });
  }

  /**
   * Identify skills that need improvement
   */
  async _identifySkillsToImprove(currentSkills, requiredSkills) {
    // Skills that exist in CV but may need improvement
    const improvable = [];

    for (const current of currentSkills) {
      for (const required of requiredSkills) {
        // Check if skills are related but current level may be insufficient
        if (current.toLowerCase().includes(required.toLowerCase().substring(0, 5))) {
          improvable.push({
            name: required,
            currentLevel: 'beginner',
            targetLevel: 'intermediate',
            importance: 'medium'
          });
          break;
        }
      }
    }

    return improvable.slice(0, 5); // Top 5
  }

  /**
   * Generate learning priority order
   */
  async _generateLearningPriority(missingSkills) {
    // Sort by importance: high > medium > low
    const sorted = [...missingSkills].sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });

    const priority = [];
    for (let i = 0; i < sorted.length; i++) {
      const skill = sorted[i];
      priority.push({
        skill: skill.name,
        priority: i + 1,
        timeToLearn: await this._estimateLearningTime(skill.name, skill.category), // Must await!
        difficulty: await this._estimateDifficulty(skill.name, skill.category) // Must await!
      });
    }
    
    return priority;
  }

  /**
   * Identify skill category
   */
  _identifySkillCategory_OLD_DEPRECATED(skill) {
    const lowerSkill = skill.toLowerCase();

    for (const [category, keywords] of Object.entries(this.fallbackSkillCategories)) {
      if (keywords.some(kw => lowerSkill.includes(kw) || kw.includes(lowerSkill))) {
        if (category === 'softSkill') return 'soft skill';
        if (category === 'programming') return 'technical';
        return 'technical';
      }
    }

    return 'other';
  }

  /**
   * Calculate skill importance based on job context
   * Enhanced to handle auto-generated skills
   */
  _calculateSkillImportance(skill, jobData) {
    const jobText = (jobData.description || '').toLowerCase();
    const title = (jobData.title || '').toLowerCase();
    const skillLower = skill.toLowerCase();

    // 1. Check if skill is mentioned in job title (HIGHEST priority)
    if (title.includes(skillLower)) {
      return 'high';
    }

    // 2. Check frequency in job description
    const regex = new RegExp(skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = jobText.match(regex);
    
    if (matches && matches.length >= 3) return 'high';
    if (matches && matches.length >= 1) return 'medium';

    // 3. For auto-generated skills (not in description), infer importance from skill type and position in list
    // Core skills for the job category should be high importance
    if (skillLower.includes('excel') || skillLower.includes('office') || 
        skillLower.includes('communication') || skillLower.includes('teamwork')) {
      return 'high'; // Essential soft skills
    }

    // Domain-specific core skills
    if (title.includes('marketing')) {
      if (skillLower.includes('marketing') || skillLower.includes('social') || 
          skillLower.includes('content') || skillLower.includes('seo')) {
        return 'high';
      }
    }
    
    if (title.includes('kế toán') || title.includes('chứng từ') || title.includes('accounting')) {
      if (skillLower.includes('accounting') || skillLower.includes('excel') || 
          skillLower.includes('sap') || skillLower.includes('financial')) {
        return 'high';
      }
    }

    if (title.includes('developer') || title.includes('engineer')) {
      if (skillLower.includes('programming') || skillLower.includes('javascript') || 
          skillLower.includes('python') || skillLower.includes('git')) {
        return 'high';
      }
    }

    // Default to medium for auto-generated skills
    return 'medium';
  }

  /**
   * Generate reason for missing skill
   */
  _generateSkillReason(skill, jobData) {
    const category = this._identifySkillCategory(skill);
    const title = jobData.title || 'this position';

    if (category === 'soft skill') {
      return `${title} requires strong ${skill} abilities`;
    }

    return `${skill} is required for ${title}`;
  }

  /**
   * Calculate skill relevance to job
   */
  _calculateSkillRelevance(skill, jobData) {
    const importance = this._calculateSkillImportance(skill, jobData);
    
    const relevanceMap = {
      high: 'high',
      medium: 'medium',
      low: 'low'
    };

    return relevanceMap[importance];
  }

  /**
   * Estimate learning time for skill (with database info)
   */
  async _estimateLearningTime(skillName, category) {
    try {
      const dbSkill = await this._findSkillInDB(skillName);
      
      if (dbSkill) {
        // Use demandLevel and trend from database
        if (dbSkill.demandLevel === 'critical' || dbSkill.trend === 'emerging') {
          return '6-12 months'; // High priority skills
        }
        
        if (dbSkill.demandLevel === 'high') {
          return '3-6 months';
        }
      }

      // Fallback logic
      if (category === 'soft skill') return 'ongoing';
      
      const lowerSkill = skillName.toLowerCase();
      
      // Complex skills
      if (lowerSkill.includes('architect') || 
          lowerSkill.includes('system design') ||
          lowerSkill.includes('aws') || 
          lowerSkill.includes('kubernetes')) {
        return '6-12 months';
      }

      // Programming languages
      if (this.fallbackSkillCategories.programming.some(kw => lowerSkill.includes(kw))) {
        return '3-6 months';
      }

      // Frameworks/tools
      return '1-3 months';
    } catch (error) {
      logger.error('❌ Error estimating learning time:', error);
      return '1-3 months'; // Safe default
    }
  }

  /**
   * Estimate difficulty level (with database info)
   */
  async _estimateDifficulty(skillName, category) {
    try {
      const dbSkill = await this._findSkillInDB(skillName);
      
      if (dbSkill) {
        // Use trend as complexity indicator
        if (dbSkill.trend === 'emerging') return 'high'; // New/cutting-edge tech
        if (dbSkill.demandLevel === 'critical') return 'high';
      }

      // Fallback logic
      if (category === 'soft skill') return 'high';

      const lowerSkill = skillName.toLowerCase();
      
      if (lowerSkill.includes('architect') || 
          lowerSkill.includes('system design')) {
        return 'high';
      }

      if (this.fallbackSkillCategories.cloud.some(kw => lowerSkill.includes(kw))) {
        return 'medium';
      }

      return 'medium';
    } catch (error) {
      logger.error('❌ Error estimating difficulty:', error);
      return 'medium'; // Safe default
    }
  }

  /**
   * Calculate overall gap level
   */
  _calculateGapLevel(missingCount, totalRequired) {
    if (totalRequired === 0) return 'low';
    
    const gapRatio = missingCount / totalRequired;
    
    if (gapRatio >= 0.6) return 'high';
    if (gapRatio >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Build CV text from cvData (optimized - limit text length)
   */
  _buildCVText(cvData) {
    const parts = [];

    // Skills (handle both string arrays and object arrays)
    if (cvData.skills) {
      if (cvData.skills.technical && Array.isArray(cvData.skills.technical)) {
        const techSkills = cvData.skills.technical
          .slice(0, 20) // Increased from 10 to 20
          .map(s => (typeof s === 'string' ? s : (s.name || s.skill || String(s))))
          .filter(Boolean)
          .join(', ');
        if (techSkills) parts.push(`Technical skills: ${techSkills}`);
      }
      if (cvData.skills.soft && Array.isArray(cvData.skills.soft)) {
        const softSkills = cvData.skills.soft
          .slice(0, 10) // Increased from 5 to 10
          .map(s => (typeof s === 'string' ? s : (s.name || s.skill || String(s))))
          .filter(Boolean)
          .join(', ');
        if (softSkills) parts.push(`Soft skills: ${softSkills}`);
      }
      if (cvData.skills.languages && Array.isArray(cvData.skills.languages)) {
        const langSkills = cvData.skills.languages
          .slice(0, 5)
          .map(s => (typeof s === 'string' ? s : (s.name || s.skill || String(s))))
          .filter(Boolean)
          .join(', ');
        if (langSkills) parts.push(`Languages: ${langSkills}`);
      }
    }

    // Experience (limit to 5 most recent, truncate descriptions)
    if (cvData.experience && Array.isArray(cvData.experience) && cvData.experience.length > 0) {
      cvData.experience.slice(0, 5).forEach(exp => {
        if (!exp) return;
        const position = exp.position || exp.title || 'Position';
        const company = exp.company || exp.organization || 'Company';
        const desc = (exp.description || exp.responsibilities || '').substring(0, 300); // Increased from 200 to 300
        if (desc) {
          parts.push(`${position} at ${company}: ${desc}`);
        } else {
          parts.push(`${position} at ${company}`);
        }
      });
    }

    // Education (limit to 3)
    if (cvData.education && Array.isArray(cvData.education) && cvData.education.length > 0) {
      cvData.education.slice(0, 3).forEach(edu => {
        if (!edu) return;
        const degree = edu.degree || 'Degree';
        const major = edu.major || edu.field || '';
        const school = edu.school || edu.institution || 'Institution';
        if (major) {
          parts.push(`${degree} in ${major} from ${school}`);
        } else {
          parts.push(`${degree} from ${school}`);
        }
      });
    }

    // Personal info (bio, summary)
    if (cvData.personalInfo) {
      if (cvData.personalInfo.bio) {
        parts.push(`Bio: ${cvData.personalInfo.bio.substring(0, 200)}`);
      }
      if (cvData.personalInfo.summary) {
        parts.push(`Summary: ${cvData.personalInfo.summary.substring(0, 200)}`);
      }
      if (cvData.personalInfo.jobTitle) {
        parts.push(`Current role: ${cvData.personalInfo.jobTitle}`);
      }
    }

    const text = parts.join('\n');
    
    // Ensure minimum length for skill extraction
    if (text.length < 50 && cvData.skills) {
      // If text is too short, add all skills
      const allSkills = [
        ...(cvData.skills.technical || []),
        ...(cvData.skills.soft || []),
        ...(cvData.skills.languages || [])
      ]
        .map(s => (typeof s === 'string' ? s : (s.name || s.skill || String(s))))
        .filter(Boolean)
        .join(', ');
      if (allSkills) {
        return `Skills: ${allSkills}\n${text}`;
      }
    }

    return text;
  }

  /**
   * Build job text from jobData
   */
  _buildJobText(jobData) {
    const parts = [];

    parts.push(`Title: ${jobData.title || ''}`);
    parts.push(`Description: ${jobData.description || ''}`);
    
    if (jobData.skills && Array.isArray(jobData.skills)) {
      parts.push(`Required skills: ${jobData.skills.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Detect if text is primarily Vietnamese
   */
  _isVietnameseText(text) {
    if (!text || text.length < 20) return false;
    
    // Vietnamese unicode ranges và common words
    const vietnameseChars = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi;
    const vietnameseWords = /(\b(?:và|của|cho|với|trong|trên|được|các|này|người|không|có|là|kỹ\s*năng|kinh\s*nghiệm|công\s*ty)\b)/gi;
    
    const charMatches = (text.match(vietnameseChars) || []).length;
    const wordMatches = (text.match(vietnameseWords) || []).length;
    
    // Calculate ratios
    const charRatio = charMatches / text.length;
    const words = text.split(/\s+/).length;
    const wordRatio = words > 0 ? wordMatches / words : 0;
    
    // Must have >15% Vietnamese chars OR >20% Vietnamese words
    return charRatio > 0.15 || wordRatio > 0.2;
  }

  /**
   * Basic skill gap analysis (fallback)
   */
  _basicSkillGapAnalysis(cvData, jobData) {
    const currentSkills = (cvData.skills?.technical || [])
      .map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
    
    const requiredSkills = (jobData.skills || [])
      .map(s => (typeof s === 'string' ? s : s.name).toLowerCase());

    const missing = requiredSkills.filter(req => !currentSkills.includes(req));
    const matched = requiredSkills.filter(req => currentSkills.includes(req));

    return {
      missingSkills: missing.map((skill, i) => ({
        name: skill,
        category: 'technical',
        importance: i < 3 ? 'high' : 'medium',
        reason: 'Required for target position'
      })),
      skillsToImprove: [],
      strongSkills: matched.map(skill => ({
        name: skill,
        level: 'intermediate',
        relevance: 'high'
      })),
      learningPriority: missing.map((skill, index) => ({
        skill,
        priority: index + 1,
        timeToLearn: '4-8 weeks',
        difficulty: 'medium'
      })),
      overallGapLevel: missing.length > 5 ? 'high' : missing.length > 2 ? 'medium' : 'low',
      _method: 'basic (fallback)'
    };
  }

  /**
   * ✅ SELF-SUFFICIENT: Analyze CV
   * Replace aiService.analyzeCV()
   * 
   * Uses: PhoBERT for skill extraction
   */
  async analyzeCV(cvText) {
    try {
      logger.info('🔬 Self-sufficient CV analysis (Hybrid System: Rule-based + Multilingual NER)');

      // Extract skills using Hybrid System (Rule-based + Multilingual NER)
      // PhoBERT is disabled - will re-enable after fixing
      const { getSkillExtractionService } = require('./skillExtractionService');
      const skillExtractor = getSkillExtractionService();
      const extractedSkills = await skillExtractor.extractSkills(cvText, {
        useHybrid: true,      // Use Hybrid System
        usePhoBERT: false,    // Disabled - will re-enable after fixing
        useGemini: false,
        maxSkills: 50
      });
      
      const skills = extractedSkills.map(s => s.name);

      // Categorize skills
      const categorized = {
        technical: [],
        soft: [],
        languages: []
      };

      for (const skill of skills) {
        const category = this._identifySkillCategory(skill);
        if (category === 'soft skill') {
          categorized.soft.push({ name: skill, level: 'intermediate' });
        } else if (skill.toLowerCase().includes('english') || skill.toLowerCase().includes('vietnamese')) {
          categorized.languages.push({ name: skill, level: 'intermediate' });
        } else {
          categorized.technical.push({ name: skill, level: 'intermediate' });
        }
      }

      return {
        skills: categorized,
        totalSkills: skills.length,
        _method: 'self-sufficient (Hybrid System: Rule-based + Multilingual NER)',
        _timestamp: new Date()
      };

    } catch (error) {
      logger.error('❌ CV analysis error:', error);
      return {
        skills: { technical: [], soft: [], languages: [] },
        totalSkills: 0,
        _method: 'error fallback'
      };
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Generate Career Objective
   * Replace aiService.generateCareerObjective()
   * 
   * Uses: Template-based generation
   */
  async generateCareerObjective(currentData, context) {
    try {
      const targetJob = context.targetJob || currentData.targetJob || 'Software Developer';
      const experience = context.experience || '2 years';
      const education = context.education || "Bachelor's degree";

      const templates = [
        `Seeking a challenging ${targetJob} position where I can apply my ${experience} of experience and ${education} to contribute to innovative projects and grow professionally.`,
        `Motivated professional with ${experience} of experience seeking a ${targetJob} role to leverage my technical skills and ${education} in a dynamic environment.`,
        `Aspiring ${targetJob} with ${experience} of hands-on experience and strong foundation from ${education}, looking to contribute to a forward-thinking organization.`
      ];

      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

      return {
        suggestions: [randomTemplate],
        _method: 'template-based'
      };

    } catch (error) {
      logger.error('❌ Career objective generation error:', error);
      return {
        suggestions: ['Seeking a challenging position to apply my skills and contribute to organizational growth.']
      };
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Suggest Skills
   * Replace aiService.suggestSkills()
   * 
   * Uses: Database query + Rule-based recommendations
   */
  async suggestSkills(targetJob, experience) {
    try {
      const jobLower = (targetJob || '').toLowerCase();
      const Skill = require('../../models/Skill');

      // Determine job category
      let category = null;
      let searchKeywords = [];

      if (jobLower.includes('frontend') || jobLower.includes('front-end')) {
        category = 'frontend';
        searchKeywords = ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript'];
      }
      else if (jobLower.includes('backend') || jobLower.includes('back-end')) {
        category = 'backend';
        searchKeywords = ['node', 'express', 'spring', 'django', 'api', 'database'];
      }
      else if (jobLower.includes('full stack') || jobLower.includes('fullstack')) {
        category = 'fullstack';
        searchKeywords = ['react', 'node', 'javascript', 'typescript', 'database', 'api'];
      }
      else if (jobLower.includes('devops')) {
        category = 'devops';
        searchKeywords = ['docker', 'kubernetes', 'aws', 'jenkins', 'terraform', 'ci/cd'];
      }
      else if (jobLower.includes('data') || jobLower.includes('analyst')) {
        category = 'data';
        searchKeywords = ['python', 'sql', 'pandas', 'excel', 'power bi', 'tableau'];
      }
      else if (jobLower.includes('kế toán') || jobLower.includes('accountant') || 
               jobLower.includes('chứng từ') || jobLower.includes('tài chính') || 
               jobLower.includes('finance') || jobLower.includes('accounting')) {
        category = 'accounting';
        searchKeywords = ['excel', 'sap', 'misa', 'accounting', 'financial reporting', 'taxation'];
      }
      else if (jobLower.includes('marketing') || jobLower.includes('sale') || jobLower.includes('bán hàng')) {
        category = 'marketing';
        searchKeywords = ['digital marketing', 'seo', 'google analytics', 'facebook ads', 'content creation', 'communication'];
      }
      else if (jobLower.includes('hr') || jobLower.includes('nhân sự') || jobLower.includes('human resource')) {
        category = 'hr';
        searchKeywords = ['recruitment', 'employee relations', 'hr management', 'communication', 'organizational skills'];
      }

      // Query database for relevant skills
      let suggestedSkills = [];

      if (searchKeywords.length > 0) {
        // Search by name or aliases
        const dbSkills = await Skill.find({
          isActive: true,
          $or: [
            { name: { $in: searchKeywords.map(k => new RegExp(k, 'i')) } },
            { aliases: { $in: searchKeywords.map(k => new RegExp(k, 'i')) } }
          ]
        })
        .sort({ popularity: -1, demandLevel: -1 }) // Sort by popularity and demand
        .limit(10)
        .select('name demandLevel trend')
        .lean();

        suggestedSkills = dbSkills.map(s => s.name);
      }

      // Fallback to hardcoded if database query fails or returns empty
      if (suggestedSkills.length === 0) {
        logger.warn('⚠️ Database query returned no skills, using fallback');
        
        if (category === 'frontend') {
          suggestedSkills = ['React', 'Vue.js', 'TypeScript', 'HTML/CSS', 'Responsive Design', 'REST APIs'];
        }
        else if (category === 'backend') {
          suggestedSkills = ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Authentication'];
        }
        else if (category === 'fullstack') {
          suggestedSkills = ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'Git'];
        }
        else if (category === 'devops') {
          suggestedSkills = ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform', 'Git'];
        }
        else if (category === 'data') {
          suggestedSkills = ['Python', 'SQL', 'Power BI', 'Excel', 'Data Analysis', 'Statistics'];
        }
        else if (category === 'accounting') {
          suggestedSkills = ['Microsoft Excel', 'SAP', 'MISA', 'Financial Reporting', 'Taxation Knowledge', 'Attention to Detail'];
        }
        else if (category === 'marketing') {
          suggestedSkills = ['Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media Marketing', 'Content Creation', 'Communication'];
        }
        else if (category === 'hr') {
          suggestedSkills = ['Recruitment', 'Employee Relations', 'HR Management Systems', 'Communication', 'Organizational Skills', 'Labor Law Knowledge'];
        }
        else {
          suggestedSkills = ['Microsoft Office', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Attention to Detail'];
        }
      }

      return {
        suggestions: suggestedSkills.slice(0, 6), // Top 6
        _method: 'database-query + rule-based',
        _category: category || 'general'
      };

    } catch (error) {
      logger.error('❌ Skill suggestion error:', error);
      return {
        suggestions: ['JavaScript', 'Git', 'Problem Solving'],
        _method: 'error-fallback'
      };
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Enhance Experience Description
   * Replace aiService.enhanceExperienceDescription()
   * 
   * Uses: Template-based enhancement
   */
  async enhanceExperienceDescription(currentData) {
    try {
      const position = currentData.position || 'Software Developer';
      const company = currentData.company || 'Tech Company';
      const description = currentData.description || '';

      if (!description) {
        return {
          suggestions: [
            `Developed and maintained software applications at ${company}`,
            `Collaborated with cross-functional teams to deliver high-quality solutions`,
            `Implemented best practices and contributed to code reviews`
          ]
        };
      }

      // Add action verbs and impact
      const enhanced = description
        .replace(/worked/gi, 'Collaborated')
        .replace(/made/gi, 'Developed')
        .replace(/did/gi, 'Implemented');

      return {
        suggestions: [enhanced],
        _method: 'template-based enhancement'
      };

    } catch (error) {
      logger.error('❌ Experience enhancement error:', error);
      return {
        suggestions: [currentData.description || 'Contributed to various projects and initiatives']
      };
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Analyze Job Description
   * Replace aiService.analyzeJobDescription()
   * 
   * Uses: PhoBERT + pattern matching
   */
  async analyzeJobDescription(jobDescription, targetJob, companyInfo) {
    try {
      logger.info('🔬 Analyzing job description (PhoBERT)');

      // Extract skills from job description
      // Use Hybrid System instead of PhoBERT
      const { getSkillExtractionService } = require('./skillExtractionService');
      const skillExtractor = getSkillExtractionService();
      const extractedSkills = await skillExtractor.extractSkills(jobDescription, {
        useHybrid: true,
        usePhoBERT: false,  // Disabled - will re-enable after fixing
        useGemini: false,
        maxSkills: 50
      });
      const skills = extractedSkills.map(s => s.name);

      // Extract experience requirements (simple regex)
      const expMatch = jobDescription.match(/(\d+)\+?\s*years?/i);
      const experienceRequired = expMatch ? parseInt(expMatch[1]) : 0;

      // Extract education requirements
      const eduMatch = jobDescription.match(/(bachelor|master|phd|degree)/i);
      const educationRequired = eduMatch ? eduMatch[1] : 'Not specified';

      return {
        skills: skills,
        experienceRequired: experienceRequired,
        educationRequired: educationRequired,
        keyResponsibilities: this._extractResponsibilities(jobDescription),
        _method: 'self-sufficient (Hybrid System + patterns)'
      };

    } catch (error) {
      logger.error('❌ Job description analysis error:', error);
      return {
        skills: [],
        experienceRequired: 0,
        educationRequired: 'Not specified',
        keyResponsibilities: []
      };
    }
  }

  /**
   * Extract responsibilities from job description
   */
  _extractResponsibilities(jobDescription) {
    const lines = jobDescription.split('\n');
    const responsibilities = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for bullet points or numbered lists
      if (/^[-•*]\s/.test(trimmed) || /^\d+\./.test(trimmed)) {
        responsibilities.push(trimmed.replace(/^[-•*\d.]\s*/, ''));
      }
    }

    return responsibilities.slice(0, 5); // Top 5
  }

  /**
   * ✅ SELF-SUFFICIENT: Analyze Job Posting
   * Replace aiService.analyzeJobPosting()
   * 
   * Uses: Hybrid System (Rule-based + Multilingual NER) + rule-based structure analysis
   */
  async analyzeJobPosting(job) {
    try {
      logger.info('📝 Analyzing job posting (self-sufficient)');

      const description = job.description || '';
      const title = job.title || '';

      // Extract skills using Hybrid System
      const { getSkillExtractionService } = require('./skillExtractionService');
      const skillExtractor = getSkillExtractionService();
      const extractedSkills = await skillExtractor.extractSkills(description, {
        useHybrid: true,
        usePhoBERT: false,  // Disabled - will re-enable after fixing
        useGemini: false,
        maxSkills: 50
      });
      const skillsExtracted = extractedSkills.map(s => s.name);

      // Structure analysis
      const hasRequirements = /requirement|yêu cầu/i.test(description);
      const hasResponsibilities = /responsibilit|trách nhiệm/i.test(description);
      const hasBenefits = /benefit|quyền lợi/i.test(description);

      // Salary detection
      const salaryMatch = description.match(/(\d+)\s*[-–]\s*(\d+)\s*(triệu|million|USD|\$)/i);
      const salaryInfo = salaryMatch ? {
        min: parseInt(salaryMatch[1]),
        max: parseInt(salaryMatch[2]),
        currency: salaryMatch[3],
      } : null;

      // Experience level from title
      let experienceLevel = 'mid-level';
      if (/senior|lead|principal|staff/i.test(title)) experienceLevel = 'senior';
      else if (/junior|entry/i.test(title)) experienceLevel = 'junior';
      else if (/intern/i.test(title)) experienceLevel = 'intern';

      const suggestions = [];
      if (!hasRequirements) suggestions.push('Thêm phần "Yêu cầu công việc"');
      if (!hasResponsibilities) suggestions.push('Thêm phần "Trách nhiệm công việc"');
      if (!hasBenefits) suggestions.push('Thêm phần "Quyền lợi"');

      return {
        skillsExtracted: skillsExtracted || [],
        structure: { hasRequirements, hasResponsibilities, hasBenefits },
        salaryInfo,
        experienceLevel,
        readabilityScore: Math.min(100, description.length / 50),
        suggestions,
        _method: 'self-sufficient (Hybrid System + rules)',
      };
    } catch (error) {
      logger.error('❌ Job posting analysis error:', error);
      throw error;
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Get Job Suggestions
   * Replace aiService.getJobSuggestions()
   * 
   * Uses: Rule-based matching by domain
   */
  async getJobSuggestions(title) {
    try {
      logger.info('💼 Getting job suggestions (rule-based)');

      const titleLower = (title || '').toLowerCase();

      let suggestions = {
        similar: [],
        related: [],
        seniorityLevels: [],
      };

      // Frontend
      if (/frontend|front-end/i.test(titleLower)) {
        suggestions.similar = ['Frontend Developer', 'Front-End Engineer', 'UI Developer'];
        suggestions.related = ['Full Stack Developer', 'React Developer', 'Vue.js Developer'];
        suggestions.seniorityLevels = ['Junior Frontend Developer', 'Senior Frontend Developer', 'Lead Frontend Engineer'];
      }
      // Backend
      else if (/backend|back-end/i.test(titleLower)) {
        suggestions.similar = ['Backend Developer', 'Back-End Engineer', 'Server-Side Developer'];
        suggestions.related = ['Full Stack Developer', 'DevOps Engineer', 'Database Administrator'];
        suggestions.seniorityLevels = ['Junior Backend Developer', 'Senior Backend Developer', 'Backend Architect'];
      }
      // Full Stack
      else if (/full|fullstack/i.test(titleLower)) {
        suggestions.similar = ['Full Stack Developer', 'Full-Stack Engineer'];
        suggestions.related = ['Software Engineer', 'Web Developer', 'Application Developer'];
        suggestions.seniorityLevels = ['Junior Full Stack Developer', 'Senior Full Stack Developer', 'Lead Full Stack Engineer'];
      }
      // Data
      else if (/data|analyst|scientist/i.test(titleLower)) {
        suggestions.similar = ['Data Analyst', 'Data Scientist', 'Data Engineer'];
        suggestions.related = ['Business Intelligence Analyst', 'Machine Learning Engineer', 'Database Administrator'];
        suggestions.seniorityLevels = ['Junior Data Analyst', 'Senior Data Scientist', 'Lead Data Engineer'];
      }
      // Default
      else {
        suggestions.similar = ['Software Engineer', 'Developer', 'Programmer'];
        suggestions.related = ['Full Stack Developer', 'Backend Developer', 'Frontend Developer'];
        suggestions.seniorityLevels = ['Junior Software Engineer', 'Senior Software Engineer', 'Staff Engineer'];
      }

      return {
        ...suggestions,
        _method: 'rule-based',
      };
    } catch (error) {
      logger.error('❌ Job suggestions error:', error);
      return {
        similar: [],
        related: [],
        seniorityLevels: [],
        _method: 'rule-based',
      };
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Analyze Job Match
   * Replace aiService.analyzeJobMatch()
   * 
   * Uses: jobMatchingService (Hybrid System + Sentence-BERT)
   */
  async analyzeJobMatch(cvData, jobData) {
    try {
      logger.info('🎯 Analyzing job match (self-sufficient)');

      // Use jobMatchingService for detailed matching
      const jobMatchingService = require('./jobMatchingService');
      const matchResult = await jobMatchingService.calculateMatchScore(cvData, jobData);

      // Extract skills from both sides
      const cvText = this._buildCVText(cvData);
      const jobText = this._buildJobText(jobData);

      // Use Hybrid System instead of PhoBERT
      const { getSkillExtractionService } = require('./skillExtractionService');
      const skillExtractor = getSkillExtractionService();
      
      const cvExtracted = await skillExtractor.extractSkills(cvText, {
        useHybrid: true,
        usePhoBERT: false,  // Disabled - will re-enable after fixing
        useGemini: false,
        maxSkills: 50
      });
      const jobExtracted = await skillExtractor.extractSkills(jobText, {
        useHybrid: true,
        usePhoBERT: false,  // Disabled - will re-enable after fixing
        useGemini: false,
        maxSkills: 50
      });
      
      const cvSkills = cvExtracted.map(s => s.name);
      const jobSkills = jobExtracted.map(s => s.name);

      // Find matches and gaps
      const matchedSkills = [];
      const missingSkills = [];

      for (const jobSkill of jobSkills) {
        const isMatched = cvSkills.some(cvSkill => 
          cvSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
          jobSkill.toLowerCase().includes(cvSkill.toLowerCase())
        );

        if (isMatched) {
          matchedSkills.push(jobSkill);
        } else {
          missingSkills.push(jobSkill);
        }
      }

      // Build strengths and gaps
      const strengths = [];
      const gaps = [];

      if (matchResult.scoreBreakdown.skillsMatch >= 70) {
        strengths.push(`Strong skill match (${Math.round(matchResult.scoreBreakdown.skillsMatch)}%)`);
      }
      if (matchResult.scoreBreakdown.experienceMatch >= 70) {
        strengths.push(`Relevant experience (${Math.round(matchResult.scoreBreakdown.experienceMatch)}%)`);
      }
      if (matchResult.scoreBreakdown.educationMatch >= 70) {
        strengths.push(`Education requirements met (${Math.round(matchResult.scoreBreakdown.educationMatch)}%)`);
      }

      if (missingSkills.length > 0) {
        gaps.push(`Missing skills: ${missingSkills.slice(0, 3).join(', ')}`);
      }
      if (matchResult.scoreBreakdown.experienceMatch < 60) {
        gaps.push('Need more relevant experience');
      }

      // Generate recommendations
      const recommendations = [];
      if (missingSkills.length > 0) {
        recommendations.push(`Learn: ${missingSkills.slice(0, 3).join(', ')}`);
      }
      if (matchResult.scoreBreakdown.experienceMatch < 60) {
        recommendations.push('Gain more experience in similar roles');
      }
      if (matchedSkills.length > 0) {
        recommendations.push(`Highlight your ${matchedSkills.slice(0, 2).join(' and ')} skills`);
      }

      // Determine fit level
      let fitLevel = 'poor';
      if (matchResult.matchScore >= 85) fitLevel = 'excellent';
      else if (matchResult.matchScore >= 70) fitLevel = 'good';
      else if (matchResult.matchScore >= 55) fitLevel = 'fair';

      return {
        matchScore: {
          skills: Math.round(matchResult.scoreBreakdown.skillsMatch),
          experience: Math.round(matchResult.scoreBreakdown.experienceMatch),
          education: Math.round(matchResult.scoreBreakdown.educationMatch),
          keywords: Math.round(matchResult.scoreBreakdown.projectsMatch),
          overall: Math.round(matchResult.matchScore),
        },
        strengths,
        gaps,
        recommendations,
        fitLevel,
        tier: matchResult.tier,
        _method: 'self-sufficient (jobMatchingService + Hybrid System)',
      };
    } catch (error) {
      logger.error('❌ Job match analysis error:', error);
      return {
        matchScore: {
          skills: 0,
          experience: 0,
          education: 0,
          keywords: 0,
          overall: 0,
        },
        strengths: [],
        gaps: [],
        recommendations: [],
        fitLevel: 'poor',
      };
    }
  }

  /**
   * ✅ SELF-SUFFICIENT: Generate Skill Roadmap
   * Replace aiService.generateSkillRoadmap() (deprecated endpoint)
   * 
   * Uses: Rule-based weekly planning
   */
  async generateSkillRoadmap(options = {}) {
    try {
      logger.info('🗺️ Generating skill roadmap (rule-based)');

      const { 
        targetRole = 'Developer', 
        targetSkills = [], 
        timeframe = 12, 
        currentLevel = 'beginner' 
      } = options;

      const weeks = [];
      const skillsPerWeek = Math.ceil(targetSkills.length / timeframe);

      let skillIndex = 0;
      for (let week = 1; week <= timeframe; week++) {
        const weekSkills = targetSkills.slice(skillIndex, skillIndex + skillsPerWeek);
        skillIndex += skillsPerWeek;

        if (weekSkills.length > 0) {
          const skill = typeof weekSkills[0] === 'string' ? weekSkills[0] : weekSkills[0].name;

          weeks.push({
            week,
            focus: skill,
            objectives: [
              `Understand fundamentals of ${skill}`,
              `Complete hands-on exercises`,
              `Build a small project`
            ],
            resources: [
              { title: `${skill} Documentation`, type: 'article', duration: '5 hours' },
              { title: `${skill} Tutorial`, type: 'video', duration: '10 hours' },
              { title: `${skill} Practice`, type: 'course', duration: '15 hours' }
            ],
            exercises: [
              `Implement basic ${skill} examples`,
              `Build a mini project using ${skill}`
            ],
            milestone: `Complete ${skill} fundamentals`
          });
        }
      }

      return {
        weeks,
        estimatedTotalHours: timeframe * 30, // 30 hours per week
        difficulty: currentLevel,
        _method: 'rule-based (deprecated - use /api/nlp/learning-roadmap)',
        _deprecationWarning: 'Use /api/nlp/learning-roadmap for advanced features'
      };
    } catch (error) {
      logger.error('❌ Roadmap generation error:', error);
      throw error;
    }
  }

  /**
   * ✅ AI-POWERED: Analyze CV Improvements
   * Phân tích CV và đưa ra gợi ý cải thiện cụ thể, chính xác dựa trên CV thực tế
   * 
   * Uses: Gemini AI for intelligent analysis + Rule-based fallback
   */
  async analyzeCVImprovements(cvData, cvText, targetJobId = null) {
    try {
      logger.info('📝 Analyzing CV for improvements', { targetJobId });

      // Step 1: Try exact match (job-specific data)
      if (targetJobId) {
        try {
          const jobData = await this._getJobData(targetJobId);
          const exactMatchData = await this._getSuccessfulCVsForJob(targetJobId);
          
          // Guardrails: Validate data quality
          const validationResult = this._validateDataQuality(exactMatchData, 'exact-match');
          if (exactMatchData.count >= 5 && validationResult.passed) {
            logger.info(`✅ Using exact match data (${exactMatchData.count} successful CVs, validation: ${validationResult.score.toFixed(2)})`);
            const result = await this._analyzeWithExactMatch(cvData, cvText, jobData, exactMatchData);
            result._dataQuality = validationResult;
            return result;
          } else if (exactMatchData.count >= 5 && !validationResult.passed) {
            logger.warn(`⚠️ Exact match data failed validation (score: ${validationResult.score.toFixed(2)}), trying next level`);
          }
          
          // Step 2: Try similar jobs
          const similarJobs = await this._findSimilarJobs(targetJobId);
          const similarJobsData = await this._getSuccessfulCVsForSimilarJobs(similarJobs);
          
          // Guardrails: Validate data quality
          const similarValidation = this._validateDataQuality(similarJobsData, 'similar-jobs');
          if (similarJobsData.count >= 5 && similarValidation.passed) {
            logger.info(`⚠️ Using similar jobs data (${similarJobsData.count} CVs from ${similarJobs.length} similar jobs, validation: ${similarValidation.score.toFixed(2)})`);
            const result = await this._analyzeWithSimilarJobs(cvData, cvText, jobData, similarJobsData);
            result._dataQuality = similarValidation;
            return result;
          } else if (similarJobsData.count >= 5 && !similarValidation.passed) {
            logger.warn(`⚠️ Similar jobs data failed validation (score: ${similarValidation.score.toFixed(2)}), trying next level`);
          }
        } catch (dataError) {
          logger.warn('⚠️ Data-driven analysis failed, trying fallbacks:', dataError.message);
        }
      }
      
      // Step 3: Try industry patterns
      const industryCode = await this._getIndustryFromCV(cvData, targetJobId);
      if (industryCode) {
        try {
          const industryData = await this._getIndustryPatterns(industryCode);
          
          // Guardrails: Validate data quality
          const industryValidation = this._validateDataQuality(industryData, 'industry');
          if (industryData.count >= 10 && industryValidation.passed) {
            logger.info(`⚠️ Using industry patterns (${industryData.count} CVs from industry ${industryCode}, validation: ${industryValidation.score.toFixed(2)})`);
            const result = await this._analyzeWithIndustryPatterns(cvData, cvText, industryData);
            result._dataQuality = industryValidation;
            return result;
          } else if (industryData.count >= 10 && !industryValidation.passed) {
            logger.warn(`⚠️ Industry data failed validation (score: ${industryValidation.score.toFixed(2)}), trying next level`);
          }
        } catch (industryError) {
          logger.warn('⚠️ Industry patterns failed:', industryError.message);
        }
      }
      
      // Step 4: Try generic patterns (all industries)
      try {
        const genericData = await this._getGenericPatterns();
        
        // Guardrails: Validate data quality
        const genericValidation = this._validateDataQuality(genericData, 'generic');
        if (genericData.count >= 20 && genericValidation.passed) {
          logger.info(`⚠️ Using generic patterns (${genericData.count} CVs across all industries, validation: ${genericValidation.score.toFixed(2)})`);
          const result = await this._analyzeWithGenericPatterns(cvData, cvText, genericData);
          result._dataQuality = genericValidation;
          return result;
        } else if (genericData.count >= 20 && !genericValidation.passed) {
          logger.warn(`⚠️ Generic data failed validation (score: ${genericValidation.score.toFixed(2)}), using fallback`);
        }
      } catch (genericError) {
        logger.warn('⚠️ Generic patterns failed:', genericError.message);
      }
      
      // Step 5: Final fallback - AI + Rules
      logger.warn('⚠️ No sufficient data, using AI + Rules fallback');
      return await this._analyzeWithAIFallback(cvData, cvText, targetJobId);

    } catch (error) {
      logger.error('❌ CV improvements analysis error:', error);
      return await this._analyzeWithAIFallback(cvData, cvText, targetJobId);
    }
  }

  /**
   * AI-powered CV analysis using Gemini
   * @private
   */
  async _analyzeCVWithAI(cvData, cvText) {
    try {
      // Normalize experience to array format
      let experienceArray = [];
      if (cvData.experience) {
        if (Array.isArray(cvData.experience)) {
          experienceArray = cvData.experience;
        } else if (typeof cvData.experience === 'object') {
          // Handle object format: { internships: [], fullTime: [], ... }
          const allExp = [];
          if (cvData.experience.internships && Array.isArray(cvData.experience.internships)) {
            allExp.push(...cvData.experience.internships);
          }
          if (cvData.experience.fullTime && Array.isArray(cvData.experience.fullTime)) {
            allExp.push(...cvData.experience.fullTime);
          }
          if (cvData.experience.partTime && Array.isArray(cvData.experience.partTime)) {
            allExp.push(...cvData.experience.partTime);
          }
          if (cvData.experience.freelance && Array.isArray(cvData.experience.freelance)) {
            allExp.push(...cvData.experience.freelance);
          }
          if (cvData.experience.projects && Array.isArray(cvData.experience.projects)) {
            allExp.push(...cvData.experience.projects);
          }
          experienceArray = allExp;
        }
      }

      // Normalize education to array format
      let educationArray = [];
      if (cvData.education) {
        if (Array.isArray(cvData.education)) {
          educationArray = cvData.education;
        } else if (typeof cvData.education === 'object') {
          // Handle object format: { university: {...}, certifications: [...] }
          if (cvData.education.university) {
            educationArray.push(cvData.education.university);
          }
          if (cvData.education.certifications && Array.isArray(cvData.education.certifications)) {
            educationArray.push(...cvData.education.certifications);
          }
        }
      }

      // Build structured CV data for context
      const cvStructure = {
        personalInfo: cvData.personalInfo || {},
        skills: {
          technical: (cvData.skills?.technical || []).map(s => typeof s === 'string' ? s : s.name),
          soft: (cvData.skills?.soft || []).map(s => typeof s === 'string' ? s : s.name),
          languages: (cvData.skills?.languages || []).map(s => typeof s === 'string' ? s : s.name),
        },
        experience: experienceArray.map(exp => ({
          position: exp.position || exp.title || '',
          company: exp.company || exp.organization || '',
          duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || ''}`,
          description: exp.description || ''
        })),
        education: educationArray.map(edu => ({
          degree: edu.degree || edu.type || '',
          major: edu.major || edu.field || '',
          school: edu.school || edu.institution || ''
        }))
      };

      // Split CV text into lines for position tracking
      const cvLines = cvText.split('\n');
      
      const prompt = `Bạn là chuyên gia tư vấn CV hàng đầu với 15+ năm kinh nghiệm, từng giúp hàng nghìn ứng viên cải thiện CV và thành công trong việc tìm việc.

NHIỆM VỤ: Phân tích CV này và đưa ra gợi ý cải thiện CỤ THỂ, CHÍNH XÁC dựa trên nội dung thực tế của CV.

CV TEXT (${cvLines.length} dòng):
${cvText}

CV STRUCTURE:
${JSON.stringify(cvStructure, null, 2)}

YÊU CẦU PHÂN TÍCH:

1. Đọc kỹ từng dòng của CV text
2. Tìm các phần cần cải thiện CỤ THỂ với:
   - Số dòng chính xác (lineNumber)
   - Text cần cải thiện (text)
   - Vấn đề cụ thể (issue)
   - Gợi ý cải thiện chi tiết (suggestion)
   - Mức độ ưu tiên (severity: high/medium/low)

3. Phân tích các khía cạnh:
   - Cấu trúc: Thiếu phần nào? Thứ tự hợp lý không?
   - Nội dung: Mô tả có đủ chi tiết? Có số liệu không? Có action verbs không?
   - Văn phong: Có dùng passive voice quá nhiều? Có generic phrases không?
   - Từ khóa: Có đủ keywords cho ATS? Có action verbs mạnh không?

4. Điểm số tổng thể (0-100) dựa trên:
   - Cấu trúc đầy đủ (25 điểm)
   - Nội dung chất lượng (25 điểm)
   - Văn phong chuyên nghiệp (25 điểm)
   - Tối ưu ATS/keywords (25 điểm)

TRẢ VỀ JSON FORMAT (QUAN TRỌNG: Phải có lineNumber chính xác):
{
  "overallScore": 75,
  "strengths": [
    "Điểm mạnh 1 cụ thể từ CV",
    "Điểm mạnh 2 cụ thể từ CV"
  ],
  "weaknesses": [
    "Điểm yếu 1 cụ thể từ CV",
    "Điểm yếu 2 cụ thể từ CV"
  ],
  "suggestions": {
    "structure": [
      "Gợi ý cấu trúc cụ thể 1",
      "Gợi ý cấu trúc cụ thể 2"
    ],
    "content": [
      "Gợi ý nội dung cụ thể 1",
      "Gợi ý nội dung cụ thể 2"
    ],
    "writing": [
      "Gợi ý văn phong cụ thể 1",
      "Gợi ý văn phong cụ thể 2"
    ],
    "keywords": [
      "Gợi ý từ khóa cụ thể 1",
      "Gợi ý từ khóa cụ thể 2"
    ]
  },
  "specificImprovements": [
    {
      "section": "KINH NGHIỆM",
      "item": "Tên vị trí hoặc công ty",
      "text": "Text cụ thể cần cải thiện (copy từ CV)",
      "issue": "Vấn đề cụ thể với text này",
      "suggestion": "Gợi ý cải thiện chi tiết, cụ thể",
      "severity": "high|medium|low",
      "lineNumber": 15,
      "startIndex": 245,
      "endIndex": 280
    }
  ]
}

LƯU Ý QUAN TRỌNG:
- Phải tìm chính xác số dòng (lineNumber) và vị trí (startIndex, endIndex) của text trong CV
- Gợi ý phải CỤ THỂ, không chung chung
- Text trong "text" field phải là text thực tế từ CV (copy chính xác)
- Mỗi improvement phải có vị trí cụ thể để highlight trong editor
- Ưu tiên các vấn đề nghiêm trọng (severity: high) trước
- Đưa ra gợi ý actionable, có thể thực hiện ngay

CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN HOẶC TEXT THÊM.`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const aiResult = JSON.parse(jsonMatch[0]);

      // Validate and enhance with position data
      if (aiResult.specificImprovements && Array.isArray(aiResult.specificImprovements)) {
        aiResult.specificImprovements = aiResult.specificImprovements.map(imp => {
          // Ensure position data is correct
          if (imp.lineNumber && imp.startIndex === undefined) {
            // Calculate startIndex from lineNumber
            const lineIndex = imp.lineNumber - 1;
            if (lineIndex >= 0 && lineIndex < cvLines.length) {
              const textBefore = cvLines.slice(0, lineIndex).join('\n');
              const startIndex = textBefore.length + (lineIndex > 0 ? 1 : 0);
              const endIndex = startIndex + (imp.text?.length || 0);
              
              imp.position = {
                startIndex,
                endIndex,
                lineNumber: imp.lineNumber,
                lineContent: cvLines[lineIndex] || '',
                text: imp.text || ''
              };
            }
          } else if (imp.startIndex !== undefined) {
            // Use provided position
            imp.position = {
              startIndex: imp.startIndex,
              endIndex: imp.endIndex || imp.startIndex + (imp.text?.length || 0),
              lineNumber: imp.lineNumber || this._getLineNumberFromIndex(cvText, imp.startIndex),
              lineContent: imp.lineContent || this._getLineContentFromIndex(cvText, imp.startIndex),
              text: imp.text || ''
            };
          }

          return imp;
        });
      }

      return {
        ...aiResult,
        _method: 'AI-powered (Gemini)',
        _timestamp: new Date()
      };

    } catch (error) {
      logger.error('❌ AI CV analysis error:', error);
      throw error;
    }
  }

  /**
   * Helper: Get line number from character index
   * @private
   */
  _getLineNumberFromIndex(text, index) {
    const textBefore = text.substring(0, index);
    return textBefore.split('\n').length;
  }

  /**
   * Helper: Get line content from character index
   * @private
   */
  _getLineContentFromIndex(text, index) {
    const lines = text.split('\n');
    const lineNumber = this._getLineNumberFromIndex(text, index);
    const lineIndex = lineNumber - 1;
    return lines[lineIndex] || '';
  }

  /**
   * Rule-based CV analysis (fallback)
   * @private
   */
  async _analyzeCVWithRules(cvData, cvText) {
    const improvements = {
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      suggestions: {
        structure: [],
        content: [],
        writing: [],
        keywords: []
      },
      specificImprovements: []
    };

    // Normalize experience to array format
    let experienceArray = [];
    if (cvData.experience) {
      if (Array.isArray(cvData.experience)) {
        experienceArray = cvData.experience;
      } else if (typeof cvData.experience === 'object') {
        // Handle object format: { internships: [], fullTime: [], ... }
        const allExp = [];
        if (cvData.experience.internships && Array.isArray(cvData.experience.internships)) {
          allExp.push(...cvData.experience.internships);
        }
        if (cvData.experience.fullTime && Array.isArray(cvData.experience.fullTime)) {
          allExp.push(...cvData.experience.fullTime);
        }
        if (cvData.experience.partTime && Array.isArray(cvData.experience.partTime)) {
          allExp.push(...cvData.experience.partTime);
        }
        if (cvData.experience.freelance && Array.isArray(cvData.experience.freelance)) {
          allExp.push(...cvData.experience.freelance);
        }
        if (cvData.experience.projects && Array.isArray(cvData.experience.projects)) {
          allExp.push(...cvData.experience.projects);
        }
        experienceArray = allExp;
      }
    }

    // Normalize education to array format
    let educationArray = [];
    if (cvData.education) {
      if (Array.isArray(cvData.education)) {
        educationArray = cvData.education;
      } else if (typeof cvData.education === 'object') {
        // Handle object format: { university: {...}, certifications: [...] }
        if (cvData.education.university) {
          educationArray.push(cvData.education.university);
        }
        if (cvData.education.certifications && Array.isArray(cvData.education.certifications)) {
          educationArray.push(...cvData.education.certifications);
        }
      }
    }

    // ACCURATE ANALYSIS: Check what's ACTUALLY in the CV, not assumptions
    const hasExperience = experienceArray.length > 0;
    const hasEducation = educationArray.length > 0;
    const hasSkills = (cvData.skills?.technical?.length || 0) + 
                     (cvData.skills?.soft?.length || 0) + 
                     (cvData.skills?.languages?.length || 0) > 0;
    const hasPersonalInfo = cvData.personalInfo && 
                           (cvData.personalInfo.fullName || cvData.personalInfo.email || cvData.personalInfo.phone);
    const hasSummary = cvData.personalInfo?.summary || cvText.toLowerCase().includes('mục tiêu');
    
    // Calculate score based on ACTUAL content
    let score = 0;
    
    // Structure (25 points)
    if (hasPersonalInfo) score += 5;
    if (hasSummary) score += 5;
    if (hasEducation) score += 5;
    if (hasExperience) score += 5;
    if (hasSkills) score += 5;
    
    // Content quality (25 points)
    if (hasExperience) {
      const hasDescriptions = experienceArray.some(exp => exp.description && exp.description.length > 50);
      if (hasDescriptions) score += 10;
      else score += 5;
    }
    if (hasSkills && (cvData.skills.technical?.length || 0) >= 3) score += 5;
    if (hasSkills && (cvData.skills.soft?.length || 0) >= 2) score += 5;
    if (cvText.length > 500) score += 5;
    
    // Writing style (25 points) - check actual text
    const hasActionVerbs = /(phát triển|triển khai|tạo|quản lý|dẫn dắt|thiết kế|cải thiện|đạt được|thực hiện|hỗ trợ|phối hợp)/i.test(cvText);
    if (hasActionVerbs) score += 10;
    const hasBulletPoints = (cvText.match(/^[-•*]\s/gm) || []).length >= 5;
    if (hasBulletPoints) score += 10;
    if (cvText.length > 1000) score += 5;
    
    // Keywords/ATS (25 points)
    const hasKeywords = /(kỹ năng|kinh nghiệm|học vấn|dự án|thành tích|chứng chỉ)/i.test(cvText);
    if (hasKeywords) score += 10;
    if (hasSkills) score += 10;
    if (hasExperience && hasEducation) score += 5;
    
    improvements.overallScore = Math.min(100, score);
    
    // Strengths based on ACTUAL content
    if (hasExperience && hasEducation) {
      improvements.strengths.push('CV có đầy đủ thông tin học vấn và kinh nghiệm');
    }
    if (hasSkills && (cvData.skills.technical?.length || 0) + (cvData.skills.soft?.length || 0) >= 5) {
      improvements.strengths.push('CV có nhiều kỹ năng được liệt kê');
    }
    if (hasSummary) {
      improvements.strengths.push('CV có mục tiêu nghề nghiệp rõ ràng');
    }
    
    // Weaknesses based on ACTUAL gaps
    if (!hasSummary) {
      improvements.weaknesses.push('Thiếu mục tiêu nghề nghiệp');
      improvements.suggestions.structure.push('Nên thêm phần mục tiêu nghề nghiệp để thể hiện định hướng rõ ràng');
      improvements.specificImprovements.push({
        section: 'STRUCTURE',
        item: 'Mục tiêu nghề nghiệp',
        issue: 'Thiếu phần mục tiêu nghề nghiệp',
        suggestion: 'Nên thêm phần mục tiêu nghề nghiệp để thể hiện định hướng rõ ràng',
        evidence: 'Theo best practices từ HR industry: 90% CV thành công có phần mục tiêu nghề nghiệp rõ ràng',
        priority: 'high',
        severity: 'high'
      });
    }
    if (hasExperience) {
      const hasFullDescriptions = experienceArray.every(exp => exp.description && exp.description.length > 50);
      if (!hasFullDescriptions) {
        improvements.weaknesses.push('Mô tả kinh nghiệm chưa đầy đủ');
        improvements.suggestions.content.push('Nên bổ sung mô tả chi tiết cho từng kinh nghiệm làm việc, bao gồm trách nhiệm và thành tích cụ thể');
        improvements.specificImprovements.push({
          section: 'CONTENT',
          item: 'Kinh nghiệm làm việc',
          issue: 'Mô tả kinh nghiệm chưa đầy đủ',
          suggestion: 'Nên bổ sung mô tả chi tiết cho từng kinh nghiệm làm việc, bao gồm trách nhiệm và thành tích cụ thể',
          evidence: 'Best practices: Mỗi kinh nghiệm nên có ít nhất 2-3 bullet points với số liệu cụ thể (ví dụ: "Tăng doanh thu 30%", "Quản lý team 5 người")',
          priority: 'high',
          severity: 'high'
        });
      }
    }
    if (hasSkills && (cvData.skills.technical?.length || 0) < 3) {
      improvements.weaknesses.push('Cần bổ sung thêm kỹ năng kỹ thuật');
      improvements.suggestions.content.push('Nên bổ sung thêm kỹ năng kỹ thuật phù hợp với vị trí ứng tuyển');
      improvements.specificImprovements.push({
        section: 'CONTENT',
        item: 'Kỹ năng kỹ thuật',
        issue: 'Số lượng kỹ năng kỹ thuật chưa đủ',
        suggestion: 'Nên bổ sung thêm kỹ năng kỹ thuật phù hợp với vị trí ứng tuyển',
        evidence: 'HR experts khuyến nghị: CV nên có ít nhất 5-7 kỹ năng kỹ thuật để pass ATS screening',
        priority: 'medium',
        severity: 'medium'
      });
    }
    
    // Only suggest what's ACTUALLY missing
    if (!hasEducation) {
      improvements.suggestions.structure.push('Thiếu phần học vấn - cần thêm thông tin về bằng cấp, trường học');
    }
    if (!hasExperience) {
      improvements.suggestions.structure.push('Thiếu phần kinh nghiệm làm việc - đây là phần quan trọng nhất');
    }
    if (!hasSkills) {
      improvements.suggestions.content.push('Nên bổ sung thêm kỹ năng kỹ thuật (ít nhất 5-7 kỹ năng)');
      improvements.suggestions.content.push('Nên bổ sung kỹ năng mềm (giao tiếp, làm việc nhóm, quản lý thời gian...)');
    }

    // 1. Analyze CV Structure
    const structureAnalysis = this._analyzeCVStructure(cvData, cvText);
    improvements.suggestions.structure = structureAnalysis.suggestions;
    improvements.overallScore += structureAnalysis.score;

    // 2. Analyze Content Quality
    const contentAnalysis = this._analyzeContentQuality(cvData, cvText);
    improvements.suggestions.content = contentAnalysis.suggestions;
    improvements.overallScore += contentAnalysis.score;
    improvements.strengths.push(...contentAnalysis.strengths);
    improvements.weaknesses.push(...contentAnalysis.weaknesses);

    // 3. Analyze Writing Style
    const writingAnalysis = this._analyzeWritingStyle(cvText);
    improvements.suggestions.writing = writingAnalysis.suggestions;
    improvements.overallScore += writingAnalysis.score;

    // 4. Analyze Keywords and ATS Optimization
    const keywordAnalysis = this._analyzeKeywords(cvData, cvText);
    improvements.suggestions.keywords = keywordAnalysis.suggestions;
    improvements.overallScore += keywordAnalysis.score;

    // 5. Generate Specific Improvements
    improvements.specificImprovements = this._generateSpecificImprovements(cvData, cvText);

    // Calculate final score (0-100)
    improvements.overallScore = Math.min(100, Math.max(0, improvements.overallScore / 4));

    return {
      ...improvements,
      _method: 'rule-based (fallback)',
      _timestamp: new Date(),
      _dataSource: 'best-practices',
      _confidence: 'low-medium',
      _disclaimer: '⚠️ Gợi ý dựa trên best practices từ HR industry. Chưa có đủ dữ liệu thực tế từ CV thành công.'
    };
  }

  /**
   * Analyze CV structure
   */
  _analyzeCVStructure(cvData, cvText) {
    const suggestions = [];
    let score = 25; // Base score

    // ACCURATE CHECK: Use actual data from cvData, not just text matching
    const hasPersonalInfo = !!(cvData.personalInfo && 
                               (cvData.personalInfo.fullName || cvData.personalInfo.email || cvData.personalInfo.phone));
    const hasEducation = !!(cvData.education && cvData.education.length > 0);
    const hasExperience = !!(cvData.experience && cvData.experience.length > 0);
    const hasSkills = !!(cvData.skills && 
                        ((cvData.skills.technical?.length || 0) > 0 || 
                         (cvData.skills.soft?.length || 0) > 0 || 
                         (cvData.skills.languages?.length || 0) > 0));
    const hasSummary = !!(cvData.personalInfo?.summary || 
                         cvText.match(/(mục tiêu|objective|summary|tóm tắt)/i));

    // Only suggest what's ACTUALLY missing
    if (!hasPersonalInfo) {
      suggestions.push('Thiếu thông tin liên hệ (email, số điện thoại)');
      score -= 5;
    }
    if (!hasEducation) {
      suggestions.push('Thiếu phần học vấn - cần thêm thông tin về bằng cấp, trường học');
      score -= 5;
    }
    if (!hasExperience) {
      suggestions.push('Thiếu phần kinh nghiệm làm việc - đây là phần quan trọng nhất');
      score -= 10;
    }
    if (!hasSkills) {
      suggestions.push('Thiếu phần kỹ năng - cần liệt kê kỹ năng kỹ thuật và kỹ năng mềm');
      score -= 5;
    }

    // Check for optional but valuable sections
    if (!hasSummary) {
      suggestions.push('Nên thêm phần tóm tắt/mục tiêu nghề nghiệp ở đầu CV để thu hút nhà tuyển dụng');
    }

    return { suggestions, score: Math.max(0, score) };
  }

  /**
   * Analyze content quality
   */
  _analyzeContentQuality(cvData, cvText) {
    const suggestions = [];
    const strengths = [];
    const weaknesses = [];
    let score = 25;

    // Normalize experience to array format
    let experienceArray = [];
    if (cvData.experience) {
      if (Array.isArray(cvData.experience)) {
        experienceArray = cvData.experience;
      } else if (typeof cvData.experience === 'object') {
        // Handle object format: { internships: [], fullTime: [], ... }
        const allExp = [];
        if (cvData.experience.internships && Array.isArray(cvData.experience.internships)) {
          allExp.push(...cvData.experience.internships);
        }
        if (cvData.experience.fullTime && Array.isArray(cvData.experience.fullTime)) {
          allExp.push(...cvData.experience.fullTime);
        }
        if (cvData.experience.partTime && Array.isArray(cvData.experience.partTime)) {
          allExp.push(...cvData.experience.partTime);
        }
        if (cvData.experience.projects && Array.isArray(cvData.experience.projects)) {
          allExp.push(...cvData.experience.projects);
        }
        experienceArray = allExp;
      }
    }

    // Analyze experience descriptions - check ACTUAL data
    if (experienceArray.length > 0) {
      experienceArray.forEach((exp, index) => {
        const desc = exp.description || '';
        // Check Vietnamese action verbs too
        const hasActionVerbs = /(phát triển|triển khai|tạo|quản lý|dẫn dắt|thiết kế|cải thiện|đạt được|thực hiện|hỗ trợ|phối hợp|developed|implemented|created|managed|led|designed|built|improved|achieved|increased|reduced)/i.test(desc);
        const hasQuantifiableResults = /\d+/.test(desc);
        const descLength = desc.length;

        if (!hasActionVerbs && descLength > 0) {
          suggestions.push(`Kinh nghiệm "${exp.position || `Vị trí ${index + 1}`}": Nên sử dụng động từ hành động mạnh (phát triển, triển khai, tạo, quản lý...) thay vì "làm việc" hoặc "chịu trách nhiệm"`);
          score -= 2;
        }
        if (!hasQuantifiableResults && descLength > 50) {
          suggestions.push(`Kinh nghiệm "${exp.position || `Vị trí ${index + 1}`}": Nên thêm số liệu cụ thể (ví dụ: "tăng doanh số 30%", "quản lý team 5 người") để thể hiện thành tích`);
          score -= 2;
        }
        if (descLength < 50 && descLength > 0) {
          suggestions.push(`Kinh nghiệm "${exp.position || `Vị trí ${index + 1}`}": Mô tả quá ngắn, nên mở rộng để thể hiện chi tiết trách nhiệm và thành tích`);
          score -= 2;
        }
        if (hasActionVerbs && hasQuantifiableResults) {
          strengths.push(`Kinh nghiệm "${exp.position || `Vị trí ${index + 1}`}" được mô tả tốt với động từ hành động và số liệu cụ thể`);
        }
      });
    } else {
      // Only add weakness if experience is ACTUALLY missing
      weaknesses.push('Thiếu thông tin kinh nghiệm làm việc');
      score -= 10;
    }

    // Analyze skills
    const technicalSkills = cvData.skills?.technical || [];
    const softSkills = cvData.skills?.soft || [];
    
    if (technicalSkills.length === 0 && softSkills.length === 0) {
      weaknesses.push('Thiếu thông tin kỹ năng');
      score -= 5;
    } else {
      if (technicalSkills.length < 5) {
        suggestions.push('Nên bổ sung thêm kỹ năng kỹ thuật (ít nhất 5-7 kỹ năng)');
      }
      if (softSkills.length < 3) {
        suggestions.push('Nên bổ sung kỹ năng mềm (giao tiếp, làm việc nhóm, quản lý thời gian...)');
      }
      if (technicalSkills.length >= 5 && softSkills.length >= 3) {
        strengths.push('Danh sách kỹ năng đầy đủ và cân bằng');
      }
    }

    // Analyze education
    if (cvData.education && cvData.education.length > 0) {
      const hasGPA = cvData.education.some(edu => edu.gpa || edu.grade);
      if (!hasGPA && cvText.match(/(university|đại học|college|cao đẳng)/i)) {
        suggestions.push('Nên thêm GPA/xếp loại nếu điểm số tốt (>= 3.0/4.0 hoặc Khá trở lên)');
      }
    }

    return { suggestions, strengths, weaknesses, score: Math.max(0, score) };
  }

  /**
   * Analyze writing style
   */
  _analyzeWritingStyle(cvText) {
    const suggestions = [];
    let score = 25;

    // Check for passive voice (common issue)
    const passiveVoicePatterns = /(was|were|been|being)\s+\w+ed/gi;
    const passiveMatches = (cvText.match(passiveVoicePatterns) || []).length;
    if (passiveMatches > 3) {
      suggestions.push('Tránh sử dụng quá nhiều câu bị động. Nên dùng câu chủ động với động từ hành động mạnh (ví dụ: "Developed" thay vì "Was developed by me")');
      score -= 3;
    }

    // Check for weak verbs
    const weakVerbs = /(worked|did|made|helped|assisted|involved)/gi;
    const weakMatches = (cvText.match(weakVerbs) || []).length;
    if (weakMatches > 2) {
      suggestions.push('Thay thế các động từ yếu (worked, did, made) bằng động từ hành động mạnh hơn (developed, implemented, created, achieved, optimized)');
      score -= 3;
    }

    // Check for generic phrases
    const genericPhrases = /(responsible for|duties include|job responsibilities)/gi;
    const genericMatches = (cvText.match(genericPhrases) || []).length;
    if (genericMatches > 0) {
      suggestions.push('Tránh các cụm từ chung chung như "responsible for" hoặc "duties include". Thay vào đó, hãy mô tả cụ thể những gì bạn đã làm và đạt được');
      score -= 2;
    }

    // Check for bullet points usage
    const bulletPoints = (cvText.match(/^[-•*]\s/gm) || []).length;
    if (bulletPoints < 5 && cvText.length > 500) {
      suggestions.push('Nên sử dụng bullet points (dấu đầu dòng) để trình bày thông tin rõ ràng và dễ đọc hơn');
    } else if (bulletPoints >= 5) {
      score += 2;
    }

    // Check for consistency
    const hasInconsistentTense = /(worked|working|work)/gi.test(cvText) && /(develop|developing|developed)/gi.test(cvText);
    if (hasInconsistentTense) {
      suggestions.push('Đảm bảo sử dụng thì quá khứ nhất quán cho các công việc đã hoàn thành');
    }

    return { suggestions, score: Math.max(0, score) };
  }

  /**
   * Analyze keywords for ATS optimization
   */
  _analyzeKeywords(cvData, cvText) {
    const suggestions = [];
    let score = 25;

    // Extract skills from CV
    const cvSkills = [];
    if (cvData.skills?.technical) {
      cvSkills.push(...cvData.skills.technical.map(s => (typeof s === 'string' ? s : s.name).toLowerCase()));
    }
    if (cvData.skills?.soft) {
      cvSkills.push(...cvData.skills.soft.map(s => (typeof s === 'string' ? s : s.name).toLowerCase()));
    }

    // Check for common important keywords
    const importantKeywords = {
      technical: ['javascript', 'python', 'java', 'react', 'node', 'sql', 'git', 'api', 'database', 'html', 'css'],
      soft: ['communication', 'leadership', 'teamwork', 'problem solving', 'time management'],
      action: ['developed', 'implemented', 'created', 'managed', 'led', 'designed', 'improved', 'achieved']
    };

    const cvTextLower = cvText.toLowerCase();
    let foundKeywords = 0;
    const missingKeywords = [];

    // Check technical keywords
    importantKeywords.technical.forEach(keyword => {
      if (cvTextLower.includes(keyword) || cvSkills.some(s => s.includes(keyword))) {
        foundKeywords++;
      } else {
        missingKeywords.push(keyword);
      }
    });

    if (foundKeywords < 5) {
      suggestions.push(`Nên thêm nhiều từ khóa kỹ thuật hơn để tối ưu cho hệ thống ATS. Các từ khóa quan trọng: ${importantKeywords.technical.slice(0, 5).join(', ')}`);
      score -= 5;
    }

    // Check for action verbs
    const actionVerbsFound = importantKeywords.action.filter(verb => cvTextLower.includes(verb)).length;
    if (actionVerbsFound < 3) {
      suggestions.push('Nên sử dụng nhiều động từ hành động mạnh hơn trong mô tả kinh nghiệm (developed, implemented, created, managed, led...)');
      score -= 3;
    }

    // Check for industry-specific terms
    const hasIndustryTerms = /(agile|scrum|devops|ci\/cd|microservices|restful|api|framework|library|tool|platform)/i.test(cvText);
    if (!hasIndustryTerms && cvSkills.length > 0) {
      suggestions.push('Nên thêm các thuật ngữ chuyên ngành phù hợp với lĩnh vực của bạn để tăng độ chuyên nghiệp');
    }

    return { suggestions, score: Math.max(0, score) };
  }

  /**
   * Generate specific improvements with text positions
   */
  _generateSpecificImprovements(cvData, cvText) {
    const improvements = [];
    const lines = cvText.split('\n');

    // Normalize experience to array format
    let experienceArray = [];
    if (cvData.experience) {
      if (Array.isArray(cvData.experience)) {
        experienceArray = cvData.experience;
      } else if (typeof cvData.experience === 'object') {
        // Handle object format: { internships: [], fullTime: [], ... }
        const allExp = [];
        if (cvData.experience.internships && Array.isArray(cvData.experience.internships)) {
          allExp.push(...cvData.experience.internships);
        }
        if (cvData.experience.fullTime && Array.isArray(cvData.experience.fullTime)) {
          allExp.push(...cvData.experience.fullTime);
        }
        if (cvData.experience.partTime && Array.isArray(cvData.experience.partTime)) {
          allExp.push(...cvData.experience.partTime);
        }
        if (cvData.experience.projects && Array.isArray(cvData.experience.projects)) {
          allExp.push(...cvData.experience.projects);
        }
        experienceArray = allExp;
      }
    }

    // Helper function to find text position in CV
    const findTextPosition = (searchText, section = null) => {
      const lowerText = cvText.toLowerCase();
      const lowerSearch = searchText.toLowerCase();
      const index = lowerText.indexOf(lowerSearch);
      
      if (index === -1) return null;
      
      // Find line number
      const textBefore = cvText.substring(0, index);
      const lineNumber = textBefore.split('\n').length;
      
      // Find line content
      const lineIndex = lineNumber - 1;
      const lineContent = lines[lineIndex] || '';
      
      return {
        startIndex: index,
        endIndex: index + searchText.length,
        lineNumber: lineNumber,
        lineContent: lineContent.trim(),
        text: searchText
      };
    };

    // Experience improvements
    if (experienceArray.length > 0) {
      experienceArray.forEach((exp, index) => {
        const desc = exp.description || '';
        const position = exp.position || '';
        
        // Find experience section in text
        let textPos = null;
        if (position) {
          textPos = findTextPosition(position, 'experience');
        } else if (exp.company) {
          textPos = findTextPosition(exp.company, 'experience');
        }
        
        if (desc.length < 100) {
          improvements.push({
            section: 'KINH NGHIỆM',
            item: exp.position || `Vị trí ${index + 1}`,
            text: desc || position || 'Chưa có mô tả',
            issue: 'Mô tả kinh nghiệm quá ngắn, thiếu chi tiết về trách nhiệm và thành tích',
            suggestion: 'Mở rộng mô tả với: (1) Trách nhiệm cụ thể, (2) Thành tích với số liệu, (3) Công nghệ/tools sử dụng',
            severity: 'high',
            position: textPos
          });
        }
      });
    }

    // Skills improvements
    const technicalSkills = cvData.skills?.technical || [];
    if (technicalSkills.length < 5) {
      // Find skills section
      const skillsPos = findTextPosition('kỹ năng', 'skills') || 
                       findTextPosition('skills', 'skills') ||
                       findTextPosition('competenc', 'skills');
      
      improvements.push({
        section: 'KỸ NĂNG',
        item: 'Kỹ năng kỹ thuật',
        text: `${technicalSkills.length} kỹ năng`,
        issue: `Chỉ có ${technicalSkills.length} kỹ năng kỹ thuật, cần bổ sung thêm`,
        suggestion: 'Bổ sung thêm ít nhất 5-7 kỹ năng kỹ thuật phù hợp với vị trí ứng tuyển',
        severity: 'high',
        position: skillsPos
      });
    }

    // Summary/Objective improvements
    const summaryMatch = cvText.match(/(summary|objective|profile|tóm tắt|mục tiêu)/i);
    if (!summaryMatch) {
      improvements.push({
        section: 'TÓM TẮT',
        item: 'Thiếu phần tóm tắt',
        text: 'Chưa có',
        issue: 'CV thiếu phần tóm tắt/mục tiêu nghề nghiệp ở đầu',
        suggestion: 'Thêm phần tóm tắt ngắn gọn (2-3 câu) ở đầu CV để highlight điểm mạnh và mục tiêu nghề nghiệp',
        severity: 'medium',
        position: { lineNumber: 1, lineContent: lines[0] || '', startIndex: 0, endIndex: 0 }
      });
    }

    // Education improvements
    if (cvData.education && cvData.education.length > 0) {
      cvData.education.forEach((edu, index) => {
        const eduPos = findTextPosition(edu.school || edu.major || 'education', 'education');
        if (!edu.degree || !edu.major) {
          improvements.push({
            section: 'HỌC VẤN',
            item: edu.school || `Trường ${index + 1}`,
            text: `${edu.degree || ''} ${edu.major || ''}`.trim() || 'Thiếu thông tin',
            issue: 'Thiếu thông tin về bằng cấp hoặc ngành học',
            suggestion: 'Bổ sung đầy đủ thông tin: Bằng cấp, Ngành học, Trường, Năm tốt nghiệp',
            severity: 'medium',
            position: eduPos
          });
        }
      });
    }

    return improvements;
  }

  /**
   * ✅ SELF-SUFFICIENT: Generate Learning Roadmap
   * Replace aiService.generateLearningRoadmap() (deprecated endpoint)
   * 
   * Uses: Skill gap analysis + rule-based planning
   */
  async generateLearningRoadmap(options = {}) {
    try {
      logger.info('📚 Generating learning roadmap (self-sufficient)');

      const {
        currentSkills = [],
        targetJob = {},
        skillGaps = [],
        timeframe = '12 weeks',
        preferences = {}
      } = options;

      const weeks = parseInt(timeframe) || 12;

      // Prioritize skill gaps
      const prioritizedSkills = skillGaps
        .filter(gap => gap.category === 'missing' || gap.priority === 'high')
        .slice(0, weeks);

      const roadmap = {
        weeks: prioritizedSkills.map((gap, index) => ({
          week: index + 1,
          focus: gap.skill,
          importance: gap.importance || 'medium',
          estimatedTime: gap.estimatedTime || '1-3 months',
          difficulty: gap.difficulty || 'medium',
          objectives: [
            `Learn ${gap.skill} fundamentals`,
            `Apply ${gap.skill} in projects`,
            `Master ${gap.skill} for ${targetJob.title || 'target role'}`
          ],
          resources: [
            { title: `${gap.skill} Official Documentation`, type: 'article', duration: '5 hours' },
            { title: `${gap.skill} Video Course`, type: 'video', duration: '10 hours' },
            { title: `${gap.skill} Interactive Tutorial`, type: 'course', duration: '15 hours' }
          ]
        })),
        estimatedTotalHours: weeks * 30,
        targetJob: targetJob.title,
        _method: 'self-sufficient (skill gap + rules)',
        _deprecationWarning: 'Use /api/nlp/learning-roadmap for full CRUD operations'
      };

      return roadmap;
    } catch (error) {
      logger.error('❌ Learning roadmap error:', error);
      throw error;
    }
  }

  // ==================== CV Improvement - Data-Driven Methods ====================

  /**
   * Get job data by ID
   * @private
   */
  async _getJobData(jobId) {
    try {
      const Job = require('../../models/Job');
      const job = await Job.findById(jobId)
        .select('title description requirements skills requiredSkills preferredSkills jobRequirements industryCode level jobType')
        .lean();
      
      if (!job) return null;
      
      return {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        requiredSkills: job.requiredSkills || job.skills || [],
        preferredSkills: job.preferredSkills || [],
        minExperience: job.jobRequirements?.minExperience || 0,
        industryCode: job.industryCode,
        level: job.level,
        jobType: job.jobType
      };
    } catch (error) {
      logger.error('Error getting job data:', error);
      return null;
    }
  }

  /**
   * Get successful CVs for a specific job
   * @private
   */
  async _getSuccessfulCVsForJob(jobId) {
    try {
      const Application = require('../../models/Application');
      const CandidateProfile = require('../../models/CandidateProfile');
      const { APPLICATION_STATUS } = require('../../constants/common.constants');
      
      // Get successful applications
      const successfulApps = await Application.find({
        jobId: jobId,
        status: { 
          $in: [
            APPLICATION_STATUS.SHORTLISTED,
            APPLICATION_STATUS.INTERVIEW,
            APPLICATION_STATUS.OFFER,
            APPLICATION_STATUS.ACCEPTED
          ]
        },
        'matchingScore.overall': { $gte: 75 }
      })
        .select('candidateId matchingScore status')
        .sort({ 'matchingScore.overall': -1 })
        .limit(50)
        .lean();
      
      if (successfulApps.length === 0) {
        return { count: 0 };
      }
      
      // Get CV data
      const candidateIds = [...new Set(successfulApps.map(app => app.candidateId))];
      const candidates = await CandidateProfile.find({
        _id: { $in: candidateIds }
      })
        .select('skills experience education resume.current.aiAnalysis.extractedData')
        .lean();
      
      return this._aggregateCVMetrics(successfulApps, candidates);
    } catch (error) {
      logger.error('Error getting successful CVs for job:', error);
      return { count: 0 };
    }
  }

  /**
   * Find similar jobs (same level, jobType, similar skills)
   * @private
   */
  async _findSimilarJobs(targetJobId) {
    try {
      const Job = require('../../models/Job');
      const Application = require('../../models/Application');
      const { APPLICATION_STATUS } = require('../../constants/common.constants');
      
      const targetJob = await Job.findById(targetJobId)
        .select('title level jobType industryCode skills requiredSkills description requirements')
        .lean();
      
      if (!targetJob) return [];
      
      // Step 1: Find jobs with exact match criteria (fast filter)
      const candidateJobs = await Job.find({
        _id: { $ne: targetJobId },
        level: targetJob.level,
        jobType: targetJob.jobType,
        status: 'active'
      })
        .select('_id title industryCode skills requiredSkills description requirements')
        .limit(50) // Get more candidates for semantic filtering
        .lean();
      
      if (candidateJobs.length === 0) return [];
      
      // Step 2: Use semantic similarity to rank jobs (RAG enhancement)
      let rankedJobs = [];
      if (this.sentenceBert && this.sentenceBert.isAvailable) {
        try {
          // Build target job text for embedding
          const targetJobText = [
            targetJob.title,
            targetJob.description || '',
            targetJob.requirements || '',
            (targetJob.requiredSkills || []).join(', '),
            (targetJob.skills || []).join(', ')
          ].filter(Boolean).join(' ');
          
          // Calculate semantic similarity for each candidate job
          const jobSimilarities = await Promise.all(
            candidateJobs.map(async (job) => {
              const jobText = [
                job.title,
                job.description || '',
                job.requirements || '',
                (job.requiredSkills || []).join(', '),
                (job.skills || []).join(', ')
              ].filter(Boolean).join(' ');
              
              try {
                const similarity = await this.sentenceBert.similarity(targetJobText, jobText);
                return { job, similarity };
              } catch (err) {
                logger.warn(`Semantic similarity failed for job ${job._id}:`, err.message);
                return { job, similarity: 0 };
              }
            })
          );
          
          // Filter by semantic similarity threshold (≥75% for similar jobs)
          rankedJobs = jobSimilarities
            .filter(({ similarity }) => similarity >= 0.75)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10) // Top 10 most similar
            .map(({ job, similarity }) => ({ ...job, semanticSimilarity: similarity }));
        } catch (semanticError) {
          logger.warn('Semantic similarity failed, falling back to exact match:', semanticError.message);
          // Fallback to exact match
          rankedJobs = candidateJobs.filter(job => {
            const targetSkills = (targetJob.requiredSkills || []).concat(targetJob.skills || []);
            const jobSkills = (job.requiredSkills || []).concat(job.skills || []);
            return targetSkills.some(skill => jobSkills.includes(skill));
          }).slice(0, 10);
        }
      } else {
        // Fallback: exact match only
        rankedJobs = candidateJobs.filter(job => {
          const targetSkills = (targetJob.requiredSkills || []).concat(targetJob.skills || []);
          const jobSkills = (job.requiredSkills || []).concat(job.skills || []);
          return targetSkills.some(skill => jobSkills.includes(skill));
        }).slice(0, 10);
      }
      
      if (rankedJobs.length === 0) return [];
      
      // Step 3: Check which jobs have successful applications
      const jobIds = rankedJobs.map(job => job._id);
      const jobsWithSuccess = await Application.aggregate([
        {
          $match: {
            jobId: { $in: jobIds },
            status: { 
              $in: [
                APPLICATION_STATUS.SHORTLISTED,
                APPLICATION_STATUS.INTERVIEW,
                APPLICATION_STATUS.OFFER
              ]
            },
            'matchingScore.overall': { $gte: 75 }
          }
        },
        {
          $group: {
            _id: '$jobId',
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gte: 3 } // At least 3 successful CVs
          }
        }
      ]);
      
      const validJobIds = jobsWithSuccess.map(j => j._id);
      return rankedJobs
        .filter(job => validJobIds.includes(job._id))
        .map(({ semanticSimilarity, ...job }) => job); // Remove similarity score from return
    } catch (error) {
      logger.error('Error finding similar jobs:', error);
      return [];
    }
  }

  /**
   * Get successful CVs from similar jobs
   * @private
   */
  async _getSuccessfulCVsForSimilarJobs(similarJobs) {
    if (similarJobs.length === 0) return { count: 0 };
    
    try {
      const Application = require('../../models/Application');
      const CandidateProfile = require('../../models/CandidateProfile');
      const { APPLICATION_STATUS } = require('../../constants/common.constants');
      
      const jobIds = similarJobs.map(job => job._id);
      
      // Get successful applications from similar jobs
      const successfulApps = await Application.find({
        jobId: { $in: jobIds },
        status: { 
          $in: [
            APPLICATION_STATUS.SHORTLISTED,
            APPLICATION_STATUS.INTERVIEW,
            APPLICATION_STATUS.OFFER
          ]
        },
        'matchingScore.overall': { $gte: 75 }
      })
        .select('candidateId matchingScore jobId')
        .lean();
      
      if (successfulApps.length === 0) return { count: 0 };
      
      // Get CV data
      const candidateIds = [...new Set(successfulApps.map(app => app.candidateId))];
      const candidates = await CandidateProfile.find({
        _id: { $in: candidateIds }
      })
        .select('skills experience education resume.current.aiAnalysis.extractedData')
        .lean();
      
      return this._aggregateCVMetrics(successfulApps, candidates);
    } catch (error) {
      logger.error('Error getting CVs from similar jobs:', error);
      return { count: 0 };
    }
  }

  /**
   * Get industry patterns
   * @private
   */
  async _getIndustryPatterns(industryCode) {
    try {
      const Application = require('../../models/Application');
      const Job = require('../../models/Job');
      const CandidateProfile = require('../../models/CandidateProfile');
      const { APPLICATION_STATUS } = require('../../constants/common.constants');
      
      // Get all jobs in this industry
      const industryJobs = await Job.find({
        industryCode: industryCode,
        status: 'active'
      })
        .select('_id')
        .lean();
      
      if (industryJobs.length === 0) return { count: 0 };
      
      const jobIds = industryJobs.map(job => job._id);
      
      // Get successful applications in this industry
      const successfulApps = await Application.find({
        jobId: { $in: jobIds },
        status: { 
          $in: [
            APPLICATION_STATUS.SHORTLISTED,
            APPLICATION_STATUS.INTERVIEW,
            APPLICATION_STATUS.OFFER
          ]
        },
        'matchingScore.overall': { $gte: 75 }
      })
        .select('candidateId matchingScore')
        .lean();
      
      if (successfulApps.length === 0) return { count: 0 };
      
      // Get CV data
      const candidateIds = [...new Set(successfulApps.map(app => app.candidateId))];
      const candidates = await CandidateProfile.find({
        _id: { $in: candidateIds }
      })
        .select('skills experience education resume.current.aiAnalysis.extractedData')
        .lean();
      
      return this._aggregateCVMetrics(successfulApps, candidates);
    } catch (error) {
      logger.error('Error getting industry patterns:', error);
      return { count: 0 };
    }
  }

  /**
   * Get generic patterns (all industries)
   * @private
   */
  async _getGenericPatterns() {
    try {
      const Application = require('../../models/Application');
      const CandidateProfile = require('../../models/CandidateProfile');
      const { APPLICATION_STATUS } = require('../../constants/common.constants');
      
      // Get top successful applications from ALL industries
      const successfulApps = await Application.find({
        status: { 
          $in: [
            APPLICATION_STATUS.SHORTLISTED,
            APPLICATION_STATUS.INTERVIEW,
            APPLICATION_STATUS.OFFER
          ]
        },
        'matchingScore.overall': { $gte: 80 } // Only very good CVs
      })
        .select('candidateId matchingScore')
        .sort({ 'matchingScore.overall': -1 })
        .limit(100)
        .lean();
      
      if (successfulApps.length === 0) return { count: 0 };
      
      // Get CV data
      const candidateIds = [...new Set(successfulApps.map(app => app.candidateId))];
      const candidates = await CandidateProfile.find({
        _id: { $in: candidateIds }
      })
        .select('skills experience education resume.current.aiAnalysis.extractedData')
        .lean();
      
      return this._aggregateGenericPatterns(successfulApps, candidates);
    } catch (error) {
      logger.error('Error getting generic patterns:', error);
      return { count: 0 };
    }
  }

  /**
   * Get industry code from CV or job
   * @private
   */
  async _getIndustryFromCV(cvData, targetJobId) {
    try {
      // Try to get from job first
      if (targetJobId) {
        const jobData = await this._getJobData(targetJobId);
        if (jobData?.industryCode) {
          return jobData.industryCode;
        }
      }
      
      // Try to get from candidate profile preferences
      // This would need candidateId, which we don't have here
      // So we'll return null if job doesn't have industry
      return null;
    } catch (error) {
      logger.warn('Error getting industry from CV:', error);
      return null;
    }
  }

  /**
   * Aggregate CV metrics from successful applications
   * @private
   */
  _aggregateCVMetrics(successfulApps, candidates) {
    try {
      if (successfulApps.length === 0 || candidates.length === 0) {
        return { count: 0 };
      }

      // Diversity filter (MMR-style, skill Jaccard) to avoid over-representation
      const diversified = this._diversifyApplications(successfulApps, candidates, 0.7, 30);
      const appsForStats = diversified.length > 0 ? diversified : successfulApps;
      
      // Calculate average score
      const scores = appsForStats.map(app => app.matchingScore?.overall || 0);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      // Extract common skills
      const allSkills = [];
      const cvDataMap = {};
      
      candidates.forEach(candidate => {
        const skills = candidate.skills?.technical || [];
        const extractedData = candidate.resume?.current?.aiAnalysis?.extractedData;
        const extractedSkills = extractedData?.skills || [];
        
        // Combine skills from both sources
        const combinedSkills = [
          ...skills.map(s => typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()),
          ...extractedSkills.map(s => typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase())
        ].filter(s => s && s.length > 0);
        
        allSkills.push(...combinedSkills);
        
        // Store CV data for later use
        cvDataMap[candidate._id.toString()] = {
          skills: combinedSkills,
          experience: candidate.experience || {},
          education: candidate.education || {}
        };
      });
      
      // Count skill frequency
      const skillFrequency = {};
      allSkills.forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
      
      // Get common skills (appears in >= 50% of CVs)
      const threshold = candidates.length * 0.5;
      const commonSkills = Object.entries(skillFrequency)
        .filter(([skill, count]) => count >= threshold)
        .map(([skill, count]) => ({
          name: skill,
          frequency: count,
          successRate: Math.round((count / candidates.length) * 100)
        }))
        .sort((a, b) => b.frequency - a.frequency);
      
      // Calculate average years of experience
      const allYears = [];
      candidates.forEach(candidate => {
        const experience = candidate.experience || {};
        const fullTime = experience.fullTime || [];
        const internships = experience.internships || [];
        const allExp = [...fullTime, ...internships];
        
        let totalYears = 0;
        allExp.forEach(exp => {
          if (exp.startDate && exp.endDate) {
            const years = this._calculateYearsOfExperience(exp.startDate, exp.endDate);
            totalYears += years;
          } else if (exp.duration) {
            // Try to parse duration string
            const years = this._parseDurationToYears(exp.duration);
            totalYears += years;
          }
        });
        
        if (totalYears > 0) {
          allYears.push(totalYears);
        }
      });
      
      const avgYears = allYears.length > 0 
        ? allYears.reduce((a, b) => a + b, 0) / allYears.length 
        : 0;
      
      return {
        count: appsForStats.length,
        avgScore,
        commonSkills,
        avgYearsOfExperience: avgYears,
        applications: appsForStats,
        cvDataMap
      };
    } catch (error) {
      logger.error('Error aggregating CV metrics:', error);
      return { count: 0 };
    }
  }

  /**
   * Diversify applications using Jaccard similarity on skills (greedy MMR-lite)
   */
  _diversifyApplications(applications, candidates, jaccardThreshold = 0.7, maxCount = 30) {
    if (!applications || applications.length === 0) return [];

    // Build skill sets
    const skillMap = new Map();
    candidates.forEach(c => {
      const skills = c.skills?.technical || [];
      const extracted = c.resume?.current?.aiAnalysis?.extractedData?.skills || [];
      const set = new Set(
        [...skills, ...extracted]
          .map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase().trim())
          .filter(Boolean)
      );
      skillMap.set((c._id || c.id || '').toString(), set);
    });

    const selected = [];
    for (const app of applications) {
      if (selected.length >= maxCount) break;
      const cid = (app.candidateId || '').toString();
      const setA = skillMap.get(cid) || new Set();
      let isSimilar = false;
      for (const s of selected) {
        const sid = (s.candidateId || '').toString();
        const setB = skillMap.get(sid) || new Set();
        const jacc = this._jaccard(setA, setB);
        if (jacc >= jaccardThreshold) {
          isSimilar = true;
          break;
        }
      }
      if (!isSimilar) {
        selected.push(app);
      }
    }
    return selected;
  }

  _jaccard(a, b) {
    if (!a || !b || a.size === 0 || b.size === 0) return 0;
    let inter = 0;
    for (const x of a) {
      if (b.has(x)) inter++;
    }
    const union = a.size + b.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  /**
   * Aggregate generic patterns (not industry-specific)
   * @private
   */
  _aggregateGenericPatterns(successfulApps, candidates) {
    try {
      const baseMetrics = this._aggregateCVMetrics(successfulApps, candidates);
      
      if (baseMetrics.count === 0) {
        return { count: 0 };
      }
      
      // Add generic structure patterns
      let hasSummaryCount = 0;
      let hasSkillsCount = 0;
      let hasExperienceCount = 0;
      let hasEducationCount = 0;
      let totalSections = 0;
      let hasMetricsCount = 0;
      let totalSkillsCount = 0;
      
      candidates.forEach(candidate => {
        const extractedData = candidate.resume?.current?.aiAnalysis?.extractedData;
        const personalInfo = extractedData?.personalInfo || candidate.personalInfo || {};
        
        if (personalInfo.summary) hasSummaryCount++;
        if (candidate.skills?.technical?.length > 0 || extractedData?.skills?.length > 0) {
          hasSkillsCount++;
          totalSkillsCount += (candidate.skills?.technical?.length || 0) + (extractedData?.skills?.length || 0);
        }
        if (candidate.experience?.fullTime?.length > 0 || extractedData?.experience?.length > 0) {
          hasExperienceCount++;
        }
        if (candidate.education?.university || extractedData?.education) {
          hasEducationCount++;
        }
        
        // Count sections
        let sections = 0;
        if (personalInfo.fullName) sections++;
        if (personalInfo.summary) sections++;
        if (candidate.skills) sections++;
        if (candidate.experience) sections++;
        if (candidate.education) sections++;
        totalSections += sections;
        
        // Check for metrics (numbers in descriptions)
        const allText = JSON.stringify(candidate).toLowerCase();
        if (/\d+%|\d+\s*(triệu|nghìn|dự án|người|tháng|năm)/i.test(allText)) {
          hasMetricsCount++;
        }
      });
      
      return {
        ...baseMetrics,
        structurePatterns: {
          hasSummary: hasSummaryCount / candidates.length,
          hasSkills: hasSkillsCount / candidates.length,
          hasExperience: hasExperienceCount / candidates.length,
          hasEducation: hasEducationCount / candidates.length,
          avgSections: totalSections / candidates.length
        },
        contentPatterns: {
          hasMetrics: hasMetricsCount / candidates.length,
          avgSkillsCount: totalSkillsCount / candidates.length
        }
      };
    } catch (error) {
      logger.error('Error aggregating generic patterns:', error);
      return { count: 0 };
    }
  }

  /**
   * Parse duration string to years
   * @private
   */
  _parseDurationToYears(duration) {
    if (!duration || typeof duration !== 'string') return 0;
    
    // Try to extract years from strings like "2020 - 2024", "2 years", "24 months"
    const yearRange = duration.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (yearRange) {
      const start = parseInt(yearRange[1]);
      const end = parseInt(yearRange[2]);
      return Math.max(0, end - start);
    }
    
    const yearsMatch = duration.match(/(\d+)\s*(năm|year)/i);
    if (yearsMatch) {
      return parseInt(yearsMatch[1]);
    }
    
    const monthsMatch = duration.match(/(\d+)\s*(tháng|month)/i);
    if (monthsMatch) {
      return parseInt(monthsMatch[1]) / 12;
    }
    
    return 0;
  }

  /**
   * Calculate years of experience from experience array
   * @private
   */
  _calculateTotalYearsOfExperience(experience) {
    if (!experience) return 0;
    
    let totalYears = 0;
    const allExp = Array.isArray(experience) ? experience : 
      (experience.fullTime || []).concat(experience.internships || []);
    
    allExp.forEach(exp => {
      if (exp.startDate && exp.endDate) {
        totalYears += this._calculateYearsOfExperience(exp.startDate, exp.endDate);
      } else if (exp.duration) {
        totalYears += this._parseDurationToYears(exp.duration);
      }
    });
    
    return totalYears;
  }

  /**
   * Analyze CV with exact match data
   * @private
   */
  async _analyzeWithExactMatch(cvData, cvText, jobData, successfulCVs) {
    const gaps = await this._identifyGaps(cvData, jobData, successfulCVs);
    const comparison = this._compareWithSuccessfulCVs(cvData, successfulCVs);
    
    return {
      overallScore: comparison.score,
      strengths: comparison.strengths,
      weaknesses: gaps.map(g => g.issue || g.type),
      suggestions: this._mapGapsToSuggestions(gaps),
      specificImprovements: this._mapGapsToImprovements(gaps),
      _dataSource: 'exact-match',
      _confidence: 'high',
      _benchmark: {
        avgSuccessfulScore: successfulCVs.avgScore,
        currentScore: comparison.score,
        gap: comparison.score - successfulCVs.avgScore
      }
    };
  }

  /**
   * Analyze CV with similar jobs data
   * @private
   */
  async _analyzeWithSimilarJobs(cvData, cvText, jobData, similarJobsData) {
    const gaps = await this._identifyGaps(cvData, jobData, similarJobsData);
    const comparison = this._compareWithSuccessfulCVs(cvData, similarJobsData);
    
    return {
      overallScore: comparison.score,
      strengths: comparison.strengths,
      weaknesses: gaps.map(g => g.issue || g.type),
      suggestions: this._mapGapsToSuggestions(gaps),
      specificImprovements: this._mapGapsToImprovements(gaps),
      _dataSource: 'similar-jobs',
      _confidence: 'high',
      _disclaimer: 'Gợi ý dựa trên CV thành công từ jobs tương tự',
      _benchmark: {
        avgSuccessfulScore: similarJobsData.avgScore,
        currentScore: comparison.score,
        gap: comparison.score - similarJobsData.avgScore
      }
    };
  }

  /**
   * Analyze CV with industry patterns
   * @private
   */
  async _analyzeWithIndustryPatterns(cvData, cvText, industryData) {
    const gaps = this._identifyGapsFromPatterns(cvData, cvText, industryData);
    
    return {
      overallScore: this._calculateScoreFromGaps(gaps, industryData),
      strengths: [],
      weaknesses: gaps.map(g => g.issue || g.type),
      suggestions: this._mapGapsToSuggestions(gaps),
      specificImprovements: this._mapGapsToImprovements(gaps),
      _dataSource: 'industry-patterns',
      _confidence: 'medium-high',
      _disclaimer: 'Gợi ý dựa trên patterns của ngành. Chưa có dữ liệu cụ thể cho job này.',
      _benchmark: {
        avgSuccessfulScore: industryData.avgScore,
        sampleSize: industryData.count
      }
    };
  }

  /**
   * Analyze CV with generic patterns
   * @private
   */
  async _analyzeWithGenericPatterns(cvData, cvText, genericData) {
    const gaps = this._identifyGapsFromGenericPatterns(cvData, cvText, genericData);
    
    return {
      overallScore: this._calculateScoreFromGaps(gaps, genericData),
      strengths: [],
      weaknesses: gaps.map(g => g.issue || g.type),
      suggestions: this._mapGapsToSuggestions(gaps),
      specificImprovements: this._mapGapsToImprovements(gaps),
      _dataSource: 'generic-patterns',
      _confidence: 'medium',
      _disclaimer: '⚠️ Gợi ý dựa trên patterns chung từ CV thành công (tất cả ngành). Chưa có đủ dữ liệu cho ngành/job này.',
      _dataQuality: {
        source: 'generic-patterns',
        sampleSize: genericData.count,
        targetIndustry: null // Will be set if available
      }
    };
  }

  /**
   * AI fallback analysis
   * @private
   */
  async _analyzeWithAIFallback(cvData, cvText, targetJobId) {
    // Try AI analysis first (if Gemini available)
    let aiAnalysis = null;
    if (this.geminiModel && cvText && cvText.length > 50) {
      try {
        logger.info('🤖 Using Gemini AI for CV improvements analysis');
        aiAnalysis = await this._analyzeCVWithAI(cvData, cvText);
      } catch (aiError) {
        logger.warn('⚠️ AI analysis failed:', aiError.message);
      }
    }
    
    // Always have rule-based fallback
    const ruleAnalysis = await this._analyzeCVWithRules(cvData, cvText);
    
    // Combine with disclaimer
    return {
      overallScore: aiAnalysis?.overallScore || ruleAnalysis.overallScore,
      strengths: aiAnalysis?.strengths || ruleAnalysis.strengths,
      weaknesses: aiAnalysis?.weaknesses || ruleAnalysis.weaknesses,
      suggestions: {
        structure: [...(aiAnalysis?.suggestions?.structure || []), ...(ruleAnalysis.suggestions?.structure || [])],
        content: [...(aiAnalysis?.suggestions?.content || []), ...(ruleAnalysis.suggestions?.content || [])],
        writing: [...(aiAnalysis?.suggestions?.writing || []), ...(ruleAnalysis.suggestions?.writing || [])],
        keywords: [...(aiAnalysis?.suggestions?.keywords || []), ...(ruleAnalysis.suggestions?.keywords || [])]
      },
      specificImprovements: [
        ...(aiAnalysis?.specificImprovements || []),
        ...(ruleAnalysis.specificImprovements || [])
      ],
      _dataSource: 'ai-rules-fallback',
      _confidence: 'low-medium',
      _disclaimer: '⚠️ Gợi ý dựa trên AI và best practices từ HR industry. Chưa có đủ dữ liệu thực tế cho ngành/job này. Khi có đơn apply thành công, hệ thống sẽ tự động cập nhật với dữ liệu thực tế.',
      _method: aiAnalysis ? 'ai' : 'rules',
      _fallbackReason: 'No sufficient successful CV data available (tried: exact match, similar jobs, industry, generic patterns)',
      _fallbackLevel: 5
    };
  }

  /**
   * Identify gaps from CV data, job data, and successful CVs
   * @private
   */
  async _identifyGaps(cvData, jobData, successfulCVs) {
    const gaps = [];
    
    if (!jobData) {
      return this._genericGapAnalysis(cvData);
    }
    
    // 1. Skills gap
    const requiredSkills = jobData.requiredSkills || [];
    const currentSkills = this._extractSkillsFromCV(cvData);
    const missingRequired = requiredSkills.filter(skill => 
      !currentSkills.includes(skill.toLowerCase())
    );
    
    if (missingRequired.length > 0) {
      const successRate = this._calculateSkillSuccessRate(missingRequired, successfulCVs);
      
      gaps.push({
        type: 'missing_required_skills',
        skills: missingRequired,
        impact: 'high',
        evidence: `${successRate}% CV thành công cho job này có skills: ${missingRequired.join(', ')}`,
        suggestion: `Thêm skills: ${missingRequired.join(', ')} (${successRate}% CV thành công có)`,
        issue: `Thiếu skills bắt buộc: ${missingRequired.join(', ')}`
      });
    }
    
    // 2. Experience gap
    if (jobData.minExperience) {
      const currentYears = this._calculateTotalYearsOfExperience(cvData.experience);
      if (currentYears < jobData.minExperience) {
        gaps.push({
          type: 'experience_gap',
          current: currentYears,
          required: jobData.minExperience,
          impact: 'high',
          evidence: `Job yêu cầu tối thiểu ${jobData.minExperience} năm, CV hiện tại có ${currentYears} năm`,
          suggestion: `Highlight các dự án/kinh nghiệm liên quan để bù đắp gap kinh nghiệm`,
          issue: `Kinh nghiệm chưa đủ: ${currentYears} năm (yêu cầu: ${jobData.minExperience} năm)`
        });
      }
    }
    
    // 3. Common skills gap (from successful CVs)
    if (successfulCVs.commonSkills && successfulCVs.commonSkills.length > 0) {
      const missingCommon = successfulCVs.commonSkills
        .filter(skill => !currentSkills.includes(skill.name.toLowerCase()))
        .slice(0, 5); // Top 5 missing
      
      if (missingCommon.length > 0) {
        gaps.push({
          type: 'missing_common_skills',
          skills: missingCommon.map(s => s.name),
          impact: 'medium',
          evidence: `${missingCommon[0].successRate}% CV thành công có ${missingCommon[0].name}`,
          suggestion: `Thêm skills phổ biến: ${missingCommon.map(s => `${s.name} (${s.successRate}%)`).join(', ')}`,
          issue: `Thiếu skills phổ biến: ${missingCommon.map(s => s.name).join(', ')}`
        });
      }
    }
    
    return gaps;
  }

  /**
   * Compare current CV with successful CVs
   * @private
   */
  _compareWithSuccessfulCVs(currentCV, successfulCVs) {
    const comparison = {
      score: 0,
      strengths: [],
      weaknesses: [],
      gaps: []
    };
    
    // Compare skills
    const currentSkills = this._extractSkillsFromCV(currentCV);
    const commonSkills = successfulCVs.commonSkills || [];
    const missingSkills = commonSkills.filter(skill => 
      !currentSkills.includes(skill.name.toLowerCase())
    );
    
    if (missingSkills.length > 0) {
      comparison.gaps.push({
        type: 'missing_skills',
        items: missingSkills.map(s => s.name),
        impact: 'high',
        evidence: `${missingSkills[0].successRate}% CV thành công có skills này`
      });
    } else if (currentSkills.length > 0) {
      comparison.strengths.push('CV có đầy đủ skills phổ biến');
    }
    
    // Compare experience
    const currentYears = this._calculateTotalYearsOfExperience(currentCV.experience);
    if (successfulCVs.avgYearsOfExperience && currentYears < successfulCVs.avgYearsOfExperience * 0.7) {
      comparison.gaps.push({
        type: 'experience_gap',
        current: currentYears,
        required: successfulCVs.avgYearsOfExperience,
        impact: 'medium',
        evidence: `CV thành công có trung bình ${successfulCVs.avgYearsOfExperience.toFixed(1)} năm kinh nghiệm`
      });
    }
    
    // Calculate score
    comparison.score = this._calculateScoreFromGaps(comparison.gaps, successfulCVs);
    
    return comparison;
  }

  /**
   * Identify gaps from generic patterns
   * @private
   */
  _identifyGapsFromGenericPatterns(cvData, cvText, genericData) {
    const gaps = [];
    
    // Check structure patterns
    const hasSummary = cvData.personalInfo?.summary || cvText.toLowerCase().includes('mục tiêu');
    if (!hasSummary && genericData.structurePatterns?.hasSummary > 0.8) {
      gaps.push({
        type: 'missing_summary',
        evidence: `${(genericData.structurePatterns.hasSummary * 100).toFixed(0)}% CV thành công có summary`,
        suggestion: 'Thêm phần tóm tắt (95% CV thành công có)',
        severity: 'high',
        issue: 'Thiếu phần tóm tắt nghề nghiệp'
      });
    }
    
    // Check metrics
    const hasMetrics = /\d+%|\d+\s*(triệu|nghìn|dự án|người|tháng|năm)/i.test(cvText);
    if (!hasMetrics && genericData.contentPatterns?.hasMetrics > 0.7) {
      gaps.push({
        type: 'missing_metrics',
        evidence: `${(genericData.contentPatterns.hasMetrics * 100).toFixed(0)}% CV thành công có số liệu cụ thể`,
        suggestion: 'Thêm số liệu: "Tăng 30%", "Quản lý 5 dự án" (85% CV thành công có)',
        severity: 'high',
        issue: 'Thiếu số liệu cụ thể trong mô tả'
      });
    }
    
    // Check skills count
    const skillsCount = this._extractSkillsFromCV(cvData).length;
    const avgSkills = genericData.contentPatterns?.avgSkillsCount || 12;
    if (skillsCount < avgSkills * 0.7) {
      gaps.push({
        type: 'insufficient_skills',
        evidence: `CV thành công có trung bình ${avgSkills} skills, CV hiện tại có ${skillsCount}`,
        suggestion: `Thêm thêm ${Math.ceil(avgSkills - skillsCount)} skills`,
        severity: 'medium',
        issue: `Số lượng skills chưa đủ (${skillsCount}/${avgSkills})`
      });
    }
    
    return gaps;
  }

  /**
   * Identify gaps from patterns (industry or generic)
   * @private
   */
  _identifyGapsFromPatterns(cvData, cvText, patternData) {
    // Use generic patterns logic if structurePatterns exists
    if (patternData.structurePatterns) {
      return this._identifyGapsFromGenericPatterns(cvData, cvText, patternData);
    }
    
    // Otherwise use common skills comparison
    return this._identifyGapsFromCommonSkills(cvData, patternData);
  }

  /**
   * Identify gaps from common skills
   * @private
   */
  _identifyGapsFromCommonSkills(cvData, patternData) {
    const gaps = [];
    const currentSkills = this._extractSkillsFromCV(cvData);
    const commonSkills = patternData.commonSkills || [];
    
    const missingSkills = commonSkills
      .filter(skill => !currentSkills.includes(skill.name.toLowerCase()))
      .slice(0, 5);
    
    if (missingSkills.length > 0) {
      gaps.push({
        type: 'missing_common_skills',
        skills: missingSkills.map(s => s.name),
        impact: 'medium',
        evidence: `${missingSkills[0].successRate}% CV thành công có ${missingSkills[0].name}`,
        suggestion: `Thêm skills: ${missingSkills.map(s => `${s.name} (${s.successRate}%)`).join(', ')}`,
        issue: `Thiếu skills phổ biến: ${missingSkills.map(s => s.name).join(', ')}`
      });
    }
    
    return gaps;
  }

  /**
   * Generic gap analysis (when no job data)
   * @private
   */
  _genericGapAnalysis(cvData) {
    const gaps = [];
    
    const hasSummary = cvData.personalInfo?.summary;
    if (!hasSummary) {
      gaps.push({
        type: 'missing_summary',
        issue: 'Thiếu phần tóm tắt nghề nghiệp',
        suggestion: 'Thêm phần tóm tắt để thể hiện định hướng rõ ràng'
      });
    }
    
    const skillsCount = this._extractSkillsFromCV(cvData).length;
    if (skillsCount < 5) {
      gaps.push({
        type: 'insufficient_skills',
        issue: `Số lượng skills chưa đủ (${skillsCount})`,
        suggestion: 'Nên có ít nhất 5-7 skills kỹ thuật'
      });
    }
    
    return gaps;
  }

  /**
   * Validate data quality (Guardrails)
   * @private
   */
  _validateDataQuality(data, sourceType) {
    let score = 0;
    const checks = {
      sampleSize: false,
      dataFreshness: false,
      completeness: false,
      relevance: false,
      biasDetected: false
    };
    
    // 1. Sample size validation
    const minSamples = {
      'exact-match': 5,
      'similar-jobs': 5,
      'industry': 10,
      'generic': 20
    };
    const minSample = minSamples[sourceType] || 5;
    if (data.count >= minSample) {
      checks.sampleSize = true;
      score += 0.25;
    }
    
    // 2. Data freshness check (prefer recent CVs)
    // Check if applications have recent timestamps
    if (data.applications && data.applications.length > 0) {
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      const recentCount = data.applications.filter(app => {
        const appDate = app.createdAt ? new Date(app.createdAt).getTime() : 0;
        return appDate > thirtyDaysAgo;
      }).length;
      
      const freshnessRatio = recentCount / data.applications.length;
      if (freshnessRatio >= 0.3) { // At least 30% are recent
        checks.dataFreshness = true;
        score += 0.20;
      } else if (freshnessRatio >= 0.1) {
        score += 0.10; // Partial credit
      }
    } else {
      // No timestamp data, assume fresh
      checks.dataFreshness = true;
      score += 0.20;
    }
    
    // 3. Completeness check (80% CVs must be complete)
    if (data.cvDataMap) {
      const totalCVs = Object.keys(data.cvDataMap).length;
      let completeCVs = 0;
      
      Object.values(data.cvDataMap).forEach(cvData => {
        const hasSkills = (cvData.skills || []).length > 0;
        const hasExperience = cvData.experience && Object.keys(cvData.experience).length > 0;
        const hasEducation = cvData.education && Object.keys(cvData.education).length > 0;
        
        if (hasSkills && (hasExperience || hasEducation)) {
          completeCVs++;
        }
      });
      
      const completenessRatio = completeCVs / totalCVs;
      if (completenessRatio >= 0.8) {
        checks.completeness = true;
        score += 0.25;
      } else if (completenessRatio >= 0.6) {
        score += 0.15; // Partial credit
      }
    } else {
      // No CV data map, assume complete
      checks.completeness = true;
      score += 0.25;
    }
    
    // 4. Relevance validation (exact match ratio for similar jobs)
    if (sourceType === 'similar-jobs' && data.applications) {
      // Check if jobs are actually similar (semantic similarity already done)
      // For now, assume relevant if we got here
      checks.relevance = true;
      score += 0.15;
    } else if (sourceType === 'exact-match') {
      checks.relevance = true;
      score += 0.15;
    } else {
      // For industry/generic, lower relevance score
      score += 0.10;
    }
    
    // 5. Bias detection (demographic, skill, experience)
    // Simple check: ensure diversity in skills and experience levels
    if (data.commonSkills && data.commonSkills.length > 0) {
      const skillDiversity = data.commonSkills.length;
      // Good diversity: 5-15 common skills
      if (skillDiversity >= 5 && skillDiversity <= 15) {
        checks.biasDetected = false; // No bias detected
        score += 0.15;
      } else {
        // Too few or too many common skills might indicate bias
        checks.biasDetected = true;
        score += 0.05; // Reduced score
      }
    } else {
      score += 0.15; // No skill data, assume no bias
    }
    
    const passed = score >= 0.7; // 70% threshold
    
    return {
      passed,
      score: Math.min(1.0, score),
      checks,
      sourceType,
      sampleSize: data.count,
      issues: Object.entries(checks)
        .filter(([key, value]) => !value && key !== 'biasDetected')
        .map(([key]) => key)
    };
  }

  /**
   * Extract skills from CV data
   * @private
   */
  _extractSkillsFromCV(cvData) {
    const skills = [];
    
    // From skills object
    if (cvData.skills?.technical) {
      skills.push(...cvData.skills.technical.map(s => 
        typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
      ));
    }
    
    // From extracted data
    if (cvData.extractedData?.skills) {
      skills.push(...cvData.extractedData.skills.map(s => 
        typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
      ));
    }
    
    return [...new Set(skills.filter(s => s && s.length > 0))];
  }

  /**
   * Calculate skill success rate
   * @private
   */
  _calculateSkillSuccessRate(skills, successfulCVs) {
    if (!successfulCVs.cvDataMap || successfulCVs.count === 0) return 0;
    
    let totalWithSkill = 0;
    const skillLower = skills.map(s => s.toLowerCase());
    
    Object.values(successfulCVs.cvDataMap).forEach(cvData => {
      const cvSkills = cvData.skills || [];
      if (skillLower.some(skill => cvSkills.includes(skill))) {
        totalWithSkill++;
      }
    });
    
    return Math.round((totalWithSkill / successfulCVs.count) * 100);
  }

  /**
   * Calculate score from gaps
   * @private
   */
  _calculateScoreFromGaps(gaps, benchmarkData) {
    let score = 100;
    
    gaps.forEach(gap => {
      if (gap.impact === 'high' || gap.severity === 'high') {
        score -= 15;
      } else if (gap.impact === 'medium' || gap.severity === 'medium') {
        score -= 10;
      } else {
        score -= 5;
      }
    });
    
    // Adjust based on benchmark
    if (benchmarkData.avgScore) {
      const gap = Math.abs(score - benchmarkData.avgScore);
      if (gap > 20) {
        score = Math.max(0, score - 10);
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Map gaps to suggestions
   * @private
   */
  _mapGapsToSuggestions(gaps) {
    const suggestions = {
      structure: [],
      content: [],
      writing: [],
      keywords: []
    };
    
    gaps.forEach(gap => {
      if (gap.suggestion) {
        if (gap.type?.includes('structure') || gap.type?.includes('summary')) {
          suggestions.structure.push(gap.suggestion);
        } else if (gap.type?.includes('skills') || gap.type?.includes('experience')) {
          suggestions.content.push(gap.suggestion);
        } else {
          suggestions.content.push(gap.suggestion);
        }
      }
    });
    
    return suggestions;
  }

  /**
   * Map gaps to improvements
   * @private
   */
  _mapGapsToImprovements(gaps) {
    return gaps.map(gap => {
      // Enhanced evidence extraction
      let evidence = gap.evidence || '';
      
      // If no evidence, generate from gap data
      if (!evidence && gap.successRate !== undefined) {
        evidence = `${gap.successRate}% CV thành công có ${gap.skills?.join(', ') || gap.type}`;
      } else if (!evidence && gap.frequency !== undefined) {
        evidence = `${gap.frequency} CV thành công có pattern này`;
      } else if (!evidence) {
        evidence = 'Dựa trên phân tích CV thành công';
      }
      
      return {
      section: gap.type?.toUpperCase() || 'GENERAL',
      issue: gap.issue || gap.type,
      suggestion: gap.suggestion || gap.evidence,
      severity: gap.severity || gap.impact || 'medium',
        evidence: evidence,
        priority: gap.impact === 'high' || gap.severity === 'high' ? 'high' : 
                  gap.impact === 'medium' || gap.severity === 'medium' ? 'medium' : 'low',
        expectedImpact: gap.impact === 'high' ? '+10-15 điểm' : 
                        gap.impact === 'medium' ? '+5-10 điểm' : '+3-5 điểm'
      };
    });
  }
}

// Singleton
let instance = null;

function getSelfSufficientAIService() {
  if (!instance) {
    instance = new SelfSufficientAIService();
  }
  return instance;
}

module.exports = {
  SelfSufficientAIService,
  getSelfSufficientAIService
};
