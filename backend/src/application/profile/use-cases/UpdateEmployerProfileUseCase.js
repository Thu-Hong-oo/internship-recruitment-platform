const { logger } = require('../../../shared/utils/logger');
const CompanySize = require('../../../domain/recruitment/enums/CompanySize');
const EmployerProfile = require('../../../domain/recruitment/EmployerProfile');

class UpdateEmployerProfileUseCase {
  constructor(employerRepository, userRepository, companyRepository) {
    this.employerRepository = employerRepository;
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
  }

  /**
   * Transform frontend company size format to enum
   * @param {string} frontendSize - Frontend format like "51-200", "1-10", etc.
   * @returns {string} Enum value like "medium_51_200", "startup_1_10"
   */
  _getPermissionsForRole(role) {
    const rolePermissions = {
      owner: {
        canPostJobs: true,
        canEditJobs: true,
        canDeleteJobs: true,
        canViewApplications: true,
        canReviewApplications: true,
        canScheduleInterviews: true,
        canManageMembers: true,
        canEditCompanyInfo: true,
      },
      admin: {
        canPostJobs: true,
        canEditJobs: true,
        canDeleteJobs: true,
        canViewApplications: true,
        canReviewApplications: true,
        canScheduleInterviews: true,
        canManageMembers: true,
        canEditCompanyInfo: false,
      },
      recruiter: {
        canPostJobs: true,
        canEditJobs: true,
        canDeleteJobs: false,
        canViewApplications: true,
        canReviewApplications: true,
        canScheduleInterviews: false,
        canManageMembers: false,
        canEditCompanyInfo: false,
      },
      interviewer: {
        canPostJobs: false,
        canEditJobs: false,
        canDeleteJobs: false,
        canViewApplications: true,
        canReviewApplications: true,
        canScheduleInterviews: true,
        canManageMembers: false,
        canEditCompanyInfo: false,
      },
      viewer: {
        canPostJobs: false,
        canEditJobs: false,
        canDeleteJobs: false,
        canViewApplications: true,
        canReviewApplications: false,
        canScheduleInterviews: false,
        canManageMembers: false,
        canEditCompanyInfo: false,
      },
    };
    return rolePermissions[role] || rolePermissions.viewer;
  }

