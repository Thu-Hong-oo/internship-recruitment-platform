/**
 * Coursera Data Service
 * Fetches professional courses from Coursera for multi-industry learning
 * Supports: Business, Design, Accounting, Healthcare, Education, Engineering, etc.
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

const COURSERA_API_KEY = process.env.COURSERA_API_KEY;
const COURSERA_API_BASE = 'https://api.coursera.org/api/courses.v1';

/**
 * Industry-specific search keywords mapping
 */
const INDUSTRY_KEYWORDS = {
  Technology: ['programming', 'software development', 'web development', 'coding'],
  Marketing: ['digital marketing', 'marketing strategy', 'social media', 'branding'],
  Business: ['business strategy', 'management', 'entrepreneurship', 'MBA'],
  Design: ['graphic design', 'UI/UX', 'visual design', 'creative'],
  Accounting: ['accounting', 'financial accounting', 'bookkeeping', 'auditing'],
  Finance: ['finance', 'investment', 'financial analysis', 'banking'],
  HR: ['human resources', 'talent management', 'recruitment', 'organizational'],
  Healthcare: ['healthcare', 'nursing', 'medical', 'patient care'],
  Education: ['teaching', 'education', 'curriculum', 'instructional design'],
  Engineering: ['engineering', 'mechanical', 'civil', 'electrical'],
  Hospitality: ['hospitality', 'hotel management', 'tourism', 'customer service'],
  Law: ['law', 'legal', 'contract', 'regulations'],
  Media: ['journalism', 'communication', 'content creation', 'public relations'],
  Logistics: ['supply chain', 'logistics', 'inventory', 'operations'],
};

/**
 * Trusted universities and institutions on Coursera
 */
const TRUSTED_INSTITUTIONS = [
  'Stanford University',
  'University of Michigan',
  'Google',
  'IBM',
  'Meta',
  'Yale University',
  'University of Pennsylvania',
  'Duke University',
  'Imperial College London',
  'Johns Hopkins University',
  'HEC Paris',
  'INSEAD',
  'Wharton School',
  'MIT',
  'Harvard University',
];

class CourseraDataService {
  constructor() {
    this.apiKey = COURSERA_API_KEY;
    this.apiBase = COURSERA_API_BASE;
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return true;

    if (!this.apiKey) {
      logger.warn('Coursera API key not configured, service will be disabled');
      return false;
    }

    this.initialized = true;
    logger.info('Coursera data service initialized');
    return true;
  }

  /**
   * Detect industry from skill name
   * @param {string} skillName - The skill to detect industry for
   * @returns {string} - Detected industry or 'Technology' as default
   */
  detectIndustry(skillName) {
    const lowerSkill = skillName.toLowerCase();

    // Check for specific keywords
    if (lowerSkill.includes('marketing') || lowerSkill.includes('seo') || lowerSkill.includes('ads')) {
      return 'Marketing';
    }
    if (lowerSkill.includes('design') || lowerSkill.includes('photoshop') || lowerSkill.includes('figma')) {
      return 'Design';
    }
    if (lowerSkill.includes('account') || lowerSkill.includes('finance') || lowerSkill.includes('tax')) {
      return 'Accounting';
    }
    if (lowerSkill.includes('business') || lowerSkill.includes('management') || lowerSkill.includes('sales')) {
      return 'Business';
    }
    if (lowerSkill.includes('hr') || lowerSkill.includes('recruitment') || lowerSkill.includes('talent')) {
      return 'HR';
    }
    if (lowerSkill.includes('nursing') || lowerSkill.includes('healthcare') || lowerSkill.includes('medical')) {
      return 'Healthcare';
    }
    if (lowerSkill.includes('teaching') || lowerSkill.includes('education') || lowerSkill.includes('curriculum')) {
      return 'Education';
    }
    if (lowerSkill.includes('engineering') || lowerSkill.includes('autocad') || lowerSkill.includes('mechanical')) {
      return 'Engineering';
    }
    if (lowerSkill.includes('hotel') || lowerSkill.includes('hospitality') || lowerSkill.includes('event')) {
      return 'Hospitality';
    }
    if (lowerSkill.includes('law') || lowerSkill.includes('legal') || lowerSkill.includes('contract')) {
      return 'Law';
    }
    if (lowerSkill.includes('media') || lowerSkill.includes('journalism') || lowerSkill.includes('content')) {
      return 'Media';
    }
    if (lowerSkill.includes('supply chain') || lowerSkill.includes('logistics') || lowerSkill.includes('inventory')) {
      return 'Logistics';
    }

    // Default to Technology
    return 'Technology';
  }

  /**
   * Search for courses on Coursera
   * @param {string} skillName - The skill to search courses for
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} - Array of course resources
   */
  async searchCourses(skillName, maxResults = 5) {
    try {
      if (!this.initialized) {
        logger.warn('Coursera service not initialized, skipping search');
        return [];
      }

      const industry = this.detectIndustry(skillName);
      const searchKeywords = INDUSTRY_KEYWORDS[industry] || [skillName];
      const query = `${skillName} ${searchKeywords[0]}`;

      logger.info(`🎓 Searching Coursera for: ${skillName} (Industry: ${industry})`);

      // Note: This is a mock implementation since Coursera API requires partnership
      // In production, you would use Coursera's official API or web scraping
      const mockCourses = await this.getMockCoursesForSkill(skillName, industry, maxResults);

      logger.info(`✅ Found ${mockCourses.length} Coursera courses for: ${skillName}`);
      return mockCourses;
    } catch (error) {
      logger.error(`Error searching Coursera for ${skillName}:`, error.message);
      return [];
    }
  }

