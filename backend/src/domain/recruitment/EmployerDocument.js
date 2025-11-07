class EmployerDocument {
  constructor(
    id,
    employerId,
    documentType,
    fileUrl,
    fileName,
    mimeType,
    fileSize
  ) {
    this.id = id;
    this.employerId = employerId;
    this.documentType = documentType;
    this.fileUrl = fileUrl;
    this.fileName = fileName;
    this.mimeType = mimeType;
    this.fileSize = fileSize;
    this.status = 'pending';
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.rejectionReason = null;
    this.metadata = new Map();
  }

  approve(verifiedBy) {
    this.status = 'approved';
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.rejectionReason = null;
  }

  reject(reason, verifiedBy) {
    this.status = 'rejected';
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.rejectionReason = reason;
  }

  addMetadata(key, value) {
    this.metadata.set(key, value);
  }

  removeMetadata(key) {
    this.metadata.delete(key);
  }

  updateFileInfo(fileUrl, fileName, mimeType, fileSize) {
    this.fileUrl = fileUrl;
    this.fileName = fileName;
    this.mimeType = mimeType;
    this.fileSize = fileSize;
  }
}

module.exports = EmployerDocument;
