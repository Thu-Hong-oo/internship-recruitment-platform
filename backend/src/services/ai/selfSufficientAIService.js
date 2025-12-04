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

const phobertService = require('../phobertService');
const { getSentenceBertService } = require('./sentenceBertService');
const { getJobMatchingService } = require('./jobMatchingService');
const { logger } = require('../../utils/logger');

class SelfSufficientAIService {
  constructor() {
    this.sentenceBert = getSentenceBertService();
    this.jobMatching = getJobMatchingService();
    
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

      // ✅ Use PhoBERT for Vietnamese CV text (most accurate for Vietnamese)
      // DISABLED: PhoBERT timeout issues, enhanced fuzzy matching is sufficient
      if (false && isCVVietnamese && cvText.length > 50) {
        logger.info('🇻🇳 Vietnamese CV detected, using PhoBERT NER (10s timeout)');
        try {
          const phobertSkills = await phobertService.extractSkills(cvText);
          if (phobertSkills && phobertSkills.length > 0) {
            currentSkills.push(...phobertSkills);
            logger.info(`✅ PhoBERT extracted ${phobertSkills.length} skills from CV`);
          }
        } catch (error) {
          logger.warn('⚠️ PhoBERT failed, falling back to keyword extraction:', error.message);
        }
      } else if (!isCVVietnamese) {
        logger.info('🇬🇧 English text detected, using keyword extraction');
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
      ].map(s => (typeof s === 'string' ? s : s.name).toLowerCase().trim());

      // 🔥 AUTO-GENERATE required skills if empty (using job title)
      if (allRequiredSkills.length === 0 && jobData.title) {
        logger.info(`🤖 Auto-generating required skills for job title: "${jobData.title}"`);
        const suggestedSkills = await this.suggestSkills(jobData.title, 'mid-level');
        if (suggestedSkills && suggestedSkills.suggestions) {
          allRequiredSkills = suggestedSkills.suggestions.map(s => s.toLowerCase().trim());
          logger.info(`✅ Auto-generated ${allRequiredSkills.length} required skills:`, allRequiredSkills.join(', '));
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

    // Skills (shortened)
    if (cvData.skills) {
      if (cvData.skills.technical) parts.push(`Technical: ${cvData.skills.technical.slice(0, 10).map(s => s.name || s).join(', ')}`);
      if (cvData.skills.soft) parts.push(`Soft skills: ${cvData.skills.soft.slice(0, 5).map(s => s.name || s).join(', ')}`);
    }

    // Experience (limit to 3 most recent, truncate descriptions)
    if (cvData.experience && Array.isArray(cvData.experience)) {
      cvData.experience.slice(0, 3).forEach(exp => {
        const desc = (exp.description || '').substring(0, 200); // Max 200 chars
        parts.push(`${exp.position} at ${exp.company}: ${desc}`);
      });
    }

    // Education (limit to 2)
    if (cvData.education && Array.isArray(cvData.education)) {
      cvData.education.slice(0, 2).forEach(edu => {
        const degree = edu.degree || 'Degree';
        const major = edu.major || edu.field || 'Field';
        const school = edu.school || edu.institution || 'Institution';
        parts.push(`${degree} in ${major} from ${school}`);
      });
    }

    return parts.join('\n');
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
      logger.info('🔬 Self-sufficient CV analysis (PhoBERT)');

      // Extract skills using PhoBERT
      const skills = await phobertService.extractSkills(cvText);

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
        _method: 'self-sufficient (PhoBERT)',
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
      const skills = await phobertService.extractSkills(jobDescription);

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
        _method: 'self-sufficient (PhoBERT + patterns)'
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
   * Uses: PhoBERT + rule-based structure analysis
   */
  async analyzeJobPosting(job) {
    try {
      logger.info('📝 Analyzing job posting (self-sufficient)');

      const description = job.description || '';
      const title = job.title || '';

      // Extract skills using PhoBERT
      const skillsExtracted = await phobertService.extractSkills(description);

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
        _method: 'self-sufficient (PhoBERT + rules)',
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
   * Uses: jobMatchingService (PhoBERT + Sentence-BERT)
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

      const cvSkills = await phobertService.extractSkills(cvText);
      const jobSkills = await phobertService.extractSkills(jobText);

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
        _method: 'self-sufficient (jobMatchingService + PhoBERT)',
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
