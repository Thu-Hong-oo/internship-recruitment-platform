const EmployerDocument = require('../../domain/recruitment/EmployerDocument');

class EmployerDocumentMapper {
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    const document = new EmployerDocument(
      mongooseDoc._id.toString(),
      mongooseDoc.employerId.toString(),
      mongooseDoc.documentType,
      mongooseDoc.fileUrl,
      mongooseDoc.fileName,
      mongooseDoc.mimeType,
      mongooseDoc.fileSize
    );

    document.status = mongooseDoc.status;
    document.verifiedAt = mongooseDoc.verifiedAt;
    document.verifiedBy = mongooseDoc.verifiedBy?.toString();
    document.rejectionReason = mongooseDoc.rejectionReason;
    document.metadata = new Map(Object.entries(mongooseDoc.metadata || {}));

    return document;
  }

  static toMongoose(domainEntity) {
    const data = {
      employerId: domainEntity.employerId,
      documentType: domainEntity.documentType,
      fileUrl: domainEntity.fileUrl,
      fileName: domainEntity.fileName,
      mimeType: domainEntity.mimeType,
      fileSize: domainEntity.fileSize,
      status: domainEntity.status,
    };

    if (domainEntity.verifiedAt) {
      data.verifiedAt = domainEntity.verifiedAt;
    }

    if (domainEntity.verifiedBy) {
      data.verifiedBy = domainEntity.verifiedBy;
    }

    if (domainEntity.rejectionReason) {
      data.rejectionReason = domainEntity.rejectionReason;
    }

    if (domainEntity.metadata && domainEntity.metadata.size > 0) {
      data.metadata = Object.fromEntries(domainEntity.metadata);
    }

    return data;
  }
}

module.exports = EmployerDocumentMapper;
