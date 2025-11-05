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
    company.description = mongooseDoc.description;
    company.website = mongooseDoc.website;
    company.industry = mongooseDoc.industry;
    company.size = mongooseDoc.size;
    company.logoUrl = mongooseDoc.logoUrl;
    company.email = mongooseDoc.email;
    company.phone = mongooseDoc.phone;

    // Date với null check đúng
    company.establishedDate =
      mongooseDoc.foundedYear != null
        ? new Date(mongooseDoc.foundedYear, 0, 1)
        : null;

    // Business info
    if (mongooseDoc.businessInfo) {
      company.taxCode = mongooseDoc.businessInfo.taxId;
      company.businessLicenseNumber =
        mongooseDoc.businessInfo.registrationNumber;
    }

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

    // Optional fields - chỉ gán nếu có giá trị
    this._assignIfDefined(data, 'description', domainEntity.description);
    this._assignIfDefined(data, 'website', domainEntity.website);
    this._assignIfDefined(data, 'industry', domainEntity.industry);
    this._assignIfDefined(data, 'size', domainEntity.size);
    this._assignIfDefined(data, 'logo', domainEntity.logoUrl);
    this._assignIfDefined(data, 'email', domainEntity.email);
    this._assignIfDefined(data, 'phone', domainEntity.phone);

    // Date
    if (domainEntity.establishedDate) {
      data.foundedYear = domainEntity.establishedDate.getFullYear();
    }

    // Address - sử dụng method từ value object
    if (domainEntity.address) {
      data.address = domainEntity.address.toPlainObject();
    }

    // Business info - chỉ tạo object khi có data thực sự
    const businessInfo = {};
    if (domainEntity.taxCode !== undefined) {
      businessInfo.taxId = domainEntity.taxCode;
    }
    if (domainEntity.businessLicenseNumber !== undefined) {
      businessInfo.registrationNumber = domainEntity.businessLicenseNumber;
    }
    if (Object.keys(businessInfo).length > 0) {
      data.businessInfo = businessInfo;
    }

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
