/**
 * LearningRoadmapMapper - Pure transformation between Mongoose and Domain
 * Handles: phases array, skillGaps array, metadata
 */

const LearningRoadmap = require('../../domain/learning/LearningRoadmap');

class LearningRoadmapMapper {
  /**
   * Convert Mongoose document to LearningRoadmap domain entity
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {LearningRoadmap|null} Domain entity
   */
  static toDomain(mongooseDoc) {
    if (!mongooseDoc) return null;

    try {
      // Handle phases array
      const phases = (mongooseDoc.phases || []).map(phase => ({
        title: phase.title,
        description: phase.description || null,
        skills: phase.skills || [],
        resources: phase.resources || [],
        duration: phase.duration || null,
        order: phase.order,
        isCompleted: phase.isCompleted || false,
        completedAt: phase.completedAt || null,
      }));

      // Handle skill gaps array
      const skillGaps = (mongooseDoc.skillGaps || []).map(gap => ({
        skillName: gap.skillName,
        currentLevel: gap.currentLevel,
        targetLevel: gap.targetLevel,
        priority: gap.priority ? gap.priority.toUpperCase() : 'MEDIUM',
      }));

      return new LearningRoadmap(
        mongooseDoc._id?.toString(),
        mongooseDoc.candidateId?.toString(),
        mongooseDoc.targetJobTitle,
        phases,
        skillGaps,
        mongooseDoc.estimatedDuration || null,
        mongooseDoc.status ? mongooseDoc.status.toUpperCase() : 'DRAFT',
        mongooseDoc.startDate || null,
        mongooseDoc.completionDate || null,
        mongooseDoc.progress || 0,
        mongooseDoc.metadata || null,
        mongooseDoc.createdAt,
        mongooseDoc.updatedAt
      );
    } catch (error) {
      console.error('Error mapping LearningRoadmap to domain:', error);
      return null;
    }
  }

  /**
   * Convert LearningRoadmap domain entity to Mongoose data
   * @param {LearningRoadmap} domainEntity - Domain entity
   * @returns {Object} Mongoose data
   */
  static toMongoose(domainEntity) {
    if (!domainEntity) return null;

    // Convert phases array
    const phases = domainEntity.phases.map(phase => ({
      title: phase.title,
      description: phase.description,
      skills: phase.skills,
      resources: phase.resources,
      duration: phase.duration,
      order: phase.order,
      isCompleted: phase.isCompleted,
      completedAt: phase.completedAt,
    }));

    // Convert skill gaps array
    const skillGaps = domainEntity.skillGaps.map(gap => ({
      skillName: gap.skillName,
      currentLevel: gap.currentLevel,
      targetLevel: gap.targetLevel,
      priority: gap.priority.toLowerCase(),
    }));

    return {
      candidateId: domainEntity.candidateId,
      targetJobTitle: domainEntity.targetJobTitle,
      phases,
      skillGaps,
      estimatedDuration: domainEntity.estimatedDuration,
      status: domainEntity.status.toLowerCase(),
      startDate: domainEntity.startDate,
      completionDate: domainEntity.completionDate,
      progress: domainEntity.progress,
      metadata: domainEntity.metadata,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * Convert for Mongoose update (excludes immutable fields)
   * @param {LearningRoadmap} domainEntity - Domain entity
   * @returns {Object} Update data
   */
  static toMongooseUpdate(domainEntity) {
    const data = this.toMongoose(domainEntity);

    // Remove immutable fields
    delete data.candidateId;
    delete data.createdAt;

    return data;
  }

  /**
   * Convert array of Mongoose documents to domain entities
   * @param {Array} mongooseDocs - Array of Mongoose documents
   * @returns {Array<LearningRoadmap>} Array of domain entities
   */
  static toDomainArray(mongooseDocs) {
    if (!Array.isArray(mongooseDocs)) return [];

    return mongooseDocs
      .map(doc => this.toDomain(doc))
      .filter(entity => entity !== null);
  }

  /**
   * Convert to lightweight preview (for lists)
   * @param {Object} mongooseDoc - Mongoose document
   * @returns {Object|null} Preview object
   */
  static toPreview(mongooseDoc) {
    if (!mongooseDoc) return null;

    const totalPhases = mongooseDoc.phases?.length || 0;
    const completedPhases =
      mongooseDoc.phases?.filter(p => p.isCompleted).length || 0;

    return {
      id: mongooseDoc._id?.toString(),
      candidateId: mongooseDoc.candidateId?.toString(),
      targetJobTitle: mongooseDoc.targetJobTitle,
      status: mongooseDoc.status ? mongooseDoc.status.toUpperCase() : 'DRAFT',
      progress: mongooseDoc.progress || 0,
      totalPhases,
      completedPhases,
      skillGapsCount: mongooseDoc.skillGaps?.length || 0,
      estimatedDuration: mongooseDoc.estimatedDuration,
      startDate: mongooseDoc.startDate,
      completionDate: mongooseDoc.completionDate,
      createdAt: mongooseDoc.createdAt,
      updatedAt: mongooseDoc.updatedAt,
    };
  }
}

module.exports = LearningRoadmapMapper;
