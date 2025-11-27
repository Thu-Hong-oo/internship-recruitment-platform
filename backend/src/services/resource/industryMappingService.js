/**
 * Industry Mapping Service
 * 
 * Map industries to appropriate API sources and search strategies
 * Adjust search queries based on industry context
 */

const { logger } = require('../../utils/logger');

class IndustryMappingService {
  constructor() {
    // Map industries to preferred API sources
    this.industryApiPreferences = {
      // Technology
      'technology': ['youtube', 'github', 'devto', 'stackoverflow', 'khanacademy'],
      'software-development': ['youtube', 'github', 'devto', 'stackoverflow'],
      'web-development': ['youtube', 'github', 'devto', 'stackoverflow'],
      
      // Healthcare
      'healthcare': ['youtube', 'khanacademy', 'coursera', 'edx'],
      'medicine': ['youtube', 'khanacademy', 'coursera', 'edx'],
      'nursing': ['youtube', 'khanacademy', 'coursera'],
      
      // Business
      'business': ['youtube', 'khanacademy', 'coursera', 'linkedin'],
      'marketing': ['youtube', 'coursera', 'linkedin'],
      'finance': ['youtube', 'khanacademy', 'coursera'],
      'accounting': ['youtube', 'khanacademy', 'coursera'],
      
      // Engineering
      'engineering': ['youtube', 'khanacademy', 'coursera', 'edx'],
      'civil-engineering': ['youtube', 'khanacademy', 'coursera'],
      'mechanical-engineering': ['youtube', 'khanacademy', 'coursera'],
      
      // Education
      'education': ['youtube', 'khanacademy', 'coursera', 'edx'],
      
      // Arts & Design
      'arts': ['youtube', 'skillshare', 'behance'],
      'design': ['youtube', 'skillshare', 'behance', 'dribbble'],
      
      // Science
      'science': ['youtube', 'khanacademy', 'coursera'],
      'biology': ['youtube', 'khanacademy', 'coursera'],
      'chemistry': ['youtube', 'khanacademy', 'coursera'],
      'physics': ['youtube', 'khanacademy', 'coursera'],
      
      // Mathematics
      'mathematics': ['youtube', 'khanacademy'],
      'statistics': ['youtube', 'khanacademy'],
      
      // Economics
      'economics': ['youtube', 'khanacademy', 'coursera'],
      
      // Legal
      'legal': ['youtube', 'coursera', 'edx'],
      
      // Hospitality
      'hospitality': ['youtube', 'coursera'],
      'culinary': ['youtube', 'masterclass'],
    };

    // Industry-specific search query modifiers
    this.industryQueryModifiers = {
      'healthcare': ['medical', 'health', 'clinical'],
      'medicine': ['medical', 'clinical', 'patient care'],
      'business': ['business', 'management', 'strategy'],
      'marketing': ['marketing', 'advertising', 'branding'],
      'finance': ['finance', 'investment', 'financial'],
      'engineering': ['engineering', 'technical', 'design'],
      'design': ['design', 'creative', 'visual'],
      'education': ['teaching', 'pedagogy', 'instruction'],
      'legal': ['law', 'legal', 'jurisprudence'],
    };
  }

  /**
   * Get preferred API sources for an industry
   * 
   * @param {string} industry - Industry code
   * @returns {Array} Array of preferred API source names
   */
  getPreferredApis(industry) {
    if (!industry) {
      // Default: return all available APIs
      return ['youtube', 'github', 'devto', 'stackoverflow', 'khanacademy', 'googlesearch'];
    }

    const normalized = industry.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Try exact match
    if (this.industryApiPreferences[normalized]) {
      return this.industryApiPreferences[normalized];
    }

    // Try partial match
    for (const [key, apis] of Object.entries(this.industryApiPreferences)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return apis;
      }
    }

    // Default: return universal APIs
    return ['youtube', 'khanacademy', 'googlesearch'];
  }

  /**
   * Enhance search query with industry context
   * 
   * @param {string} skill - Skill name
   * @param {string} industry - Industry code
   * @returns {string} Enhanced search query
   */
  enhanceSearchQuery(skill, industry) {
    if (!industry) {
      return skill;
    }

    const normalized = industry.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const modifiers = this.industryQueryModifiers[normalized] || [];

    if (modifiers.length > 0) {
      return `${skill} ${modifiers[0]}`;
    }

    return skill;
  }

  /**
   * Determine if API is suitable for industry
   * 
   * @param {string} apiName - API name (e.g., 'youtube', 'github')
   * @param {string} industry - Industry code
   * @returns {boolean} True if suitable
   */
  isApiSuitable(apiName, industry) {
    const preferred = this.getPreferredApis(industry);
    return preferred.includes(apiName.toLowerCase());
  }

  /**
   * Get industry-specific resource types
   * 
   * @param {string} industry - Industry code
   * @returns {Array} Preferred resource types
   */
  getPreferredResourceTypes(industry) {
    if (!industry) {
      return ['course', 'video', 'documentation', 'article'];
    }

    const normalized = industry.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Industry-specific preferences
    const typeMap = {
      'technology': ['course', 'video', 'documentation', 'article', 'project'],
      'software-development': ['course', 'video', 'documentation', 'project'],
      'design': ['video', 'course', 'article', 'project'],
      'business': ['course', 'article', 'video'],
      'marketing': ['course', 'article', 'video'],
      'healthcare': ['course', 'video', 'article'],
      'medicine': ['course', 'video', 'article'],
      'education': ['course', 'video', 'article'],
      'engineering': ['course', 'video', 'documentation'],
      'arts': ['video', 'course', 'article'],
    };

    return typeMap[normalized] || ['course', 'video', 'article'];
  }

  /**
   * Map industry to Khan Academy subject
   * 
   * @param {string} industry - Industry code
   * @returns {string} Khan Academy subject
   */
  mapToKhanAcademySubject(industry) {
    const mapping = {
      'technology': 'computing',
      'software-development': 'computing',
      'healthcare': 'health-and-medicine',
      'medicine': 'health-and-medicine',
      'business': 'economics-finance-domain',
      'finance': 'economics-finance-domain',
      'engineering': 'physics',
      'science': 'science',
      'mathematics': 'math',
      'education': 'teacher-resources',
    };

    const normalized = industry.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return mapping[normalized] || 'computing';
  }
}

module.exports = new IndustryMappingService();

