const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../../utils/logger');

/**
 * AI Content Service
 * Provides AI-powered content suggestions and enhancements for CV building
 */

class AIContentService {
  constructor() {
    // Initialize Gemini AI
    this.geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    this.isAIEnabled = this.geminiApiKey && this.geminiApiKey.startsWith('AIzaSy') && process.env.USE_AI_CONTENT === 'true';

    if (this.isAIEnabled) {
      try {
        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        this.model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
        });
        logger.info('✅ AIContentService: Gemini model initialized');
      } catch (error) {
        logger.warn('⚠️ AIContentService: Failed to initialize Gemini model', error.message);
        this.isAIEnabled = false;
      }
    } else {
      logger.warn('⚠️ AIContentService: GEMINI_API_KEY not available or USE_AI_CONTENT not enabled');
    }
  }

  /**
   * Generate initial suggestions when creating new CV
   */
  async generateInitialSuggestions(userId) {
    if (!this.isAIEnabled) {
      return this.getFallbackSuggestions();
    }

    try {
      const prompt = `Generate 4-6 helpful suggestions for someone creating their first professional CV.
      Focus on:
      - Career objective and summary
      - Work experience descriptions
      - Skills presentation
      - Education and projects
      - Overall CV structure

      Return as a JSON array of strings, each suggestion should be actionable and specific.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Try to parse as JSON first
      try {
        const suggestions = JSON.parse(text);
        if (Array.isArray(suggestions)) {
          return suggestions;
        }
      } catch (parseError) {
        // If not JSON, split by newlines and clean up
        const suggestions = text.split('\n')
          .filter(line => line.trim().length > 10)
          .map(line => line.replace(/^[•\-\*\d]+\.?\s*/, '').trim())
          .slice(0, 6);

        return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions();
      }

      return this.getFallbackSuggestions();
    } catch (error) {
      logger.error('Error generating initial suggestions:', error);
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

    try {
      let prompt = '';

      switch (sectionType) {
        case 'careerObjective':
          prompt = `Generate 3-4 specific suggestions to improve this career objective for a CV.
          Current content: "${currentContent || 'No content yet'}"
          Target job: "${targetJob || 'General professional role'}"
          User profile: ${JSON.stringify(userProfile || {})}

          Return as JSON array with objects containing: type, title, description, example.
          Focus on making it more specific, results-oriented, and tailored to the target job.`;
          break;

        case 'experience':
          prompt = `Analyze this work experience description and provide 3-4 specific improvements.
          Current content: "${currentContent || 'No content yet'}"
          Target job: "${targetJob || 'General professional role'}"

          Return as JSON array with objects containing: type, title, description, example.
          Focus on: using action verbs, quantifying achievements, relevant keywords, and job-specific tailoring.`;
          break;

        case 'skills':
          prompt = `Review these skills and suggest 3-4 improvements for a CV.
          Current skills: "${currentContent || 'No skills listed'}"
          Target job: "${targetJob || 'General professional role'}"

          Return as JSON array with objects containing: type, title, description, example.
          Focus on: relevant keywords, skill levels, organization, and job matching.`;
          break;

        case 'projects':
          prompt = `Provide suggestions to improve this project description for a CV.
          Current content: "${currentContent || 'No project details'}"
          Target job: "${targetJob || 'General professional role'}"

          Return as JSON array with objects containing: type, title, description, example.
          Focus on: technical details, impact, technologies used, and relevance to target job.`;
          break;

        case 'education':
          prompt = `Suggest improvements for this education section in a CV.
          Current content: "${currentContent || 'No education details'}"

          Return as JSON array with objects containing: type, title, description, example.
          Focus on: relevance, achievements, GPA (if strong), and additional qualifications.`;
          break;

        default:
          prompt = `Provide general CV content improvement suggestions for section type: ${sectionType}.
          Current content: "${currentContent || 'No content'}"
          Target job: "${targetJob || 'General professional role'}"

          Return as JSON array with objects containing: type, title, description, example.`;
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Try to parse as JSON
      try {
        const suggestions = JSON.parse(text);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions;
        }
      } catch (parseError) {
        logger.warn('Failed to parse Gemini response as JSON, using fallback');
      }

      // Fallback to default suggestions
      return this.getFallbackSuggestionsForSection(sectionType);

    } catch (error) {
      logger.error(`Error generating ${sectionType} suggestions:`, error);
      return this.getFallbackSuggestionsForSection(sectionType);
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
      const cvText = this.extractCVText(cvData);

      const prompt = `Analyze this CV and job description to provide optimization suggestions.

CV Content:
${cvText}

Job Title: ${jobTitle || 'Not specified'}
Job Description:
${jobDescription}

Please provide optimization suggestions in JSON format with this structure:
{
  "suggestions": [
    {
      "type": "keywords|relevance|structure|content",
      "title": "Brief title",
      "description": "Detailed explanation",
      "priority": "high|medium|low",
      "section": "experience|skills|summary|etc"
    }
  ],
  "missingKeywords": ["keyword1", "keyword2"],
  "relevanceScore": 0.0-1.0,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}

Focus on:
1. Missing important keywords from job description
2. Content relevance and tailoring
3. Structure and presentation improvements
4. Specific actionable suggestions`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Try to parse JSON response
      try {
        const analysis = JSON.parse(text);
        if (analysis.suggestions && Array.isArray(analysis.suggestions)) {
          return {
            suggestions: analysis.suggestions,
            missingKeywords: analysis.missingKeywords || [],
            relevanceScore: analysis.relevanceScore || 0.5,
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || []
          };
        }
      } catch (parseError) {
        logger.warn('Failed to parse Gemini optimization response, using fallback');
      }

      // Fallback to basic analysis
      return this.getFallbackOptimization(cvData, jobDetails);

    } catch (error) {
      logger.error('Error optimizing CV for job:', error);
      return this.getFallbackOptimization(cvData, jobDetails);
    }
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  async extractKeywords(text) {
    if (!text) return [];

    try {
      const prompt = `Extract the most relevant keywords from the following text. Focus on skills, technologies, qualifications, and key terms that would be important for a resume or job application. Return only a JSON array of keywords, no explanations.

Text: ${text}

Return format: ["keyword1", "keyword2", "keyword3", ...]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text().trim();

      // Parse JSON response
      const keywords = JSON.parse(textResponse);

      if (Array.isArray(keywords)) {
        return keywords.slice(0, 20); // Limit to 20 keywords
      }

      // Fallback to simple extraction if parsing fails
      return this.simpleKeywordExtraction(text);
    } catch (error) {
      logger.error('Error extracting keywords with Gemini:', error);
      // Fallback to simple extraction
      return this.simpleKeywordExtraction(text);
    }
  }

  /**
   * Simple keyword extraction fallback
   */
  simpleKeywordExtraction(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));

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
    if (!this.isAIEnabled) {
      // Fallback: simple keyword extraction
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

    try {
      const prompt = `Extract the most important keywords and skills from this job description.
      Focus on technical skills, soft skills, tools, technologies, and key requirements.

      Job Description:
      ${jobDescription}

      Return as JSON array of strings, maximum 20 keywords. Prioritize:
      1. Technical skills and technologies
      2. Programming languages and frameworks
      3. Tools and platforms
      4. Required experience level
      5. Key responsibilities

      Example: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Agile"]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      try {
        const keywords = JSON.parse(text);
        return Array.isArray(keywords) ? keywords.slice(0, 20) : [];
      } catch (parseError) {
        // Extract keywords from text response
        const keywordMatches = text.match(/["']([^"']+)["']/g);
        if (keywordMatches) {
          return keywordMatches
            .map(match => match.replace(/["']/g, ''))
            .slice(0, 20);
        }
        return [];
      }
    } catch (error) {
      logger.error('Error extracting job keywords:', error);
      return [];
    }
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

module.exports = new AIContentService();