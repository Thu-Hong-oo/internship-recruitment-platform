const {
  BadRequestError,
  NotFoundError,
} = require('../../../shared/utils/errors');

class BulkVerifyDocumentsUseCase {
  constructor(employerRepository, companyRepository) {
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
  }

  async execute({ documentIds, adminId, status, rejectionReason }) {
    // Validate input
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new BadRequestError(
        'Document IDs array is required and cannot be empty'
      );
    }

    if (!adminId || !status) {
      throw new BadRequestError('Admin ID and status are required');
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
        'Rejection reason is required when rejecting documents'
      );
    }

    const EmployerDocument = require('../../../infrastructure/models/EmployerDocument');

    // Find all documents
    const documents = await EmployerDocument.find({
      _id: { $in: documentIds },
      status: 'pending', // Only allow verification of pending documents
    });

    if (documents.length === 0) {
      throw new NotFoundError('No valid pending documents found');
    }

    // Update all documents
    const updatePromises = documents.map(async document => {
      document.status = status;
      document.verifiedAt = new Date();
      document.verifiedBy = adminId;

      if (status === 'rejected') {
        document.rejectionReason = rejectionReason;
      } else {
        document.rejectionReason = undefined;
      }

      return document.save();
    });

    await Promise.all(updatePromises);

    // Check and update company verification status for affected employers
    const employerIds = [
      ...new Set(documents.map(doc => doc.employerId.toString())),
    ];
    await Promise.all(
      employerIds.map(employerId =>
        this.checkAndUpdateCompanyVerification(employerId)
      )
    );

    return {
      message: `${documents.length} documents ${
        status === 'approved' ? 'approved' : 'rejected'
      } successfully`,
      processedCount: documents.length,
      status: status,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
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
          } via bulk verification`
        );
      }
    } catch (error) {
      // Log error but don't fail the bulk verification
      const logger = require('../../../shared/utils/logger');
      logger.error(
        'Error updating company verification status in bulk operation:',
        error
      );
    }
  }
}

module.exports = BulkVerifyDocumentsUseCase;
