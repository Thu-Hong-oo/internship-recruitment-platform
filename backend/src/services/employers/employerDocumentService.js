// Service để quản lý document của EmployerProfile
const { logger } = require('../../utils/logger');

class EmployerDocumentService {
  constructor(employerProfile) {
    this.profile = employerProfile;
  }

  /**
   * Thêm document mới
   */
  async addDocument(url, cloudinaryId, documentType, metadata = {}) {
    logger.info('Adding document to profile', {
      profileId: this.profile._id,
      documentType,
      existingDocsCount: this.profile.verification.documents.length,
    });

    const existingDoc = this.profile.verification.documents.find(
      doc => doc.documentType === documentType
    );

    if (existingDoc) {
      // Update existing document
      existingDoc.url = url;
      existingDoc.cloudinaryId = cloudinaryId;
      existingDoc.metadata = { ...existingDoc.metadata, ...metadata };
      existingDoc.uploadedAt = new Date();
      existingDoc.verified = false;
      existingDoc.verifiedBy = undefined;
      existingDoc.verifiedAt = undefined;
      existingDoc.rejectionReason = undefined;
      logger.info('Updated existing document', {
        profileId: this.profile._id,
        documentType,
      });
    } else {
      // Add new document
      this.profile.verification.documents.push({
        url,
        cloudinaryId,
        documentType,
        metadata,
        uploadedAt: new Date(),
      });
      logger.info('Added new document', {
        profileId: this.profile._id,
        documentType,
      });
    }

    // FIX: Grace period approach - Don't immediately revoke verification
    // Company keeps posting rights but documents need re-review
    if (this.profile.verification.steps.adminApproved) {
      // Set pending review flag instead of immediate revoke
      this.profile.verification.pendingReview = true;
      this.profile.verification.lastDocumentUpdate = new Date();

      // Calculate grace period deadline (30 days)
      const gracePeriod = new Date();
      gracePeriod.setDate(gracePeriod.getDate() + 30);
      this.profile.verification.reviewDeadline = gracePeriod;

      // Keep verification but mark as needs review
      // this.profile.verification.isVerified = true; // Keep current status
      // this.profile.status = 'verified'; // Keep posting rights
    }

    logger.info('About to save profile', {
      profileId: this.profile._id,
      documentsCount: this.profile.verification.documents.length,
    });

    const savedProfile = await this.profile.save({ validateBeforeSave: false });

    logger.info('Profile saved successfully', {
      profileId: this.profile._id,
      documentsCount: savedProfile.verification.documents.length,
    });

    return savedProfile;
  }

  /**
   * Xóa document
   */
  async removeDocument(documentMongoId) {
    this.profile.verification.documents =
      this.profile.verification.documents.filter(
        doc => doc._id.toString() !== documentMongoId
      );

    // FIX: Grace period approach for document removal
    if (this.profile.verification.steps.adminApproved) {
      this.profile.verification.pendingReview = true;
      this.profile.verification.lastDocumentUpdate = new Date();

      // Calculate grace period deadline (30 days)
      const gracePeriod = new Date();
      gracePeriod.setDate(gracePeriod.getDate() + 30);
      this.profile.verification.reviewDeadline = gracePeriod;

      // Keep verification but mark as needs review
      // this.profile.verification.isVerified = true; // Keep current status
    }

    return this.profile.save({ validateBeforeSave: false });
  }

  /**
   * Kiểm tra document tồn tại
   */
  hasDocument(documentMongoId) {
    return this.profile.verification.documents.some(
      doc => doc._id.toString() === documentMongoId
    );
  }

  /**
   * Lấy document theo ID
   */
  getDocument(documentMongoId) {
    return this.profile.verification.documents.find(
      doc => doc._id.toString() === documentMongoId
    );
  }

  /**
   * Lấy documents theo type
   */
  getDocumentsByType(documentType) {
    return this.profile.verification.documents.filter(
      doc => doc.documentType === documentType
    );
  }
}

module.exports = EmployerDocumentService;
