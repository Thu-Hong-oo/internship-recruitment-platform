const axios = require('axios');
const { logger } = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * GitHub Data Crawler Service
 * Fetches trending repositories and learning projects from GitHub
 * 
 * @description Provides verifiable, community-validated learning projects
 * @author Thu-Hong-oo
 * @date 2025-12-01
 */
class GitHubDataService {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN; // Optional, increases rate limit
    this.axiosInstance = null;
    this.initialized = false;
  }

  /**
   * Initialize GitHub API client
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Internship-Recruitment-Platform',
      };

      if (this.token) {
        headers['Authorization'] = `token ${this.token}`;
      }

      this.axiosInstance = axios.create({
        baseURL: this.baseURL,
        headers: headers,
        timeout: 10000,
      });

      this.initialized = true;
      logger.info('✅ GitHub Data Service initialized');
      return true;
    } catch (error) {
      logger.error('❌ GitHub API initialization failed:', error);
      return false;
    }
  }

  /**
   * Search repositories by skill/topic
   * @param {string} skill - Skill to search for (e.g., "React", "Python", "Machine Learning")
   * @param {Object} options - Search options
   */
  async searchRepositories(skill, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        maxResults = 10,
        difficulty = 'beginner', // beginner, intermediate, advanced
        language = null,
        minStars = 100,
      } = options;

      // Build search query
      let query = `${skill} ${this.getDifficultyKeywords(difficulty)}`;
      if (language) {
        query += ` language:${language}`;
      }
      query += ` stars:>${minStars}`;

      logger.info(`🔍 Searching GitHub for: "${query}"`);

      // Search repositories
      const response = await this.axiosInstance.get('/search/repositories', {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: maxResults * 2, // Get extra for filtering
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.warn(`⚠️ No repositories found for: ${query}`);
        return [];
      }

      // Format and filter results
      const repositories = [];
      for (const repo of response.data.items) {
        // Skip archived or outdated repos
        if (repo.archived) {
          continue;
        }

        const lastUpdated = new Date(repo.updated_at);
        const monthsSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24 * 30);
        
        // Skip repos not updated in 2+ years (likely outdated)
        if (monthsSinceUpdate > 24) {
          continue;
        }

        // Get additional repo details
        const repoDetails = await this.getRepositoryDetails(repo.full_name);
        
        // Calculate credibility score
        const credibility = this.calculateCredibility({
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          openIssues: repo.open_issues_count,
          hasReadme: repoDetails.hasReadme,
          hasLicense: repo.license !== null,
          monthsSinceUpdate: monthsSinceUpdate,
        });

        repositories.push({
          id: `github_${repo.id}_${uuidv4()}`,
          title: repo.name,
          description: repo.description || `${repo.name} - GitHub repository`,
          url: repo.html_url,
          type: 'project',
          skill: skill,
          difficulty: difficulty,
          duration: this.estimateDuration(repo.size, difficulty),
          source: 'github',
          provider: repo.owner.login,
          credibility: credibility,
          rating: Math.min((repo.stargazers_count / 10000) * 5, 5), // Convert to 1-5 scale
          popularity: repo.stargazers_count,
          metadata: {
            repoId: repo.id,
            fullName: repo.full_name,
            owner: repo.owner.login,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            openIssues: repo.open_issues_count,
            license: repo.license ? repo.license.name : null,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            topics: repo.topics || [],
            hasReadme: repoDetails.hasReadme,
            hasDocumentation: repoDetails.hasDocumentation,
          },
        });
      }

      // Sort by credibility and popularity
      repositories.sort((a, b) => {
        const scoreA = a.credibility * 0.6 + (a.popularity / 10000) * 0.4;
        const scoreB = b.credibility * 0.6 + (b.popularity / 10000) * 0.4;
        return scoreB - scoreA;
      });

      logger.info(`✅ Found ${repositories.length} high-quality repositories for: ${skill}`);
      return repositories.slice(0, maxResults);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logger.error('❌ GitHub API rate limit exceeded');
      } else {
        logger.error(`❌ GitHub search failed for: ${skill}`, error.message);
      }
      return [];
    }
  }

  /**
   * Get repository details (README, documentation)
   * @param {string} fullName - Repository full name (owner/repo)
   */
  async getRepositoryDetails(fullName) {
    try {
      const details = {
        hasReadme: false,
        hasDocumentation: false,
      };

      // Check for README
      try {
        await this.axiosInstance.get(`/repos/${fullName}/readme`);
        details.hasReadme = true;
      } catch (error) {
        // README not found
      }

      // Check for documentation
      try {
        const contentsResponse = await this.axiosInstance.get(`/repos/${fullName}/contents`);
        const files = contentsResponse.data.map(file => file.name.toLowerCase());
        details.hasDocumentation = files.some(name => 
          name.includes('docs') || 
          name.includes('documentation') || 
          name.includes('wiki')
        );
      } catch (error) {
        // Contents not accessible
      }

      return details;
    } catch (error) {
      logger.warn(`⚠️ Failed to get details for: ${fullName}`, error.message);
      return { hasReadme: false, hasDocumentation: false };
    }
  }

  /**
   * Get trending repositories by language
   * @param {string} language - Programming language (e.g., "JavaScript", "Python")
   * @param {string} skill - Specific skill to focus on
   */
  async getTrendingRepositories(language, skill, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const { maxResults = 10, difficulty = 'beginner' } = options;

      // Search for trending repos in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const query = `${skill} language:${language} created:>${dateStr} stars:>10`;

      logger.info(`🔍 Searching for trending repos: "${query}"`);

      const response = await this.axiosInstance.get('/search/repositories', {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: maxResults,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        // Fallback to general search
        return await this.searchRepositories(skill, { language, difficulty, maxResults });
      }

      const repositories = [];
      for (const repo of response.data.items) {
        if (repo.archived) continue;

        const repoDetails = await this.getRepositoryDetails(repo.full_name);
        const credibility = this.calculateCredibility({
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          openIssues: repo.open_issues_count,
          hasReadme: repoDetails.hasReadme,
          hasLicense: repo.license !== null,
          monthsSinceUpdate: 0, // New repos
        });

        repositories.push({
          id: `github_${repo.id}_${uuidv4()}`,
          title: repo.name,
          description: repo.description || `${repo.name} - Trending GitHub repository`,
          url: repo.html_url,
          type: 'project',
          skill: skill,
          difficulty: difficulty,
          duration: this.estimateDuration(repo.size, difficulty),
          source: 'github',
          provider: repo.owner.login,
          credibility: credibility,
          rating: Math.min((repo.stargazers_count / 1000) * 5, 5),
          popularity: repo.stargazers_count,
          metadata: {
            repoId: repo.id,
            fullName: repo.full_name,
            owner: repo.owner.login,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            trending: true,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
          },
        });
      }

      logger.info(`✅ Found ${repositories.length} trending repositories`);
      return repositories;
    } catch (error) {
      logger.error('❌ Trending repositories search failed:', error.message);
      return [];
    }
  }

  /**
   * Get awesome lists (curated learning resources)
   * @param {string} skill - Skill to find awesome list for
   */
  async getAwesomeList(skill) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const query = `awesome-${skill.toLowerCase().replace(' ', '-')}`;
      
      logger.info(`🔍 Searching for awesome list: "${query}"`);

      const response = await this.axiosInstance.get('/search/repositories', {
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 5,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.warn(`⚠️ No awesome list found for: ${skill}`);
        return null;
      }

      // Get the top result
      const repo = response.data.items[0];

      return {
        id: `github_awesome_${repo.id}_${uuidv4()}`,
        title: `Awesome ${skill}`,
        description: repo.description || `Curated list of ${skill} resources`,
        url: repo.html_url,
        type: 'documentation',
        skill: skill,
        difficulty: 'beginner', // Fixed: 'all' is invalid, use 'beginner' for awesome lists
        duration: 60, // Reading time
        source: 'github',
        provider: repo.owner.login,
        credibility: 0.95, // Awesome lists are highly credible
        rating: 5,
        popularity: repo.stargazers_count,
        metadata: {
          repoId: repo.id,
          fullName: repo.full_name,
          stars: repo.stargazers_count,
          awesomeList: true,
        },
      };
    } catch (error) {
      logger.error(`❌ Awesome list search failed for: ${skill}`, error.message);
      return null;
    }
  }

  /**
   * Calculate credibility score for a repository
   * @param {Object} metrics - Repository metrics
   * @returns {number} Credibility score (0-1)
   */
  calculateCredibility({ stars, forks, watchers, openIssues, hasReadme, hasLicense, monthsSinceUpdate }) {
    let score = 0;

    // Stars factor (max 0.35)
    if (stars > 10000) score += 0.35;
    else if (stars > 1000) score += 0.28;
    else if (stars > 100) score += 0.20;
    else if (stars > 10) score += 0.10;

    // Community engagement (forks + watchers, max 0.25)
    const engagement = forks + watchers;
    if (engagement > 1000) score += 0.25;
    else if (engagement > 100) score += 0.18;
    else if (engagement > 10) score += 0.10;

    // Maintenance (max 0.2)
    if (monthsSinceUpdate < 3) score += 0.2;
    else if (monthsSinceUpdate < 12) score += 0.15;
    else if (monthsSinceUpdate < 24) score += 0.08;

    // Documentation (max 0.15)
    if (hasReadme) score += 0.10;
    if (hasLicense) score += 0.05;

    // Issue management (max 0.05)
    if (openIssues < 50) score += 0.05;
    else if (openIssues < 100) score += 0.03;

    return Math.min(score, 1.0);
  }

  /**
   * Estimate duration to complete/study a project
   * @param {number} size - Repository size in KB
   * @param {string} difficulty - Difficulty level
   * @returns {number} Estimated duration in minutes
   */
  estimateDuration(size, difficulty) {
    // Base duration on size
    let duration = Math.min(size / 100, 300); // Max 300 minutes

    // Adjust by difficulty
    const difficultyMultipliers = {
      beginner: 1.0,
      intermediate: 1.5,
      advanced: 2.0,
    };

    duration *= difficultyMultipliers[difficulty] || 1.0;

    return Math.floor(duration);
  }

  /**
   * Get difficulty keywords for search
   * @param {string} difficulty - Difficulty level
   * @returns {string} Search keywords
   */
  getDifficultyKeywords(difficulty) {
    const keywords = {
      beginner: 'tutorial starter beginner learn',
      intermediate: 'project example practice',
      advanced: 'advanced production framework',
    };

    return keywords[difficulty] || keywords.beginner;
  }

  /**
   * Check API rate limit
   */
  async checkRateLimit() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await this.axiosInstance.get('/rate_limit');
      const limit = response.data.resources.search;

      logger.info(`📊 GitHub API Rate Limit: ${limit.remaining}/${limit.limit}`);
      return {
        limit: limit.limit,
        remaining: limit.remaining,
        reset: new Date(limit.reset * 1000),
      };
    } catch (error) {
      logger.error('❌ Failed to check rate limit:', error.message);
      return null;
    }
  }

  /**
   * Validate GitHub token
   */
  async validateToken() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await this.axiosInstance.get('/user');
      logger.info(`✅ GitHub token is valid (user: ${response.data.login})`);
      return true;
    } catch (error) {
      logger.warn('⚠️ GitHub token validation failed or not provided (using unauthenticated access)');
      return false;
    }
  }
}

// Export singleton instance
const githubDataService = new GitHubDataService();

module.exports = githubDataService;
