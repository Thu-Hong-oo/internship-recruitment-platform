/**
 * CompanyResponseDTO
 * Transforms infrastructure Company model into API-friendly format
 */
class CompanyResponseDTO {
  constructor(companyModel) {
    this.id = companyModel._id;
    this.companyId = companyModel.companyId;
    this.companyName = companyModel.companyName;
    this.name = companyModel.name;
    this.legalName = companyModel.legalName;
    this.taxCode = companyModel.taxCode;
    this.description = companyModel.description;
    this.websiteUrl = companyModel.websiteUrl;
    this.logoUrl = companyModel.logoUrl;
    this.companyHotline = companyModel.companyHotline;
    this.companyEmail = companyModel.companyEmail;
    this.foundedYear = companyModel.foundedYear;
    this.verificationStatus = companyModel.verificationStatus;
    this.companySize = companyModel.companySize;
    this.size = companyModel.size;
    this.industry = companyModel.industry;
    this.location = companyModel.location || {};
    this.contact = companyModel.contact || {};
    this.socialMedia = companyModel.socialMedia || {};
    this.isVerified = companyModel.isVerified;
    this.verifiedAt = companyModel.verifiedAt;
    this.createdAt = companyModel.createdAt;
    this.updatedAt = companyModel.updatedAt;
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
      companyName: this.companyName,
      name: this.name,
      legalName: this.legalName,
      taxCode: this.taxCode,
      description: this.description,
      websiteUrl: this.websiteUrl,
      logoUrl: this.logoUrl,
      companyHotline: this.companyHotline,
      companyEmail: this.companyEmail,
      foundedYear: this.foundedYear,
      verificationStatus: this.verificationStatus,
      companySize: this.companySize,
      size: this.size,
      industry: this.industry,
      location: this.location,
      contact: this.contact,
      socialMedia: this.socialMedia,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = CompanyResponseDTO;
