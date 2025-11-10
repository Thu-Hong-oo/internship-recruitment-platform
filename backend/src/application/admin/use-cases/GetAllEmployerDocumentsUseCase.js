const {
  BadRequestError,
  NotFoundError,
} = require('../../../shared/utils/errors');

class GetAllEmployerDocumentsUseCase {
  constructor() {
    // No dependencies needed for this simple query
  }

  async execute({
    page = 1,
    limit = 20,
    status,
    employerId,
    documentType,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const EmployerDocument = require('../../../infrastructure/models/EmployerDocument');

    // Build query
    const query = {};
    if (status) query.status = status;
    if (employerId) query.employerId = employerId;
    if (documentType) query.documentType = documentType;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const documents = await EmployerDocument.find(query)
      .populate('employerId', 'fullName email')
      .populate('verifiedBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EmployerDocument.countDocuments(query);

    return {
      documents: documents.map(doc => ({
        id: doc._id,
        employerId: doc.employerId,
        employerName: doc.employerId?.fullName || 'Unknown',
        employerEmail: doc.employerId?.email || 'Unknown',
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        status: doc.status,
        verifiedAt: doc.verifiedAt,
        verifiedBy: doc.verifiedBy,
        rejectionReason: doc.rejectionReason,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = GetAllEmployerDocumentsUseCase;
