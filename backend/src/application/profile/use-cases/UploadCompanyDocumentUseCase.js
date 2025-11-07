const { logger } = require('../../../shared/utils/logger');
const {
  DOCUMENT_TYPES,
  validateDocumentType,
  validateDocumentMetadata,
  getVerificationProgress,
} = require('../../../infrastructure/config/documentTypes');

/**
 * Upload Company Document Use Case
 * Handles uploading verification documents for company
 */
class UploadCompanyDocumentUseCase {
  constructor(
    employerRepository,
    companyRepository,
    uploadService,
    userRepository
  ) {
    this.employerRepository = employerRepository;
    this.companyRepository = companyRepository;
    this.uploadService = uploadService;
    this.userRepository = userRepository;
  }

  async execute({ userId, file, documentType, metadata = {} }) {
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

      // 3. Validate document type
      const isValidType = validateDocumentType(documentType, company.industry);
      if (!isValidType) {
        throw new Error('INVALID_DOCUMENT_TYPE');
      }

      // 4. Validate metadata
      const metadataValidation = validateDocumentMetadata(
        documentType,
        metadata
      );
      if (!metadataValidation.valid) {
        throw new Error(metadataValidation.error);
      }

      // 5. Upload file to cloud storage
      const uploadResult = await this.uploadService.uploadFile({
        file,
        type: 'document',
        userId: userId,
        metadata: {
          documentType,
          companyId: company.id,
          ...metadata,
        },
      });

      // 6. Add document to company verification.documents array
      const documentData = {
        type: documentType,
        url: uploadResult.url,
        publicId: uploadResult.public_id,
        uploadedAt: new Date(),
        metadata: {
          ...metadata,
          originalName: uploadResult.originalName || file.originalname,
          size: uploadResult.size || file.size,
          mimeType: uploadResult.mimeType || file.mimetype,
        },
      };

      // Update company documents
      if (!company.verification) {
        company.verification = {
          isVerified: false,
          steps: {
            businessInfo: false,
            documents: false,
          },
          documents: [],
        };
      }

      // Check if document type already exists and replace it
      const existingDocIndex = company.verification.documents.findIndex(
        doc => doc.type === documentType
      );

      if (existingDocIndex >= 0) {
        // Delete old file from cloud storage if exists
        const oldDoc = company.verification.documents[existingDocIndex];
        if (oldDoc.publicId) {
          try {
            await this.uploadService.deleteFile(oldDoc.publicId);
          } catch (error) {
            logger.warn(
              `Failed to delete old document: ${oldDoc.publicId}`,
              error
            );
          }
        }
        // Replace with new document
        company.verification.documents[existingDocIndex] = documentData;
      } else {
        // Add new document
        company.verification.documents.push(documentData);
      }

      // Save company
      await this.companyRepository.update(company.id, {
        verification: company.verification,
      });

      // 7. Calculate verification progress
      const progress = getVerificationProgress(
        company.verification.documents,
        company.industry
      );

      logger.info(
        `Document uploaded successfully: ${documentType} for company ${company.id}`
      );

      return {
        success: true,
        message: 'Tài liệu đã được upload thành công',
        document: documentData,
        verificationProgress: progress,
      };
    } catch (error) {
      logger.error('Upload company document failed:', error);
      throw error;
    }
  }
}

module.exports = UploadCompanyDocumentUseCase;
