/**
 * Khan Academy API Service
 * 
 * Fetch courses from Khan Academy
 * 100% FREE, NO API KEY REQUIRED!
 * Supports ALL industries: Math, Science, Arts, Economics, etc.
 * 
 * API: https://www.khanacademy.org/api/v1/
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');

class KhanAcademyApiService {
  constructor() {
    this.baseUrl = 'https://www.khanacademy.org/api/v1';
    this.isAvailable = true; // Always available, no API key needed
    logger.info('Khan Academy API Service initialized (no API key required)');
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Map industry to Khan Academy topics
   */
  _getIndustryTopics(industry) {
    const industryMap = {
      // Technology
      'technology': ['computing', 'computer-programming'],
      'software-development': ['computing', 'computer-programming'],
      'web-development': ['computing', 'computer-programming'],
      
      // Healthcare
      'healthcare': ['health-and-medicine', 'biology'],
      'medicine': ['health-and-medicine', 'biology'],
      'nursing': ['health-and-medicine', 'biology'],
      
      // Business
      'business': ['economics-finance-domain', 'microeconomics'],
      'marketing': ['economics-finance-domain'],
      'finance': ['economics-finance-domain', 'finance'],
      'accounting': ['economics-finance-domain', 'accounting'],
      
      // Engineering
      'engineering': ['physics', 'chemistry', 'math'],
      'civil-engineering': ['physics', 'math'],
      'mechanical-engineering': ['physics', 'math'],
      'electrical-engineering': ['physics', 'math'],
      
      // Education
      'education': ['teacher-resources', 'math', 'science'],
      
      // Arts
      'arts': ['humanities', 'art-history'],
      'design': ['humanities', 'art-history'],
      
      // Science
      'science': ['science', 'biology', 'chemistry', 'physics'],
      'biology': ['biology'],
      'chemistry': ['chemistry'],
      'physics': ['physics'],
      
      // Math
      'mathematics': ['math'],
      'statistics': ['statistics-probability'],
      
      // Economics
      'economics': ['economics-finance-domain'],
    };

    // Normalize industry code
    const normalized = (industry || '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Try exact match first
    if (industryMap[normalized]) {
      return industryMap[normalized];
    }

    // Try partial match
    for (const [key, topics] of Object.entries(industryMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return topics;
      }
    }

    // Default: return general topics
    return ['math', 'science', 'computing'];
  }

  /**
   * Map skill to Khan Academy subject
   */
  _mapSkillToSubject(skill) {
    const skillMap = {
      // Programming
      'javascript': 'computing',
      'python': 'computing',
      'java': 'computing',
      'react': 'computing',
      'node.js': 'computing',
      
      // Math
      'calculus': 'math',
      'algebra': 'math',
      'statistics': 'statistics-probability',
      
      // Science
      'biology': 'biology',
      'chemistry': 'chemistry',
      'physics': 'physics',
      
      // Business
      'economics': 'economics-finance-domain',
      'finance': 'finance',
      'accounting': 'accounting',
    };

    const normalized = skill.toLowerCase().trim();
    return skillMap[normalized] || 'computing'; // Default to computing
  }

  /**
   * Search for topics/courses by skill and industry
   * 
   * @param {string} skill - Skill name
   * @param {string} industry - Industry code (optional)
   * @param {string} difficulty - Difficulty level
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of course resources
   */
  async searchTopics(skill, industry = null, difficulty = 'beginner', maxResults = 10) {
    if (!this.isServiceAvailable()) {
      return [];
    }

    try {
      // Determine subject from skill or industry
      let subject = this._mapSkillToSubject(skill);
      
      if (industry) {
        const industryTopics = this._getIndustryTopics(industry);
        if (industryTopics && industryTopics.length > 0) {
          subject = industryTopics[0]; // Use first topic
        }
      }

      // Get topics in this subject
      const topicsResponse = await axios.get(`${this.baseUrl}/topic/${subject}`);
      
      if (!topicsResponse.data || !topicsResponse.data.children) {
        logger.info(`No Khan Academy topics found for subject: ${subject}`);
        return [];
      }

      // Get courses from topics
      const courses = [];
      const topics = topicsResponse.data.children.slice(0, 5); // Limit topics

      for (const topic of topics) {
        try {
          const exercisesResponse = await axios.get(`${this.baseUrl}/topic/${topic.slug}/exercises`);
          
          if (exercisesResponse.data && exercisesResponse.data.length > 0) {
            exercisesResponse.data.slice(0, 3).forEach(exercise => {
              courses.push({
                type: 'course',
                title: exercise.display_name || exercise.title || topic.title,
                url: `https://www.khanacademy.org${exercise.url || topic.url}`,
                provider: 'Khan Academy',
                subject: subject,
                topic: topic.title,
                description: exercise.description || topic.description || '',
                difficulty: difficulty,
                isFree: true,
                estimatedCost: 0,
                rating: 4.8, // Khan Academy has high ratings
                duration: 'Self-paced',
                recencyScore: 1.0, // Khan Academy content is maintained
              });
            });
          }
        } catch (error) {
          // Skip if topic doesn't have exercises
          continue;
        }

        if (courses.length >= maxResults) break;
      }

      logger.info(`Found ${courses.length} Khan Academy courses for: ${skill} (${industry || 'general'})`);
      return courses.slice(0, maxResults);

    } catch (error) {
      logger.error('Khan Academy API error:', error.message);
      return [];
    }
  }

  /**
   * Get all available subjects
   * 
   * @returns {Promise<Array>} Array of subjects
   */
  async getSubjects() {
    try {
      const response = await axios.get(`${this.baseUrl}/topictree`);
      return response.data.children || [];
    } catch (error) {
      logger.error('Khan Academy get subjects error:', error.message);
      return [];
    }
  }

  /**
   * Search by industry directly
   * 
   * @param {string} industry - Industry code
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of courses
   */
  async searchByIndustry(industry, maxResults = 10) {
    const topics = this._getIndustryTopics(industry);
    
    if (!topics || topics.length === 0) {
      return [];
    }

    const allCourses = [];
    
    for (const topic of topics) {
      try {
        const courses = await this.searchTopics('', null, 'beginner', maxResults);
        allCourses.push(...courses);
      } catch (error) {
        continue;
      }
    }

    return allCourses.slice(0, maxResults);
  }
}

module.exports = new KhanAcademyApiService();

