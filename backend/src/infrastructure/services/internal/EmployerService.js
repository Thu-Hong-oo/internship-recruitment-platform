const EmployerRepository = require('../../repositories/EmployerRepository');
const CompanyRepository = require('../../repositories/CompanyRepository');
const JobRepository = require('../../repositories/JobRepository');
const ApplicationRepository = require('../../repositories/ApplicationRepository');
const ValidationService = require('./ValidationService');
const EmailService = require('../external/EmailService');

class EmployerService {
  constructor() {
    this.employerRepository = new EmployerRepository();
    this.companyRepository = new CompanyRepository();
    this.jobRepository = new JobRepository();
    this.applicationRepository = new ApplicationRepository();
    this.validationService = new ValidationService();
  }

  async createProfile(userId, profileData) {
    try {
      // Validate profile data
      const validation = this.validationService.validateProfile(profileData);
      if (!validation.isValid) {
        throw new Error(
          `Profile validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Check if employer already exists
      const existingEmployer = await this.employerRepository.findByUserId(
        userId
      );
      if (existingEmployer) {
        throw new Error('Employer profile already exists');
      }

      // Create employer profile
      const employerData = {
        userId,
        ...profileData,
      };

      const employer = await this.employerRepository.create(employerData);

      // Send welcome email
      await EmailService.sendWelcomeEmail(employer.userId.email, 'employer');

      return {
        success: true,
        employer: {
          id: employer._id,
          userId: employer.userId,
          companyId: employer.companyId,
        },
        message: 'Employer profile created successfully',
      };
    } catch (error) {
      throw new Error(`Profile creation failed: ${error.message}`);
    }
  }

  async getEmployerProfile(employerId) {
    try {
      const employer = await this.employerRepository.findById(employerId);
      if (!employer) {
        throw new Error('Employer not found');
      }

      return {
        success: true,
        employer: {
          id: employer._id,
          userId: employer.userId,
          companyId: employer.companyId,
          position: employer.position,
          department: employer.department,
          permissions: employer.permissions,
        },
      };
    } catch (error) {
      throw new Error(`Get employer profile failed: ${error.message}`);
    }
  }

  async updateProfile(employerId, updates) {
    try {
      // Validate updates
      const validation = this.validationService.validateProfile(updates);
      if (!validation.isValid) {
        throw new Error(
          `Profile validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update employer profile
      const updatedEmployer = await this.employerRepository.update(
        employerId,
        updates
      );

      return {
        success: true,
        employer: {
          id: updatedEmployer._id,
          position: updatedEmployer.position,
          department: updatedEmployer.department,
        },
        message: 'Profile updated successfully',
      };
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  async createCompany(employerId, companyData) {
    try {
      // Validate company data
      const validation = this.validationService.validateCompany(companyData);
      if (!validation.isValid) {
        throw new Error(
          `Company validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Create company
      const company = await this.companyRepository.create(companyData);

      // Update employer with company reference
      await this.employerRepository.update(employerId, {
        companyId: company._id,
      });

      return {
        success: true,
        company: {
          id: company._id,
          name: company.name,
          industry: company.industry,
          size: company.size,
          location: company.location,
        },
        message: 'Company created successfully',
      };
    } catch (error) {
      throw new Error(`Company creation failed: ${error.message}`);
    }
  }

  async getCompany(employerId) {
    try {
      const employer = await this.employerRepository.findById(employerId);
      if (!employer || !employer.companyId) {
        throw new Error('Company not found');
      }

      const company = await this.companyRepository.findById(employer.companyId);

      return {
        success: true,
        company: {
          id: company._id,
          name: company.name,
          industry: company.industry,
          size: company.size,
          description: company.description,
          website: company.website,
          location: company.location,
          isVerified: company.isVerified,
        },
      };
    } catch (error) {
      throw new Error(`Get company failed: ${error.message}`);
    }
  }

  async updateCompany(employerId, updates) {
    try {
      const employer = await this.employerRepository.findById(employerId);
      if (!employer || !employer.companyId) {
        throw new Error('Company not found');
      }

      // Validate company data
      const validation = this.validationService.validateCompany(updates);
      if (!validation.isValid) {
        throw new Error(
          `Company validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Update company
      const updatedCompany = await this.companyRepository.update(
        employer.companyId,
        updates
      );

      return {
        success: true,
        company: {
          id: updatedCompany._id,
          name: updatedCompany.name,
          industry: updatedCompany.industry,
          size: updatedCompany.size,
        },
        message: 'Company updated successfully',
      };
    } catch (error) {
      throw new Error(`Company update failed: ${error.message}`);
    }
  }

  async getEmployerStats(employerId) {
    try {
      const employer = await this.employerRepository.findById(employerId);
      if (!employer) {
        throw new Error('Employer not found');
      }

      // Get job posts count
      const jobPostsCount = await this.jobRepository.count({ employerId });

      // Get applications count
      const applicationsCount = await this.applicationRepository.count({
        jobId: {
          $in: await this.jobRepository.find({ employerId }).select('_id'),
        },
      });

      // Get recent applications
      const recentApplications = await this.applicationRepository.find(
        {
          jobId: {
            $in: await this.jobRepository.find({ employerId }).select('_id'),
          },
        },
        { limit: 5, sort: { createdAt: -1 } }
      );

      return {
        success: true,
        stats: {
          jobPostsCount,
          applicationsCount,
          recentApplications: recentApplications.length,
        },
      };
    } catch (error) {
      throw new Error(`Get employer stats failed: ${error.message}`);
    }
  }

  async getDashboard(employerId) {
    try {
      const employer = await this.employerRepository.findById(employerId);
      if (!employer) {
        throw new Error('Employer not found');
      }

      // Get recent job posts
      const recentJobs = await this.jobRepository.find(
        { employerId },
        { limit: 5, sort: { createdAt: -1 } }
      );

      // Get recent applications
      const recentApplications = await this.applicationRepository.find(
        { jobId: { $in: recentJobs.map(job => job._id) } },
        { limit: 10, sort: { createdAt: -1 } }
      );

      // Get stats
      const stats = await this.getEmployerStats(employerId);

      return {
        success: true,
        dashboard: {
          recentJobs: recentJobs.map(job => ({
            id: job._id,
            title: job.title,
            status: job.status,
            applicationsCount: recentApplications.filter(
              app => app.jobId.toString() === job._id.toString()
            ).length,
            createdAt: job.createdAt,
          })),
          recentApplications: recentApplications.map(app => ({
            id: app._id,
            jobTitle: app.jobTitle,
            candidateName: app.candidateName,
            status: app.status,
            appliedAt: app.appliedAt,
          })),
          stats: stats.stats,
        },
      };
    } catch (error) {
      throw new Error(`Get dashboard failed: ${error.message}`);
    }
  }
}

module.exports = new EmployerService();
