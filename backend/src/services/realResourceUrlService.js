/**
 * Real Resource URL Service
 * 
 * Generate real, working URLs for learning resources based on skill names
 * 
 * Sources:
 * 1. Official Documentation (free, reliable)
 * 2. YouTube Search URLs (free, no API needed)
 * 3. Udemy/Coursera Search URLs (free, no API needed)
 * 4. GitHub Repositories (free)
 * 5. MDN Web Docs (free, reliable)
 */

const { logger } = require('../utils/logger');

class RealResourceUrlService {
  constructor() {
    // Official documentation URLs mapping
    this.officialDocs = {
      'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'js': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'typescript': 'https://www.typescriptlang.org/docs/',
      'ts': 'https://www.typescriptlang.org/docs/',
      'python': 'https://docs.python.org/3/',
      'node.js': 'https://nodejs.org/docs/latest/api/',
      'nodejs': 'https://nodejs.org/docs/latest/api/',
      'node': 'https://nodejs.org/docs/latest/api/',
      'react': 'https://react.dev/',
      'reactjs': 'https://react.dev/',
      'vue': 'https://vuejs.org/guide/',
      'vuejs': 'https://vuejs.org/guide/',
      'angular': 'https://angular.io/docs',
      'express': 'https://expressjs.com/',
      'django': 'https://docs.djangoproject.com/',
      'flask': 'https://flask.palletsprojects.com/',
      'mongodb': 'https://www.mongodb.com/docs/',
      'postgresql': 'https://www.postgresql.org/docs/',
      'postgres': 'https://www.postgresql.org/docs/',
      'mysql': 'https://dev.mysql.com/doc/',
      'redis': 'https://redis.io/docs/',
      'docker': 'https://docs.docker.com/',
      'kubernetes': 'https://kubernetes.io/docs/',
      'k8s': 'https://kubernetes.io/docs/',
      'aws': 'https://docs.aws.amazon.com/',
      'git': 'https://git-scm.com/doc',
      'html': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
      'css': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
      'java': 'https://docs.oracle.com/javase/',
      'c++': 'https://en.cppreference.com/',
      'cpp': 'https://en.cppreference.com/',
      'go': 'https://go.dev/doc/',
      'golang': 'https://go.dev/doc/',
      'rust': 'https://doc.rust-lang.org/',
      'php': 'https://www.php.net/docs.php',
      'ruby': 'https://ruby-doc.org/',
      'swift': 'https://docs.swift.org/',
      'kotlin': 'https://kotlinlang.org/docs/',
    };

    // YouTube search URLs (will redirect to search results)
    this.youtubeBaseUrl = 'https://www.youtube.com/results?search_query=';
    
    // Udemy search URLs
    this.udemyBaseUrl = 'https://www.udemy.com/courses/search/?q=';
    
    // Coursera search URLs
    this.courseraBaseUrl = 'https://www.coursera.org/search?query=';
    
    // GitHub search URLs
    this.githubBaseUrl = 'https://github.com/search?q=';
    
    // FreeCodeCamp
    this.freecodecampBaseUrl = 'https://www.freecodecamp.org/learn/';
  }

  /**
   * Get official documentation URL for a skill
   * @param {string} skill - Skill name
   * @returns {string|null} Official docs URL or null
   */
  getOfficialDocsUrl(skill) {
    if (!skill || typeof skill !== 'string') return null;
    
    const normalized = skill.toLowerCase().trim();
    
    // Direct match
    if (this.officialDocs[normalized]) {
      return this.officialDocs[normalized];
    }
    
    // Try removing common suffixes
    const withoutJs = normalized.replace(/\.js$/, '');
    if (this.officialDocs[withoutJs]) {
      return this.officialDocs[withoutJs];
    }
    
    // Try removing spaces and special chars
    const cleaned = normalized.replace(/[^a-z0-9]/g, '');
    if (this.officialDocs[cleaned]) {
      return this.officialDocs[cleaned];
    }
    
    return null;
  }

  /**
   * Generate YouTube search URL
   * @param {string} skill - Skill name
   * @param {string} difficulty - Difficulty level
   * @param {string} type - Resource type (tutorial, course, etc.)
   * @returns {string} YouTube search URL
   */
  getYouTubeUrl(skill, difficulty = 'beginner', type = 'tutorial') {
    if (!skill) return 'https://www.youtube.com/';
    
    const query = encodeURIComponent(
      `${skill} ${difficulty} ${type} full course`
    );
    return `${this.youtubeBaseUrl}${query}`;
  }

