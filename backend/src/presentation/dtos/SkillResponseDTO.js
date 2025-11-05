/**
 * SkillResponseDTO
 * Transforms infrastructure Skill model into API-friendly format
 */
class SkillResponseDTO {
  constructor(skillModel) {
    this.id = skillModel._id;
    this.name = skillModel.name;
    this.slug = skillModel.slug;
    this.description = skillModel.description;
    this.parentId = skillModel.parentId;
    this.embedding = skillModel.embedding;
    this.popularity = skillModel.popularity;
    this.isActive = skillModel.isActive;
    this.demandLevel = skillModel.demandLevel;
    this.trend = skillModel.trend;
    this.level = skillModel.level;
    this.path = skillModel.path || [];
    this.createdAt = skillModel.createdAt;
    this.updatedAt = skillModel.updatedAt;
  }

  /**
   * Factory method to create DTO from Skill model
   */
  static fromSkill(skillModel) {
    return new SkillResponseDTO(skillModel);
  }

  /**
   * Factory method to create DTOs from array of Skill models
   */
  static fromSkills(skillModels) {
    return skillModels.map(model => new SkillResponseDTO(model));
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      parentId: this.parentId,
      embedding: this.embedding,
      popularity: this.popularity,
      isActive: this.isActive,
      demandLevel: this.demandLevel,
      trend: this.trend,
      level: this.level,
      path: this.path,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = SkillResponseDTO;
