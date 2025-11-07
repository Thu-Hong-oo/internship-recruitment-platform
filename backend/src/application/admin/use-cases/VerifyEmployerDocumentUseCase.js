const {
  BadRequestError,
  NotFoundError,
} = require('../../../shared/utils/errors');

class VerifyEmployerDocumentUseCase {
  constructor(employerRepository, companyRepository) {
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
  }

  async execute({ documentId, adminId, status, rejectionReason }) {
    // Validate input
    if (!documentId || !adminId || !status) {
      throw new BadRequestError(
        'Document ID, admin ID, and status are required'
      );
    }

    // Validate status
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(
        'Status must be either "approved" or "rejected"'
      );
    }

    // If rejecting, rejection reason is required
    if (status === 'rejected' && !rejectionReason) {
      throw new BadRequestError(
        'Rejection reason is required when rejecting a document'
      );
    }

    // Find the document
    const EmployerDocument = require('../../../infrastructure/models/EmployerDocument');
    const document = await EmployerDocument.findById(documentId);

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Update document status
    document.status = status;
    document.verifiedAt = new Date();
    document.verifiedBy = adminId;

    if (status === 'rejected') {
      document.rejectionReason = rejectionReason;
    } else {
      document.rejectionReason = undefined; // Clear any previous rejection reason
    }

    await document.save();

    // Check if all required documents are approved to update company verification status
    await this.checkAndUpdateCompanyVerification(document.employerId);

    return {
      document: {
        id: document._id,
        documentType: document.documentType,
        status: document.status,
        verifiedAt: document.verifiedAt,
        verifiedBy: document.verifiedBy,
        rejectionReason: document.rejectionReason,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
      },
    };
  }

  async checkAndUpdateCompanyVerification(employerId) {
    try {
      // Get all documents for this employer
      const EmployerDocument = require('../../../infrastructure/models/EmployerDocument');
      const documents = await EmployerDocument.find({ employerId });

      // Required document types for verification
      const requiredTypes = ['business-license', 'tax-certificate'];

      // Check if all required documents are approved
      const approvedRequiredDocs = documents.filter(
        doc =>
          requiredTypes.includes(doc.documentType) && doc.status === 'approved'
      );

      const allRequiredApproved = requiredTypes.every(requiredType =>
        approvedRequiredDocs.some(doc => doc.documentType === requiredType)
      );

      // Get employer and company info
      const employer = await this.employerRepository.findById(employerId);
      if (!employer || !employer.companyId) {
        return; // No company to update
      }

      const company = await this.companyRepository.findById(employer.companyId);
      if (!company) {
        return; // Company not found
      }

      // Update company verification status
      const wasVerified = company.isVerified;
      company.isVerified = allRequiredApproved;

      if (company.isVerified !== wasVerified) {
        await this.companyRepository.save(company);

        // Log the verification status change
        const logger = require('../../../shared/utils/logger');
        logger.info(
          `Company ${company._id} verification status changed to ${
            company.isVerified ? 'verified' : 'unverified'
          }`
        );
      }
    } catch (error) {
      // Log error but don't fail the document verification
      const logger = require('../../../shared/utils/logger');
      logger.error('Error updating company verification status:', error);
    }
  }
}

module.exports = VerifyEmployerDocumentUseCase;
