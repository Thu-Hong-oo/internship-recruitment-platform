/**
 * CompanyResponseDTO
 * Transforms infrastructure Company model into API-friendly format
 */
class CompanyResponseDTO {
  constructor(companyModel) {
    this.id = companyModel._id;
    this.companyId = companyModel.companyId;
    this.name = companyModel.name;
    this.legalName = companyModel.legalName;
    this.industry = companyModel.industry;
    this.size = companyModel.size;
    this.description = companyModel.description;
    this.website = companyModel.website;
    this.logo = companyModel.logo;
    this.coverImage = companyModel.coverImage;
    this.phone = companyModel.phone;
    this.email = companyModel.email;
    this.foundedYear = companyModel.foundedYear;

    // Address mapping
    this.address = companyModel.address || {};

    // Business info mapping
    this.businessInfo = companyModel.businessInfo || {};

    // Legal representative mapping
    this.legalRepresentative = companyModel.legalRepresentative || {};

    // Social media mapping
    this.socialMedia = companyModel.socialMedia || {};

    // Verification mapping
    this.isVerified = companyModel.verification?.isVerified || false;
    this.verificationStatus = companyModel.verification?.isVerified
      ? 'verified'
      : 'pending';
    this.verifiedAt = companyModel.verification?.verifiedAt;
    this.verificationSteps = companyModel.verification?.steps || {};
    this.verificationDocuments = companyModel.verification?.documents || [];

    // Status
    this.status = companyModel.status;

    // Timestamps
    this.createdAt = companyModel.createdAt;
    this.updatedAt = companyModel.updatedAt;

    // Owner reference
    this.owner = companyModel.owner;
  }

  /**
   * Factory method to create DTO from Company model
   */
  static fromCompany(companyModel) {
    return new CompanyResponseDTO(companyModel);
  }

  /**
   * Factory method to create DTOs from array of Company models
   */
  static fromCompanies(companyModels) {
    return companyModels.map(model => new CompanyResponseDTO(model));
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      companyId: this.companyId,
      name: this.name,
      legalName: this.legalName,
      industry: this.industry,
      size: this.size,
      description: this.description,
      website: this.website,
      logo: this.logo,
      coverImage: this.coverImage,
      phone: this.phone,
      email: this.email,
      foundedYear: this.foundedYear,
      address: this.address,
      businessInfo: this.businessInfo,
      legalRepresentative: this.legalRepresentative,
      socialMedia: this.socialMedia,
      isVerified: this.isVerified,
      verificationStatus: this.verificationStatus,
      verifiedAt: this.verifiedAt,
      verificationSteps: this.verificationSteps,
      verificationDocuments: this.verificationDocuments,
      status: this.status,
      owner: this.owner,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = CompanyResponseDTO;
