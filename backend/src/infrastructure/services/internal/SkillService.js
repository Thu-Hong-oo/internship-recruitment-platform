const SkillRepository = require('../../repositories/SkillRepository');
const CandidateRepository = require('../../repositories/CandidateRepository');
const ValidationService = require('./ValidationService');

class SkillService {
  constructor() {
    this.skillRepository = new SkillRepository();
    this.candidateRepository = new CandidateRepository();
    this.validationService = new ValidationService();
  }

  async getAllSkills(filters = {}) {
    try {
      const { page = 1, limit = 20, category, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (category) query.category = category;
      if (search) query.name = { $regex: search, $options: 'i' };

      const skills = await this.skillRepository.find(query, {
        skip,
        limit,
        sort: { popularity: -1 },
        populate: ['category'],
      });

      const total = await this.skillRepository.count(query);

      return {
        success: true,
        skills: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
          isActive: skill.isActive,
          createdAt: skill.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all skills failed: ${error.message}`);
    }
  }

  async getSkillById(skillId) {
    try {
      const skill = await this.skillRepository.findById(skillId, ['category']);

      if (!skill) {
        throw new Error('Skill not found');
      }

      return {
        success: true,
        skill: {
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
          isActive: skill.isActive,
          createdAt: skill.createdAt,
        },
      };
    } catch (error) {
      throw new Error(`Get skill by ID failed: ${error.message}`);
    }
  }

  async searchSkills(filters = {}) {
    try {
      const { q, limit = 10 } = filters;

      if (!q || q.trim().length < 2) {
        return {
          success: true,
          skills: [],
          pagination: { page: 1, limit, total: 0, pages: 0 },
        };
      }

      const skills = await this.skillRepository.find(
        { name: { $regex: q, $options: 'i' }, isActive: true },
        { limit, sort: { popularity: -1 } }
      );

      return {
        success: true,
        skills: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
        })),
        pagination: {
          page: 1,
          limit,
          total: skills.length,
          pages: 1,
        },
      };
    } catch (error) {
      throw new Error(`Search skills failed: ${error.message}`);
    }
  }

  async getSkillCategories(filters = {}) {
    try {
      // Get unique categories from skills
      const categories = await this.skillRepository.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        categories: categories.map(cat => ({
          name: cat._id,
          skillsCount: cat.count,
        })),
      };
    } catch (error) {
      throw new Error(`Get skill categories failed: ${error.message}`);
    }
  }

  async getSkillsByCategory(categoryId, filters = {}) {
    try {
      const { page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const skills = await this.skillRepository.find(
        { category: categoryId, isActive: true },
        { skip, limit, sort: { popularity: -1 } }
      );

      const total = await this.skillRepository.count({
        category: categoryId,
        isActive: true,
      });

      return {
        success: true,
        skills: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get skills by category failed: ${error.message}`);
    }
  }

  async getPopularSkills(filters = {}) {
    try {
      const { limit = 10 } = filters;

      const skills = await this.skillRepository.find(
        { isActive: true },
        { limit, sort: { popularity: -1 } }
      );

      return {
        success: true,
        skills: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
        })),
      };
    } catch (error) {
      throw new Error(`Get popular skills failed: ${error.message}`);
    }
  }

  async getTrendingSkills(filters = {}) {
    try {
      const { limit = 10 } = filters;

      // Get skills that have been recently added or updated
      const skills = await this.skillRepository.find(
        { isActive: true },
        { limit, sort: { updatedAt: -1 } }
      );

      return {
        success: true,
        skills: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
          updatedAt: skill.updatedAt,
        })),
      };
    } catch (error) {
      throw new Error(`Get trending skills failed: ${error.message}`);
    }
  }

  async getSkillRecommendations(candidateId, filters = {}) {
    try {
      const { limit = 10 } = filters;

      // Get candidate's current skills
      const candidate = await this.candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const currentSkills = candidate.skills || [];

      // Get popular skills that candidate doesn't have
      const skills = await this.skillRepository.find(
        { name: { $nin: currentSkills }, isActive: true },
        { limit, sort: { popularity: -1 } }
      );

      return {
        success: true,
        recommendations: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
          reason: 'Popular skill you might be interested in',
        })),
      };
    } catch (error) {
      throw new Error(`Get skill recommendations failed: ${error.message}`);
    }
  }

  async getSkillStats() {
    try {
      const totalSkills = await this.skillRepository.count({ isActive: true });

      const skillsByCategory = await this.skillRepository.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);

      const popularSkills = await this.skillRepository.find(
        { isActive: true },
        { limit: 5, sort: { popularity: -1 } }
      );

      return {
        success: true,
        stats: {
          totalSkills,
          totalCategories: skillsByCategory.length,
          skillsByCategory,
          popularSkills: popularSkills.map(skill => ({
            id: skill._id,
            name: skill.name,
            popularity: skill.popularity,
          })),
        },
      };
    } catch (error) {
      throw new Error(`Get skill stats failed: ${error.message}`);
    }
  }

  async createSkill(skillData) {
    try {
      // Validate skill data
      const validation = this.validationService.validateSkill(skillData);
      if (!validation.isValid) {
        throw new Error(
          `Skill validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Create skill
      const skill = await this.skillRepository.create({
        ...skillData,
        isActive: true,
        popularity: 0,
      });

      return {
        success: true,
        skill: {
          id: skill._id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          popularity: skill.popularity,
          isActive: skill.isActive,
        },
        message: 'Skill created successfully',
      };
    } catch (error) {
      throw new Error(`Create skill failed: ${error.message}`);
    }
  }

  async updateSkill(skillId, updates) {
    try {
      // Validate updates
      const validation = this.validationService.validateSkill(updates);
      if (!validation.isValid) {
        throw new Error(
          `Skill validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update skill
      const updatedSkill = await this.skillRepository.update(skillId, updates);

      return {
        success: true,
        skill: {
          id: updatedSkill._id,
          name: updatedSkill.name,
          description: updatedSkill.description,
          category: updatedSkill.category,
          popularity: updatedSkill.popularity,
          isActive: updatedSkill.isActive,
        },
        message: 'Skill updated successfully',
      };
    } catch (error) {
      throw new Error(`Update skill failed: ${error.message}`);
    }
  }

  async deleteSkill(skillId) {
    try {
      // Soft delete skill
      await this.skillRepository.update(skillId, { isActive: false });

      return {
        success: true,
        message: 'Skill deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete skill failed: ${error.message}`);
    }
  }
}

module.exports = new SkillService();
