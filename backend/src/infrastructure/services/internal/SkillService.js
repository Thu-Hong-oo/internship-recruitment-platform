/**
 * SkillService - Handles skill management operations
 * Follows Clean Architecture using Repository Pattern
 */
const SkillRepository = require('../../repositories/SkillRepository');
const CandidateRepository = require('../../repositories/CandidateRepository');
const ValidationService = require('./ValidationService');

class SkillService {
  constructor() {
    if (!SkillService.instance) {
      this.skillRepository = new SkillRepository();
      this.candidateRepository = new CandidateRepository();
      this.validationService = new ValidationService();
      SkillService.instance = this;
    }
    return SkillService.instance;
  }

  async getAllSkills(filters = {}) {
    try {
      const { page = 1, limit = 20, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      // By default only include active skills. Caller may pass includeInactive=true to override.
      if (!filters.includeInactive) query.isActive = true;
      if (search) query.name = { $regex: search, $options: 'i' };

      const skills = await this.skillRepository.find(query, {
        skip,
        limit,
        sort: { popularity: -1 },
      });

      const total = await this.skillRepository.count(query);

      return {
        success: true,
        skills: skills,
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

  async getSkillById(idOrSlugOrName) {
    try {
      let skill;

      // Try to find by slug first (more user-friendly)
      skill = await this.skillRepository.findBySlug(idOrSlugOrName);

      // If not found by slug, try by name
      if (!skill) {
        skill = await this.skillRepository.findByName(idOrSlugOrName);
      }

      // If not found by name, try by ObjectId
      if (!skill) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idOrSlugOrName)) {
          skill = await this.skillRepository.findById(idOrSlugOrName);
        }
      }

      if (!skill) {
        throw new Error('Skill not found');
      }

      return {
        success: true,
        skill: skill,
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
        skills: skills,
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
      // Check if skill name already exists
      const existingSkill = await this.skillRepository.findByName(
        skillData.name
      );
      if (existingSkill) {
        throw new Error('Skill with this name already exists');
      }

      // Check if skill slug already exists
      if (skillData.slug) {
        const existingSlugSkill = await this.skillRepository.findBySlug(
          skillData.slug
        );
        if (existingSlugSkill) {
          throw new Error('Skill with this slug already exists');
        }
      }

      // Validate skill data
      const validation = this.validationService.validateSkill(skillData);
      if (!validation.isValid) {
        throw new Error(
          `Skill validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Create skill directly from Model (bypass entity validation for now)
      const SkillModel = require('../../models/Skill');
      const newSkill = new SkillModel({
        name: skillData.name,
        slug: skillData.slug,
        description: skillData.description,
        parentId: skillData.parentId,
        embedding: skillData.embedding,
        popularity: skillData.popularity || 0,
        isActive: skillData.isActive !== false,
        demandLevel: skillData.demandLevel || 'medium',
        trend: skillData.trend || 'stable',
        level: skillData.level || 0,
        path: skillData.path || [],
      });

      const savedSkill = await newSkill.save();

      return {
        success: true,
        skill: savedSkill,
        message: 'Skill created successfully',
      };
    } catch (error) {
      throw new Error(`Create skill failed: ${error.message}`);
    }
  }

  async updateSkill(idOrSlugOrName, updates) {
    try {
      let skill;

      // Try to find by slug first (more user-friendly)
      skill = await this.skillRepository.findBySlug(idOrSlugOrName);

      // If not found by slug, try by name
      if (!skill) {
        skill = await this.skillRepository.findByName(idOrSlugOrName);
      }

      // If not found by name, try by ObjectId
      if (!skill) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idOrSlugOrName)) {
          skill = await this.skillRepository.findById(idOrSlugOrName);
        }
      }

      if (!skill) {
        throw new Error('Skill not found');
      }

      // Validate updates (only provided fields)
      const validation = this.validationService.validateSkillUpdate(updates);
      if (!validation.isValid) {
        throw new Error(
          `Skill validation failed: ${validation.errors.join(', ')}`
        );
      }

      // For partial updates, merge with existing data and validate the complete object
      const mergedData = {
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        parentId: skill.parentId,
        popularity: skill.popularity,
        isActive: skill.isActive,
        demandLevel: skill.demandLevel,
        trend: skill.trend,
        ...updates, // Override with provided updates
      };

      // Validate the merged data using full validation
      const fullValidation = this.validationService.validateSkill(mergedData);
      if (!fullValidation.isValid) {
        throw new Error(
          `Skill validation failed: ${fullValidation.errors.join(', ')}`
        );
      }

      // Update skill with merged data
      const updatedSkill = await this.skillRepository.update(
        skill.skillId,
        mergedData
      );

      return {
        success: true,
        skill: updatedSkill,
        message: 'Skill updated successfully',
      };
    } catch (error) {
      throw new Error(`Update skill failed: ${error.message}`);
    }
  }

  async deleteSkill(idOrSlugOrName) {
    try {
      let skill;

      // Try to find by slug first (more user-friendly)
      skill = await this.skillRepository.findBySlug(idOrSlugOrName);

      // If not found by slug, try by name
      if (!skill) {
        skill = await this.skillRepository.findByName(idOrSlugOrName);
      }

      // If not found by name, try by ObjectId
      if (!skill) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idOrSlugOrName)) {
          skill = await this.skillRepository.findById(idOrSlugOrName);
        }
      }

      if (!skill) {
        throw new Error('Skill not found');
      }

      // Determine underlying id (support both mongoose doc and domain entity)
      const targetId = skill._id || skill.skillId || skill.id;

      // If the skill is already inactive, return a clear error (idempotent protection)
      if (skill.isActive === false) {
        throw new Error('Skill already deleted');
      }

      // Soft delete skill
      await this.skillRepository.update(targetId, { isActive: false });

      return {
        success: true,
        message: 'Skill deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete skill failed: ${error.message}`);
    }
  }
}

module.exports = SkillService;
