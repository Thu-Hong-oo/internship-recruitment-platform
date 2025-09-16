/**
 * Helper để migrate từ old EmployerProfile methods sang services
 * Sử dụng để update controllers một cách dần dần
 */

/**
 * Wrapper cho document operations
 */
function getDocumentService(profile) {
  return profile.getDocumentService();
}

/**
 * Wrapper cho verification operations
 */
function getVerificationService(profile) {
  return profile.getVerificationService();
}

/**
 * Migration helper functions
 */
const EmployerProfileHelpers = {
  // Document operations
  async addDocument(profile, url, cloudinaryId, documentType, metadata = {}) {
    const service = getDocumentService(profile);
    return service.addDocument(url, cloudinaryId, documentType, metadata);
  },

  async removeDocument(profile, documentMongoId) {
    const service = getDocumentService(profile);
    return service.removeDocument(documentMongoId);
  },

  hasDocument(profile, documentMongoId) {
    const service = getDocumentService(profile);
    return service.hasDocument(documentMongoId);
  },

  getDocument(profile, documentMongoId) {
    const service = getDocumentService(profile);
    return service.getDocument(documentMongoId);
  },

  getDocumentsByType(profile, documentType) {
    const service = getDocumentService(profile);
    return service.getDocumentsByType(documentType);
  },

  // Verification operations
  canPostJobs(profile) {
    const service = getVerificationService(profile);
    return service.canPostJobs();
  },

  async requireIdVerification(profile, reason) {
    const service = getVerificationService(profile);
    return service.requireIdVerification(reason);
  },

  needsIdVerification(profile) {
    const service = getVerificationService(profile);
    return service.needsIdVerification();
  },

  async verifyDocument(profile, documentId, verifiedBy) {
    const service = getVerificationService(profile);
    return service.verifyDocument(documentId, verifiedBy);
  },

  async rejectDocument(profile, documentId, rejectionReason, verifiedBy) {
    const service = getVerificationService(profile);
    return service.rejectDocument(documentId, rejectionReason, verifiedBy);
  },
};

module.exports = EmployerProfileHelpers;
