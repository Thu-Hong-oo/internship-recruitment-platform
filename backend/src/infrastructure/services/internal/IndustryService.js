const IndustryRepository = require('../../repositories/IndustryRepository');
const CompanyRepository = require('../../repositories/CompanyRepository');
const JobRepository = require('../../repositories/JobRepository');
const ValidationService = require('./ValidationService');

class IndustryService {
  constructor() {
    this.industryRepository = new IndustryRepository();
    this.companyRepository = new CompanyRepository();
    this.jobRepository = new JobRepository();
    this.validationService = new ValidationService();
  }

  async createIndustry(industryData) {
    try {
      // Validate industry data
      const validation = this.validationService.validateIndustry(industryData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if industry already exists
      const existingIndustry = await this.industryRepository.findOne({
        name: industryData.name,
      });

      if (existingIndustry) {
        throw new Error('Industry with this name already exists');
      }

      // Create industry
      const industry = await this.industryRepository.create(industryData);

      return {
        success: true,
        industry: {
          id: industry._id,
          name: industry.name,
          description: industry.description,
          isActive: industry.isActive,
          createdAt: industry.createdAt,
        },
        message: 'Industry created successfully',
      };
    } catch (error) {
      throw new Error(`Create industry failed: ${error.message}`);
    }
  }

  async getIndustryById(industryId) {
    try {
      const industry = await this.industryRepository.findById(industryId);
      if (!industry) {
        throw new Error('Industry not found');
      }

      return {
        success: true,
        industry: {
          id: industry._id,
          name: industry.name,
          description: industry.description,
          isActive: industry.isActive,
          createdAt: industry.createdAt,
          updatedAt: industry.updatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Get industry by ID failed: ${error.message}`);
    }
  }

  async updateIndustry(industryId, updateData) {
    try {
      const industry = await this.industryRepository.findById(industryId);
      if (!industry) {
        throw new Error('Industry not found');
      }

      // Validate update data
      const validation = this.validationService.validateIndustry(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Update industry
      const updatedIndustry = await this.industryRepository.update(
        industryId,
        updateData
      );

      return {
        success: true,
        industry: {
          id: updatedIndustry._id,
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

  async deleteIndustry(industryId) {
    try {
      const industry = await this.industryRepository.findById(industryId);
      if (!industry) {
        throw new Error('Industry not found');
      }

      // Check if industry is being used by companies
      const companiesUsingIndustry = await this.companyRepository.count({
        industry: industry.name,
      });

      if (companiesUsingIndustry > 0) {
        throw new Error(
          'Cannot delete industry that is being used by companies'
        );
      }

      // Soft delete industry
      await this.industryRepository.softDelete(industryId);

      return {
        success: true,
        message: 'Industry deleted successfully',
      };
    } catch (error) {
      throw new Error(`Delete industry failed: ${error.message}`);
    }
  }

  async getAllIndustries(filters = {}) {
    try {
      const { page = 1, limit = 20, isActive, search } = filters;
      const skip = (page - 1) * limit;

      const query = {};
      if (isActive !== undefined) query.isActive = isActive;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const industries = await this.industryRepository.find(query, {
        skip,
        limit,
        sort: { name: 1 },
      });

      const total = await this.industryRepository.count(query);

      return {
        success: true,
        industries: industries.map(industry => ({
          id: industry._id,
          name: industry.name,
          description: industry.description,
          isActive: industry.isActive,
          createdAt: industry.createdAt,
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

  async getActiveIndustries() {
    try {
      const industries = await this.industryRepository.find(
        { isActive: true },
        { sort: { name: 1 } }
      );

      return {
        success: true,
        industries: industries.map(industry => ({
          id: industry._id,
          name: industry.name,
          description: industry.description,
        })),
      };
    } catch (error) {
      throw new Error(`Get active industries failed: ${error.message}`);
    }
  }

  async getIndustryStats(industryId) {
    try {
      const industry = await this.industryRepository.findById(industryId);
      if (!industry) {
        throw new Error('Industry not found');
      }

      // Get industry statistics
      const totalCompanies = await this.companyRepository.count({
        industry: industry.name,
      });

      const totalJobs = await this.jobRepository.count({
        industry: industry.name,
      });

      const activeJobs = await this.jobRepository.count({
        industry: industry.name,
        status: 'published',
      });

      return {
        success: true,
        stats: {
          totalCompanies,
          totalJobs,
          activeJobs,
        },
      };
    } catch (error) {
      throw new Error(`Get industry stats failed: ${error.message}`);
    }
  }

  async getIndustryCompanies(industryId, filters = {}) {
    try {
      const industry = await this.industryRepository.findById(industryId);
      if (!industry) {
        throw new Error('Industry not found');
      }

      const { page = 1, limit = 20, search } = filters;
      const skip = (page - 1) * limit;

      const query = { industry: industry.name };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const companies = await this.companyRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      });

      const total = await this.companyRepository.count(query);

      return {
        success: true,
        companies: companies.map(company => ({
          id: company._id,
          name: company.name,
          website: company.website,
          size: company.size,
          description: company.description,
          logo: company.logo,
          location: company.location,
          isActive: company.isActive,
          createdAt: company.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get industry companies failed: ${error.message}`);
    }
  }

  async getIndustryJobs(industryId, filters = {}) {
    try {
      const industry = await this.industryRepository.findById(industryId);
      if (!industry) {
        throw new Error('Industry not found');
      }

      const { page = 1, limit = 20, status, search } = filters;
      const skip = (page - 1) * limit;

      const query = { industry: industry.name };
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const jobs = await this.jobRepository.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: ['employerId', 'companyId'],
      });

      const total = await this.jobRepository.count(query);

      return {
        success: true,
        jobs: jobs.map(job => ({
          id: job._id,
          title: job.title,
          status: job.status,
          employer: job.employerId,
          company: job.companyId,
          createdAt: job.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Get industry jobs failed: ${error.message}`);
    }
  }

  async searchIndustries(searchQuery) {
    try {
      const industries = await this.industryRepository.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ],
        isActive: true,
      });

      return {
        success: true,
        industries: industries.map(industry => ({
          id: industry._id,
          name: industry.name,
          description: industry.description,
        })),
      };
    } catch (error) {
      throw new Error(`Search industries failed: ${error.message}`);
    }
  }

  async getIndustryTrends() {
    try {
      const trends = await this.jobRepository.aggregate([
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      return {
        success: true,
        trends: trends.map(trend => ({
          industry: trend._id,
          jobCount: trend.count,
        })),
      };
    } catch (error) {
      throw new Error(`Get industry trends failed: ${error.message}`);
    }
  }
}

module.exports = new IndustryService();


