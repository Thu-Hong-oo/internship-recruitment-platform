const { logger } = require('../../../shared/utils/logger');
const { getPermissionsForRole } = require('../../../shared/utils/permissions');
const Company = require('../../../domain/recruitment/Company');
const Address = require('../../../domain/recruitment/Address');

/**
 * CreateCompanyUseCase
 * Application Layer - orchestrates business logic
 * Handles defaults and data preparation before passing to Domain
 */
class CreateCompanyUseCase {
  constructor(companyRepository, employerRepository) {
    this.companyRepository = companyRepository;
    this.employerRepository = employerRepository;
  }

  async execute({ userId, companyData }) {
    try {
      // 1. Validation (Application Layer responsibility)
      this._validateInput(companyData);

      // 2. Business rule check
      await this._checkUserEligibility(userId);

      // 3. Create domain objects with Application Layer defaults
      const address = this._createAddress(companyData.address);
      const company = this._createCompany(userId, companyData, address);

      // 4. Save company
      const savedCompany = await this.companyRepository.create(company);

      // 5. Create owner profile
      const ownerProfile = await this._createOwnerProfile(
        userId,
        savedCompany.companyId,
        companyData.ownerPosition
      );

      logger.info(
        `Company created: ${savedCompany.companyId} by user: ${userId}`
      );

      return {
        company: savedCompany,
        profile: ownerProfile,
      };
    } catch (error) {
      logger.error('Create company failed:', error);
      throw error;
    }
  }

  _validateInput(companyData) {
    if (!companyData.name?.trim()) {
      throw new Error('COMPANY_NAME_REQUIRED');
    }

    // Validate business info
    if (!companyData.businessInfo?.taxId) {
      throw new Error('BUSINESS_INFO_TAX_ID_REQUIRED');
    }
    if (!companyData.businessInfo?.issueDate) {
      throw new Error('BUSINESS_INFO_ISSUE_DATE_REQUIRED');
    }
    if (!companyData.businessInfo?.issuePlace) {
      throw new Error('BUSINESS_INFO_ISSUE_PLACE_REQUIRED');
    }

    // Validate legal representative
    if (!companyData.legalRepresentative?.fullName) {
      throw new Error('LEGAL_REPRESENTATIVE_FULL_NAME_REQUIRED');
    }
    if (!companyData.legalRepresentative?.position) {
      throw new Error('LEGAL_REPRESENTATIVE_POSITION_REQUIRED');
    }
    if (!companyData.legalRepresentative?.phone) {
      throw new Error('LEGAL_REPRESENTATIVE_PHONE_REQUIRED');
    }
    if (!companyData.legalRepresentative?.email) {
      throw new Error('LEGAL_REPRESENTATIVE_EMAIL_REQUIRED');
    }
  }

  async _checkUserEligibility(userId) {
    const existingCompany = await this.companyRepository.findByOwner(userId);
    if (existingCompany) {
      throw new Error('USER_ALREADY_HAS_COMPANY');
    }
  }

  _createAddress(addressData) {
    if (!addressData) return null;

    // Use defaults at Application Layer, not in Domain
    return new Address(
      addressData.street || '',
      addressData.ward || '',
      addressData.district || '',
      addressData.city || '',
      addressData.country || 'Việt Nam'
    );
  }

  _createCompany(userId, companyData, address) {
    // Create Company domain entity with required fields
    const company = new Company(
      null, // id - will be assigned by repository
      companyData.name,
      userId,
      address
    );

    // Set optional fields
    if (companyData.description) company.description = companyData.description;
    if (companyData.website) company.website = companyData.website;
    if (companyData.industry) company.industry = companyData.industry;
    if (companyData.size) company.size = companyData.size;
    if (companyData.email) company.email = companyData.email;
    if (companyData.phone) company.phone = companyData.phone;
    if (companyData.logo) company.logoUrl = companyData.logo;

    // Business info
    if (companyData.businessInfo?.taxId) {
      company.businessInfo.taxId = companyData.businessInfo.taxId;
    }
    if (companyData.businessInfo?.issueDate) {
      company.businessInfo.issueDate = new Date(
        companyData.businessInfo.issueDate
      );
    }
    if (companyData.businessInfo?.issuePlace) {
      company.businessInfo.issuePlace = companyData.businessInfo.issuePlace;
    }
    if (companyData.businessInfo?.registrationNumber) {
      company.businessInfo.registrationNumber =
        companyData.businessInfo.registrationNumber;
      company.businessLicenseNumber =
        companyData.businessInfo.registrationNumber;
    }

    // Legal representative
    if (companyData.legalRepresentative?.fullName) {
      company.legalRepresentative.fullName =
        companyData.legalRepresentative.fullName;
    }
    if (companyData.legalRepresentative?.position) {
      company.legalRepresentative.position =
        companyData.legalRepresentative.position;
    }
    if (companyData.legalRepresentative?.phone) {
      company.legalRepresentative.phone = companyData.legalRepresentative.phone;
    }
    if (companyData.legalRepresentative?.email) {
      company.legalRepresentative.email = companyData.legalRepresentative.email;
    }

    // Initialize verification status
    company.isVerified = false;
    company.verificationStatus = 'pending';

    // Initialize members array
    company.members = [];

    return company;
  }

  async _createOwnerProfile(userId, companyId, positionData) {
    // Application Layer sets defaults for profile creation
    return await this.employerRepository.create({
      owner: userId,
      company: companyId,
      role: 'owner',
      permissions: getPermissionsForRole('owner'),
      position: positionData || { title: 'Giám đốc' },
      status: 'active',
      joinedAt: new Date(),
    });
  }
}

module.exports = CreateCompanyUseCase;