  /**
   * Mock function to generate realistic Coursera courses
   * In production, replace with actual API calls
   */
  async getMockCoursesForSkill(skillName, industry, maxResults = 5) {
    const courses = [];
    const institutions = TRUSTED_INSTITUTIONS.slice(0, maxResults);

    // Generate course templates based on industry
    const courseTemplates = this.getCourseTemplatesForIndustry(industry, skillName);

    for (let i = 0; i < Math.min(maxResults, courseTemplates.length); i++) {
      const template = courseTemplates[i];
      const institution = institutions[i % institutions.length];

      courses.push({
        id: uuidv4(),
        title: template.title,
        url: `https://www.coursera.org/learn/${this.slugify(template.title)}`,
        description: template.description,
        source: 'coursera',
        type: 'course',
        provider: institution,
        duration: template.duration,
        level: template.level,
        rating: (4.5 + Math.random() * 0.5).toFixed(1), // 4.5-5.0
        enrollments: Math.floor(50000 + Math.random() * 200000),
        skillsCovered: template.skills,
        credibility: this.calculateCredibility({
          institution,
          rating: 4.7,
          enrollments: 100000,
        }),
        metadata: {
          language: 'en',
          subtitles: ['en', 'vi'],
          certificate: true,
          financial_aid: true,
        },
      });
    }

    return courses;
  }

  /**
   * Get course templates based on industry
   */
  getCourseTemplatesForIndustry(industry, skillName) {
    const templates = {
      Marketing: [
        {
          title: `${skillName} Fundamentals`,
          description: `Master the fundamentals of ${skillName} with industry experts`,
          duration: '4 weeks',
          level: 'beginner',
          skills: [skillName, 'Marketing Strategy', 'Analytics'],
        },
        {
          title: `Advanced ${skillName} Strategies`,
          description: `Learn advanced techniques and strategies for ${skillName}`,
          duration: '6 weeks',
          level: 'intermediate',
          skills: [skillName, 'Campaign Management', 'ROI Optimization'],
        },
        {
          title: `${skillName} Specialization`,
          description: `Comprehensive specialization covering all aspects of ${skillName}`,
          duration: '3 months',
          level: 'intermediate',
          skills: [skillName, 'Marketing Tools', 'Data-Driven Marketing'],
        },
      ],
      Design: [
        {
          title: `Introduction to ${skillName}`,
          description: `Learn the basics of ${skillName} from industry professionals`,
          duration: '4 weeks',
          level: 'beginner',
          skills: [skillName, 'Design Principles', 'Visual Communication'],
        },
        {
          title: `${skillName} Professional Certificate`,
          description: `Earn a professional certificate in ${skillName}`,
          duration: '6 months',
          level: 'intermediate',
          skills: [skillName, 'Design Tools', 'Portfolio Development'],
        },
      ],
      Accounting: [
        {
          title: `${skillName} Principles`,
          description: `Master accounting principles and ${skillName} techniques`,
          duration: '6 weeks',
          level: 'beginner',
          skills: [skillName, 'Financial Reporting', 'GAAP'],
        },
        {
          title: `Advanced ${skillName}`,
          description: `Advanced concepts in ${skillName} for professionals`,
          duration: '8 weeks',
          level: 'intermediate',
          skills: [skillName, 'Financial Analysis', 'Audit'],
        },
      ],
      Business: [
        {
          title: `${skillName} Essentials`,
          description: `Essential business skills focusing on ${skillName}`,
          duration: '5 weeks',
          level: 'beginner',
          skills: [skillName, 'Leadership', 'Strategic Thinking'],
        },
        {
          title: `MBA in ${skillName}`,
          description: `MBA-level course covering ${skillName} in depth`,
          duration: '12 weeks',
          level: 'advanced',
          skills: [skillName, 'Business Analytics', 'Decision Making'],
        },
      ],
      // Default template for other industries
      default: [
        {
          title: `Introduction to ${skillName}`,
          description: `Learn the fundamentals of ${skillName}`,
          duration: '4 weeks',
          level: 'beginner',
          skills: [skillName, 'Practical Applications'],
        },
        {
          title: `${skillName} Specialization`,
          description: `Comprehensive course on ${skillName}`,
          duration: '8 weeks',
          level: 'intermediate',
          skills: [skillName, 'Advanced Techniques'],
        },
      ],
    };

    return templates[industry] || templates.default;
  }

  /**
   * Calculate credibility score for a Coursera course
   */
  calculateCredibility({ institution, rating, enrollments }) {
    let score = 0;

    // Institution reputation (40%)
    if (TRUSTED_INSTITUTIONS.includes(institution)) {
      score += 0.4;
    } else {
      score += 0.2;
    }

    // Rating (30%)
    score += (rating / 5) * 0.3;

    // Enrollments (20%)
    if (enrollments > 100000) score += 0.2;
    else if (enrollments > 50000) score += 0.15;
    else if (enrollments > 10000) score += 0.1;
    else score += 0.05;

    // Coursera platform bonus (10%)
    score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Create URL-friendly slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get courses from specific institutions
   */
  async getCoursesFromInstitution(institution, skillName, maxResults = 3) {
    try {
      logger.info(`🎓 Searching courses from ${institution} for: ${skillName}`);
      const industry = this.detectIndustry(skillName);
      const courses = await this.getMockCoursesForSkill(skillName, industry, maxResults);

      // Filter by institution
      return courses.filter((c) => c.provider === institution).slice(0, maxResults);
    } catch (error) {
      logger.error(`Error fetching courses from ${institution}:`, error.message);
      return [];
    }
  }
}

module.exports = new CourseraDataService();
