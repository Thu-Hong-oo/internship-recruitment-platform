/**
 * Curated Resources Database
 * 
 * Database của các learning resources cụ thể, đã được verify:
 * - Direct URLs đến courses/videos/articles cụ thể
 * - Không phải search URLs
 * - Chất lượng cao, phổ biến
 * 
 * Sources:
 * - Popular courses trên Udemy, Coursera, edX
 * - High-quality YouTube channels và playlists
 * - Official documentation
 * - Reputable tech blogs và tutorials
 */

const { logger } = require('../../utils/logger');
const additionalResources = require('./curatedResourcesExtensions');

class CuratedResourcesDatabase {
  constructor() {
    // Curated resources database
    // Format: { skill: { type: [{ title, url, provider, ... }] } }
    this.resources = {
      'node.js': {
        course: [
          {
            title: 'The Complete Node.js Developer Course (3rd Edition)',
            url: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/',
            provider: 'Udemy',
            instructor: 'Andrew Mead',
            rating: 4.7,
            students: 200000,
            duration: '35 hours',
            difficulty: 'beginner',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
          {
            title: 'Node.js, Express, MongoDB & More: The Complete Bootcamp',
            url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/',
            provider: 'Udemy',
            instructor: 'Jonas Schmedtmann',
            rating: 4.8,
            students: 150000,
            duration: '40 hours',
            difficulty: 'intermediate',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'Node.js Tutorial for Beginners: Learn Node in 1 Hour',
            url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
            provider: 'YouTube - Programming with Mosh',
            channel: 'Programming with Mosh',
            views: 2000000,
            duration: '1 hour',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.8,
          },
          {
            title: 'Node.js Full Course for Beginners',
            url: 'https://www.youtube.com/watch?v=Oe421EPjBE4',
            provider: 'YouTube - freeCodeCamp.org',
            channel: 'freeCodeCamp.org',
            views: 5000000,
            duration: '8 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.9,
          },
        ],
        documentation: [
          {
            title: 'Node.js Official Documentation',
            url: 'https://nodejs.org/docs/latest/api/',
            provider: 'Node.js Foundation',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
          {
            title: 'Node.js Best Practices',
            url: 'https://github.com/goldbergyoni/nodebestpractices',
            provider: 'GitHub - Node.js Best Practices',
            difficulty: 'advanced',
            isFree: true,
            rating: 4.9,
          },
        ],
      },
      'python': {
        course: [
          {
            title: 'Complete Python Bootcamp From Zero to Hero in Python',
            url: 'https://www.udemy.com/course/complete-python-bootcamp/',
            provider: 'Udemy',
            instructor: 'Jose Portilla',
            rating: 4.6,
            students: 1500000,
            duration: '22 hours',
            difficulty: 'beginner',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
          {
            title: 'Python for Everybody Specialization',
            url: 'https://www.coursera.org/specializations/python',
            provider: 'Coursera',
            instructor: 'Charles Severance',
            rating: 4.8,
            students: 500000,
            duration: '7 months',
            difficulty: 'beginner',
            isFree: true, // Audit option
            estimatedCost: 49, // Certificate
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'Python Tutorial - Python for Beginners [Full Course]',
            url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
            provider: 'YouTube - Programming with Mosh',
            channel: 'Programming with Mosh',
            views: 15000000,
            duration: '6 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.9,
          },
          {
            title: 'Python for Beginners - Full Course',
            url: 'https://www.youtube.com/watch?v=eIrMbAQSU34',
            provider: 'YouTube - freeCodeCamp.org',
            channel: 'freeCodeCamp.org',
            views: 8000000,
            duration: '4.5 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.8,
          },
        ],
        documentation: [
          {
            title: 'Python Official Documentation',
            url: 'https://docs.python.org/3/',
            provider: 'Python Software Foundation',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
          {
            title: 'Real Python Tutorials',
            url: 'https://realpython.com/',
            provider: 'Real Python',
            difficulty: 'intermediate',
            isFree: true, // Some free, some paid
            rating: 4.9,
          },
        ],
      },
      'postgresql': {
        course: [
          {
            title: 'The Complete PostgreSQL Bootcamp',
            url: 'https://www.udemy.com/course/the-complete-postgresql-bootcamp/',
            provider: 'Udemy',
            instructor: 'Jose Portilla',
            rating: 4.7,
            students: 50000,
            duration: '12 hours',
            difficulty: 'beginner',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'PostgreSQL Tutorial for Beginners',
            url: 'https://www.youtube.com/watch?v=qw--VYLpxG4',
            provider: 'YouTube - freeCodeCamp.org',
            channel: 'freeCodeCamp.org',
            views: 500000,
            duration: '4 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.7,
          },
        ],
        documentation: [
          {
            title: 'PostgreSQL Official Documentation',
            url: 'https://www.postgresql.org/docs/',
            provider: 'PostgreSQL Global Development Group',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
        ],
      },
      'mongodb': {
        course: [
          {
            title: 'MongoDB - The Complete Developer\'s Guide',
            url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/',
            provider: 'Udemy',
            instructor: 'Maximilian Schwarzmüller',
            rating: 4.7,
            students: 100000,
            duration: '15 hours',
            difficulty: 'intermediate',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'MongoDB Full Course',
            url: 'https://www.youtube.com/watch?v=ofme2WS29Ww',
            provider: 'YouTube - freeCodeCamp.org',
            channel: 'freeCodeCamp.org',
            views: 800000,
            duration: '5 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.8,
          },
        ],
        documentation: [
          {
            title: 'MongoDB Official Documentation',
            url: 'https://www.mongodb.com/docs/',
            provider: 'MongoDB Inc.',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
        ],
      },
      'redis': {
        course: [
          {
            title: 'Redis - The Complete Developer\'s Guide',
            url: 'https://www.udemy.com/course/redis-the-complete-developers-guide/',
            provider: 'Udemy',
            instructor: 'Stephen Grider',
            rating: 4.6,
            students: 30000,
            duration: '8 hours',
            difficulty: 'intermediate',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'Redis Tutorial for Beginners',
            url: 'https://www.youtube.com/watch?v=G1rOthIU-uo',
            provider: 'YouTube - Traversy Media',
            channel: 'Traversy Media',
            views: 200000,
            duration: '1 hour',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.6,
          },
        ],
        documentation: [
          {
            title: 'Redis Official Documentation',
            url: 'https://redis.io/docs/',
            provider: 'Redis Ltd.',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
        ],
      },
      'docker': {
        course: [
          {
            title: 'Docker & Kubernetes: The Practical Guide',
            url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/',
            provider: 'Udemy',
            instructor: 'Maximilian Schwarzmüller',
            rating: 4.7,
            students: 80000,
            duration: '20 hours',
            difficulty: 'intermediate',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'Docker Tutorial for Beginners',
            url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
            provider: 'YouTube - freeCodeCamp.org',
            channel: 'freeCodeCamp.org',
            views: 2000000,
            duration: '2 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.8,
          },
        ],
        documentation: [
          {
            title: 'Docker Official Documentation',
            url: 'https://docs.docker.com/',
            provider: 'Docker Inc.',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
        ],
      },
      'kubernetes': {
        course: [
          {
            title: 'Kubernetes for the Absolute Beginners - Hands-on',
            url: 'https://www.udemy.com/course/learn-kubernetes/',
            provider: 'Udemy',
            instructor: 'Mumshad Mannambeth',
            rating: 4.6,
            students: 100000,
            duration: '5 hours',
            difficulty: 'beginner',
            isFree: false,
            estimatedCost: 19.99,
            certificateOffered: true,
          },
        ],
        video: [
          {
            title: 'Kubernetes Tutorial for Beginners',
            url: 'https://www.youtube.com/watch?v=X48VuDVv0do',
            provider: 'YouTube - TechWorld with Nana',
            channel: 'TechWorld with Nana',
            views: 1500000,
            duration: '2 hours',
            difficulty: 'beginner',
            isFree: true,
            rating: 4.7,
          },
        ],
        documentation: [
          {
            title: 'Kubernetes Official Documentation',
            url: 'https://kubernetes.io/docs/',
            provider: 'Cloud Native Computing Foundation',
            difficulty: 'intermediate',
            isFree: true,
            rating: 5.0,
          },
        ],
      },
    };
    
    // Merge additional resources from extensions
    Object.assign(this.resources, additionalResources);
    
    logger.info('Curated Resources Database initialized', {
      totalSkills: Object.keys(this.resources).length,
      skills: Object.keys(this.resources).join(', ')
    });
  }

  /**
   * Normalize skill name for lookup
   * @param {string} skill - Skill name
   * @returns {string} Normalized skill name
   */
  normalizeSkill(skill) {
    if (!skill || typeof skill !== 'string') return null;
    
    const normalized = skill.toLowerCase().trim();
    
    // Handle variations
    const aliases = {
      'node': 'node.js',
      'nodejs': 'node.js',
      'postgres': 'postgresql',
      'k8s': 'kubernetes',
      'js': 'javascript',
      'ts': 'typescript',
      // UI/UX Design tools
      'figma design tool': 'figma',
      'figma design': 'figma',
      'adobe xd design tool': 'adobe xd',
      'adobe xd design': 'adobe xd',
      'xd': 'adobe xd',
      'sketch design tool': 'sketch',
      'sketch app': 'sketch',
      'design system': 'design systems',
      // Frontend
      'reactjs': 'react',
      'react.js': 'react',
      'vuejs': 'vue',
      'vue.js': 'vue',
      // Backend
      'expressjs': 'express',
      'express.js': 'express',
      // Databases
      'mongo': 'mongodb',
    };
    
    return aliases[normalized] || normalized;
  }

  /**
   * Get curated resources for a skill
   * @param {string} skill - Skill name
   * @param {string} type - Resource type (course, video, documentation, article)
   * @param {string} difficulty - Difficulty level (beginner, intermediate, advanced)
   * @param {number} limit - Maximum number of resources to return
   * @returns {Array} Array of curated resources
   */
  getResources(skill, type, difficulty = 'beginner', limit = 3) {
    const normalizedSkill = this.normalizeSkill(skill);
    
    if (!normalizedSkill || !this.resources[normalizedSkill]) {
      return [];
    }
    
    const skillResources = this.resources[normalizedSkill];
    
    if (!skillResources[type] || !Array.isArray(skillResources[type])) {
      return [];
    }
    
    // Filter by difficulty if specified
    let filtered = skillResources[type];
    if (difficulty) {
      filtered = filtered.filter(r => {
        if (!r.difficulty) return true; // No difficulty = suitable for all
        
        // Match logic:
        // - beginner: show beginner only
        // - intermediate: show beginner + intermediate
        // - advanced: show all (beginner + intermediate + advanced)
        if (difficulty === 'beginner') {
          return r.difficulty === 'beginner';
        } else if (difficulty === 'intermediate') {
          return r.difficulty === 'beginner' || r.difficulty === 'intermediate';
        } else if (difficulty === 'advanced') {
          return true; // Show all levels for advanced users
        }
        return r.difficulty === difficulty;
      });
    }
    
    // Sort by rating (highest first)
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    // Return limited results
    return filtered.slice(0, limit);
  }

  /**
   * Get best resource for a skill (highest rated)
   * @param {string} skill - Skill name
   * @param {string} type - Resource type
   * @param {string} difficulty - Difficulty level
   * @returns {Object|null} Best resource or null
   */
  getBestResource(skill, type, difficulty = 'beginner') {
    const resources = this.getResources(skill, type, difficulty, 1);
    return resources.length > 0 ? resources[0] : null;
  }

  /**
   * Check if skill has curated resources
   * @param {string} skill - Skill name
   * @returns {boolean} True if resources exist
   */
  hasResources(skill) {
    const normalizedSkill = this.normalizeSkill(skill);
    return normalizedSkill && !!this.resources[normalizedSkill];
  }
}

module.exports = new CuratedResourcesDatabase();

