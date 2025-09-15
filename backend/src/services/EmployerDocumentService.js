/**
 * Service để quản lý document của EmployerProfile
 */
class EmployerDocumentService {
  constructor(employerProfile) {
    this.profile = employerProfile;
  }

  /**
   * Thêm document mới
   */
  async addDocument(url, cloudinaryId, documentType, metadata = {}) {
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
    } else {
      // Add new document
      this.profile.verification.documents.push({
        url,
        cloudinaryId,
        documentType,
        metadata,
        uploadedAt: new Date(),
      });
    }

    return this.profile.save({ validateBeforeSave: false });
  }

  /**
   * Xóa document
   */
  async removeDocument(documentMongoId) {
    this.profile.verification.documents =
      this.profile.verification.documents.filter(
        doc => doc._id.toString() !== documentMongoId
      );
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
