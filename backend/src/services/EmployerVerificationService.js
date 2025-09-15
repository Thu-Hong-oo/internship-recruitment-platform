const { EMPLOYER_PROFILE_STATUS } = require('../constants/common.constants');

/**
 * Service để quản lý verification của EmployerProfile
 */
class EmployerVerificationService {
  constructor(employerProfile) {
    this.profile = employerProfile;
  }

  /**
   * Kiểm tra có thể đăng tin không
   */
  canPostJobs() {
    if (this.profile.status === EMPLOYER_PROFILE_STATUS.VERIFIED) {
      return { canPost: true };
    }
    if (this.profile.status === EMPLOYER_PROFILE_STATUS.PENDING) {
      return { canPost: true, limited: true };
    }
    return { canPost: false, reason: 'Tài khoản chưa được xác minh' };
  }

  /**
   * Yêu cầu xác minh CCCD
   */
  async requireIdVerification(reason) {
    this.profile.legalRepresentative.identification.required = true;
    this.profile.legalRepresentative.identification.requiredReason = reason;

    if (!this.profile.legalRepresentative.identification.number) {
      this.profile.status = EMPLOYER_PROFILE_STATUS.PENDING;
    }

    return this.profile.save();
  }

  /**
   * Kiểm tra có cần xác minh CCCD không
   */
  needsIdVerification() {
    return this.profile.legalRepresentative.identification.required === true;
  }

  /**
   * Tính toán progress verification
   */
  getVerificationProgress() {
    const steps = this.profile.verification.steps;
    const totalSteps = Object.keys(steps).length;
    const completedSteps = Object.values(steps).filter(Boolean).length;
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Verify document
   */
  async verifyDocument(documentId, verifiedBy) {
    const document = this.profile.verification.documents.find(
      doc => doc.documentId === documentId
    );
    if (document) {
      document.verified = true;
      document.verifiedBy = verifiedBy;
      document.verifiedAt = new Date();
      document.rejectionReason = undefined;
      return this.profile.save();
    }
    throw new Error('Document not found');
  }

  /**
   * Reject document
   */
  async rejectDocument(documentId, rejectionReason, verifiedBy) {
    const document = this.profile.verification.documents.find(
      doc => doc.documentId === documentId
    );
    if (document) {
      document.verified = false;
      document.verifiedBy = verifiedBy;
      document.verifiedAt = new Date();
      document.rejectionReason = rejectionReason;
      return this.profile.save();
    }
    throw new Error('Document not found');
  }
}

module.exports = EmployerVerificationService;
