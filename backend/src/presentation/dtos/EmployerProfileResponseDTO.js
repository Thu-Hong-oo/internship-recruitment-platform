/**
 * EmployerProfileResponseDTO
 * Transforms infrastructure EmployerProfile model into API-friendly format
 */
class EmployerProfileResponseDTO {
  constructor(employerProfileModel) {
    this.id = employerProfileModel._id;
    this.owner = employerProfileModel.owner;
    this.company = employerProfileModel.company || {};
    this.position = employerProfileModel.position || {};
    this.contact = employerProfileModel.contact || {};
    this.legalRepresentative = employerProfileModel.legalRepresentative || {};
    this.businessInfo = employerProfileModel.businessInfo || {};
    this.verification = employerProfileModel.verification || {};
    this.status = employerProfileModel.status;
    this.createdAt = employerProfileModel.createdAt;
    this.updatedAt = employerProfileModel.updatedAt;
  }

  /**
   * Factory method to create DTO from EmployerProfile model
   */
  static fromEmployerProfile(employerProfileModel) {
    return new EmployerProfileResponseDTO(employerProfileModel);
  }

  /**
   * Factory method to create DTOs from array of EmployerProfile models
   */
  static fromEmployerProfiles(employerProfileModels) {
    return employerProfileModels.map(
      model => new EmployerProfileResponseDTO(model)
    );
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      owner: this.owner,
      company: this.company,
      position: this.position,
      contact: this.contact,
      legalRepresentative: this.legalRepresentative,
      businessInfo: this.businessInfo,
      verification: this.verification,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = EmployerProfileResponseDTO;
