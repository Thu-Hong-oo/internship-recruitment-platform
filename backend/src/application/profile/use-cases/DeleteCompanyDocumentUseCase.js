const { logger } = require('../../../shared/utils/logger');
const {
  getVerificationProgress,
} = require('../../../infrastructure/config/documentTypes');

/**
 * Delete Company Document Use Case
 * Removes a verification document from company
 */
class DeleteCompanyDocumentUseCase {
  constructor(employerRepository, companyRepository, uploadService) {
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
    this.uploadService = uploadService;
  }

  async execute({ userId, documentType }) {
    try {
      // 1. Find employer profile
      const employer = await this.employerRepository.findByUserId(userId);
      if (!employer) {
        throw new Error('EMPLOYER_PROFILE_NOT_FOUND');
      }

      // Check permissions - only owner or those with canEditCompanyInfo can delete documents
      if (
        employer.role !== 'owner' &&
        !employer.permissions?.canEditCompanyInfo
      ) {
        throw new Error('NO_PERMISSION_TO_DELETE_DOCUMENTS');
      }

      // 2. Get company
      const company = await this.companyRepository.findById(employer.companyId);
      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }

      // 3. Find document
      const docIndex = company.verification?.documents?.findIndex(
        doc => doc.type === documentType
      );

      if (docIndex === -1 || docIndex === undefined) {
        throw new Error('DOCUMENT_NOT_FOUND');
      }

      const document = company.verification.documents[docIndex];

      // 4. Delete from cloud storage
      if (document.publicId) {
        try {
          await this.uploadService.deleteFile(document.publicId);
        } catch (error) {
          logger.warn(
            `Failed to delete file from cloud: ${document.publicId}`,
            error
          );
          // Continue anyway to remove from database
        }
      }

      // 5. Remove from company documents array
      company.verification.documents.splice(docIndex, 1);

      // 6. Update verification status if needed
      if (company.verification.documents.length === 0) {
        company.verification.steps.documents = false;
      }

      // Save company
      await this.companyRepository.update(company.id, {
        verification: company.verification,
      });

      // 7. Calculate new verification progress
      const progress = getVerificationProgress(
        company.verification.documents,
        company.industry
      );

      logger.info(
        `Document deleted successfully: ${documentType} from company ${company.id}`
      );

      return {
        success: true,
        message: 'Tài liệu đã được xóa thành công',
        verificationProgress: progress,
      };
    } catch (error) {
      logger.error('Delete company document failed:', error);
      throw error;
    }
  }
}

module.exports = DeleteCompanyDocumentUseCase;
