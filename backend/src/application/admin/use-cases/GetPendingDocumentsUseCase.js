const { NotFoundError } = require('../../../shared/utils/errors');

class GetPendingDocumentsUseCase {
  constructor() {
    // No dependencies needed for this simple query
  }

  async execute({ page = 1, limit = 20, documentType, employerId }) {
    const EmployerDocument = require('../../../infrastructure/models/EmployerDocument');

    // Build query
    const query = { status: 'pending' };

    if (documentType) {
      query.documentType = documentType;
    }

    if (employerId) {
      query.employerId = employerId;
    }

    // Get total count
    const total = await EmployerDocument.countDocuments(query);

    // Get documents with pagination
    const documents = await EmployerDocument.find(query)
      .populate('employerId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform data
    const transformedDocuments = documents.map(doc => ({
      id: doc._id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      employer: doc.employerId
        ? {
            id: doc.employerId._id,
            fullName: doc.employerId.fullName,
            email: doc.employerId.email,
          }
        : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return {
      documents: transformedDocuments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = GetPendingDocumentsUseCase;
