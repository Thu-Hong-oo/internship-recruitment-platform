// src/domain/recruitment/Company.js
const CompanySize = require('./CompanySize');
const VerificationStatus = require('./VerificationStatus');
const Address = require('./Address');

/**
 * Company Domain Entity (Aggregate Root)
 * Pure business logic - no defaults, no infrastructure concerns
 */
class Company {
  constructor(companyId, name, ownerId, address) {
    // Required fields only in constructor
    this.companyId = companyId;
    this.name = name;
    this.ownerId = ownerId;
    this.address = address;

    // Optional fields - no defaults
    this.description = null;
    this.website = null;
    this.industry = null;
    this.size = null;
    this.isVerified = null;
    this.verificationStatus = null;
    this.taxCode = null;
    this.taxCodeImageUrl = null;
    this.businessLicense = null;
    this.businessLicenseNumber = null;
    this.businessLicenseImageUrl = null;
    this.establishedDate = null;
    this.phone = null;
    this.email = null;
    this.logo = null;
    this.coverImage = null;
    this.members = null;

    // Required business fields
    // Store existing data separately
    this.existingBusinessInfo = null;
    this.existingLegalRepresentative = null;
    this.existingSocialMedia = null;

    // Current update data
    this.businessInfo = null;
    this.legalRepresentative = null;
    this.socialMedia = null;
  }

  // Getter for id (alias to companyId for consistency)
  get id() {
    return this.companyId;
  }

  updateInfo(name, description) {
    if (name) this.name = name;
    if (description) this.description = description;
  }

  verify() {
    this.isVerified = true;
    this.verificationStatus = VerificationStatus.VERIFIED;
  }

  submitForVerification() {
    this.verificationStatus = VerificationStatus.UNDER_REVIEW;
  }

  updateBusinessInfo(taxCode, license) {
    if (taxCode) this.taxCode = taxCode;
    if (license) this.businessLicense = license;
  }

  updateAddress(address) {
    if (!(address instanceof Address)) {
      throw new Error('Address must be an Address instance');
    }
    this.address = address;
  }

  uploadTaxCodeImage(imageUrl) {
    this.taxCodeImageUrl = imageUrl;
  }

  uploadBusinessLicenseImage(imageUrl) {
    this.businessLicenseImageUrl = imageUrl;
  }

  isFullyVerified() {
    return (
      this.verificationStatus === VerificationStatus.VERIFIED &&
      this.taxCode &&
      this.businessLicense
    );
  }

  getOwner() {
    // Return the owner Employer
    return (
      this.members.find(member => member.userId === this.ownerId) ||
      this.ownerId
    );
  }

  addMember(member) {
    if (!this.members.find(m => m.userId === member.userId)) {
      this.members.push(member);
    }
  }

  removeMember(memberId) {
    this.members = this.members.filter(member => member.userId !== memberId);
  }
}

module.exports = Company;
