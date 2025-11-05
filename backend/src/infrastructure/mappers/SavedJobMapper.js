const SavedJob = require('../../domain/supporting/entities/SavedJob');

/**
 * SavedJobMapper
 *
 * Converts between Mongoose documents and SavedJob domain entities.
 */
class SavedJobMapper {
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    return new SavedJob(
      mongooseDoc._id?.toString(),
      mongooseDoc.candidateId?.toString(),
      mongooseDoc.jobId?.toString(),
      mongooseDoc.notes || null,
      mongooseDoc.tags || null,
      mongooseDoc.reminderDate || null,
      mongooseDoc.savedAt,
      mongooseDoc.createdAt,
      mongooseDoc.updatedAt
    );
  }

  static toMongoose(domainEntity) {
    const data = {
      candidateId: domainEntity.candidateId,
      jobId: domainEntity.jobId,
    };

    if (domainEntity.notes !== null) data.notes = domainEntity.notes;
    if (domainEntity.tags !== null) data.tags = domainEntity.tags;
    if (domainEntity.reminderDate !== null)
      data.reminderDate = domainEntity.reminderDate;
    if (domainEntity.savedAt !== null) data.savedAt = domainEntity.savedAt;

    return data;
  }

  static toDomainArray(mongooseDocs) {
    if (!mongooseDocs || !Array.isArray(mongooseDocs)) return [];
    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }
}

module.exports = SavedJobMapper;
