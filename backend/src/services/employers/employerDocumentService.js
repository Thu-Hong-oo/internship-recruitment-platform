
const { logger } = require('../../utils/logger');
const { AppError } = require('../../utils/errors');
const { uploadDocument, deleteDocument } = require('../upload/documentUploadService');

class EmployerDocumentService {
  constructor(employerProfile) {
    if (!employerProfile) {
      throw new AppError('Employer profile is required', 400);
    }
    this.profile = employerProfile;
  }

  /**
   * Add or update document
   */
  async addDocument(file, documentType, metadata = {}) {
    try {
      logger.info('Adding document', {
        profileId: this.profile._id,
        documentType,
        existingCount: this.profile.verification.documents.length
      });

      // Upload to cloud storage
      const uploadResult = await uploadDocument(file, {
        folder: `employer-documents/${this.profile._id}`,
        documentType
      });

      // Find existing document of same type
      const existingIndex = this.profile.verification.documents.findIndex(
        doc => doc.documentType === documentType
      );

      const documentData = {
        url: uploadResult.url,
        cloudinaryId: uploadResult.publicId,
        documentType,
        uploadedAt: new Date(),
        verified: false,
        metadata: {
          filename: uploadResult.originalName,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimeType,
          ...metadata
        }
      };

      if (existingIndex !== -1) {
        // Delete old file from cloud
        const oldDoc = this.profile.verification.documents[existingIndex];
        if (oldDoc.cloudinaryId) {
          try {
            await deleteDocument(oldDoc.cloudinaryId);
          } catch (error) {
            logger.warn('Failed to delete old document', { error });
          }
        }

        // Update existing
        this.profile.verification.documents[existingIndex] = documentData;
        logger.info('Document updated', { profileId: this.profile._id, documentType });
      } else {
        // Add new
        this.profile.verification.documents.push(documentData);
        logger.info('Document added', { profileId: this.profile._id, documentType });
      }

      // Handle verification status
      await this._handleDocumentChange();

      await this.profile.save();

      return {
        document: documentData,
        profile: this.profile
      };
    } catch (error) {
      logger.error('Error adding document', { 
        profileId: this.profile._id,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Remove document
   */
  async removeDocument(documentId) {
    const docIndex = this.profile.verification.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (docIndex === -1) {
      throw new AppError('Document not found', 404);
    }

    const document = this.profile.verification.documents[docIndex];

    // Delete from cloud storage
    if (document.cloudinaryId) {
      try {
        await deleteDocument(document.cloudinaryId);
      } catch (error) {
        logger.warn('Failed to delete document from cloud', { error });
      }
    }

    // Remove from array
    this.profile.verification.documents.splice(docIndex, 1);

    // Handle verification status
    await this._handleDocumentChange();

    await this.profile.save();

    logger.info('Document removed', { 
      profileId: this.profile._id,
      documentId 
    });

    return this.profile;
  }

  /**
   * Get document by ID
   */
  getDocument(documentId) {
    const document = this.profile.verification.documents.find(
      doc => doc._id.toString() === documentId
    );

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  /**
   * Get documents by type
   */
  getDocumentsByType(documentType) {
    return this.profile.verification.documents.filter(
      doc => doc.documentType === documentType
    );
  }

  /**
   * Check if document exists
   */
  hasDocument(documentType) {
    return this.profile.verification.documents.some(
      doc => doc.documentType === documentType
    );
  }

  /**
   * Get all verified documents
   */
  getVerifiedDocuments() {
    return this.profile.verification.documents.filter(doc => doc.verified);
  }

  /**
   * Get all pending documents
   */
  getPendingDocuments() {
    return this.profile.verification.documents.filter(doc => !doc.verified);
  }

  /**
   * Handle document change - Grace period approach
   */
  async _handleDocumentChange() {
    // Only apply grace period if already verified
    if (!this.profile.verification.steps.adminApproved) {
      return;
    }

    // Set pending review
    this.profile.verification.pendingReview = true;
    this.profile.verification.lastDocumentUpdate = new Date();

    // Calculate grace period deadline (30 days)
    const gracePeriod = new Date();
    gracePeriod.setDate(gracePeriod.getDate() + 30);
    this.profile.verification.reviewDeadline = gracePeriod;

    logger.info('Document change - grace period applied', {
      profileId: this.profile._id,
      reviewDeadline: gracePeriod
    });

    // Keep verified status during grace period
    // Admin will review and decide to keep or revoke
  }

  /**
   * Check if grace period expired
   */
  isGracePeriodExpired() {
    if (!this.profile.verification.reviewDeadline) {
      return false;
    }
    return new Date() > this.profile.verification.reviewDeadline;
  }
}

module.exports = EmployerDocumentService;