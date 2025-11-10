const { NotFoundError } = require('../../../shared/utils/errors');

class GetDocumentDetailsUseCase {
  constructor() {
    // No dependencies needed
  }

  async execute({ documentId }) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const EmployerDocument = require('../../../infrastructure/models/EmployerDocument');

    const document = await EmployerDocument.findById(documentId)
      .populate('employerId', 'fullName email')
      .populate('verifiedBy', 'fullName email')
      .lean();

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    return {
      id: document._id,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      status: document.status,
      verifiedAt: document.verifiedAt,
      rejectionReason: document.rejectionReason,
      employer: document.employerId
        ? {
            id: document.employerId._id,
            fullName: document.employerId.fullName,
            email: document.employerId.email,
          }
        : null,
      verifiedBy: document.verifiedBy
        ? {
            id: document.verifiedBy._id,
            fullName: document.verifiedBy.fullName,
            email: document.verifiedBy.email,
          }
        : null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}

module.exports = GetDocumentDetailsUseCase;