  async execute({ userId, employerId, profileData, companyData }) {
    try {
      let employer;
      let isNewProfile = false; // Track if we just created a new profile

      // If userId is provided, find employer by userId first
      if (userId) {
        employer = await this.employerRepository.findByUserId(userId);

        if (employer) {
          logger.info(`Found existing employer profile: ${employer.profileId}`);
        }

        if (!employer) {
          // No existing profile, create new one
          isNewProfile = true;
          logger.info(`Creating employer profile for user: ${userId}`);

          const user = await this.userRepository.findById(userId);
          if (!user || user.role !== 'employer') {
            throw new Error('EMPLOYER_NOT_FOUND');
          }

          // Step 1: Create Company entity through repository
          // Use data from profileData if provided, otherwise use defaults
          const companyData = {
            companyId: `COMP_${Date.now()}_${userId.toString().slice(-6)}`,
            owner: userId,
            name:
              profileData.company?.name ||
              user.fullName ||
              user.email.split('@')[0],
            industry: profileData.company?.industry || 'technology',
            size: this._transformCompanySize(profileData.company?.size),
            email: profileData.company?.email || user.email,
            website: profileData.company?.website || '',
            description: profileData.company?.description || '',
            logo: profileData.company?.logo || '',
            address: {
              street: profileData.address?.street || '',
              ward: profileData.address?.ward || '',
              district: profileData.address?.district || '',
              city: profileData.address?.city || '',
              country: profileData.address?.country || 'Việt Nam',
            },
            legalRepresentative: {
              fullName:
                profileData.legalRepresentative?.fullName ||
                user.fullName ||
                user.email.split('@')[0],
              position: profileData.legalRepresentative?.position || 'Giám đốc',
              phone:
                profileData.legalRepresentative?.phone ||
                profileData.contact?.phone ||
                '0123456789', // Required field, use placeholder
              email: profileData.legalRepresentative?.email || user.email,
            },
            businessInfo: {
              registrationNumber:
                profileData.businessInfo?.registrationNumber ||
                `temp_${userId}`,
              taxId:
                profileData.businessInfo?.taxId ||
                `temp_${Date.now().toString().slice(-6)}`,
              issueDate: profileData.businessInfo?.issueDate || new Date(),
              issuePlace:
                profileData.businessInfo?.issuePlace || 'TP. Hồ Chí Minh', // Required field, use default city
            },
            verification: {
              isVerified: false,
              steps: {
                businessInfo: false,
                documents: false,
              },
              documents: [],
            },
            status: 'pending',
          };

          const company = await this.companyRepository.create(companyData);
          logger.info(`Company created: ${company.id}`);

          // Step 2: Create EmployerProfile domain entity
          const employerProfile = new EmployerProfile(
            null, // profileId will be generated by database
            userId,
            company.companyId // Use companyId instead of id
          );

          // Set additional properties
          employerProfile.assignRole('owner', {
            canPostJobs: true,
            canEditJobs: true,
            canDeleteJobs: true,
            canViewApplications: true,
            canReviewApplications: true,
            canScheduleInterviews: true,
            canManageMembers: true,
            canEditCompanyInfo: true,
          });

          employerProfile.updatePosition(
            profileData.position?.title || 'Nhân viên',
            profileData.position?.level || 'junior',
            profileData.position?.department || 'Quản lý'
          );

          employer = await this.employerRepository.create(employerProfile);

          // Step 3: Update user reference
          await this.userRepository.updateEmployerProfile(
            userId,
            employer.profileId
          );

          logger.info(`Employer profile created: ${employer.profileId}`);
        }

        // Set employerId from employer object
        employerId = employer.profileId;
      } else if (employerId) {
        // Otherwise, find by employerId
        employer = await this.employerRepository.findById(employerId);
        if (!employer) {
          throw new Error('EMPLOYER_NOT_FOUND');
        }
      } else {
        throw new Error('EMPLOYER_ID_OR_USER_ID_REQUIRED');
      }

      // Only update if there's actual data to update AND profile existed before
      let finalEmployer = employer;
      if (!isNewProfile && profileData && Object.keys(profileData).length > 0) {
        // If employer profile exists but doesn't have a company, set the company
        if (!employer.companyId && company) {
          employer.companyId = company.companyId;
        }

        // Merge only profile fields into employer entity, exclude company-related fields
        const profileFields = [
          'position',
          'contact',
          'legalRepresentative',
          'role',
          'status',
          'permissions',
        ];
        profileFields.forEach(field => {
          if (profileData[field] !== undefined) {
            employer[field] = profileData[field];
          }
        });

        // If role is provided, always set appropriate permissions
        if (profileData.role !== undefined) {
          employer.permissions = this._getPermissionsForRole(profileData.role);
        }
        finalEmployer = await this.employerRepository.update(
          employerId,
          employer
        );
        logger.info(`Employer profile updated: ${employerId}`);
      } else if (isNewProfile) {
        logger.info(`New employer profile created, skipping update`);
      }

      // Handle company data updates if provided
      let finalCompany = null;
      if (companyData && Object.keys(companyData).length > 0) {
        if (employer.companyId) {
          // Update existing company
          finalCompany = await this.companyRepository.update(
            employer.companyId,
            companyData
          );
          logger.info(`Company updated: ${employer.companyId}`);
        } else {
          // This shouldn't happen if profile was created properly
          throw new Error('COMPANY_NOT_FOUND_FOR_PROFILE');
        }
      }

      return {
        message: isNewProfile
          ? 'Hồ sơ nhà tuyển dụng đã được tạo thành công'
          : 'Hồ sơ nhà tuyển dụng đã được cập nhật thành công',
        employer: finalEmployer,
        company: finalCompany,
      };
    } catch (error) {
      logger.error('Update employer profile failed:', error.message);
      throw error;
    }
  }
}

module.exports = UpdateEmployerProfileUseCase;
