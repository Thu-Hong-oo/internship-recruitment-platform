const { logger } = require('../../utils/logger');
// const OpenAI = require('openai'); // Uncomment when OpenAI is available

/**
 * AI Content Service
 * Provides AI-powered content suggestions and enhancements for CV building
 */

class AIContentService {
  constructor() {
    // this.openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY
    // });
    this.isAIEnabled = process.env.OPENAI_API_KEY && process.env.USE_AI_CONTENT === 'true';
  }

  /**
   * Generate initial suggestions when creating new CV
   */
  async generateInitialSuggestions(userId) {
    if (!this.isAIEnabled) {
      return this.getFallbackSuggestions();
    }

    try {
      // TODO: Implement OpenAI call
      // const userProfile = await getUserProfile(userId);
      // const suggestions = await this.openai.createCompletion({...});

      return [
        "Add a compelling career objective that highlights your key strengths",
        "Include specific achievements with metrics in your experience section",
        "Tailor your skills section to match the job you're applying for",
        "Add relevant projects that demonstrate your technical abilities"
      ];
    } catch (error) {
      logger.error('AI initial suggestions failed:', error.message);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Generate content suggestions for specific section
   */
  async generateSuggestions({ sectionType, currentContent, targetJob, userProfile, existingContent }) {
    if (!this.isAIEnabled) {
      return this.getFallbackSuggestionsForSection(sectionType);
    }

    try {
      const context = {
        sectionType,
        currentContent: currentContent || '',
        targetJob: targetJob || '',
        userProfile: userProfile || {},
        existingContent: existingContent || {}
      };

      // TODO: Implement OpenAI call based on section type
      const suggestions = await this.generateSectionSpecificSuggestions(context);

      return suggestions;
    } catch (error) {
      logger.error('AI content suggestions failed:', error.message);
      return this.getFallbackSuggestionsForSection(sectionType);
    }
  }

  /**
   * Generate section-specific suggestions
   */
  async generateSectionSpecificSuggestions(context) {
    const { sectionType, currentContent, targetJob, userProfile } = context;

    switch (sectionType) {
      case 'careerObjective':
        return await this.generateObjectiveSuggestions(currentContent, targetJob, userProfile);

      case 'experience':
        return await this.generateExperienceSuggestions(currentContent, targetJob);

      case 'skills':
        return await this.generateSkillsSuggestions(currentContent, targetJob);

      case 'projects':
        return await this.generateProjectSuggestions(currentContent, targetJob);

      case 'education':
        return await this.generateEducationSuggestions(currentContent);

      default:
        return ["Focus on quantifiable achievements", "Use action verbs", "Tailor content to the job description"];
    }
  }

  /**
   * Generate career objective suggestions
   */
  async generateObjectiveSuggestions(currentContent, targetJob, userProfile) {
    const suggestions = [];

    if (!currentContent || currentContent.length < 50) {
      suggestions.push({
        type: 'improvement',
        title: 'Make it more specific',
        description: 'Include your target role, key skills, and career goals',
        example: `Dynamic and motivated ${userProfile.role || 'professional'} with expertise in ${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'}. Seeking to leverage strong technical skills and passion for innovation to contribute to ${targetJob || 'challenging projects'} and drive organizational success.`
      });
    }

    if (!currentContent.toLowerCase().includes('results') && !currentContent.toLowerCase().includes('achievements')) {
      suggestions.push({
        type: 'enhancement',
        title: 'Highlight achievements',
        description: 'Mention specific accomplishments or skills',
        example: 'Add metrics or specific technologies you excel in'
      });
    }

    return suggestions;
  }

  /**
   * Generate experience section suggestions
   */
  async generateExperienceSuggestions(currentContent, targetJob) {
    const suggestions = [];

    if (!currentContent || !Array.isArray(currentContent.items) || currentContent.items.length === 0) {
      suggestions.push({
        type: 'content',
        title: 'Add work experience',
        description: 'Include your most recent and relevant positions',
        example: 'Start with your current or most recent role, include company name, dates, and key responsibilities'
      });
    }

    // Check for quantifiable achievements
    const hasMetrics = currentContent.items?.some(item =>
      item.description && /\d+/.test(item.description)
    );

    if (!hasMetrics) {
      suggestions.push({
        type: 'improvement',
        title: 'Add quantifiable achievements',
        description: 'Include numbers, percentages, or specific outcomes',
        example: 'Instead of "Managed team", say "Managed team of 5 developers, increasing productivity by 30%"'
      });
    }

    // Check for action verbs
    const actionVerbs = ['led', 'developed', 'implemented', 'improved', 'created', 'managed', 'designed'];
    const hasActionVerbs = currentContent.items?.some(item =>
      item.description && actionVerbs.some(verb =>
        item.description.toLowerCase().includes(verb)
      )
    );

    if (!hasActionVerbs) {
      suggestions.push({
        type: 'enhancement',
        title: 'Use action verbs',
        description: 'Start bullet points with strong action words',
        example: 'Use words like "Developed", "Implemented", "Optimized", "Led", "Created"'
      });
    }

    return suggestions;
  }

  /**
   * Generate skills suggestions
   */
  async generateSkillsSuggestions(currentContent, targetJob) {
    const suggestions = [];

    if (!currentContent || !Array.isArray(currentContent.categories) || currentContent.categories.length === 0) {
      suggestions.push({
        type: 'content',
        title: 'Categorize your skills',
        description: 'Group skills by category (Technical, Soft Skills, Languages, etc.)',
        example: 'Create categories like "Programming Languages", "Frameworks", "Tools", "Soft Skills"'
      });
    }

    // Check if skills are relevant to target job
    if (targetJob) {
      suggestions.push({
        type: 'optimization',
        title: 'Tailor skills to job',
        description: `Highlight skills relevant to ${targetJob}`,
        example: 'Move the most job-relevant skills to the top of each category'
      });
    }

    return suggestions;
  }

  /**
   * Generate project suggestions
   */
  async generateProjectSuggestions(currentContent, targetJob) {
    const suggestions = [];

    if (!currentContent || !Array.isArray(currentContent.items) || currentContent.items.length === 0) {
      suggestions.push({
        type: 'content',
        title: 'Add relevant projects',
        description: 'Include personal or work projects that demonstrate your skills',
        example: 'Add projects from GitHub, personal websites, or significant work initiatives'
      });
    }

    // Check for technical details
    const hasTechDetails = currentContent.items?.some(item =>
      item.technologies && item.technologies.length > 0
    );

    if (!hasTechDetails) {
      suggestions.push({
        type: 'enhancement',
        title: 'Include technologies used',
        description: 'Specify the technologies, frameworks, and tools you used',
        example: 'Add a "Technologies" field: React, Node.js, MongoDB, AWS'
      });
    }

    return suggestions;
  }

  /**
   * Generate education suggestions
   */
  async generateEducationSuggestions(currentContent) {
    const suggestions = [];

    if (!currentContent || !Array.isArray(currentContent.items) || currentContent.items.length === 0) {
      suggestions.push({
        type: 'content',
        title: 'Add education details',
        description: 'Include your degrees, institutions, and graduation dates',
        example: 'List your most recent education first, including GPA if above 3.0'
      });
    }

    return suggestions;
  }

  /**
   * Optimize CV content for specific job
   */
  async optimizeForJob(cvData, jobDetails) {
    if (!this.isAIEnabled) {
      return this.getFallbackOptimization(cvData, jobDetails);
    }

    try {
      const { jobDescription, jobTitle } = jobDetails;

      // Extract job keywords
      const jobKeywords = await this.extractJobKeywords(jobDescription);

      // Analyze current CV content
      const cvText = this.extractCVText(cvData);
      const cvKeywords = await this.extractKeywords(cvText);

      // Find missing keywords
      const missingKeywords = jobKeywords.filter(keyword =>
        !cvKeywords.some(cvKeyword =>
          cvKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(cvKeyword.toLowerCase())
        )
      );

      // Generate optimization suggestions
      const suggestions = [];

      if (missingKeywords.length > 0) {
        suggestions.push({
          type: 'keywords',
          title: 'Add missing keywords',
          description: `Consider adding these job-relevant keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
          keywords: missingKeywords
        });
      }

      // Check content relevance
      const relevanceScore = this.calculateRelevanceScore(cvKeywords, jobKeywords);
      if (relevanceScore < 0.6) {
        suggestions.push({
          type: 'relevance',
          title: 'Improve job relevance',
          description: 'Your CV content may not strongly match this job. Consider tailoring your experience and skills sections.',
          score: relevanceScore
        });
      }

      return {
        suggestions,
        missingKeywords,
        relevanceScore,
        optimizedContent: cvData // TODO: Implement actual content optimization
      };

    } catch (error) {
      logger.error('AI job optimization failed:', error.message);
      return this.getFallbackOptimization(cvData, jobDetails);
    }
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  async extractKeywords(text) {
    if (!text) return [];

    // Simple keyword extraction - split by common separators
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));

    // Count frequency and return top keywords
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 20);
  }

  /**
   * Extract job-specific keywords
   */
  async extractJobKeywords(jobDescription) {
    // Focus on technical skills, requirements, and key terms
    const techKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'mongodb',
      'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'api'
    ];

    const words = jobDescription.toLowerCase().split(/\s+/);
    return words.filter(word =>
      techKeywords.includes(word) ||
      word.includes('experience') ||
      word.includes('skill') ||
      word.length > 4
    ).slice(0, 15);
  }

  /**
   * Calculate relevance score
   */
  calculateRelevanceScore(cvKeywords, jobKeywords) {
    if (!cvKeywords.length || !jobKeywords.length) return 0;

    const matches = cvKeywords.filter(cvKeyword =>
      jobKeywords.some(jobKeyword =>
        cvKeyword.toLowerCase().includes(jobKeyword.toLowerCase()) ||
        jobKeyword.toLowerCase().includes(cvKeyword.toLowerCase())
      )
    );

    return matches.length / Math.max(cvKeywords.length, jobKeywords.length);
  }

  /**
   * Extract text from CV data
   */
  extractCVText(cvData) {
    let text = '';

    if (cvData.content?.personalInfo?.summary) {
      text += cvData.content.personalInfo.summary + ' ';
    }

    if (cvData.content?.sections) {
      cvData.content.sections.forEach(section => {
        if (section.content) {
          if (section.content.text) text += section.content.text + ' ';
          if (section.content.items) {
            section.content.items.forEach(item => {
              text += (item.title || '') + ' ' + (item.description || '') + ' ';
            });
          }
          if (section.content.categories) {
            section.content.categories.forEach(cat => {
              text += (cat.name || '') + ' ' + (cat.skills?.join(' ') || '') + ' ';
            });
          }
        }
      });
    }

    return text;
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'an', 'a'];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Fallback suggestions when AI is not available
   */
  getFallbackSuggestions() {
    return [
      "Start with a strong career objective",
      "Use quantifiable achievements in experience",
      "Tailor your skills to the job description",
      "Include relevant projects and technologies"
    ];
  }

  /**
   * Fallback suggestions for specific sections
   */
  getFallbackSuggestionsForSection(sectionType) {
    const suggestions = {
      careerObjective: [{
        type: 'improvement',
        title: 'Make it specific',
        description: 'Include your target role and key skills'
      }],
      experience: [{
        type: 'enhancement',
        title: 'Add achievements',
        description: 'Include specific accomplishments with metrics'
      }],
      skills: [{
        type: 'organization',
        title: 'Categorize skills',
        description: 'Group skills by technical areas'
      }],
      projects: [{
        type: 'detail',
        title: 'Add technical details',
        description: 'Include technologies and outcomes'
      }]
    };

    return suggestions[sectionType] || this.getFallbackSuggestions();
  }

  /**
   * Fallback optimization when AI is not available
   */
  getFallbackOptimization(cvData, jobDetails) {
    return {
      suggestions: [{
        type: 'manual',
        title: 'Manual optimization needed',
        description: 'AI optimization not available. Please manually review and tailor your CV for this job.'
      }],
      missingKeywords: [],
      relevanceScore: 0.5,
      optimizedContent: cvData
    };
  }
}

module.exports = new AIContentService();</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\backend\src\services\resume\aiContentService.js