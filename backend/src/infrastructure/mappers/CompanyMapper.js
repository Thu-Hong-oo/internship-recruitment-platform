const CompanyDomain = require('../../domain/recruitment/Company');
const Address = require('../../domain/recruitment/Address');

/**
 * CompanyMapper
 * Infrastructure layer - converts between Domain Entity and Mongoose Model
 * Pure transformation - no defaults, no business logic, no mutations
 */
class CompanyMapper {
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    // Create Address value object if exists
    const address = mongooseDoc.address
      ? new Address(
          mongooseDoc.address.street,
          mongooseDoc.address.ward,
          mongooseDoc.address.district,
          mongooseDoc.address.city,
          mongooseDoc.address.country
        )
      : null;

    const company = new CompanyDomain(
      mongooseDoc._id.toString(),
      mongooseDoc.name,
      this._toStringOrNull(mongooseDoc.owner),
      address
    );

    // Basic fields
    // Keep existing values if not provided in update
    company.description = mongooseDoc.description ?? company.description;
    company.website = mongooseDoc.website ?? company.website;
    company.industry = mongooseDoc.industry ?? company.industry;
    company.size = mongooseDoc.size ?? company.size;
    company.logo = mongooseDoc.logo ?? company.logo;
    company.coverImage = mongooseDoc.coverImage ?? company.coverImage;
    company.email = mongooseDoc.email ?? company.email;
    company.phone = mongooseDoc.phone ?? company.phone;

    // Handle foundedYear
    company.foundedYear = mongooseDoc.foundedYear;

    // Map and store sensitive information
    company.businessInfo = mongooseDoc.businessInfo
      ? { ...mongooseDoc.businessInfo }
      : null;
    company.existingBusinessInfo = company.businessInfo;

    company.legalRepresentative = mongooseDoc.legalRepresentative
      ? { ...mongooseDoc.legalRepresentative }
      : null;
    company.existingLegalRepresentative = company.legalRepresentative;

    company.socialMedia = mongooseDoc.socialMedia
      ? { ...mongooseDoc.socialMedia }
      : null;
    company.existingSocialMedia = company.socialMedia;

    // Verification - map without defaults
    company.isVerified = mongooseDoc.verification?.isVerified;
    company.verificationStatus = mongooseDoc.status;

    return company;
  }

  static toMongoose(domainEntity) {
    const data = {
      owner: this._toStringOrNull(domainEntity.ownerId),
      name: domainEntity.name,
      status: domainEntity.verificationStatus,
    };

    // Map companyId if it exists
    if (domainEntity.companyId) {
      data.companyId = domainEntity.companyId;
    }

    // Optional fields - chỉ gán nếu có giá trị
    this._assignIfDefined(data, 'description', domainEntity.description);
    this._assignIfDefined(data, 'website', domainEntity.website);
    this._assignIfDefined(data, 'industry', domainEntity.industry);
    this._assignIfDefined(data, 'size', domainEntity.size);
    this._assignIfDefined(data, 'logo', domainEntity.logoUrl);
    this._assignIfDefined(data, 'coverImage', domainEntity.coverImageUrl);
    this._assignIfDefined(data, 'email', domainEntity.email);
    this._assignIfDefined(data, 'phone', domainEntity.phone);

    // Handle foundedYear
    if (domainEntity.foundedYear) {
      data.foundedYear = domainEntity.foundedYear;
    }

    // Address - sử dụng method từ value object
    if (domainEntity.address) {
      data.address = domainEntity.address.toPlainObject();
    }

    // Handle sensitive information with proper merging
    if (domainEntity.businessInfo || domainEntity.existingBusinessInfo) {
      data.businessInfo = {
        ...(domainEntity.existingBusinessInfo || {}),
        ...(domainEntity.businessInfo || {}),
      };
    }

    if (
      domainEntity.legalRepresentative ||
      domainEntity.existingLegalRepresentative
    ) {
      data.legalRepresentative = {
        ...(domainEntity.existingLegalRepresentative || {}),
        ...(domainEntity.legalRepresentative || {}),
      };
    }

    if (domainEntity.socialMedia || domainEntity.existingSocialMedia) {
      data.socialMedia = {
        ...(domainEntity.existingSocialMedia || {}),
        ...(domainEntity.socialMedia || {}),
      };
    }
    data.businessInfo = domainEntity.businessInfo
      ? {
          ...(domainEntity.existingBusinessInfo || {}),
          ...domainEntity.businessInfo,
        }
      : domainEntity.existingBusinessInfo || {};

    // Preserve and merge legal representative info
    data.legalRepresentative = domainEntity.legalRepresentative
      ? {
          ...(domainEntity.existingLegalRepresentative || {}),
          ...domainEntity.legalRepresentative,
        }
      : domainEntity.existingLegalRepresentative || {};

    // Preserve and merge social media
    data.socialMedia = domainEntity.socialMedia
      ? {
          ...(domainEntity.existingSocialMedia || {}),
          ...domainEntity.socialMedia,
        }
      : domainEntity.existingSocialMedia || {};

    // Verification
    if (domainEntity.isVerified !== undefined) {
      data.verification = {
        isVerified: domainEntity.isVerified,
      };
    }

    return data;
  }

  // Helper methods
  static _toStringOrNull(value) {
    if (!value) return null;
    return typeof value === 'object' && value.toString
      ? value.toString()
      : value;
  }

  static _assignIfDefined(target, key, value) {
    if (value !== undefined) {
      target[key] = value;
    }
  }
}

module.exports = CompanyMapper;
