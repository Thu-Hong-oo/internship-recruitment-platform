/**
 * ApplicationResponseDTO
 * Transforms infrastructure Application model into API-friendly format
 */
class ApplicationResponseDTO {
  constructor(applicationModel) {
    this.id = applicationModel._id;
    this.jobId = applicationModel.jobId;
    this.candidateId = applicationModel.candidateId;
    this.cvId = applicationModel.cvId;
    this.coverLetterText = applicationModel.coverLetterText;
    this.status = applicationModel.status;
    this.appliedAt = applicationModel.appliedAt;
    this.viewedAt = applicationModel.viewedAt;
    this.employerNotes = applicationModel.employerNotes;
    this.candidateNotes = applicationModel.candidateNotes;
    this.metadata = applicationModel.metadata || {};
    this.createdAt = applicationModel.createdAt;
    this.updatedAt = applicationModel.updatedAt;

    // Computed fields
    this.canWithdraw = applicationModel.canWithdraw();
    this.isViewed = applicationModel.isViewed();
  }

  /**
   * Factory method to create DTO from Application model
   */
  static fromApplication(applicationModel) {
    return new ApplicationResponseDTO(applicationModel);
  }

  /**
   * Factory method to create DTOs from array of Application models
   */
  static fromApplications(applicationModels) {
    return applicationModels.map(model => new ApplicationResponseDTO(model));
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      candidateId: this.candidateId,
      cvId: this.cvId,
      coverLetterText: this.coverLetterText,
      status: this.status,
      appliedAt: this.appliedAt,
      viewedAt: this.viewedAt,
      employerNotes: this.employerNotes,
      candidateNotes: this.candidateNotes,
      metadata: this.metadata,
      canWithdraw: this.canWithdraw,
      isViewed: this.isViewed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = ApplicationResponseDTO;
