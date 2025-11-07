/**
 * IndustryService - Handles industry operations
 * Follows Clean Architecture using Repository Pattern
 */
const IndustryRepository = require('../../repositories/IndustryRepository');

class IndustryService {
  constructor() {
    if (!IndustryService.instance) {
      this.industryRepository = new IndustryRepository();
      IndustryService.instance = this;
    }
    return IndustryService.instance;
  }

  /**
   * Get all industries with pagination
   * Uses Repository Pattern for clean architecture
   * @param {Object} query Query parameters for pagination
   * @returns {Promise<{industries: Array, pagination: Object}>}
   */
  async getAllIndustries(query = {}) {
    try {
      const page = parseInt(query.page, 10) || 1;
      const limit = parseInt(query.limit, 10) || 100;
      const search = query.search || '';
      const lang = query.lang || 'vi';

      // ✅ Use Repository instead of Model
      const allIndustries = await this.industryRepository.findVisible();

      // Apply search filter if provided
      let filteredIndustries = allIndustries;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredIndustries = allIndustries.filter(industry => {
          const nameVi = industry.name?.vi || '';
          const nameEn = industry.name?.en || '';
          const keywords = (industry.keywords || []).join(' ');

          return (
            nameVi.toLowerCase().includes(searchLower) ||
            nameEn.toLowerCase().includes(searchLower) ||
            keywords.toLowerCase().includes(searchLower)
          );
        });
      }

      // Apply pagination
      const total = filteredIndustries.length;
      const skip = (page - 1) * limit;
      const paginatedIndustries = filteredIndustries.slice(skip, skip + limit);

      return {
        industries: paginatedIndustries.map(industry => ({
          id: industry.id,
          code: industry.code,
          name: industry.name[lang] || industry.name.vi,
          nameVi: industry.name.vi,
          nameEn: industry.name.en,
          description:
            industry.description?.[lang] || industry.description?.vi || '',
          visible: industry.visible,
          sortOrder: industry.sortOrder,
          parentCode: industry.parentCode,
          path: industry.path,
          icon: industry.icon,
          color: industry.color,
          stats: industry.stats,
          createdAt: industry.createdAt,
          updatedAt: industry.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get all industries failed: ${error.message}`);
    }
  }

  async createIndustry(industryData) {
    try {
      // Check if industry code already exists
      const existingIndustry = await this.industryRepository.findByCode(
        industryData.code
      );

      if (existingIndustry) {
        throw new Error('Industry with this code already exists');
      }

      // Create industry directly from Model (bypass entity validation for now)
      const IndustryModel = require('../../models/Industry');
      const newIndustry = new IndustryModel({
        code: industryData.code,
        parentCode: industryData.parentCode || null,
        name: industryData.name,
        description: industryData.description || { vi: '', en: '' },
        keywords: industryData.keywords || [],
        color: industryData.color || '#2563eb',
        icon: industryData.icon || '',
        visible: industryData.visible !== false,
        sortOrder: industryData.sortOrder || 0,
        suggestedTemplates: industryData.suggestedTemplates || [],
        suggestions: industryData.suggestions || {
          summary: [],
          experience: [],
          projects: [],
          skills: [],
        },
      });

      const savedIndustry = await newIndustry.save();

      return {
        success: true,
        industry: {
          id: savedIndustry._id,
          code: savedIndustry.code,
          name: savedIndustry.name,
          description: savedIndustry.description,
          visible: savedIndustry.visible,
          sortOrder: savedIndustry.sortOrder,
          parentCode: savedIndustry.parentCode,
          path: savedIndustry.path,
          createdAt: savedIndustry.createdAt,
        },
        message: 'Industry created successfully',
      };
    } catch (error) {
      throw new Error(`Create industry failed: ${error.message}`);
    }
  }

  async getIndustryById(idOrCode) {
    try {
      let industry;

      // Try to find by code first (more user-friendly)
      industry = await this.industryRepository.findByCode(idOrCode);

      // If not found by code, try by ObjectId
      if (!industry) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idOrCode)) {
          industry = await this.industryRepository.findById(idOrCode);
        }
      }

      if (!industry) {
        throw new Error('Industry not found');
      }

      return {
        success: true,
        industry: {
          id: industry.id,
          code: industry.code,
          name: industry.name,
          description: industry.description,
          visible: industry.visible,
          sortOrder: industry.sortOrder,
          parentCode: industry.parentCode,
          path: industry.path,
          icon: industry.icon,
          color: industry.color,
          keywords: industry.keywords,
          stats: industry.stats,
          createdAt: industry.createdAt,
          updatedAt: industry.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get industry by ID failed: ${error.message}`);
    }
  }

  async updateIndustry(idOrCode, updateData) {
    try {
      let industry;

      // Try to find by code first (more user-friendly)
      industry = await this.industryRepository.findByCode(idOrCode);

      // If not found by code, try by ObjectId
      if (!industry) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idOrCode)) {
          industry = await this.industryRepository.findById(idOrCode);
        }
      }

      if (!industry) {
        throw new Error('Industry not found');
      }

      // TODO: Add validation when validationService is implemented
      // const validation = this.validationService.validateIndustry(updateData);
      // if (!validation.isValid) {
      //   throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      // }

      // Update industry
      const updatedIndustry = await this.industryRepository.update(
        industry.industryId,
        updateData
      );

      return {
        success: true,
        industry: {
          id: updatedIndustry.industryId,
          name: updatedIndustry.name,
          description: updatedIndustry.description,
          isActive: updatedIndustry.isActive,
          updatedAt: updatedIndustry.updatedAt,
        },
        message: 'Industry updated successfully',
      };
    } catch (error) {
      throw new Error(`Update industry failed: ${error.message}`);
    }
  }

  async deleteIndustry(idOrCode) {
    try {
      let industry;

      // Try to find by code first (more user-friendly)
      industry = await this.industryRepository.findByCode(idOrCode);

      // If not found by code, try by ObjectId
      if (!industry) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(idOrCode)) {
          industry = await this.industryRepository.findById(idOrCode);
        }
      }

      if (!industry) {
        throw new Error('Industry not found');
      }

      // Check if industry is being used by companies
      // TODO: Implement company repository check when available
      // const companiesUsingIndustry = await this.companyRepository.count({
      //   industry: industry.name.vi || industry.name,
      // });

      // if (companiesUsingIndustry > 0) {
      //   throw new Error('Cannot delete industry that is being used by companies');
      // }

      // Delete industry
      await this.industryRepository.delete(industry.industryId);

      return {
        success: true,
        message: 'Industry deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete industry failed: ${error.message}`);
    }
  }

  // ========================
  // Additional Query Methods
  // ========================

  /**
   * Get active industries only
   * @returns {Promise<Array>} List of active industries
   */
  async getActiveIndustries(page = 1, limit = 20, lang = 'vi') {
    try {
      const industries = await this.industryRepository.findAll({
        visible: true,
        page,
        limit,
      });

      return {
        success: true,
        industries: industries.map(industry => ({
          id: industry._id,
          code: industry.code,
          name:
            lang === 'en' && industry.nameEn ? industry.nameEn : industry.name,
          description:
            lang === 'en' && industry.descriptionEn
              ? industry.descriptionEn
              : industry.description,
          icon: industry.icon,
          visible: industry.visible,
        })),
        pagination: {
          page,
          limit,
          total: industries.length,
        },
      };
    } catch (error) {
      throw new Error(`Get active industries failed: ${error.message}`);
    }
  }

  /**
   * Search industries by name or keywords
   * @param {string} query - Search query
   * @param {string} lang - Language (vi/en)
   * @returns {Promise<Array>} Matching industries
   */
  async searchIndustries(query, lang = 'vi') {
    try {
      // Simple search implementation - can be enhanced with full-text search
      const industries = await this.industryRepository.findAll({
        visible: true,
      });

      const searchLower = query.toLowerCase();
      const filtered = industries.filter(industry => {
        const name =
          lang === 'en' && industry.nameEn ? industry.nameEn : industry.name;
        const desc =
          lang === 'en' && industry.descriptionEn
            ? industry.descriptionEn
            : industry.description;

        return (
          name?.toLowerCase().includes(searchLower) ||
          desc?.toLowerCase().includes(searchLower) ||
          industry.code?.toLowerCase().includes(searchLower)
        );
      });

      return {
        success: true,
        industries: filtered.map(industry => ({
          id: industry._id,
          code: industry.code,
          name:
            lang === 'en' && industry.nameEn ? industry.nameEn : industry.name,
          description:
            lang === 'en' && industry.descriptionEn
              ? industry.descriptionEn
              : industry.description,
          icon: industry.icon,
        })),
        total: filtered.length,
      };
    } catch (error) {
      throw new Error(`Search industries failed: ${error.message}`);
    }
  }

  /**
   * Get industry trends (job counts)
   * @returns {Promise<Array>} Industry statistics
   */
  async getIndustryTrends() {
    try {
      // TODO: Implement aggregation with Job model
      // For now, return placeholder
      return {
        success: true,
        trends: [],
        message: 'Industry trends feature coming soon',
      };
    } catch (error) {
      throw new Error(`Get industry trends failed: ${error.message}`);
    }
  }

  /**
   * Get statistics for a specific industry
   * @param {string} industryId - Industry ID or code
   * @returns {Promise<Object>} Industry stats
   */
  async getIndustryStats(industryId) {
    try {
      // TODO: Implement aggregation with Company and Job models
      // For now, return placeholder
      return {
        success: true,
        stats: {
          totalCompanies: 0,
          totalJobs: 0,
          activeJobs: 0,
        },
        message: 'Industry stats feature requires Company and Job models',
      };
    } catch (error) {
      throw new Error(`Get industry stats failed: ${error.message}`);
    }
  }

  /**
   * Get companies in a specific industry
   * @param {string} industryId - Industry ID or code
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of companies
   */
  async getIndustryCompanies(industryId, filters = {}) {
    try {
      // TODO: Implement with Company model
      // For now, return placeholder
      return {
        success: true,
        companies: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
        },
        message:
          'Industry companies feature requires Company model integration',
      };
    } catch (error) {
      throw new Error(`Get industry companies failed: ${error.message}`);
    }
  }

  /**
   * Get jobs in a specific industry
   * @param {string} industryId - Industry ID or code
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of jobs
   */
  async getIndustryJobs(industryId, filters = {}) {
    try {
      // TODO: Implement with Job model
      // For now, return placeholder
      return {
        success: true,
        jobs: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
        },
        message: 'Industry jobs feature requires Job model integration',
      };
    } catch (error) {
      throw new Error(`Get industry jobs failed: ${error.message}`);
    }
  }
}

module.exports = IndustryService;
