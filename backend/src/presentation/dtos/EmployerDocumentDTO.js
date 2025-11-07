class EmployerDocumentDTO {
  constructor(document) {
    this.id = document.id;
    this.documentType = document.documentType;
    this.fileUrl = document.fileUrl;
    this.fileName = document.fileName;
    this.mimeType = document.mimeType;
    this.fileSize = document.fileSize;
    this.status = document.status;
    this.verifiedAt = document.verifiedAt;
    this.rejectionReason = document.rejectionReason;
    this.metadata = Object.fromEntries(document.metadata || new Map());
    this.createdAt = document.createdAt;
    this.updatedAt = document.updatedAt;
  }

  static fromDocument(document) {
    return new EmployerDocumentDTO(document);
  }

  static fromDocuments(documents) {
    return documents.map(doc => new EmployerDocumentDTO(doc));
  }
}

module.exports = EmployerDocumentDTO;
