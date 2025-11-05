// src/domain/recruitment/Company.js
const CompanySize = require('./CompanySize');
const VerificationStatus = require('./VerificationStatus');
const Address = require('./Address');

class Company {
  constructor(companyId, name, ownerId, address) {
    this.companyId = companyId;
    this.name = name;
    this.description = '';
    this.website = '';
    this.industry = '';
    this.size = CompanySize.STARTUP;
    this.isVerified = false;
    this.verificationStatus = VerificationStatus.PENDING;
    this.ownerId = ownerId;
    this.taxCode = '';
    this.taxCodeImageUrl = '';
    this.businessLicense = '';
    this.businessLicenseNumber = '';
    this.businessLicenseImageUrl = '';
    this.establishedDate = null;
    this.address = address;
    this.phone = '';
    this.email = '';
    this.logoUrl = '';
    this.members = []; // List of Employer members
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
