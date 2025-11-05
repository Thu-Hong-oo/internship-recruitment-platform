/**
 * LearningRoadmapResponseDTO
 * Transforms infrastructure LearningRoadmap model into API-friendly format
 */
class LearningRoadmapResponseDTO {
  constructor(roadmapModel) {
    this.id = roadmapModel._id;
    this.candidateId = roadmapModel.candidateId;
    this.targetJobId = roadmapModel.targetJobId;
    this.targetJobTitle = roadmapModel.targetJobTitle;
    this.currentSkills = roadmapModel.currentSkills || [];
    this.targetSkills = roadmapModel.targetSkills || [];
    this.skillGaps = roadmapModel.skillGaps || [];
    this.phases = roadmapModel.phases || [];
    this.progress = roadmapModel.progress || 0;
    this.estimatedDuration = roadmapModel.estimatedDuration;
    this.createdAt = roadmapModel.createdAt;
    this.updatedAt = roadmapModel.updatedAt;

    // Computed fields
    this.calculatedProgress = roadmapModel.calculateProgress();
  }

  /**
   * Factory method to create DTO from LearningRoadmap model
   */
  static fromRoadmap(roadmapModel) {
    return new LearningRoadmapResponseDTO(roadmapModel);
  }

  /**
   * Factory method to create DTOs from array of LearningRoadmap models
   */
  static fromRoadmaps(roadmapModels) {
    return roadmapModels.map(model => new LearningRoadmapResponseDTO(model));
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      candidateId: this.candidateId,
      targetJobId: this.targetJobId,
      targetJobTitle: this.targetJobTitle,
      currentSkills: this.currentSkills,
      targetSkills: this.targetSkills,
      skillGaps: this.skillGaps,
      phases: this.phases,
      progress: this.progress,
      estimatedDuration: this.estimatedDuration,
      calculatedProgress: this.calculatedProgress,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = LearningRoadmapResponseDTO;