  /**
   * Generate Udemy search URL
   * @param {string} skill - Skill name
   * @param {string} difficulty - Difficulty level
   * @returns {string} Udemy search URL
   */
  getUdemyUrl(skill, difficulty = 'beginner') {
    if (!skill) return 'https://www.udemy.com/';
    
    const query = encodeURIComponent(`${skill} ${difficulty}`);
    return `${this.udemyBaseUrl}${query}`;
  }

  /**
   * Generate Coursera search URL
   * @param {string} skill - Skill name
   * @returns {string} Coursera search URL
   */
  getCourseraUrl(skill) {
    if (!skill) return 'https://www.coursera.org/';
    
    const query = encodeURIComponent(skill);
    return `${this.courseraBaseUrl}${query}`;
  }

  /**
   * Generate GitHub search URL for learning resources
   * @param {string} skill - Skill name
   * @returns {string} GitHub search URL
   */
  getGitHubUrl(skill) {
    if (!skill) return 'https://github.com/';
    
    const query = encodeURIComponent(`awesome ${skill} learning`);
    return `${this.githubBaseUrl}${query}&type=repositories`;
  }

  /**
   * Generate FreeCodeCamp URL
   * @param {string} skill - Skill name
   * @returns {string} FreeCodeCamp URL
   */
  getFreeCodeCampUrl(skill) {
    // FreeCodeCamp has specific paths for different topics
    const skillMap = {
      'javascript': 'javascript-algorithms-and-data-structures',
      'js': 'javascript-algorithms-and-data-structures',
      'python': 'scientific-computing-with-python',
      'html': 'responsive-web-design',
      'css': 'responsive-web-design',
      'react': 'front-end-development-libraries',
      'node': 'back-end-development-and-apis',
      'node.js': 'back-end-development-and-apis',
      'nodejs': 'back-end-development-and-apis',
    };
    
    const normalized = skill.toLowerCase().trim();
    const path = skillMap[normalized] || skillMap[normalized.replace(/\.js$/, '')];
    
    if (path) {
      return `${this.freecodecampBaseUrl}${path}/`;
    }
    
    return 'https://www.freecodecamp.org/learn/';
  }

  /**
   * Get real URL for a resource type
   * @param {Object} params - Resource parameters
   * @param {string} params.skill - Skill name
   * @param {string} params.type - Resource type (course, video, documentation, article)
   * @param {string} params.difficulty - Difficulty level
   * @param {string} params.provider - Provider name (optional)
   * @returns {string} Real URL
   */
  getRealUrl({ skill, type, difficulty = 'beginner', provider }) {
    if (!skill || typeof skill !== 'string') {
      return '#';
    }

    const normalizedSkill = skill.toLowerCase().trim();

    // Official documentation (highest priority)
    if (type === 'documentation') {
      const officialUrl = this.getOfficialDocsUrl(normalizedSkill);
      if (officialUrl) {
        return officialUrl;
      }
      // Fallback to MDN search
      return `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skill)}`;
    }

    // Video resources
    if (type === 'video') {
      if (provider && provider.toLowerCase().includes('youtube')) {
        return this.getYouTubeUrl(normalizedSkill, difficulty, 'tutorial');
      }
      // Default to YouTube
      return this.getYouTubeUrl(normalizedSkill, difficulty, 'tutorial');
    }

    // Course resources
    if (type === 'course') {
      if (provider) {
        const providerLower = provider.toLowerCase();
        if (providerLower.includes('udemy')) {
          return this.getUdemyUrl(normalizedSkill, difficulty);
        }
        if (providerLower.includes('coursera')) {
          return this.getCourseraUrl(normalizedSkill);
        }
        if (providerLower.includes('freecodecamp') || providerLower.includes('free code camp')) {
          return this.getFreeCodeCampUrl(normalizedSkill);
        }
      }
      // Default to Udemy
      return this.getUdemyUrl(normalizedSkill, difficulty);
    }

    // Article resources
    // Skip articles - we don't have curated articles, so avoid search URLs
    // Return official docs instead if available
    if (type === 'article') {
      const officialUrl = this.getOfficialDocsUrl(normalizedSkill);
      return officialUrl || null; // Don't return search URLs
    }

    // Tutorial resources
    if (type === 'tutorial') {
      return this.getYouTubeUrl(normalizedSkill, difficulty, 'tutorial');
    }

    // Default: return official docs or search
    const officialUrl = this.getOfficialDocsUrl(normalizedSkill);
    return officialUrl || this.getYouTubeUrl(normalizedSkill, difficulty);
  }
}

module.exports = new RealResourceUrlService();

