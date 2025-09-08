const OpenAI = require('openai');
const natural = require('natural');
const { logger } = require('../utils/logger');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Skill dictionary for different domains
const SKILL_DICTIONARY = {
  technology: {
    programming: ['python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala'],
    web: ['html', 'css', 'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel'],
    database: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab'],
    mobile: ['react native', 'flutter', 'ios', 'android', 'xamarin', 'ionic'],
    ai_ml: ['tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'opencv', 'nlp']
  },
  business: {
    analysis: ['excel', 'powerpoint', 'word', 'power bi', 'tableau', 'sql', 'r', 'python'],
    management: ['project management', 'agile', 'scrum', 'kanban', 'jira', 'trello', 'asana'],
    finance: ['financial modeling', 'budgeting', 'forecasting', 'quickbooks', 'sap', 'oracle']
  },
  marketing: {
    digital: ['seo', 'sem', 'google ads', 'facebook ads', 'email marketing', 'content marketing'],
    analytics: ['google analytics', 'google tag manager', 'facebook pixel', 'hotjar', 'mixpanel'],
    social: ['social media management', 'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok']
  },
  design: {
    graphic: ['photoshop', 'illustrator', 'figma', 'sketch', 'canva', 'invision'],
    ui_ux: ['user experience', 'user interface', 'wireframing', 'prototyping', 'usability testing'],
    video: ['premiere pro', 'after effects', 'final cut pro', 'davinci resolve']
  }
};

class AIService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Extract text from CV file
   */
  async extractTextFromCV(fileBuffer, mimeType) {
    try {
      let text = '';
      
      if (mimeType === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file type');
      }

      return this.preprocessText(text);
    } catch (error) {
      logger.error('Error extracting text from CV:', error);
      throw error;
    }
  }

  /**
   * Preprocess text for analysis
   */
  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract skills from text using NLP
   */
  async extractSkills(text) {
    try {
      const prompt = `
        Extract technical and professional skills from the following text. 
        Return only the skills as a JSON array of objects with format:
        [{"name": "skill_name", "level": "beginner|intermediate|advanced", "confidence": 0.0-1.0}]
        
        Text: ${text}
        
        Focus on:
        - Programming languages and frameworks
        - Tools and technologies
        - Soft skills and methodologies
        - Certifications and qualifications
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;
      const skills = JSON.parse(response);
      
      return this.normalizeSkills(skills);
    } catch (error) {
      logger.error('Error extracting skills:', error);
      // Fallback to rule-based extraction
      return this.extractSkillsRuleBased(text);
    }
  }

  /**
   * Rule-based skill extraction as fallback
   */
  extractSkillsRuleBased(text) {
    const skills = [];
    const words = this.tokenizer.tokenize(text);
    
    // Flatten skill dictionary
    const allSkills = [];
    Object.values(SKILL_DICTIONARY).forEach(category => {
      Object.values(category).forEach(skillList => {
        allSkills.push(...skillList);
      });
    });

    // Find matches
    allSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        skills.push({
          name: skill,
          level: 'intermediate', // Default level
          confidence: 0.7
        });
      }
    });

    return skills;
  }

  /**
   * Normalize skills to standard format
   */
  normalizeSkills(skills) {
    return skills.map(skill => ({
      name: skill.name.toLowerCase(),
      level: skill.level || 'intermediate',
      confidence: skill.confidence || 0.5
    }));
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Calculate match score between CV and job
   */
  async calculateMatchScore(cvText, jobData, cvSkills = []) {
    try {
      const scores = {
        skills: 0,
        experience: 0,
        education: 0,
        keywords: 0,
        overall: 0
      };

      // Skills matching
      if (jobData.skills && cvSkills.length > 0) {
        const requiredSkills = jobData.skills.filter(s => s.required).map(s => s.name.toLowerCase());
        const niceToHaveSkills = jobData.skills.filter(s => !s.required).map(s => s.name.toLowerCase());
        
        const cvSkillNames = cvSkills.map(s => s.name);
        
        const requiredMatch = requiredSkills.filter(skill => 
          cvSkillNames.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))
        ).length;
        
        const niceToHaveMatch = niceToHaveSkills.filter(skill => 
          cvSkillNames.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))
        ).length;

        scores.skills = (requiredMatch / Math.max(requiredSkills.length, 1)) * 0.7 + 
                       (niceToHaveMatch / Math.max(niceToHaveSkills.length, 1)) * 0.3;
      }

      // Experience matching
      if (jobData.experience && jobData.experience.min) {
        // This would need to be extracted from CV text
        // For now, using a simple heuristic
        const experienceKeywords = ['experience', 'years', 'worked', 'job', 'position'];
        const hasExperience = experienceKeywords.some(keyword => cvText.includes(keyword));
        scores.experience = hasExperience ? 0.8 : 0.3;
      }

      // Education matching
      if (jobData.education && jobData.education.level) {
        const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college'];
        const hasEducation = educationKeywords.some(keyword => cvText.includes(keyword));
        scores.education = hasEducation ? 0.9 : 0.4;
      }

      // Keyword similarity using embeddings
      const cvEmbedding = await this.generateEmbedding(cvText);
      const jobEmbedding = await this.generateEmbedding(jobData.description + ' ' + jobData.requirements);
      scores.keywords = this.calculateSimilarity(cvEmbedding, jobEmbedding);

      // Overall score with weights
      scores.overall = 
        scores.skills * 0.45 +
        scores.experience * 0.2 +
        scores.education * 0.1 +
        scores.keywords * 0.2;

      return scores;
    } catch (error) {
      logger.error('Error calculating match score:', error);
      throw error;
    }
  }

  /**
   * Identify skill gaps
   */
  identifySkillGaps(cvSkills, jobSkills) {
    const gaps = [];
    const cvSkillNames = cvSkills.map(s => s.name.toLowerCase());
    
    jobSkills.forEach(jobSkill => {
      const hasSkill = cvSkillNames.some(cvSkill => 
        cvSkill.includes(jobSkill.name.toLowerCase()) || 
        jobSkill.name.toLowerCase().includes(cvSkill)
      );
      
      if (!hasSkill) {
        gaps.push({
          skill: jobSkill.name,
          required: jobSkill.required,
          level: jobSkill.level,
          importance: jobSkill.required ? 0.9 : 0.6
        });
      }
    });

    return gaps.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Generate personalized skill roadmap
   */
  async generateSkillRoadmap(skillGaps, userProfile, duration = 8) {
    try {
      const prompt = `
        Create a personalized learning roadmap for the following skill gaps.
        Duration: ${duration} weeks
        User background: ${userProfile?.education?.fieldOfStudy || 'General'}
        
        Skill gaps: ${JSON.stringify(skillGaps)}
        
        Return a JSON object with this structure:
        {
          "weeks": [
            {
              "week": 1,
              "focus": "skill_name",
              "objectives": ["objective1", "objective2"],
              "resources": [
                {
                  "title": "resource_title",
                  "url": "resource_url",
                  "type": "video|article|course|book",
                  "duration": "estimated_hours"
                }
              ],
              "exercises": ["exercise1", "exercise2"],
              "milestone": "what_to_achieve_by_end_of_week"
            }
          ],
          "estimatedTotalHours": number,
          "difficulty": "beginner|intermediate|advanced"
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);
    } catch (error) {
      logger.error('Error generating skill roadmap:', error);
      throw error;
    }
  }

  /**
   * Analyze CV and return comprehensive analysis
   */
  async analyzeCV(cvText, jobData = null) {
    try {
      const analysis = {
        skills: await this.extractSkills(cvText),
        embedding: await this.generateEmbedding(cvText),
        complexity: 'intermediate',
        estimatedDuration: 6
      };

      if (jobData) {
        analysis.matchScore = await this.calculateMatchScore(cvText, jobData, analysis.skills);
        analysis.skillGaps = this.identifySkillGaps(analysis.skills, jobData.skills || []);
      }

      return analysis;
    } catch (error) {
      logger.error('Error analyzing CV:', error);
      throw error;
    }
  }

  /**
   * Get job recommendations based on CV
   */
  async getJobRecommendations(cvText, availableJobs, limit = 10) {
    try {
      const cvEmbedding = await this.generateEmbedding(cvText);
      const recommendations = [];

      for (const job of availableJobs) {
        const jobText = `${job.title} ${job.description} ${job.requirements}`;
        const jobEmbedding = await this.generateEmbedding(jobText);
        const similarity = this.calculateSimilarity(cvEmbedding, jobEmbedding);
        
        recommendations.push({
          job,
          score: similarity,
          reasons: this.generateRecommendationReasons(cvText, job)
        });
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting job recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate reasons for job recommendation
   */
  generateRecommendationReasons(cvText, job) {
    const reasons = [];
    const cvSkills = this.extractSkillsRuleBased(cvText).map(s => s.name);
    const jobSkills = job.skills?.map(s => s.name.toLowerCase()) || [];

    // Skill matches
    const matchingSkills = jobSkills.filter(skill => 
      cvSkills.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))
    );

    if (matchingSkills.length > 0) {
      reasons.push(`Matches ${matchingSkills.length} required skills: ${matchingSkills.slice(0, 3).join(', ')}`);
    }

    // Location match
    if (job.location && cvText.toLowerCase().includes(job.location.toLowerCase())) {
      reasons.push('Location matches your profile');
    }

    // Experience level
    if (job.type === 'internship') {
      reasons.push('Perfect for internship level');
    }

    return reasons;
  }

  /**
   * Semantic search for jobs, skills, or users
   */
  async semanticSearch(query, type = 'jobs', limit = 10) {
    try {
      // For now, return empty results to avoid errors
      // In production, this would use vector embeddings and similarity search
      logger.info(`Semantic search called for query: ${query}, type: ${type}`);
      
      // Return empty results to trigger fallback to text search
      return [];
    } catch (error) {
      logger.error('Error in semantic search:', error);
      // Return empty results to trigger fallback
      return [];
    }
  }

  /**
   * Analyze job description and extract skills, difficulty, category
   */
  async analyzeJobDescription(description) {
    try {
      const prompt = `
        Analyze the following job description and extract:
        1. Technical skills required
        2. Difficulty level (beginner/intermediate/advanced)
        3. Job category (tech/business/marketing/design/data/other)
        4. Key responsibilities
        5. Required experience level
        
        Job description: ${description}
        
        Return as JSON:
        {
          "skillsExtracted": ["skill1", "skill2"],
          "difficulty": "beginner|intermediate|advanced",
          "category": "tech|business|marketing|design|data|other",
          "responsibilities": ["resp1", "resp2"],
          "experienceLevel": "entry|mid|senior"
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      const analysis = JSON.parse(response);
      
      // Generate embedding for the job
      analysis.embedding = await this.generateEmbedding(description);
      analysis.lastAnalyzedAt = new Date();

      return analysis;
    } catch (error) {
      logger.error('Error analyzing job description:', error);
      // Return default analysis
      return {
        skillsExtracted: [],
        difficulty: 'beginner',
        category: 'tech',
        responsibilities: [],
        experienceLevel: 'entry',
        embedding: [],
        lastAnalyzedAt: new Date()
      };
    }
  }

  /**
   * Calculate job match score between job and user profile
   */
  async calculateJobMatchScore(job, userProfile) {
    try {
      const scores = {
        skills: 0,
        experience: 0,
        education: 0,
        keywords: 0,
        culture: 0,
        overall: 0
      };

      // Skills matching
      if (job.requirements.skills && userProfile.skills) {
        const jobSkills = job.requirements.skills.map(s => s.skillId.name.toLowerCase());
        const userSkills = userProfile.skills.map(s => s.name.toLowerCase());
        
        const requiredSkills = job.requirements.skills.filter(s => s.level === 'required');
        const preferredSkills = job.requirements.skills.filter(s => s.level === 'preferred');
        
        const requiredMatch = requiredSkills.filter(skill => 
          userSkills.some(userSkill => userSkill.includes(skill.skillId.name.toLowerCase()))
        ).length;
        
        const preferredMatch = preferredSkills.filter(skill => 
          userSkills.some(userSkill => userSkill.includes(skill.skillId.name.toLowerCase()))
        ).length;

        scores.skills = (requiredMatch / Math.max(requiredSkills.length, 1)) * 0.7 + 
                       (preferredMatch / Math.max(preferredSkills.length, 1)) * 0.3;
      }

      // Experience matching
      if (job.requirements.experience && userProfile.experience) {
        const jobMinMonths = job.requirements.experience.minMonths || 0;
        const userTotalMonths = userProfile.experience.reduce((total, exp) => total + exp.duration, 0);
        
        if (userTotalMonths >= jobMinMonths) {
          scores.experience = Math.min(1, userTotalMonths / (jobMinMonths + 6));
        } else {
          scores.experience = userTotalMonths / Math.max(jobMinMonths, 1);
        }
      }

      // Education matching
      if (job.requirements.education && userProfile.education) {
        const jobLevel = job.requirements.education.level;
        const userLevel = userProfile.education.level;
        
        const levelScores = { 'Bachelor': 1, 'Master': 1.2, 'PhD': 1.5 };
        const userScore = levelScores[userLevel] || 1;
        const jobScore = levelScores[jobLevel] || 1;
        
        scores.education = Math.min(1, userScore / jobScore);
      }

      // Keyword similarity using embeddings
      const jobText = `${job.title} ${job.description} ${job.responsibilities.join(' ')}`;
      const userText = `${userProfile.summary} ${userProfile.skills.map(s => s.name).join(' ')}`;
      
      const jobEmbedding = await this.generateEmbedding(jobText);
      const userEmbedding = await this.generateEmbedding(userText);
      scores.keywords = this.calculateSimilarity(jobEmbedding, userEmbedding);

      // Overall score with weights
      scores.overall = 
        scores.skills * 0.45 +
        scores.experience * 0.2 +
        scores.education * 0.1 +
        scores.keywords * 0.2 +
        scores.culture * 0.05;

      return {
        ...scores,
        breakdown: {
          skills: Math.round(scores.skills * 100),
          experience: Math.round(scores.experience * 100),
          education: Math.round(scores.education * 100),
          keywords: Math.round(scores.keywords * 100),
          culture: Math.round(scores.culture * 100)
        },
        overall: Math.round(scores.overall * 100)
      };
    } catch (error) {
      logger.error('Error calculating job match score:', error);
      throw error;
    }
  }

  /**
   * Analyze job skills and requirements
   */
  async analyzeJobSkills(job) {
    try {
      const analysis = {
        requiredSkills: job.requirements.skills.filter(s => s.level === 'required'),
        preferredSkills: job.requirements.skills.filter(s => s.level === 'preferred'),
        niceToHaveSkills: job.requirements.skills.filter(s => s.level === 'nice-to-have'),
        skillCategories: {},
        difficulty: job.aiAnalysis?.difficulty || 'beginner',
        category: job.aiAnalysis?.category || 'tech',
        estimatedLearningTime: 0
      };

      // Group skills by category
      const allSkills = job.requirements.skills;
      allSkills.forEach(skill => {
        const category = skill.skillId.category;
        if (!analysis.skillCategories[category]) {
          analysis.skillCategories[category] = [];
        }
        analysis.skillCategories[category].push(skill);
      });

      // Estimate learning time
      analysis.estimatedLearningTime = allSkills.length * 20; // 20 hours per skill average

      return analysis;
    } catch (error) {
      logger.error('Error analyzing job skills:', error);
      throw error;
    }
  }

  /**
   * Generate skill roadmap for specific job
   */
  async generateSkillRoadmapForJob(job, userProfile = null, duration = 8) {
    try {
      // Get user's current skills
      const userSkills = userProfile ? userProfile.skills.map(s => s.name.toLowerCase()) : [];
      
      // Identify skill gaps
      const skillGaps = [];
      job.requirements.skills.forEach(jobSkill => {
        const hasSkill = userSkills.some(userSkill => 
          userSkill.includes(jobSkill.skillId.name.toLowerCase())
        );
        
        if (!hasSkill) {
          skillGaps.push({
            skill: jobSkill.skillId.name,
            required: jobSkill.level === 'required',
            level: jobSkill.level,
            importance: jobSkill.importance || 5
          });
        }
      });

      // Generate roadmap using AI
      const roadmap = await this.generateSkillRoadmap(skillGaps, userProfile, duration);
      
      return {
        ...roadmap,
        skillGaps,
        targetJob: {
          title: job.title,
          company: job.companyId.name,
          category: job.aiAnalysis?.category
        },
        userProfile: userProfile ? {
          currentSkills: userSkills,
          education: userProfile.education?.fieldOfStudy,
          experience: userProfile.experience?.length || 0
        } : null
      };
    } catch (error) {
      logger.error('Error generating skill roadmap for job:', error);
      throw error;
    }
  }

  /**
   * Extract and analyze CV content
   */
  async analyzeCVContent(cvText, jobRequirements = null) {
    try {
      const analysis = {
        skills: await this.extractSkills(cvText),
        experience: this.extractExperience(cvText),
        education: this.extractEducation(cvText),
        contact: this.extractContactInfo(cvText),
        summary: this.extractSummary(cvText),
        embedding: await this.generateEmbedding(cvText)
      };

      if (jobRequirements) {
        analysis.matchScore = await this.calculateMatchScore(cvText, jobRequirements, analysis.skills);
        analysis.skillGaps = this.identifySkillGaps(analysis.skills, jobRequirements.skills || []);
      }

      return analysis;
    } catch (error) {
      logger.error('Error analyzing CV content:', error);
      throw error;
    }
  }

  /**
   * Extract experience information from CV text
   */
  extractExperience(cvText) {
    // Simple regex-based extraction
    const experiencePattern = /(?:experience|work|employment|job).*?(?:years?|months?)/gi;
    const matches = cvText.match(experiencePattern);
    
    return matches ? matches.map(match => ({ description: match.trim() })) : [];
  }

  /**
   * Extract education information from CV text
   */
  extractEducation(cvText) {
    const educationPattern = /(?:education|degree|university|college|bachelor|master|phd).*?(?:\.|$)/gi;
    const matches = cvText.match(educationPattern);
    
    return matches ? matches.map(match => ({ description: match.trim() })) : [];
  }

  /**
   * Extract contact information from CV text
   */
  extractContactInfo(cvText) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /(\+?[\d\s\-\(\)]{10,})/g;
    
    return {
      email: cvText.match(emailPattern) || [],
      phone: cvText.match(phonePattern) || []
    };
  }

  /**
   * Extract summary from CV text
   */
  extractSummary(cvText) {
    // Extract first paragraph as summary
    const paragraphs = cvText.split('\n\n').filter(p => p.trim().length > 50);
    return paragraphs[0] || cvText.substring(0, 200);
  }
}

module.exports = new AIService();
