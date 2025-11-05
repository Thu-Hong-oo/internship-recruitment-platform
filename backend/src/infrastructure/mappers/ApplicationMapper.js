const Application = require('../../domain/recruitment/Application');

/**
 * ApplicationMapper
 * Infrastructure layer - converts between Domain Entity and Mongoose Model
 * Pure transformation - no defaults, no business logic, no mutations
 */
class ApplicationMapper {
  /**
   * Convert Mongoose Model to Domain Entity
   * Maps data as-is without adding defaults
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    const application = new Application(
      mongooseDoc._id.toString(),
      mongooseDoc.jobId?.toString() || mongooseDoc.jobId,
      mongooseDoc.candidateId?.toString() || mongooseDoc.candidateId
    );

    // Map fields directly without defaults
    application.cvId = mongooseDoc.cvId?.toString() || mongooseDoc.cvId;
    application.coverLetterText = mongooseDoc.coverLetterText;
    application.status = mongooseDoc.status;
    application.appliedAt = mongooseDoc.appliedAt;
    application.viewedAt = mongooseDoc.viewedAt;
    application.employerNotes = mongooseDoc.employerNotes;
    application.candidateNotes = mongooseDoc.candidateNotes;
    application.metadata = mongooseDoc.metadata;

    // Timestamps
    application.createdAt = mongooseDoc.createdAt;
    application.updatedAt = mongooseDoc.updatedAt;

    return application;
  }

  /**
   * Convert Domain Entity to plain object for Mongoose
   * Returns only the data, let Mongoose handle defaults via schema
   */
  static toMongoose(domainEntity) {
    const data = {
      jobId: domainEntity.jobId,
      candidateId: domainEntity.candidateId,
    };

    // Optional fields - only include if provided
    if (domainEntity.cvId !== undefined) data.cvId = domainEntity.cvId;
    if (domainEntity.coverLetterText !== undefined)
      data.coverLetterText = domainEntity.coverLetterText;
    if (domainEntity.status !== undefined) data.status = domainEntity.status;
    if (domainEntity.appliedAt !== undefined)
      data.appliedAt = domainEntity.appliedAt;
    if (domainEntity.viewedAt !== undefined)
      data.viewedAt = domainEntity.viewedAt;
    if (domainEntity.employerNotes !== undefined)
      data.employerNotes = domainEntity.employerNotes;
    if (domainEntity.candidateNotes !== undefined)
      data.candidateNotes = domainEntity.candidateNotes;
    if (domainEntity.metadata !== undefined)
      data.metadata = domainEntity.metadata;

    return data;
  }
}

module.exports = ApplicationMapper;
