const { logger } = require('../../../shared/utils/logger');
const {
  getVerificationProgress,
  getDocumentTypesForIndustry,
} = require('../../../infrastructure/config/documentTypes');

/**
 * Get Company Documents Use Case
 * Retrieves all uploaded documents and verification status
 */
class GetCompanyDocumentsUseCase {
  constructor(employerRepository, companyRepository) {
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
  }

  async execute({ userId }) {
    try {
      // 1. Find employer profile
      const employer = await this.employerRepository.findByUserId(userId);
      if (!employer) {
        throw new Error('EMPLOYER_PROFILE_NOT_FOUND');
      }

      // 2. Get company
      const company = await this.companyRepository.findById(
        employer.company.toString()
      );
      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }

      // 3. Get uploaded documents
      const uploadedDocuments = company.verification?.documents || [];

      // 4. Calculate verification progress
      const progress = getVerificationProgress(
        uploadedDocuments,
        company.industry
      );

      // 5. Get required document types for this industry
      const documentTypes = getDocumentTypesForIndustry(company.industry);

      return {
        success: true,
        data: {
          documents: uploadedDocuments,
          verificationProgress: progress,
          requiredDocuments: documentTypes.required.map(doc => ({
            id: doc.id,
            name: doc.name,
            nameEn: doc.nameEn,
            description: doc.description,
            uploaded: uploadedDocuments.some(d => d.type === doc.id),
          })),
          optionalDocuments: documentTypes.optional.map(doc => ({
            id: doc.id,
            name: doc.name,
            nameEn: doc.nameEn,
            description: doc.description,
            uploaded: uploadedDocuments.some(d => d.type === doc.id),
          })),
          verification: {
            isVerified: company.verification?.isVerified || false,
            verifiedAt: company.verification?.verifiedAt || null,
            steps: company.verification?.steps || {
              businessInfo: false,
              documents: false,
            },
          },
          status: company.status,
        },
      };
    } catch (error) {
      logger.error('Get company documents failed:', error);
      throw error;
    }
  }
}

module.exports = GetCompanyDocumentsUseCase;
