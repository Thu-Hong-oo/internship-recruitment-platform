/**
 * Search Skills Use Case
 * Advanced search for skills with various criteria
 */

class SearchSkillsUseCase {
  constructor(skillRepository) {
    this.skillRepository = skillRepository;
  }

  async execute(searchParams) {
    try {
      const {
        query,
        categories = [],
        levels = [],
        trending = false,
        popular = false,
        limit = 20,
        page = 1,
      } = searchParams;

      // Build search query
      const searchQuery = this._buildSearchQuery(
        query,
        categories,
        levels,
        trending,
        popular
      );

      // Execute search
      const skip = (page - 1) * limit;
      const sort = this._buildSortCriteria(trending, popular);

      const [skills, total] = await Promise.all([
        this.skillRepository.find(searchQuery, { skip, limit, sort }),
        this.skillRepository.count(searchQuery),
      ]);

      // Add relevance scoring if text search
      let scoredSkills = skills;
      if (query) {
        scoredSkills = this._calculateRelevanceScores(skills, query);
      }

      return {
        success: true,
        data: {
          skills: scoredSkills,
          total,
          query: searchParams,
          suggestions: await this._getSearchSuggestions(query),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  _buildSearchQuery(query, categories, levels, trending, popular) {
    const searchQuery = {};

    // Text search
    if (query && query.trim()) {
      const searchRegex = new RegExp(query.trim(), 'i');
      searchQuery.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { keywords: { $in: [searchRegex] } },
        { 'relatedSkills.name': searchRegex },
      ];
    }

    // Category filter
    if (categories && categories.length > 0) {
      searchQuery.category = { $in: categories };
    }

    // Level filter
    if (levels && levels.length > 0) {
      searchQuery.level = { $in: levels };
    }

    // Trending filter
    if (trending) {
      searchQuery.trending = true;
    }

    // Popular filter
    if (popular) {
      searchQuery.$or = searchQuery.$or ? [...searchQuery.$or] : [];
      searchQuery.$or.push({ usageCount: { $gte: 100 } });
    }

    return searchQuery;
  }

  _buildSortCriteria(trending, popular) {
    if (trending) {
      return { trendingScore: -1, usageCount: -1, name: 1 };
    }

    if (popular) {
      return { usageCount: -1, name: 1 };
    }

    return { name: 1 };
  }

  _calculateRelevanceScores(skills, query) {
    const queryLower = query.toLowerCase();

    return skills
      .map(skill => {
        let score = 0;

        // Exact name match gets highest score
        if (skill.name.toLowerCase() === queryLower) {
          score += 100;
        } else if (skill.name.toLowerCase().includes(queryLower)) {
          score += 50;
        }

        // Description match
        if (
          skill.description &&
          skill.description.toLowerCase().includes(queryLower)
        ) {
          score += 25;
        }

        // Keywords match
        if (skill.keywords) {
          const keywordMatches = skill.keywords.filter(keyword =>
            keyword.toLowerCase().includes(queryLower)
          );
          score += keywordMatches.length * 10;
        }

        // Related skills match
        if (skill.relatedSkills) {
          const relatedMatches = skill.relatedSkills.filter(related =>
            related.name.toLowerCase().includes(queryLower)
          );
          score += relatedMatches.length * 5;
        }

        // Usage popularity bonus
        score += Math.min(skill.usageCount || 0, 50) / 10;

        return {
          ...skill,
          relevanceScore: score,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async _getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    try {
      // Get skills with similar names
      const suggestions = await this.skillRepository.find(
        {
          name: { $regex: new RegExp(query, 'i') },
        },
        { limit: 5, sort: { usageCount: -1 } }
      );

      return suggestions.map(skill => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        usageCount: skill.usageCount,
      }));
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
}

module.exports = SearchSkillsUseCase;
