const { logger } = require('../../../shared/utils/logger');
const CompanySize = require('../../../domain/recruitment/enums/CompanySize');

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
  _transformCompanySize(frontendSize) {
    if (!frontendSize) return CompanySize.STARTUP_1_10;

    // If already in correct enum format, return as-is
    if (Object.values(CompanySize).includes(frontendSize)) {
      return frontendSize;
    }

    // Map frontend format to enum
    const sizeMap = {
      '1-10': CompanySize.STARTUP_1_10,
      '11-50': CompanySize.SMALL_11_50,
      '51-200': CompanySize.MEDIUM_51_200,
      '201-1000': CompanySize.LARGE_201_1000,
      '1000+': CompanySize.ENTERPRISE_1000_PLUS,
      '1000-plus': CompanySize.ENTERPRISE_1000_PLUS,
      startup: CompanySize.STARTUP_1_10,
      small: CompanySize.SMALL_11_50,
      medium: CompanySize.MEDIUM_51_200,
      large: CompanySize.LARGE_201_1000,
      enterprise: CompanySize.ENTERPRISE_1000_PLUS,
    };

    const normalized = frontendSize.toLowerCase().replace(/\s+/g, '');
    return sizeMap[normalized] || CompanySize.STARTUP_1_10;
  }

  async execute({ userId, employerId, profileData }) {
    try {
      let employer;
      let isNewProfile = false; // Track if we just created a new profile

      // If userId is provided, find employer by userId first
      if (userId) {
        employer = await this.employerRepository.findByUserId(userId);

        if (employer) {
          logger.info(`Found existing employer profile: ${employer.id}`);
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

          // Step 2: Create EmployerProfile entity through repository
          const employerProfileData = {
            userId: userId,
            companyId: company.id,
            position: {
              title: profileData.position?.title || 'Nhân viên',
              level: profileData.position?.level || 'junior',
              department: profileData.position?.department || 'Quản lý',
            },
            role: 'owner',
            permissions: {
              canPostJobs: true,
              canEditJobs: true,
              canDeleteJobs: true,
              canViewApplications: true,
              canReviewApplications: true,
              canScheduleInterviews: true,
              canManageMembers: true,
              canEditCompanyInfo: true,
            },
          };

          employer = await this.employerRepository.create(employerProfileData);

          // Step 3: Update user reference
          await this.userRepository.updateEmployerProfile(userId, employer.id);

          logger.info(`Employer profile created: ${employer.id}`);
        }

        // Set employerId from employer object
        employerId = employer.id;
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
        finalEmployer = await this.employerRepository.update(
          employerId,
          profileData
        );
        logger.info(`Employer profile updated: ${employerId}`);
      } else if (isNewProfile) {
        logger.info(`New employer profile created, skipping update`);
      }

      return {
        message: isNewProfile
          ? 'Hồ sơ nhà tuyển dụng đã được tạo thành công'
          : 'Hồ sơ nhà tuyển dụng đã được cập nhật thành công',
        employer: finalEmployer,
      };
    } catch (error) {
      logger.error('Update employer profile failed:', error.message);
      throw error;
    }
  }
}

module.exports = UpdateEmployerProfileUseCase;
