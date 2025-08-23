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
        User background: ${userProfile.education?.fieldOfStudy || 'General'}
        
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
}

module.exports = new AIService();
